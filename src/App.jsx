import { useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'site-schedule-visited-v1';
const SLOTS = ['00', '15', '30', '45'];
const TIMES = ['00', '15', '30', '45', '60'];
const MINING_TIERS = [
  {
    name: 'Tier 1',
    miners: [
      ['WebTyk', '1.84'], ['UserJyx', '1.80'], ['NetVorn', '1.45'], ['CloudFuz', '0.88'],
      ['SysBlip', '0.87'], ['DevQuix', '0.64'], ['IT_Kwez', '0.42'], ['DataRax', '0.32'],
      ['WorkZap', '0.31'], ['CodePlix', '0.30']
    ]
  },
  {
    name: 'Tier 2',
    miners: [
      ['OpsHax', '3.23'], ['SecCrux', '2.73'], ['GameDrux', '2.57'], ['PrintYiv', '2.43'],
      ['FileNuz', '1.88'], ['Prod Glin', '1.80'], ['VM_Wekl', '1.74'], ['BackSkiv', '1.49'],
      ['TestXor', '1.36'], ['LabBzop', '0.48']
    ]
  },
  {
    name: 'Tier 3',
    miners: [
      ['Phoenix', '4.79'], ['MediaVlu', '3.93'], ['QA_Pivz', '3.58'], ['HR_Treq', '3.42'],
      ['VPN_Qwer', '3.38'], ['FinLoxu', '3.38'], ['SalesMiv', '3.21'], ['ChatEzk', '3.17'],
      ['EngZolp', '2.63'], ['LogJuk', '0.30']
    ]
  }
];

function siteFolderName(name) {
  return name
    .replace(/\s*\[H(?:87|40)\]\s*$/i, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

function validateSiteData(data) {
  if (!data || !Array.isArray(data.groups)) {
    throw new Error('sites.json must contain a groups array.');
  }

  data.groups.forEach((group) => {
    if (!group || typeof group.group !== 'string' || !Array.isArray(group.sites)) {
      throw new Error('Each site group must have a name and a sites array.');
    }
    group.sites.forEach((site) => {
      if (!site || typeof site.name !== 'string' || SLOTS.some((slot) => typeof site[slot] !== 'boolean')) {
        throw new Error(`Invalid site entry in group "${group.group}".`);
      }
    });
  });
  return data.groups;
}

function Timeline({ site }) {
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

function SiteGroup({ group, sites, visited, onVisitedChange, onOpenSite }) {
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

function MiningTier({ tier }) {
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

function SiteImageDialog({ siteName, onClose }) {
  const dialogRef = useRef(null);
  const viewerRef = useRef(null);
  const [images, setImages] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteName) return undefined;
    const dialog = dialogRef.current;
    const controller = new AbortController();
    if (!dialog.open) dialog.showModal();

    async function loadImages() {
      try {
        const folder = siteFolderName(siteName);
        const response = await fetch(`/api/site-images?folder=${encodeURIComponent(folder)}`, {
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`Image API request failed with status ${response.status}.`);
        const data = await response.json();
        if (!data || !Array.isArray(data.images)) {
          throw new Error('The site image response must include an images array.');
        }
        const imageList = data.images.map((file) => ({
          file,
          label: file.replace(/\.png$/i, ''),
          url: `/Sites/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`
        }));
        setImages(imageList);
        setSelectedFile(imageList[0]?.file || '');
      } catch (loadError) {
        if (loadError.name === 'AbortError') return;
        console.error(`Could not load images for ${siteName}.`, loadError);
        setError('Could not load this site’s images. Please try again later.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadImages();
    return () => {
      controller.abort();
      if (dialog.open) dialog.close();
    };
  }, [siteName]);

  const selectedImage = images.find((image) => image.file === selectedFile);

  async function toggleFullscreen() {
    const viewer = viewerRef.current;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (viewer?.requestFullscreen) {
      await viewer.requestFullscreen();
    } else {
      setError('Full-screen viewing is not supported by this browser.');
    }
  }

  return (
    <dialog
      aria-labelledby="site-dialog-title"
      className="site-dialog"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      ref={dialogRef}
    >
      <div className="dialog-header">
        <h2 id="site-dialog-title">{siteName}</h2>
        <button aria-label="Close image viewer" className="dialog-close" onClick={onClose} type="button">&times;</button>
      </div>
      {images.length > 0 && (
        <div aria-label="Site images" className="image-tabs" role="tablist">
          {images.map((image) => (
            <button
              aria-selected={selectedFile === image.file}
              className="image-tab"
              key={image.file}
              onClick={() => {
                setSelectedFile(image.file);
                setError('');
              }}
              role="tab"
              type="button"
            >
              {image.label}
            </button>
          ))}
        </div>
      )}
      <div aria-live="polite" className="site-image-viewer" ref={viewerRef}>
        {loading ? (
          <p className="image-message">Loading images...</p>
        ) : error ? (
          <p className="image-message">{error}</p>
        ) : selectedImage ? (
          <img
            alt={`${siteName} - ${selectedImage.label}`}
            onClick={toggleFullscreen}
            onError={() => setError(`Could not load ${selectedImage.file}.`)}
            src={selectedImage.url}
          />
        ) : (
          <p className="image-message">No PNG images found for this site.</p>
        )}
      </div>
    </dialog>
  );
}

export default function App() {
  const [initialVisits] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        visited: saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {},
        error: ''
      };
    } catch (error) {
      console.error('Could not load saved visit marks.', error);
      return { visited: {}, error: 'Could not load saved visit marks.' };
    }
  });
  const [visited, setVisited] = useState(initialVisits.visited);
  const [siteGroups, setSiteGroups] = useState([]);
  const [sortAlphabetically, setSortAlphabetically] = useState(false);
  const [activeSite, setActiveSite] = useState('');
  const [status, setStatus] = useState(initialVisits.error);
  const [loadError, setLoadError] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/json/sites.json', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`sites.json request failed with status ${response.status}.`);
        return response.json();
      })
      .then((data) => setSiteGroups(validateSiteData(data)))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setLoadError('Could not load site data. Please try again later.');
        console.error('Could not load the site schedule.', error);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!transitioning) return undefined;
    const timer = window.setTimeout(() => setTransitioning(false), 180);
    return () => window.clearTimeout(timer);
  }, [transitioning, sortAlphabetically]);

  const seizedGroup = siteGroups.find((group) => group.group === 'FBI SEIZED');
  const regularGroups = siteGroups.filter((group) => group.group !== 'FBI SEIZED');
  const seizedSites = (seizedGroup?.sites || []).map((site) => ({
    ...site,
    group: seizedGroup.group,
    isSeized: true
  }));
  const displayGroups = regularGroups.map((group) => (
    group.group === 'ALWAYS'
      ? { ...group, sites: [...group.sites, ...seizedSites] }
      : group
  ));
  if (seizedSites.length > 0 && !displayGroups.some((group) => group.group === 'ALWAYS')) {
    displayGroups.push({ group: 'ALWAYS', sites: seizedSites });
  }
  const alphabeticalSites = useMemo(() => displayGroups
    .flatMap((group) => group.sites.map((site) => ({ ...site, group: group.group })))
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' })),
  [displayGroups]);

  function toggleSort() {
    setTransitioning(true);
    setSortAlphabetically((value) => !value);
  }

  function updateVisited(key, checked) {
    const nextVisited = { ...visited, [key]: checked };
    setVisited(nextVisited);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextVisited));
      setStatus('Saved');
    } catch (error) {
      setStatus('Could not save visit marks in this browser.');
      console.error('Could not save visit marks in this browser.', error);
    }
  }

  return (
    <main>
      <header>
        <h1>Site Schedule</h1>
        <p>Track visited sites and check mining speeds. Visited selections are saved in this browser.</p>
        <span aria-live="polite" className="status">{status}</span>
      </header>
      <div className="section-label">Site schedule</div>
      <div aria-label="Sort sites" className="schedule-controls" role="group">
        <span className={`sort-option${sortAlphabetically ? '' : ' active'}`}>By Schedule</span>
        <label className="sort-toggle">
          <input
            aria-label={sortAlphabetically ? 'Switch to schedule sort' : 'Switch to alphabetical sort'}
            checked={sortAlphabetically}
            onChange={toggleSort}
            type="checkbox"
          />
          <span className="sort-slider" />
        </label>
        <span className={`sort-option${sortAlphabetically ? ' active' : ''}`}>Alphabetical</span>
      </div>
      <div className={`site-schedule${transitioning ? ' is-transitioning' : ''}`} id="site-schedule">
        {loadError ? (
          <p className="schedule-error">{loadError}</p>
        ) : (
          <>
            {sortAlphabetically ? (
              siteGroups.length > 0 && <SiteGroup group="Alphabetical" sites={alphabeticalSites} visited={visited} onVisitedChange={updateVisited} onOpenSite={setActiveSite} />
            ) : (
              displayGroups.map((group) => (
                <SiteGroup group={group.group} key={group.group} sites={group.sites} visited={visited} onVisitedChange={updateVisited} onOpenSite={setActiveSite} />
              ))
            )}
          </>
        )}
      </div>
      <div className="section-label">Mining tiers</div>
      {MINING_TIERS.map((tier) => <MiningTier key={tier.name} tier={tier} />)}
      {activeSite && <SiteImageDialog key={activeSite} onClose={() => setActiveSite('')} siteName={activeSite} />}
    </main>
  );
}
