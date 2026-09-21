function AuthField({ label, name, type = 'text', value, onChange, error, ...props }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-white">
      {label}
      <input
        {...props}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`rounded border bg-neutral-950 px-3 py-3 font-normal text-white outline-none transition placeholder:text-neutral-500 focus:ring-2 ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/25'
            : 'border-neutral-600 focus:border-[var(--ktm-orange)] focus:ring-orange-600/30'
        }`}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
      />
      {error && <span className="text-xs font-normal text-red-400" id={`${name}-error`}>{error}</span>}
    </label>
  );
}

export default AuthField;
