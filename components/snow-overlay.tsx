'use client'

// Ambient falling-snow layer — the clearest, most literal "winter" signal
// we can put on the page. Pure CSS animation (no JS per-frame work), fixed
// so it drifts continuously across every section as you scroll, not just
// once per section entrance.
const FLAKES = Array.from({ length: 36 }, (_, i) => {
  const seed = i * 137.5; // golden-angle spread for a natural-looking distribution
  const left = (seed % 100);
  const size = 2 + ((i * 7) % 5); // 2–6px
  const duration = 14 + ((i * 5) % 16); // 14–29s
  const delay = -((i * 3.7) % duration);
  const drift = ((i % 2 === 0 ? 1 : -1) * (20 + (i % 40))); // px of horizontal sway
  const opacity = 0.25 + ((i % 5) * 0.1);
  return { left, size, duration, delay, drift, opacity };
});

export function SnowOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[5] overflow-hidden" aria-hidden="true">
      {FLAKES.map((f, i) => (
        <span
          key={i}
          className="snowflake absolute rounded-full bg-white"
          style={{
            left: `${f.left}%`,
            width: f.size,
            height: f.size,
            opacity: f.opacity,
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
            // @ts-expect-error custom property read by the keyframes
            '--drift': `${f.drift}px`,
          }}
        />
      ))}
    </div>
  )
}
