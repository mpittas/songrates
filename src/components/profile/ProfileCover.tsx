/**
 * Dusk wash in the same coral family as the home hero:
 * apricot highlight → rose mid → wine, with a light sheen.
 */
export default function ProfileCover() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,#ffb07a_0%,#f05f45_28%,#c13a62_58%,#4a1530_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_92%_18%,rgba(255,176,122,0.45)_0%,transparent_42%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0)_32%)]" />
      <div className="explore-hero-noise pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay" />
    </div>
  );
}
