/**
 * One nav definition shared by every page.
 *
 * The portfolio and the dashboard are separate HTML documents, so the same
 * label needs a different href depending on which document is open: "#td" is a
 * same-page anchor on the home page but points at nothing on the dashboard, and
 * would silently do nothing when clicked. Passing the current page in keeps the
 * list in one place instead of two copies drifting apart.
 *
 * An item with no href renders as inert text rather than a link, which is how
 * the current section marks itself.
 */
export function navLinks(page) {
  const home = page === 'home';
  return [
    { href: home ? '#td' : './#td', label: 'TouchDesigner' },
    // On the dashboard page this is where you already are, so it is a label,
    // not a destination.
    home ? { href: './dashboard.html', label: 'Dashboards' } : { label: 'Dashboards' },
    { label: 'Audio Visual Artist' },
  ];
}
