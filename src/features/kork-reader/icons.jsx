import React from 'react';

function IconBase({ children, size = 20, className = '', ...props }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export const BookOpenIcon = (p) => <IconBase {...p}><path d="M2.5 5.5A3.5 3.5 0 0 1 6 2h5v18H6a3.5 3.5 0 0 0-3.5 3.5z"/><path d="M21.5 5.5A3.5 3.5 0 0 0 18 2h-5v18h5a3.5 3.5 0 0 1 3.5 3.5z"/></IconBase>;
export const UploadIcon = (p) => <IconBase {...p}><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></IconBase>;
export const ChevronLeftIcon = (p) => <IconBase {...p}><path d="m15 18-6-6 6-6"/></IconBase>;
export const ChevronRightIcon = (p) => <IconBase {...p}><path d="m9 18 6-6-6-6"/></IconBase>;
export const MenuIcon = (p) => <IconBase {...p}><path d="M4 6h16M4 12h16M4 18h16"/></IconBase>;
export const SettingsIcon = (p) => <IconBase {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.82 2.82-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.04 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.96 19.36a1.7 1.7 0 0 0-1.88.34l-.06.06-2.82-2.82.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.04H3v-4h.04A1.7 1.7 0 0 0 4.6 8.92a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.82-2.82.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 10 3V3h4v.08a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.82 2.82-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.04H21v4h-.04A1.7 1.7 0 0 0 19.4 15z"/></IconBase>;
export const BookmarkIcon = ({ filled = false, ...p }) => <IconBase {...p} fill={filled ? 'currentColor' : 'none'}><path d="M6 3h12v18l-6-4-6 4z"/></IconBase>;
export const ExpandIcon = (p) => <IconBase {...p}><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></IconBase>;
export const TrashIcon = (p) => <IconBase {...p}><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 10v7M14 10v7"/></IconBase>;
export const XIcon = (p) => <IconBase {...p}><path d="M6 6l12 12M18 6 6 18"/></IconBase>;
export const LibraryIcon = (p) => <IconBase {...p}><path d="M4 19.5V5a2 2 0 0 1 2-2h11.5a1.5 1.5 0 0 1 1.5 1.5V19"/><path d="M6 17h13M8 7h7M8 11h8"/></IconBase>;
export const MinusIcon = (p) => <IconBase {...p}><path d="M5 12h14"/></IconBase>;
export const PlusIcon = (p) => <IconBase {...p}><path d="M12 5v14M5 12h14"/></IconBase>;
export const SunIcon = (p) => <IconBase {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></IconBase>;
export const MoonIcon = (p) => <IconBase {...p}><path d="M20.5 14.5A8 8 0 1 1 9.5 3.5a6.5 6.5 0 0 0 11 11z"/></IconBase>;
