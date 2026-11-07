export default function ToothIcon({ size = 24, className = '', strokeWidth = 1.8 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2.9c-1.7 0-2.35.9-3.9.9-1.18 0-2.1-.66-3.05.25C3.23 5.7 3.7 8.55 4.42 10.4c.55 1.4.43 3.08.78 4.74.38 1.78.98 3.78 2.2 3.78 1.2 0 1.16-2.62 1.7-4.55.3-1.07.84-1.77 1.9-1.77h2c1.06 0 1.6.7 1.9 1.77.54 1.93.5 4.55 1.7 4.55 1.22 0 1.82-2 2.2-3.78.35-1.66.23-3.34.78-4.74.72-1.85 1.19-4.7-.63-6.35-.95-.91-1.87-.25-3.05-.25-1.55 0-2.2-.9-3.9-.9Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.15 8.35c1.08-.57 2.39-.82 3.85-.82 1.46 0 2.77.25 3.85.82"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity=".55"
      />
    </svg>
  )
}
