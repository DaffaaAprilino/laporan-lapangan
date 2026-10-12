// Ikon SVG bersama: dipakai sidebar dashboard dan kartu login, supaya tidak ada
// gambar yang digandakan di beberapa file.
type IconProps = { size?: number };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function IconDocument({ size = 17 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <g {...stroke}>
        <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
        <path d="M13.5 3v4.5H18M8 13h7M8 16.5h5" />
      </g>
    </svg>
  );
}

export function IconUsers({ size = 17 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <g {...stroke}>
        <circle cx="9.5" cy="8.5" r="3.2" />
        <path d="M3.5 19.5c0-3 2.7-4.8 6-4.8s6 1.8 6 4.8" />
        <path d="M16 5.6a3 3 0 0 1 0 5.8M17.5 14.9c1.9.6 3 1.9 3 4.1" />
      </g>
    </svg>
  );
}

export function IconLogout({ size = 17 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <g {...stroke} strokeWidth={1.8}>
        <path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5" />
        <path d="M9 12h10" />
        <path d="M15.5 8.5 19 12l-3.5 3.5" />
      </g>
    </svg>
  );
}
