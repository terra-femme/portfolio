import { useEffect, useRef, useState } from 'react';

// Embedded demo frame. The demo posts its own content height, so the frame
// fits the content at any width instead of cutting it off or scrolling inside.
// Only the height number crosses the frame boundary; the sandbox still blocks
// the demo from reading the host page.
export default function EmbedFrame({ src, title, ratio }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(null);

  useEffect(() => {
    const onMessage = (e) => {
      if (e.source !== ref.current?.contentWindow) return;
      if (e.data?.type !== 'demo-height') return;
      console.log(`[embed-frame] ${title} reports height ${e.data.height}px`);
      setHeight(e.data.height);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [title]);

  const style = height
    ? { height, aspectRatio: 'auto' }
    : ratio
      ? { aspectRatio: ratio }
      : undefined;

  return (
    <iframe
      ref={ref}
      className="cs-embed"
      src={src}
      title={title}
      loading="lazy"
      sandbox="allow-scripts"
      style={style}
    />
  );
}
