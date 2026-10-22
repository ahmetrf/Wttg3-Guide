const SLOTS = ['00', '15', '30', '45'];

export default function Timeline({ site }) {
  const ranges = [];
  const bars = [];
  let index = 0;

  while (index < SLOTS.length) {
    if (site[SLOTS[index]] !== true) {
      index += 1;
      continue;
    }
    const start = index;
    while (index < SLOTS.length && site[SLOTS[index]] === true) index += 1;
    const end = index;
    ranges.push(`${String(start * 15).padStart(2, '0')}-${String(end * 15).padStart(2, '0')}`);
    bars.push(
      <span
        className={`availability-bar${site.name.endsWith('[H87]') ? ' tier-h87' : ''}${site.name.endsWith('[H40]') ? ' tier-h40' : ''}`}
        key={`${start}-${end}`}
        style={{ left: `${start * 25}%`, width: `${(end - start) * 25}%` }}
      />
    );
  }

  return (
    <div className="timeline-track" role="img" aria-label={ranges.length ? `Available ${ranges.join(', ')}` : 'Not available'}>
      {bars}
    </div>
  );
}
