export default function MiningTier({ tier }) {
  return (
    <section className="tier-section">
      <h2>{tier.name}</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th scope="col">Name</th><th scope="col">Mining speed</th></tr></thead>
          <tbody>
            {tier.miners.map(([name, speed]) => (
              <tr key={name}><td>{name}</td><td>{speed} DOS/min</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
