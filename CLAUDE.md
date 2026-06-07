# BodyVis - CLAUDE.md

このファイルはClaude Codeがプロジェクトを理解するための仕様書です。
実装前に必ずこのファイルを参照してください。

---

## サービス概要

**BodyVis**は、筋トレをしている・始めたい人が「目標の体型をビジュアルで確認することで継続モチベーションを維持する」ためのWebアプリケーションです。

- 体重の数字ではなく、**体脂肪率・筋肉量（体組成）の変化**にフォーカス
- Bodygram APIで写真から体型データを自動取得
- Gemini APIで現在と目標の体型画像を生成・比較表示
- 「3ヶ月後の自分がどう見えるか」をビジュアルで可視化する

---

## 技術スタック

| レイヤー | 技術 | 備考 |
|---|---|---|
| フロントエンド | Next.js (App Router) | |
| スタイリング | Tailwind CSS | |
| ORM | Drizzle ORM | 採用検討中。素のSQLでも可 |
| データベース | Cloudflare D1 | SQLiteベース |
| 認証 | Auth.js（NextAuth.js） | |
| デプロイ | Cloudflare Pages | Workers・D1と同一エコシステム |
| 身体計測API | Bodygram Platform API | 写真 → 体型データ取得 |
| 画像生成AI | Gemini API | 体型ビジュアル生成 |

### Cloudflare構成

```
Cloudflare Pages   → フロントエンドホスティング
Cloudflare Workers → APIサーバー（Next.js API Routes）
Cloudflare D1      → データベース
Cloudflare R2      → AI生成画像の保存（検討中）
```

### 注意事項

- `@cloudflare/next-on-pages` アダプターを使用
- Edge RuntimeのためNode.js専用ライブラリは使用不可
- D1はSQLiteベースのためPostgreSQLとは一部構文が異なる

---

## DB設計

### 設計方針

- **写真（正面・側面）はサーバーに保存しない** — API送信後即時廃棄
- 体組成の計測値・目標値・生成画像URLのみ保存
- ユーザーの明示的な同意取得後にデータ保存

### テーブル構成

```sql
-- ユーザー基本情報
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  gender TEXT CHECK(gender IN ('male', 'female')),
  created_at INTEGER NOT NULL
);

-- スキャン結果（写真は保存しない）
CREATE TABLE scans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  height REAL NOT NULL,       -- cm
  weight REAL NOT NULL,       -- kg
  age INTEGER NOT NULL,
  body_fat_pct REAL,          -- %
  muscle_mass REAL,           -- kg
  waist REAL,                 -- cm
  shoulder_width REAL,        -- cm
  scanned_at INTEGER NOT NULL
);

-- 目標体型
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  target_weight REAL NOT NULL,     -- kg
  target_body_fat REAL NOT NULL,   -- %
  target_date INTEGER,             -- Unix timestamp（任意）
  created_at INTEGER NOT NULL
);

-- AI生成画像
CREATE TABLE generated_images (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  scan_id TEXT NOT NULL REFERENCES scans(id),
  goal_id TEXT NOT NULL REFERENCES goals(id),
  current_image_url TEXT,
  goal_image_url TEXT,
  created_at INTEGER NOT NULL
);
```

### D1クエリ例（ORM不使用の場合）

```typescript
// SELECT
const result = await env.DB.prepare(
  'SELECT * FROM scans WHERE user_id = ? ORDER BY scanned_at DESC'
).bind(userId).all();

// INSERT
await env.DB.prepare(
  'INSERT INTO scans (id, user_id, height, weight, age, body_fat_pct, muscle_mass, scanned_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
).bind(id, userId, height, weight, age, bodyFatPct, muscleMass, Date.now()).run();
```

---

## 画面構成

