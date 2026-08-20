// Fill in your real profile URLs below, then delete the TODO comments.
const SOCIAL_LINKS = [
  { key: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/bad.habitmusic' }, // TODO: replace with your real Instagram URL
  { key: 'x', label: 'X / Twitter', href: 'https://x.com/TerraFemmeTech' }, // TODO: replace with your real X/Twitter URL
  // { key: 'xene', label: 'Xene', href: 'https://xene.media' }, // hidden until xene.media is live — uncomment to re-enable
  { key: 'email', label: 'Email', href: 'mailto:collab.terrafemme@gmail.com' },
];

function Icon({ type }) {
  switch (type) {
    case 'instagram':
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2.5" y="2.5" width="15" height="15" rx="4.5" />
          <circle cx="10" cy="10" r="3.6" />
          <circle cx="14.3" cy="5.7" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'x':
      return (
        <svg viewBox="0 0 19 19">
          <use href={`${import.meta.env.BASE_URL}icons.svg#x-icon`} />
        </svg>
      );
    case 'xene':
      // No brand mark provided — neutral external-link glyph as a stand-in.
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 4.5H4a1 1 0 0 0-1 1V16a1 1 0 0 0 1 1h10.5a1 1 0 0 0 1-1v-4.5" />
          <path d="M11.5 2.5h6v6" />
          <path d="M17 3 9.5 10.5" />
        </svg>
      );
    case 'email':
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2.5" y="4.5" width="15" height="11" rx="2.2" />
          <path d="m3.2 5.5 6.8 5.4 6.8-5.4" />
        </svg>
      );
    default:
      return null;
  }
}

export default function SocialLinks() {
  return (
    <div className="social-links">
      {SOCIAL_LINKS.map((s) => (
        <a
          key={s.key}
          href={s.href}
          aria-label={s.label}
          target={s.href.startsWith('mailto:') ? undefined : '_blank'}
          rel={s.href.startsWith('mailto:') ? undefined : 'noreferrer'}
        >
          <Icon type={s.key} />
        </a>
      ))}
    </div>
  );
}
