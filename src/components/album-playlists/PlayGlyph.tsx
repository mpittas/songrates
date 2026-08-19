export default function PlayGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden>
      <path d="M4 2.2v13.6L15.2 9 4 2.2Z" fill="currentColor" />
    </svg>
  );
}
