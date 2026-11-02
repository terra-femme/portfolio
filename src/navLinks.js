/**
 * One nav definition shared by every page.
 *
 * Each page is a separate HTML document, so the same label needs a different
 * href depending on which document is open: "#td" is a same-page anchor on the
 * home page but points at nothing on the others, and would silently do nothing
 * when clicked. Passing the current page in keeps the list in one place instead
 * of one copy per page drifting apart.
 *
 * An item with no href renders as inert text rather than a link. The current
 * page's item is marked `current: true`, so ScrambleNav gives it the glow that
 * tells the visitor where they are.
 */
export function navLinks(page) {
  const home = page === 'home';
  return [
    { href: home ? '#td' : './#td', label: 'TouchDesigner', current: home },
    page === 'dashboard'
      ? { label: 'Dashboards', current: true }
      : { href: './dashboard.html', label: 'Dashboards' },
    page === 'projects'
      ? { label: 'Programs', current: true }
      : { href: './projects.html', label: 'Programs' },
    page === 'azure'
      ? { label: 'Azure', current: true }
      : { href: './azure.html', label: 'Azure' },
    { label: 'Audio Visual Artist' },
  ];
}
