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

export function IconList({ size = 17 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <g {...stroke}>
        <path d="M9 6h11M9 12h11M9 18h11" />
        <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" strokeWidth={2.4} />
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

export function IconMenu({ size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <g {...stroke} strokeWidth={1.9}>
        <path d="M4 7h16M4 12h16M4 17h16" />
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

export function IconTrash({ size = 17 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <g {...stroke}>
        <path d="M4 7h16M9.5 7V5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7" />
        <path d="M6.5 7l.8 12a1 1 0 0 0 1 .9h7.4a1 1 0 0 0 1-.9l.8-12" />
        <path d="M10.5 11v6M13.5 11v6" />
      </g>
    </svg>
  );
}
