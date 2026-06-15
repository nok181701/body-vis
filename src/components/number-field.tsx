export function NumberField({
  label,
  unit,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-3 pr-10 rounded-xl bg-white border text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-100 transition-colors ${
            error ? "border-red-300" : "border-slate-200"
          }`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          {unit}
        </span>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
