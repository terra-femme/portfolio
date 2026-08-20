// Small looping seed-to-leaf animation. Pure CSS keyframes (see .leaf-sprout*
// rules in index.css) so there's no extra animation library. Respects
// prefers-reduced-motion the same way Background3D.jsx and Card.jsx do.
export default function LeafSprout() {
  const reduced = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <svg
      className={`leaf-sprout${reduced ? ' is-static' : ''}`}
      width="50"
      height="50"
      viewBox="0 0 50 50"
      aria-hidden="true"
    >
      <ellipse className="leaf-sprout-seed" cx="25" cy="44" rx="5" ry="3" />
      <path className="leaf-sprout-stem" d="M25 42 C25 34 25 26 25 18" />
      <path
        className="leaf-sprout-leaf"
        d="M25 19 C18 17 14 10 17 4 C24 6 27 13 25 19 Z"
      />
    </svg>
  );
}
