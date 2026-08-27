import { useEffect, useRef, useState } from 'react';

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// Passive auto-cycle: one link, one letter, every tick.
const AUTO_SCRAMBLE_FRAMES = 8;
const AUTO_FRAME_DELAY_MS = 110; // ~880ms per letter
const AUTO_TICK_INTERVAL_MS = 3000;

// Hover sweep: every letter in the label, one at a time, left to right.
const HOVER_SCRAMBLE_FRAMES = 4;
const HOVER_FRAME_DELAY_MS = 55; // ~220ms per letter

// Cycles through `links` one at a time for the passive idle animation
// (exactly one link scrambles one letter per tick, then it's the next
// link's turn). On hover/focus, that link runs its own sequential sweep:
// each letter scrambles briefly and resolves before the next one starts.
// Every scramble also fires a keyed "pulse" so the letter's span remounts
// and replays the CSS bubble-up-and-settle animation, timed to match how
// long that letter spends scrambling.
export default function ScrambleNav({ links }) {
  const [displays, setDisplays] = useState(() => links.map((l) => l.label.split('')));
  const [pulses, setPulses] = useState({});
  const activeIndexRef = useRef(0);
  const busyRef = useRef(new Set());
  const timeoutsRef = useRef([]);
  const reducedRef = useRef(false);

  useEffect(() => {
    setDisplays(links.map((l) => l.label.split('')));
    setPulses({});
    activeIndexRef.current = 0;
    busyRef.current = new Set();
  }, [links]);

  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const bumpPulse = (linkIndex, charIndex, durationMs) => {
    const key = `${linkIndex}-${charIndex}`;
    setPulses((prev) => ({
      ...prev,
      [key]: { version: (prev[key]?.version || 0) + 1, durationMs },
    }));
  };

  const scrambleOneChar = (linkIndex, charIndex, original, frames, frameDelay, onDone) => {
    bumpPulse(linkIndex, charIndex, frames * frameDelay);

    let frame = 0;
    const runFrame = () => {
      frame += 1;
      setDisplays((prev) => {
        const next = [...prev];
        const nextChars = [...next[linkIndex]];
        nextChars[charIndex] = frame < frames
          ? SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
          : original;
        next[linkIndex] = nextChars;
        return next;
      });
      if (frame < frames) {
        timeoutsRef.current.push(setTimeout(runFrame, frameDelay));
      } else if (onDone) {
        onDone();
      }
    };
    runFrame();
  };

  // Passive idle cycle.
  useEffect(() => {
    if (reducedRef.current) {
      console.log('[ScrambleNav] reduced motion preferred, skipping auto-cycle');
      return;
    }

    const tick = () => {
      const linkIndex = activeIndexRef.current;
      activeIndexRef.current = (activeIndexRef.current + 1) % links.length;

      if (busyRef.current.has(linkIndex)) {
        console.log(`[ScrambleNav] link ${linkIndex} busy (hover sweep in progress), skipping auto tick`);
        return;
      }

      const label = links[linkIndex].label;
      const chars = label.split('');
      const eligible = chars.map((c, i) => i).filter((i) => chars[i] !== ' ');
      if (eligible.length === 0) return;

      const charIndex = eligible[Math.floor(Math.random() * eligible.length)];
      console.log(`[ScrambleNav] auto tick: link ${linkIndex} ("${label}") index ${charIndex}`);
      scrambleOneChar(linkIndex, charIndex, chars[charIndex], AUTO_SCRAMBLE_FRAMES, AUTO_FRAME_DELAY_MS);
    };

    const interval = setInterval(tick, AUTO_TICK_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [links]);

  const handleHoverSweep = (linkIndex) => {
    if (reducedRef.current) return;
    if (busyRef.current.has(linkIndex)) {
      console.log(`[ScrambleNav] link ${linkIndex} sweep already running, ignoring re-trigger`);
      return;
    }

    busyRef.current.add(linkIndex);
    const label = links[linkIndex].label;
    const chars = label.split('');
    console.log(`[ScrambleNav] hover sweep start: link ${linkIndex} ("${label}")`);

    const sweep = (pos) => {
      if (pos >= chars.length) {
        busyRef.current.delete(linkIndex);
        console.log(`[ScrambleNav] hover sweep done: link ${linkIndex}`);
        return;
      }
      if (chars[pos] === ' ') {
        sweep(pos + 1);
        return;
      }
      scrambleOneChar(
        linkIndex,
        pos,
        chars[pos],
        HOVER_SCRAMBLE_FRAMES,
        HOVER_FRAME_DELAY_MS,
        () => sweep(pos + 1)
      );
    };
    sweep(0);
  };

  return (
    <>
      {links.map((link, i) => {
        const letters = (
          <span className="scramble-word" aria-hidden="true">
            {displays[i].map((char, j) => {
              const pulse = pulses[`${i}-${j}`];
              return (
                <span
                  key={`${j}-${pulse ? pulse.version : 0}`}
                  className={pulse ? 'scramble-letter letter-bubble' : 'scramble-letter'}
                  style={pulse ? { animationDuration: `${pulse.durationMs}ms` } : undefined}
                >
                  {char}
                </span>
              );
            })}
          </span>
        );

        // No href means this is a label, not a destination: render inert text
        // with no hover sweep, so nothing suggests it can be clicked. It still
        // takes part in the passive auto-cycle.
        if (!link.href) {
          return (
            <span key={link.label} className="nav-static" aria-label={link.label}>
              {letters}
            </span>
          );
        }

        return (
          <a
            key={link.href}
            href={link.href}
            aria-label={link.label}
            onMouseEnter={() => handleHoverSweep(i)}
            onFocus={() => handleHoverSweep(i)}
          >
            {letters}
          </a>
        );
      })}
    </>
  );
}
