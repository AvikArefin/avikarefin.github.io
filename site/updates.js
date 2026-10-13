// Recently updated notes: AtoZAI publishes /AtoZAI/updates.json on every deploy,
// this fills the list from it. If the feed is missing the section stays hidden.
(() => {
  const section = document.querySelector('.log');
  const list = section && section.querySelector('.log__list');
  if (!list) return;

  const ROWS = 6;
  const thisYear = new Date().getFullYear();
  const day = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });
  const dayYear = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' });

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  };

  fetch('/AtoZAI/updates.json')
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then(({ updates }) => {
      if (!updates || !updates.length) return;
      updates.slice(0, ROWS).forEach((u, i) => {
        const date = new Date(u.date);
        const li = el('li', 'log__row' + (i === 0 ? ' log__row--latest' : ''));
        const a = el('a');
        a.href = u.url;

        const time = el('time', 'log__date', (date.getFullYear() === thisYear ? day : dayYear).format(date));
        time.dateTime = u.date;

        const title = el('span', 'log__title', u.title);
        if (i === 0) title.append(' ', el('span', 'log__tag', 'Updated'));

        a.append(time, title, el('span', 'log__section', u.section || 'AtoZAI'));
        li.append(a);
        list.append(li);
      });
      section.hidden = false;
    })
    .catch(() => {});
})();
