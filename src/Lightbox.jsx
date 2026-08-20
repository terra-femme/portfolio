import { useEffect, useRef } from 'react';

// Full-screen video player. Closes on backdrop click, X button, or Escape.
export default function Lightbox({ item, onClose }) {
  const closeRef = useRef();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!item) return null;

  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-modal="true" aria-label={item.title}>
      <button className="lightbox-close" onClick={onClose} ref={closeRef} aria-label="Close">×</button>
      <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
        <video
          src={item.video}
          poster={item.poster}
          controls
          autoPlay
          loop
          playsInline
        />
        <div className="lightbox-meta">
          <span className="tag">{item.tag}</span>
          <h3>{item.title}</h3>
          <p>{item.desc}</p>
        </div>
      </div>
    </div>
  );
}
