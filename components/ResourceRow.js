/**
 * ResourceRow — A single row linking to an external resource (GitHub, Figma, etc.).
 *
 * @param {string}  icon     — 'github' | 'figma' | 'link'
 * @param {string}  label    — display text
 * @param {string}  url      — external URL
 * @param {boolean} disabled — grey-out and prevent interaction (default false)
 */

/** Inline SVG icons keyed by name */
const icons = {
  github: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.607.069-.607 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  ),
  figma: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5zM12 2h3.5a3.5 3.5 0 1 1 0 7H12V2zm0 7h3.5a3.5 3.5 0 1 1 0 7H12V9zm-7 7a3.5 3.5 0 0 1 3.5-3.5H12v3.5a3.5 3.5 0 1 1-7 0zm7-3.5a3.5 3.5 0 1 0 0-7v7z" />
    </svg>
  ),
  link: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
};

/** External-link arrow icon */
const ArrowIcon = () => (
  <svg className="w-4 h-4 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17L17 7" />
    <path d="M7 7h10v10" />
  </svg>
);

export default function ResourceRow({ icon, label, url, disabled = false }) {
  const content = (
    <div
      className={`flex items-center justify-between p-3 rounded-lg transition ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:bg-surface-hover cursor-pointer'
      }`}
    >
      {/* Left: icon + label */}
      <div className="flex items-center gap-3 text-text-primary">
        <span className="text-text-secondary">
          {icons[icon] || icons.link}
        </span>
        <span className="text-sm font-medium">{label}</span>
      </div>

      {/* Right: arrow */}
      <ArrowIcon />
    </div>
  );

  // If disabled, render plain div; otherwise wrap in anchor
  if (disabled) return content;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block">
      {content}
    </a>
  );
}
