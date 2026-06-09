# BodyVis - CLAUDE.md

このファイルはClaude Codeがプロジェクトを理解するための仕様書です。
実装前に必ずこのファイルを参照してください。

---

## CRITICAL PROTOCOLS (ABSOLUTE PRIORITY)

1. **日本語応答**
   ユーザーに提示する文章や応答、コードに記載するコメントやドキュメントなどはすべて日本語で記述すること。
2. **言語規定**
   内部の思考プロセスは英語で行う。ユーザーへのレスポンス、アーティファクト、コミットメッセージ、コード内のコメントは必ず日本語で記述すること。（システムエラーやライブラリのエラーメッセージは原文のままでよい）
3. **自動化の限界と報告**
   ツール実行が複数回失敗した場合や、権限不足・環境固有の問題に直面した場合は、執拗に再試行せず、直ちにユーザーに状況を報告し手動対応を依頼すること。
4. **品質保証**
   コード修正完了時は、必ず Lint（`npm run lint`）を実行し、PASS することを確認してからユーザーへ報告すること。
5. **不要ファイル**
   確認などで一時的に作成したファイルは不要になった時点で削除を行うこと。
6. **機密情報の保護**
   APIキー、トークンなどの機密情報を、チャットの応答や成果物に絶対に出力しないこと。`.env` や `NEXT_PUBLIC_*` などの環境変数の取り扱いに注意すること。
7. **コメントの同期**
   機能や仕様を変更した際は、コードの修正だけでなく、関連するコード内のコメント（JSDoc・インラインコメント等）も必ず同期して更新すること。
8. **作業中断時のロールバック**
   エラーや中断によりタスクを終了する場合、ユーザーの明示的な指示がない限り、修正途中の不安定な状態を残さず、作業開始前のクリーンな状態に復元すること。

---

## 役割定義 (Roles)

ユーザーが役割を指定した場合（例: "Role: Architect"）、その役割の責務範囲を**厳守**すること。

- **Role: System Analyst（仕様理解・要件定義担当）**
  - 実装やアーキテクチャの話は一切せず、「何を実現すべきか」「要件に矛盾はないか」「例外ケースの考慮漏れはないか」を整理・言語化する。
  - 【禁止事項】**コードの実装、アーキテクチャ設計の提案。**
- **Role: Architect（設計担当）**
  - 実装の詳細コードは書かず、コンポーネント構成・ディレクトリ構造・データフローの設計に集中する。
  - 【禁止事項】**コンポーネント内部の具体的実装コードの記述。**
- **Role: Developer（実装担当）**
  - 設計または指示に基づき、具体的で動作するコードを記述する。
  - 型安全性、コーディング規約の遵守に集中する。
  - 【禁止事項】**独断によるディレクトリ構造の変更、仕様の再定義。** 不明点は必ずユーザーに確認すること。
- **Role: Reviewer（レビュー担当）**
  - コード生成は行わず、設計と実装の整合性確認、パフォーマンス評価、静的エクスポート制約の遵守確認を行う。
  - 複数の視点（保守性、堅牢性、可読性）から厳しく指摘を行う。
  - 【禁止事項】**コードの修正・生成。** 監査役であり、作業員ではない。

---

## サービス概要

**BodyVis**は、自分の写真で体型変化とバーチャル試着を体験できるWebアプリケーションです。

- 写真1枚と基本情報を入力するだけで体型データを自動推定
- MediaPipe + 機械学習モデルで写真から体型データを推定（Bodygram不使用・完全無料）
- スライダーで体重・筋肉量を増減させると元の写真に反映して体型変化を可視化
- 服の画像をアップロードするとバーチャル試着画像をGemini APIで生成

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
| 体型推定 | MediaPipe Pose + 推定モデル | 写真 → 関節座標 → 体型数値推定 |
| 推定モデル学習データ | ANSUR II Dataset | 米軍公開データ・完全無料・商用OK |
| 画像生成AI | Gemini API | 体型ビジュアル生成・バーチャル試着 |

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
- MediaPipeはクライアントサイドで実行（カメラ映像はサーバーに送信しない）

---

## 体型推定の仕組み

### MediaPipeで取得できる値

- 関節33点のXY座標（肩・肘・手首・腰・膝・足首など）
- そこから計算できる比率（肩幅・上半身下半身比・逆三角形度など）

### 推定モデルで補う値

MediaPipeの関節座標 + ユーザー手入力（身長・体重・年齢・性別）を入力として、以下を推定する。

| 推定項目 | 推定精度 | 備考 |
|---|---|---|
| バスト囲 | 誤差5〜10cm | ANSUR IIで学習 |
| ウエスト囲 | 誤差5〜10cm | ANSUR IIで学習 |
| ヒップ囲 | 誤差5〜10cm | ANSUR IIで学習 |
| 体脂肪率 | 誤差3〜5% | ANSUR IIで学習 |
| 骨格筋量 | 誤差2〜4kg | ANSUR IIで学習 |

### ANSUR II Dataset

- 米陸軍が公開している体型測定データ（約6000人分）
- 身長・体重・関節座標・各部位の周囲長を含む
- 完全無料・商用利用OK
- URL: https://www.openlab.psu.edu/ansur2/

---

## DB設計

### 設計方針

- **写真（正面）はサーバーに保存しない** — API送信後即時廃棄
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
  height REAL NOT NULL,         -- cm
  weight REAL NOT NULL,         -- kg
  age INTEGER NOT NULL,
  body_fat_pct REAL,            -- % （推定値）
  muscle_mass REAL,             -- kg（推定値）
  waist REAL,                   -- cm（推定値）
  bust REAL,                    -- cm（推定値）
  hip REAL,                     -- cm（推定値）
  shoulder_width REAL,          -- cm（MediaPipeから計算）
  scanned_at INTEGER NOT NULL
);

