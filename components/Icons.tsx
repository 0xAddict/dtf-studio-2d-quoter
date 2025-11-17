import React from 'react';

interface IconProps {
  className?: string;
  'aria-hidden'?: boolean;
}

export const Upload: React.FC<IconProps> = ({ className = "w-4 h-4", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
);

export const Axis3D: React.FC<IconProps> = ({ className = "h-5 w-5", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M12 12v9" />
    <path d="m9.13 5.13 2.87-2.87 2.87 2.87" />
    <path d="M12 3v6" />
    <path d="m5.13 9.13-2.87 2.87 2.87 2.87" />
    <path d="M3 12h6" />
    <path d="m18.87 9.13 2.87 2.87-2.87 2.87" />
    <path d="M15 12h6" />
  </svg>
);

export const Bookmark: React.FC<IconProps> = ({ className = "h-5 w-5", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  </svg>
);

export const RulerDimensionLine: React.FC<IconProps> = ({ className = "h-5 w-5", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M4 8h16" />
    <path d="M4 16h16" />
    <path d="M8 4v2" />
    <path d="M12 4v4" />
    <path d="M16 4v2" />
    <path d="M8 18v2" />
    <path d="M12 16v4" />
    <path d="M16 18v2" />
    <line x1="4" x2="4" y1="4" y2="20" />
    <line x1="20" x2="20" y1="4" y2="20" />
  </svg>
);

export const Target: React.FC<IconProps> = ({ className = "h-5 w-5", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

export const Box: React.FC<IconProps> = ({ className = "h-5 w-5", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.29 7 12 12 20.71 7" />
    <line x1="12" x2="12" y1="22" y2="12" />
  </svg>
);
