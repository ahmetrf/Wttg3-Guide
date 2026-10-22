import Timeline from './Timeline.jsx';

const TIMES = ['00', '15', '30', '45', '60'];

export default function SiteGroup({ group, sites, visited, onVisitedChange, onOpenSite }) {
  return (
    <section className="schedule-section">
      <h2>{group}</h2>
      <div className="table-wrap">
        <table className="site-table">
          <thead>
            <tr>
              <th className="visited-col" scope="col">Visited</th>
              <th scope="col">Site</th>
              <th className="timeline-col" scope="col">
                <div className="timeline-axis">
                  {TIMES.map((time) => <span key={time}>{time}</span>)}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sites.map((site) => {
              const seized = site.isSeized === true;
              const key = `${site.group || group}|${site.name}`;
              return (
                <tr className={seized ? 'seized-site' : undefined} key={key}>
                  <td className="visited-col">
                    <input
                      aria-label={seized ? `${site.name} is FBI seized` : `Mark ${site.name} visited`}
                      checked={seized || Boolean(visited[key])}
                      className="visited-check"
                      disabled={seized}
                      onChange={(event) => onVisitedChange(key, event.target.checked)}
                      type="checkbox"
                    />
                  </td>
                  <td className="site-name">
                    {seized ? (
                      <span>{site.name} <span className="seized-label">[FBI Seized]</span></span>
                    ) : (
                      <button
                        className={`site-link${site.name.endsWith('[H87]') ? ' tier-h87' : ''}${site.name.endsWith('[H40]') ? ' tier-h40' : ''}`}
                        onClick={() => onOpenSite(site.name)}
                        type="button"
                      >
                        {site.name}
                      </button>
                    )}
                  </td>
                  <td className="timeline-col"><Timeline site={site} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
