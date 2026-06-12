"use client";

/**
 * @param {object} props
 * @param {'primary'|'ghost'|'destructive'} [props.variant]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export default function Button({
  variant = "primary",
  className = "",
  children,
  type = "button",
  ...rest
}) {
  const base =
    variant === "primary"
      ? "btn-primary inline-flex items-center justify-center gap-2"
      : variant === "destructive"
        ? "btn-destructive inline-flex items-center justify-center gap-2"
        : "btn-ghost inline-flex items-center justify-center gap-2";

  return (
    <button type={type} className={`${base} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
