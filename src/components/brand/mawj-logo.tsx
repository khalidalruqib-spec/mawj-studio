import type { SVGProps } from "react";

type MawjLogoProps = SVGProps<SVGSVGElement> & {
  variant?: "mark" | "full";
};

/** Mawj wave mark — used in headers, favicon-style spots, and landing. */
export function MawjLogo({ variant = "mark", className, ...props }: MawjLogoProps) {
  if (variant === "full") {
    return (
      <svg
        viewBox="0 0 200 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <path
          d="M8 36V12h6l10 16 10-16h6v24h-5.5V22l-9.5 14h-3L12 22v14H8Z"
          fill="currentColor"
        />
        <path
          d="M52 36c-6.2 0-10.5-4.2-10.5-10.2S45.8 15.6 52 15.6c3.4 0 6.1 1.3 7.8 3.6l-4.2 2.6c-.9-1.2-2.2-1.9-3.6-1.9-2.8 0-4.8 2.1-4.8 5.1s2 5.1 4.8 5.1c1.5 0 2.8-.7 3.7-2l4.2 2.5c-1.8 2.4-4.6 3.6-7.9 3.6Z"
          fill="currentColor"
        />
        <path
          d="M72 36V15.6h5.2V19h.3c1.2-2.2 3.5-3.4 6.3-3.4 4.8 0 7.8 3.2 7.8 8.5V36h-5.5V24.4c0-2.8-1.4-4.4-3.9-4.4-2.6 0-4.2 1.8-4.2 4.7V36H72Z"
          fill="currentColor"
        />
        <path
          d="M98.5 36c-5.4 0-9.2-3.8-9.2-9.1 0-5.4 3.9-9.3 9.4-9.3 5.8 0 9.1 4.2 9.1 9.6v1.5h-13.1c.4 2.5 2.2 4 4.7 4 1.8 0 3.2-.7 4.1-2.2l4.5 2.4c-1.6 2.6-4.4 3.6-7.5 3.6Zm-3.6-11.2h7.5c-.2-2.3-1.8-3.8-3.7-3.8-2.1 0-3.4 1.5-3.8 3.8Z"
          fill="currentColor"
        />
        <path
          d="M118 36V15.6h5.2V19h.3c1.2-2.2 3.5-3.4 6.3-3.4 4.8 0 7.8 3.2 7.8 8.5V36h-5.5V24.4c0-2.8-1.4-4.4-3.9-4.4-2.6 0-4.2 1.8-4.2 4.7V36H118Z"
          fill="currentColor"
        />
        <path
          d="M148 36l-8.5-11.2L148 15.6h6.2l-4.8 6.4 4.9 6.5h-6.3Zm-11.8 0V15.6h5.5V36h-5.5Z"
          fill="currentColor"
        />
        <path
          d="M162 12.2c0-1.8 1.4-3.1 3.2-3.1s3.2 1.3 3.2 3.1-1.4 3.2-3.2 3.2-3.2-1.4-3.2-3.2ZM162.8 36V15.6h5.5V36h-5.5Z"
          fill="currentColor"
        />
        <path
          d="M180.5 36c-5.4 0-9.2-3.8-9.2-9.1 0-5.4 3.9-9.3 9.4-9.3 5.8 0 9.1 4.2 9.1 9.6v1.5h-13.1c.4 2.5 2.2 4 4.7 4 1.8 0 3.2-.7 4.1-2.2l4.5 2.4c-1.6 2.6-4.4 3.6-7.5 3.6Zm-3.6-11.2h7.5c-.2-2.3-1.8-3.8-3.7-3.8-2.1 0-3.4 1.5-3.8 3.8Z"
          fill="currentColor"
        />
        <path
          d="M8 8c8-4 18-2 24 4 6-6 16-8 24-4-2 10-12 18-24 20C20 26 10 18 8 8Z"
          fill="#7ef2bc"
          transform="translate(0, -2) scale(0.35)"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect width="40" height="40" rx="12" fill="currentColor" className="text-[#7ef2bc]" />
      <path
        d="M10 26c4-8 8-12 10-14 2 2 6 6 10 14-3 2-7 4-10 4s-7-2-10-4Z"
        fill="#060a09"
      />
      <path
        d="M14 22c2-4 4-6 6-8 2 2 4 4 6 8-1.5 1-3.5 2-6 2s-4.5-1-6-2Z"
        fill="#7ef2bc"
        opacity="0.9"
      />
    </svg>
  );
}
