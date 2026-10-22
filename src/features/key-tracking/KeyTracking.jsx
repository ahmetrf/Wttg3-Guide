export default function KeyTracking({ rows, onChange }) {
  return (
    <section aria-label="Key tracking" className="key-tracking-section">
      <div className="table-wrap">
        <table className="key-tracking-table">
          <thead>
            <tr><th scope="col">#</th><th scope="col">Key</th><th scope="col">Wiki</th></tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <th scope="row">{index + 1}</th>
                <td>
                  <input
                    aria-label={`Key ${index + 1}`}
                    autoComplete="off"
                    className="key-input"
                    onChange={(event) => onChange(index, 'key', event.target.value)}
                    type="text"
                    value={row.key}
                  />
                </td>
                <td>
                  <div aria-label={`Wiki for key ${index + 1}`} className="wiki-options" role="radiogroup">
                    {['1', '2', '3'].map((wiki) => (
                      <label className="wiki-option" key={wiki}>
                        <input
                          checked={row.wiki === wiki}
                          name={`wiki-${index + 1}`}
                          onChange={() => onChange(index, 'wiki', wiki)}
                          type="radio"
                          value={wiki}
                        />
                        <span>{wiki}</span>
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
