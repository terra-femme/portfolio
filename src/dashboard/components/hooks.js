import { useEffect, useRef, useState } from 'react';

/** True when the user has asked the OS to reduce motion. */
export function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animate a number from 0 up to `target` on mount.
 *
 * Driven by requestAnimationFrame against real elapsed time rather than a
 * per-frame increment. A frame-counting version runs at whatever rate the
 * display happens to refresh, so the same counter finishes in half the time on
 * a 120Hz laptop as on a 60Hz monitor.
 *
 * Reduced motion short-circuits to the final value immediately -- the number is
 * the content, so it must never be withheld as a side effect of an effect.
 */
export function useCountUp(target, { duration = 900, delay = 0 } = {}) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));
  const frameRef = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return undefined;
    }

    let start = null;
    // easeOutCubic: fast off the mark, gentle landing. Matches how the panels
    // themselves ease in, so the whole page feels like one motion system.
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    const step = (now) => {
      if (start === null) start = now;
      const elapsed = now - start - delay;
      if (elapsed < 0) {
        frameRef.current = requestAnimationFrame(step);
        return;
      }
      const t = Math.min(1, elapsed / duration);
      setValue(target * ease(t));
      if (t < 1) frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);

    // Safety net, and not a theoretical one: requestAnimationFrame stops firing
    // whenever the page is not being painted -- a background tab, an occluded
    // or offscreen iframe, some power-saving modes. When that happens mid-count
    // the tile freezes on a PARTIAL number and never recovers, so a $4.82M KPI
    // sits there reading $1.57M. A wrong figure presented as fact is far worse
    // than no animation, so a timer guarantees the true value lands regardless.
    // Timers are throttled in hidden tabs too, but unlike rAF they still fire,
    // and an overdue one fires immediately when the tab is focused again.
    const settle = setTimeout(() => setValue(target), delay + duration + 120);

    return () => {
      cancelAnimationFrame(frameRef.current);
      clearTimeout(settle);
    };
  }, [target, duration, delay]);

  return value;
}

/**
 * A ticking "seconds since last refresh" readout.
 *
 * This is the only place in the dashboard that touches the real clock. The
 * underlying data is static, but a BI canvas that claims a sync time and then
 * shows the same frozen string forever looks broken; a counter that advances
 * reads as a live connection without pretending the numbers changed.
 */
export function useElapsed(sinceIso, tickMs = 1000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const id = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);

  const seconds = Math.max(0, Math.floor((now - new Date(sinceIso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * Sort state for a table column.
 * Clicking a new column starts descending -- for metrics tables "biggest
 * first" is almost always the question being asked.
 */
export function useSort(defaultKey, defaultDir = 'desc') {
  const [sort, setSort] = useState({ key: defaultKey, dir: defaultDir });

  const toggle = (key) =>
    setSort((prev) => (prev.key === key
      ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
      : { key, dir: 'desc' }));

  const apply = (rows) => {
    const sorted = [...rows].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (typeof av === 'string') return av.localeCompare(bv);
      return av - bv;
    });
    return sort.dir === 'desc' ? sorted.reverse() : sorted;
  };

  return { sort, toggle, apply };
}
