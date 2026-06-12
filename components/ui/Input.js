"use client";

/**
 * @param {object} props
 * @param {string} [props.error]
 * @param {string} [props.className]
 */
export default function Input({ error, className = "", id, ...rest }) {
  return (
    <div className="w-full">
      <input
        id={id}
        className={`input-field ${error ? "input-field--error" : ""} ${className}`.trim()}
        {...rest}
      />
      {error && (
        <p className="text-caption mt-1" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
