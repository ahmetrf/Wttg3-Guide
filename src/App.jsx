import { useEffect, useMemo, useState } from 'react';
import { EMPTY_KEY_ROWS, getTabFromLocation, KEY_ROW_COUNT, KEY_TRACKING_STORAGE_KEY, STORAGE_KEY } from './app/appConfig.js';
import KeyTracking from './features/key-tracking/KeyTracking.jsx';
import MiningTier from './features/tier-list/MiningTier.jsx';
import { MINING_TIERS } from './features/tier-list/tiers.js';
import SiteGroup from './features/site-list/SiteGroup.jsx';
import SiteImageDialog from './features/site-list/SiteImageDialog.jsx';
import { validateSiteData } from './features/site-list/siteData.js';
import WttgTracker from './features/tracker/WttgTracker.jsx';

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
  const [activeTab, setActiveTab] = useState(getTabFromLocation);
  const [keyRows, setKeyRows] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY_TRACKING_STORAGE_KEY) || 'null');
      if (!Array.isArray(saved) || saved.length !== KEY_ROW_COUNT) return EMPTY_KEY_ROWS;
      return saved.map((row) => ({
        key: typeof row?.key === 'string' ? row.key : '',
        wiki: ['1', '2', '3'].includes(row?.wiki) ? row.wiki : ''
      }));
    } catch (error) {
      console.error('Could not load saved key tracking.', error);
      return EMPTY_KEY_ROWS;
    }
  });

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
    function syncTabFromLocation() {
      setActiveTab(getTabFromLocation());
    }
    window.addEventListener('hashchange', syncTabFromLocation);
    window.addEventListener('popstate', syncTabFromLocation);
    return () => {
      window.removeEventListener('hashchange', syncTabFromLocation);
      window.removeEventListener('popstate', syncTabFromLocation);
    };
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

  function navigateToTab(tab) {
    setActiveTab(tab);
    if (window.location.hash !== `#${tab}`) {
      window.history.pushState(null, '', `${window.location.pathname}${window.location.search}#${tab}`);
    }
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

  function updateKeyRow(index, field, value) {
    const nextRows = keyRows.map((row, rowIndex) => (
      rowIndex === index ? { ...row, [field]: value } : row
    ));
    setKeyRows(nextRows);
    try {
      localStorage.setItem(KEY_TRACKING_STORAGE_KEY, JSON.stringify(nextRows));
      setStatus('Saved');
    } catch (error) {
      setStatus('Could not save key tracking in this browser.');
      console.error('Could not save key tracking in this browser.', error);
    }
  }

  function resetData() {
    if (!window.confirm('Reset saved site visit marks and key tracking data?')) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(KEY_TRACKING_STORAGE_KEY);
      setVisited({});
      setKeyRows(EMPTY_KEY_ROWS.map((row) => ({ ...row })));
      setStatus('Data reset');
    } catch (error) {
      setStatus('Could not reset saved data in this browser.');
      console.error('Could not reset saved data in this browser.', error);
    }
  }

  return (
    <main className={activeTab === 'tracker' ? 'tracker-page' : ''}>
      <nav aria-label="Main sections" className="top-nav">
        <h1 className="nav-brand">
          <span aria-hidden="true" className="nav-mark">W3</span>
          <span>WTTG 3 Guide</span>
        </h1>
        <div className="nav-tabs">
          {[
            ['sites', 'Site List'],
            ['tiers', 'Tier List'],
            ['keys', 'Key Tracker']
          ].map(([tab, label]) => (
            <button
              aria-current={activeTab === tab ? 'page' : undefined}
              className={`nav-button${activeTab === tab ? ' active' : ''}`}
              key={tab}
              onClick={() => navigateToTab(tab)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="top-actions">
          <button
            aria-current={activeTab === 'tracker' ? 'page' : undefined}
            className={`tracker-action${activeTab === 'tracker' ? ' active' : ''}`}
            onClick={() => navigateToTab('tracker')}
            type="button"
          >
            Tracker
          </button>
          <button className="reset-button" onClick={resetData} type="button">Reset Data</button>
        </div>
      </nav>
      <header className="page-header">
        <p>Your companion for exploring sites, checking mining tiers, and keeping your wiki keys organized.</p>
        <span aria-live="polite" className="status">{status}</span>
      </header>
      {activeTab === 'sites' && (
        <section aria-label="Site list">
          <div className="section-label">Site list</div>
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
        </section>
      )}
      {activeTab === 'tiers' && (
        <section aria-label="Tier list">
          <div className="section-label">Mining tiers</div>
          <div className="tiers-grid">
            {MINING_TIERS.map((tier) => <MiningTier key={tier.name} tier={tier} />)}
          </div>
        </section>
      )}
      {activeTab === 'keys' && (
        <section aria-label="Key tracking">
          <div className="section-label">Key tracking</div>
          <KeyTracking rows={keyRows} onChange={updateKeyRow} />
        </section>
      )}
      {activeTab === 'tracker' && (
        <WttgTracker
          keyRows={keyRows}
          onKeyChange={updateKeyRow}
          onOpenSite={setActiveSite}
          onVisitedChange={updateVisited}
          visited={visited}
        />
      )}
      {activeSite && <SiteImageDialog key={activeSite} onClose={() => setActiveSite('')} siteName={activeSite} />}
      <footer className="site-footer">
        <span>İletişim</span>
        <a href="https://discord.gg/Z63f4gxAuR" rel="noreferrer" target="_blank">
          <svg aria-hidden="true" className="contact-icon discord-icon" viewBox="0 0 24 24">
            <path d="M6.2 6.5c3.8-1.8 7.8-1.8 11.6 0l2.1 9.7c-1.7 1.3-3.4 2.1-5.2 2.5l-1.1-1.8c.7-.2 1.3-.5 1.9-.9-2.3 1.1-4.8 1.1-7.1 0 .6.4 1.2.7 1.9.9l-1.1 1.8c-1.8-.4-3.5-1.2-5.2-2.5l2.2-9.7Zm3.4 6.4c-.8 0-1.4.7-1.4 1.5s.6 1.5 1.4 1.5 1.4-.7 1.4-1.5-.6-1.5-1.4-1.5Zm4.8 0c-.8 0-1.4.7-1.4 1.5s.6 1.5 1.4 1.5 1.4-.7 1.4-1.5-.6-1.5-1.4-1.5Z" />
          </svg>
          Discord
        </a>
        <a href="https://github.com/ahmetrf" rel="noreferrer" target="_blank">
          <svg aria-hidden="true" className="contact-icon github-icon" viewBox="0 0 24 24">
            <path d="M12 .8a11.2 11.2 0 0 0-3.54 21.82c.56.1.76-.24.76-.54v-2.1c-3.1.67-3.76-1.32-3.76-1.32-.5-1.28-1.24-1.62-1.24-1.62-1.02-.7.08-.69.08-.69 1.13.08 1.73 1.16 1.73 1.16 1 .1.45 2.03 3.32 1.55.1-.73.4-1.22.72-1.5-2.48-.28-5.08-1.27-5.08-5.53 0-1.22.44-2.22 1.16-3-.12-.28-.5-1.42.11-2.96 0 0 .95-.3 3.08 1.15a10.7 10.7 0 0 1 5.6 0c2.13-1.45 3.08-1.15 3.08-1.15.61 1.54.23 2.68.11 2.96.72.78 1.16 1.78 1.16 3 0 4.27-2.6 5.25-5.09 5.52.4.35.76 1.03.76 2.08v3.09c0 .3.2.65.77.54A11.2 11.2 0 0 0 12 .8Z" />
          </svg>
          GitHub
        </a>
      </footer>
    </main>
  );
}
