import type { SVGProps } from "react";

type MawjLogoProps = SVGProps<SVGSVGElement> & {
  /** mark = icon only · full = MAWJ wordmark · mark-light = icon on dark bg without fill box */
  variant?: "mark" | "full" | "mark-light";
};

const GRADIENT = (
  <defs>
    <linearGradient id="mawj-brand-grad" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#9efcd0" />
      <stop offset="45%" stopColor="#7ef2bc" />
      <stop offset="100%" stopColor="#4dd4a0" />
    </linearGradient>
    <linearGradient id="mawj-wave-highlight" x1="12" y1="18" x2="38" y2="34" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#b8ffe0" />
      <stop offset="100%" stopColor="#7ef2bc" />
    </linearGradient>
  </defs>
);

/** Wave + play mark — layered motion curves with a forward play cut. */
function MarkPaths({ ink = "#071210" }: { ink?: string }) {
  return (
    <>
      {/* Back wave */}
      <path
        d="M9 33c5.5-7 11-10 16.5-8.5 3.2 1 6.2 3.8 9 7.5 2.2-4.2 5.8-6.8 10.5-7 4-.2 7.2 1.8 9.5 5.5v4.2c-3.5-3.2-7.2-4.8-11-4.5-4.2.4-7.8 2.8-10.5 6.5-2.8-3.5-6.5-5.8-11-6-4-.2-7.5 1.5-10 4.8V33Z"
        fill={ink}
        opacity="0.88"
      />
      {/* Front wave with play point */}
      <path
        d="M10 28.5c4.8-6.5 10-9.2 15.5-7.5 2.8.9 5.2 3 7.2 6 1.8-2.8 4.5-4.5 8-4.8 3.8-.3 7 1.5 9.3 4.8l-3.8 2.8c-1.6-2-3.8-3-6.2-2.8-3 .3-5.2 2-6.5 4.5-2.5-2.5-5.8-4-9.5-3.5-3.2.4-6 2.2-8.2 5v-4.5Z"
        fill="url(#mawj-wave-highlight)"
      />
      {/* Play triangle */}
      <path d="M31.5 17.5 38 22l-6.5 4.5V17.5Z" fill={ink} />
      {/* AI sparkle */}
      <circle cx="14" cy="16" r="2.2" fill={ink} opacity="0.75" />
      <path
        d="M14 12.8v1.4M14 17.8v1.4M11.8 16h1.4M15.8 16h1.4"
        stroke={ink}
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.55"
      />
    </>
  );
}

/** مَوج brand mark — headers, favicon, OG. */
export function MawjLogo({ variant = "mark", className, ...props }: MawjLogoProps) {
  if (variant === "full") {
    return (
      <svg
        viewBox="0 0 168 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
        {...props}
      >
        {GRADIENT}
        <rect x="0" y="0" width="40" height="40" rx="12" fill="url(#mawj-brand-grad)" />
        <g transform="translate(4 4) scale(0.833)">
          <MarkPaths />
        </g>
        {/* MAWJ wordmark */}
        <path
          d="M54 30V10h5.8l7.2 12.5L74 10h5.8v20h-4.8V18.2L68.5 30h-3.8L58.8 18.2V30H54Zm26.2 0c-5.2 0-8.8-3.5-8.8-8.4 0-5 3.7-8.6 8.9-8.6 5.5 0 8.6 3.9 8.6 9v1.2H72.5c.3 2.2 1.8 3.6 4 3.6 1.6 0 2.9-.6 3.7-1.8l3.8 2.2c-1.4 2.2-3.8 3.8-7 3.8Zm-3.2-6.8h6.8c-.2-2-1.5-3.2-3.2-3.2-1.9 0-3.1 1.3-3.6 3.2ZM98 30V10h4.8v20H98Zm14.5 0V10h4.8l9.2 13.5V10h4.5v20h-4.8L117 16.5V30h-4.5Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (variant === "mark-light") {
    return (
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
        {...props}
      >
        {GRADIENT}
        <MarkPaths ink="currentColor" />
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
      {GRADIENT}
      <rect width="40" height="40" rx="12" fill="url(#mawj-brand-grad)" />
      <MarkPaths />
    </svg>
  );
}