| 画面名 | パス | 概要 |
|---|---|---|
| トップ / ランディング | `/` | サービス説明・利用開始ボタン |
| 写真アップロード | `/scan` | 正面・側面写真のアップロード・身長体重入力 |
| スキャン処理中 | `/scan/processing` | Bodygram APIのスキャン待機 |
| 現在の体型確認 | `/scan/result` | スキャン結果の体組成データ確認 |
| 目標設定 | `/goal` | 目標体重・体脂肪率の入力 |
| 生成中 | `/goal/generating` | Gemini APIの画像生成待機 |
| 結果表示 | `/result` | ビフォーアフター画像・体組成比較 |

### ユーザーフロー

```
トップ
  → 写真アップロード（正面・側面）+ 身長・体重・年齢・性別入力
  → Bodygram APIスキャン（10〜30秒）
  → 現在の体組成データ確認
  → 目標体重・目標体脂肪率入力
  → Gemini API画像生成（10〜20秒）
  → ビフォーアフター表示
```

---

## Bodygram Platform API

```typescript
// リクエスト形式
interface ScanRequest {
  age: number;
  gender: 'male' | 'female';
  height: number;   // ミリメートル (cm × 10)
  weight: number;   // グラム (kg × 1000)
  frontPhoto: string;  // Base64
  rightPhoto: string;  // Base64
}

// エンドポイント
POST https://platform.bodygram.com/api/orgs/{orgId}/scans

// 認証
Authorization: {API_KEY}
```

- フリープラン: 月20回まで無料
- 環境変数: `BODYGRAM_API_KEY`, `BODYGRAM_ORG_ID`

---

## Gemini API 画像生成

### 体脂肪率カテゴリ（男性）

| 体脂肪率 | カテゴリ | プロンプトキーワード |
|---|---|---|
| 5〜9% | shredded | extreme muscle definition, visible veins |
| 10〜14% | lean athletic | visible abdominal definition, broad shoulders |
| 15〜19% | fit | toned muscles, slim waist |
| 20〜24% | average | soft muscle definition, natural build |
| 25%以上 | overfat | rounded abdomen, softer physique |

### プロンプト生成関数

```typescript
function buildPrompt(gender: 'male' | 'female', fatPct: number, heightCm: number): string {
  const category = getFatCategory(gender, fatPct);
  return `3D rendered fitness avatar, photorealistic CG style, ${gender} figure, ${heightCm}cm height, ${category.label} body composition, ${category.description}, front view, studio lighting, white background, no face detail, athletic wear`;
}
```

### ネガティブプロンプト（必須）

```
underweight, extremely thin, anorexic, unhealthy, bones visible, realistic photo, real person, nsfw, explicit
```

### Safety Settings

```typescript
import { HarmCategory, HarmBlockThreshold } from '@google/genai';

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];
```

- 環境変数: `GOOGLE_GENAI_API_KEY`
- モデル: `gemini-3-pro-image-preview`

---

## プライバシー・セキュリティ

| 項目 | 対応内容 |
|---|---|
| 写真の非保存 | 正面・側面写真はAPI送信後即時廃棄・サーバーに保存しない |
| 同意取得 | データ収集・AI処理についてユーザーから明示的な同意を取得 |
| データ最小化 | 必要最小限のデータのみ収集・送信 |
| 第三者送信 | Gemini APIへの送信についてGoogleのポリシーをユーザーに明示 |
| アクセス制御 | 自分のデータのみアクセス可能に制限 |

### 体脂肪率の入力ガード

```typescript
const FAT_PCT_MIN = { male: 5, female: 12 };
const FAT_PCT_MAX = { male: 50, female: 55 };
```

---

## 環境変数

```env
BODYGRAM_API_KEY=
BODYGRAM_ORG_ID=
GOOGLE_GENAI_API_KEY=
AUTH_SECRET=
DATABASE_URL=        # Cloudflare D1
```

---

## MVP スコープ

### 含む
- 写真アップロード → Bodygramスキャン → 体組成表示
- 目標設定 → Gemini画像生成 → ビフォーアフター表示

### 含まない（MVP後）
- ユーザー認証・データ保存
- 目標達成期間シミュレーション
- SNSシェア機能
- トレーニングメニュー提案
