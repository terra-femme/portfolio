import { useEffect, useRef, useState } from 'react';

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const AUTO_SCRAMBLE_FRAMES = 8;
const AUTO_FRAME_DELAY_MS = 110; // ~880ms per letter
// Deliberately not a fixed 3s interval like the nav links — randomized so
// this word's pulse never locks into the same rhythm as the nav bar.
const AUTO_TICK_MIN_MS = 4200;
const AUTO_TICK_MAX_MS = 7000;

const HOVER_SCRAMBLE_FRAMES = 4;
const HOVER_FRAME_DELAY_MS = 55; // ~220ms per letter

// Same bubble-scramble effect as the nav links (idle: one random letter
// pops up in 3D and settles on its own randomized cadence; hover: every
// letter sweeps left to right), scoped to a single inline word, with an
// added glow on the pop.
export default function ScrambleWord({ text, as: Tag = 'span', className }) {
  const [display, setDisplay] = useState(() => text.split(''));
  const [pulses, setPulses] = useState({});
  const busyRef = useRef(false);
  const timeoutsRef = useRef([]);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const bumpPulse = (charIndex, durationMs) => {
    setPulses((prev) => ({
      ...prev,
      [charIndex]: { version: (prev[charIndex]?.version || 0) + 1, durationMs },
    }));
  };

  const scrambleOneChar = (charIndex, original, frames, frameDelay, onDone) => {
    bumpPulse(charIndex, frames * frameDelay);

    let frame = 0;
    const runFrame = () => {
      frame += 1;
      setDisplay((prev) => {
        const next = [...prev];
        next[charIndex] = frame < frames
          ? SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
          : original;
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

  useEffect(() => {
    if (reducedRef.current) {
      console.log('[ScrambleWord] reduced motion preferred, skipping auto-cycle for', text);
      return;
    }

    const letters = text.split('');
    let cancelled = false;

    const scheduleNext = () => {
      const delay = AUTO_TICK_MIN_MS + Math.random() * (AUTO_TICK_MAX_MS - AUTO_TICK_MIN_MS);
      timeoutsRef.current.push(setTimeout(tick, delay));
    };

    const tick = () => {
      if (busyRef.current) {
        console.log(`[ScrambleWord] "${text}" busy (hover sweep in progress), skipping auto tick`);
      } else {
        const eligible = letters.map((c, i) => i).filter((i) => letters[i] !== ' ');
        if (eligible.length > 0) {
          const charIndex = eligible[Math.floor(Math.random() * eligible.length)];
          console.log(`[ScrambleWord] auto tick: "${text}" index ${charIndex}`);
          scrambleOneChar(charIndex, letters[charIndex], AUTO_SCRAMBLE_FRAMES, AUTO_FRAME_DELAY_MS);
        }
      }
      if (!cancelled) scheduleNext();
    };

    scheduleNext();
    return () => {
      cancelled = true;
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [text]);

  const handleHoverSweep = () => {
    if (reducedRef.current || busyRef.current) return;
    busyRef.current = true;
    const letters = text.split('');
    console.log(`[ScrambleWord] hover sweep start: "${text}"`);

    const sweep = (pos) => {
      if (pos >= letters.length) {
        busyRef.current = false;
        console.log(`[ScrambleWord] hover sweep done: "${text}"`);
        return;
      }
      if (letters[pos] === ' ') {
        sweep(pos + 1);
        return;
      }
      scrambleOneChar(pos, letters[pos], HOVER_SCRAMBLE_FRAMES, HOVER_FRAME_DELAY_MS, () => sweep(pos + 1));
    };
    sweep(0);
  };

  return (
    <Tag className={['scramble-word', className].filter(Boolean).join(' ')} onMouseEnter={handleHoverSweep}>
      {display.map((char, i) => {
        const pulse = pulses[i];
        return (
          <span
            key={`${i}-${pulse ? pulse.version : 0}`}
            className={pulse ? 'scramble-letter letter-bubble-glow' : 'scramble-letter'}
            style={pulse ? { animationDuration: `${pulse.durationMs}ms` } : undefined}
          >
            {char}
          </span>
        );
      })}
    </Tag>
  );
}
