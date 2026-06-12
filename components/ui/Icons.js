/**
 * Shared SVG icon components — extracted from inline SVG to reduce duplication.
 * All icons are Heroicons outline style (MIT license).
 */

const baseClass = "shrink-0 transition-colors";
const strokeWidth = 1.5;

function Icon({ path, children, className = "w-5 h-5" }) {
  return (
    <svg
      className={`${baseClass} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      aria-hidden="true"
    >
      {path ? <path d={path} /> : children}
    </svg>
  );
}

// ── Icons ──

export function FolderIcon({ className }) {
  return (
    <Icon className={className} path="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  );
}

export function DocumentIcon({ className }) {
  return (
    <Icon className={className} path="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
  );
}

export function ChartBarIcon({ className }) {
  return (
    <Icon className={className} path="M12 20V10M18 20V4M6 20v-4" />
  );
}

export function TrashIcon({ className }) {
  return (
    <Icon className={className} path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  );
}

export function CheckCircleIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M9 14l2 2 4-4" />
      <path d="M7 3h10a2 2 0 012 2v16l-3-2-3 2-3-2-3 2V5a2 2 0 00-2-2z" />
    </Icon>
  );
}

export function DownloadIcon({ className }) {
  return (
    <Icon className={className} path="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" />
  );
}

export function UploadIcon({ className }) {
  return (
    <Icon className={className} path="M12 4.5v15m7.5-7.5h-15" />
  );
}

export function PlusIcon({ className }) {
  return (
    <Icon className={className} path="M12 4.5v15m7.5-7.5h-15" />
  );
}

export function SearchIcon({ className }) {
  return (
    <Icon className={className} path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  );
}

export function SendIcon({ className }) {
  return (
    <Icon className={className} path="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  );
}

export function WarningIcon({ className }) {
  return (
    <Icon className={className} path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  );
}

export function CloseIcon({ className }) {
  return (
    <Icon className={className} path="M6 18L18 6M6 6l12 12" />
  );
}

export function ChevronLeftIcon({ className }) {
  return (
    <Icon className={className} path="M15.75 19.5L8.25 12l7.5-7.5" />
  );
}

export function ChevronRightIcon({ className }) {
  return (
    <Icon className={className} path="M8.25 4.5l7.5 7.5-7.5 7.5" />
  );
}

export function EditIcon({ className }) {
  return (
    <Icon className={className} path="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
  );
}

export function UsersIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </Icon>
  );
}

export function MailIcon({ className }) {
  return (
    <svg className={`${baseClass} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth} aria-hidden="true">
      <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

export function ImageIcon({ className }) {
  return (
    <svg className={`${baseClass} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth} aria-hidden="true">
      <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21zm16.5-13.5h.008v.008h-.008V7.5z" />
    </svg>
  );
}

export function SpinnerIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={`${baseClass} ${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
