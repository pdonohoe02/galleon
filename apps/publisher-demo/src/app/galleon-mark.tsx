/**
 * Galleon's brand mark as an inline SVG: the same navy rounded square with a
 * light "G" that the dashboards render via `.gl-brand-mark`, reproduced here so
 * the publisher page can show it without importing the dashboard stylesheet.
 */
export function GalleonMark({
  size = 20,
  title = "Galleon",
}: {
  size?: number;
  title?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      width={size}
      height={size}
      role="img"
      aria-label={title}
    >
      <rect width="20" height="20" rx="4" fill="#0a2540" />
      <text
        x="10"
        y="14.4"
        textAnchor="middle"
        fontFamily="'Schibsted Grotesk', system-ui, sans-serif"
        fontSize="12"
        fontWeight="700"
        fill="#cfe3f2"
      >
        G
      </text>
    </svg>
  );
}