-- 目標体型
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  target_weight REAL NOT NULL,      -- kg
  target_body_fat REAL NOT NULL,    -- %
  target_muscle_mass REAL,          -- kg
  target_date INTEGER,              -- Unix timestamp（任意）
  created_at INTEGER NOT NULL
);

-- AI生成画像（体型ビジュアル・バーチャル試着）
CREATE TABLE generated_images (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  scan_id TEXT REFERENCES scans(id),
  goal_id TEXT REFERENCES goals(id),
  type TEXT CHECK(type IN ('body_current', 'body_goal', 'try_on')),
  image_url TEXT,
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
  'INSERT INTO scans (id, user_id, height, weight, age, body_fat_pct, muscle_mass, bust, waist, hip, shoulder_width, scanned_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
).bind(id, userId, height, weight, age, bodyFatPct, muscleMass, bust, waist, hip, shoulderWidth, Date.now()).run();
```

---

## 画面構成

| 画面名 | パス | 概要 |
|---|---|---|
| トップ / ランディング | `/` | サービス説明・利用開始ボタン |
| 写真アップロード | `/scan` | 正面写真アップロード・身長体重年齢性別入力 |
| スキャン処理中 | `/scan/processing` | MediaPipe解析・体型推定モデル処理待機 |
| 現在の体型確認 | `/scan/result` | 推定された体組成データ確認 |
| 目標設定 | `/goal` | 目標体重・体脂肪率・筋肉量の入力 |
| 体型調整 | `/goal/adjust` | スライダーで体重・筋肉量を増減・Geminiで反映 |
| 生成中 | `/goal/generating` | Gemini APIの画像生成待機 |
| 結果表示 | `/result` | ビフォーアフター画像・体組成比較 |
| バーチャル試着 | `/try-on` | 服の画像アップロード → 試着画像生成 |

### ユーザーフロー

```
トップ
  → 写真アップロード（正面）+ 身長・体重・年齢・性別入力
  → MediaPipe解析 + 推定モデルで体組成推定
  → 現在の体組成データ確認
  → 目標体重・目標体脂肪率・筋肉量入力
  → スライダーで調整 → Geminiで画像に反映（任意）
  → Gemini API画像生成
  → ビフォーアフター表示
  → バーチャル試着（服の画像をアップロード）
```

---

## Gemini API 画像生成

### 体型ビジュアル生成（ビフォーアフター）

#### 体脂肪率カテゴリ（男性）

| 体脂肪率 | カテゴリ | プロンプトキーワード |
|---|---|---|
| 5〜9% | shredded | extreme muscle definition, visible veins |
| 10〜14% | lean athletic | visible abdominal definition, broad shoulders |
| 15〜19% | fit | toned muscles, slim waist |
| 20〜24% | average | soft muscle definition, natural build |
| 25%以上 | overfat | rounded abdomen, softer physique |

#### プロンプト生成関数

```typescript
function buildBodyPrompt(gender: 'male' | 'female', fatPct: number, heightCm: number): string {
  const category = getFatCategory(gender, fatPct);
  return `3D rendered fitness avatar, photorealistic CG style, ${gender} figure, ${heightCm}cm height, ${category.label} body composition, ${category.description}, front view, studio lighting, white background, no face detail, athletic wear`;
}
```

### バーチャル試着

ユーザーの写真 + 服の画像 + 体型数値をGemini APIに渡して試着画像を生成する。

```typescript
// マルチモーダル入力
const contentParts = [
  {
    inlineData: {
      data: userPhotoBase64,  // ユーザーの正面写真
      mimeType: 'image/jpeg',
    },
  },
  {
    inlineData: {
      data: clothingPhotoBase64,  // 服の画像
      mimeType: 'image/jpeg',
    },
  },
  { text: buildTryOnPrompt(measurements, clothing) },
];
```

### 体型調整スライダー → 画像反映

スライダーで調整した体型数値をプロンプトに反映してGeminiで再生成する。
リアルタイム反映ではなく「この体型で生成」ボタンを押したタイミングで生成する（APIコスト・速度の観点から）。

```typescript
function buildAdjustedPrompt(
  userPhotoBase64: string,
  currentMeasurements: Measurements,
  adjustedMeasurements: Measurements
): string {
  return `
    Based on Photo 1 (the user's current body),
    generate a photorealistic image reflecting these body changes:
    - Weight: ${currentMeasurements.weight}kg → ${adjustedMeasurements.weight}kg
    - Body fat: ${currentMeasurements.bodyFat}% → ${adjustedMeasurements.bodyFat}%
    - Muscle mass: ${currentMeasurements.muscleMass}kg → ${adjustedMeasurements.muscleMass}kg
    Keep the same face, pose, and background. Show realistic body changes.
  `;
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
| 写真の非保存 | 正面写真はMediaPipe処理・Gemini API送信後即時廃棄・サーバーに保存しない |
| クライアントサイド処理 | MediaPipeはブラウザ上で実行。カメラ映像はサーバーに送信しない |
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
GOOGLE_GENAI_API_KEY=
AUTH_SECRET=
DATABASE_URL=        # Cloudflare D1
```

---

## MVP スコープ

### 含む
- 写真アップロード → MediaPipe解析 → 体組成推定 → 体組成表示
- 目標設定 → Gemini画像生成 → ビフォーアフター表示
- スライダーで体重・筋肉量調整 → Geminiで画像に反映
- バーチャル試着（服の画像 → 試着画像生成）

### 含まない（MVP後）
- ユーザー認証・データ保存
- 目標達成期間シミュレーション
- SNSシェア機能
- トレーニングメニュー提案
