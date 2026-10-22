import { useEffect, useState } from "react";
import { validateSiteData } from "../site-list/siteData.js";
import MiningTier from "../tier-list/MiningTier.jsx";
import { MINING_TIERS } from "../tier-list/tiers.js";
import "./WttgTracker.css";

/* ------------------------------------------------------------------
   WTTG3 Tracker
   Veri akışı: oyun + main.lua -> state.json -> bridge.js -> bu bileşen
   Köprü: http://127.0.0.1:17655/stream (SSE)
   Kullanım:  import WttgTracker from "./WttgTracker";  <WttgTracker />
------------------------------------------------------------------- */

const BRIDGE_URL = "http://127.0.0.1:17655/stream";
const STALE_SECONDS = 6; // updated_at bundan eskiyse oyun yanıt vermiyor sayılır

/* ---------- canlı bağlantı ---------- */

function useWttgLive(enabled) {
  const [state, setState] = useState(null);
  const [link, setLink] = useState("connecting"); // connecting | open | closed

  useEffect(() => {
    if (!enabled) return undefined;
    setLink("connecting");
    const es = new EventSource(BRIDGE_URL);
    es.onopen = () => setLink("open");
    es.onerror = () => setLink("closed"); // tarayıcı kendiliğinden yeniden dener
    es.onmessage = (e) => {
      try {
        setState(JSON.parse(e.data));
        setLink("open");
      } catch {
        /* yarım paket, bir sonrakini bekle */
      }
    };
    return () => es.close();
  }, [enabled]);

  return { state, link };
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/* ---------- yardımcılar ---------- */

const nf = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 });
const num = (v) => (typeof v === "number" ? nf.format(v) : "–");

function pretty(s) {
  if (!s) return "";
  return String(s)
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
}

function clock(unixSeconds) {
  return new Date(unixSeconds * 1000).toLocaleTimeString("tr-TR");
}

/* ---------- demo verisi (oyun kapalıyken arayüzü görmek için) ---------- */

const DEMO = {
  schema: 2,
  in_game: true,
  updated_at: 0,
  player: {
    dos_coin: 1842.5, yolo_yen: 320, rep_level: 7, rep_xp: 1260, stamina: 0.64,
    firewall_on: true, firewall_tier: 2, max_vms: 3, locked_out: false,
    computer_event: null,
  },
  crypto_miners: [{ id: "m", name: "BasicMiner", value: 2 }],
  motion_sensors: [{ id: "s1", name: "Door" }, { id: "s2", name: "Window" }],
  time: { game_live: true, hours_left: 41, minute_count: 18, total_hours: 72, game_clock_unix: null },
  threat: {
    active_event: "Threat.Event.Tanner", active_event_name: "Tanner",
    actors: [{ id: "t", name: "Tanner", value: "Active" }],
    history: [
      { at: 1700000000, hours_left: 44, event: null, event_name: null, actors: [] },
      { at: 1700000300, hours_left: 43, event: "Threat.Event.Tanner", event_name: "Tanner", actors: ["Tanner"] },
    ],
  },
  orders: { deliveries: [{ id: "p1", name: "Package" }], darkdrop: [] },
};

/* ---------- küçük bileşenler ---------- */

function Section({ title, aside, children }) {
  return (
    <section className="wt-sec">
      <header className="wt-sec-h">
        <h2>{title}</h2>
        {aside != null && <span className="wt-aside">{aside}</span>}
      </header>
      {children}
    </section>
  );
}

function Empty({ children }) {
  return <p className="wt-empty">{children}</p>;
}

function StatCard({ label, value, detail, children, tone }) {
  return (
    <article className={`wt-stat ${tone || ""}`}>
      <p className="wt-stat-k">{label}</p>
      <p className="wt-stat-v">{value}</p>
      {detail && <p className="wt-stat-s">{detail}</p>}
      {children}
    </article>
  );
}

function Meter({ ratio, tone }) {
  const pct = Math.max(0, Math.min(1, Number(ratio) || 0)) * 100;
  return (
    <div className="wt-meter" role="presentation">
      <div className={`wt-meter-fill ${tone || ""}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function Chips({ items, empty }) {
  if (!items || items.length === 0) return <Empty>{empty}</Empty>;
  return (
    <ul className="wt-chips">
      {items.map((it, i) => (
        <li key={`${it.id}-${i}`}>{pretty(it.name)}</li>
      ))}
    </ul>
  );
}

function Rows({ items, empty, max }) {
  if (!items || items.length === 0) return <Empty>{empty}</Empty>;
  return (
    <ul className="wt-rows">
      {items.map((it, i) => (
        <li key={`${it.id}-${i}`}>
          <span>{pretty(it.name)}</span>
          <b>{typeof it.value === "number" ? num(it.value) : it.value}</b>
          {max ? <Meter ratio={it.value / max} /> : null}
        </li>
      ))}
    </ul>
  );
}

/* ---------- ana bölümler ---------- */

function ThreatHero({ threat }) {
  const actors = threat?.actors ?? [];
  const active = Boolean(threat?.active_event) || actors.length > 0;
  const names = actors.length ? actors.map((a) => pretty(a.name)).join(", ") : pretty(threat?.active_event_name);

  return (
    <div className={`wt-threat ${active ? "is-active" : ""}`}>
      <p className="wt-threat-k">{active ? "Aktif tehdit" : "Tehdit durumu"}</p>
      <p className="wt-threat-v">{active ? names || "Bilinmeyen tehdit" : "Şu an tehdit yok"}</p>
      <p className="wt-threat-s">
        {active && threat?.active_event ? threat.active_event : "Bir katil devreye girdiğinde burada görünür."}
      </p>
    </div>
  );
}

function GameClock({ time }) {
  const t = time ?? {};
  const gameHour = typeof t.hours_left === "number" ? (t.hours_left + 2) % 24 : null;
  const hasBar = typeof t.hours_left === "number" && typeof t.total_hours === "number" && t.total_hours > 0;
  return (
    <div className="wt-clock">
      <p className="wt-clock-k">Oyun saati</p>
      <p className="wt-clock-v">
        {gameHour !== null ? String(gameHour).padStart(2, "0") : "–"}
        <span> sa </span>
        {typeof t.minute_count === "number" ? String(t.minute_count).padStart(2, "0") : "–"}
        <span> dk</span>
      </p>
      {hasBar && <Meter ratio={t.hours_left / t.total_hours} />}
      <p className="wt-clock-s">{t.game_live === false ? "Duraklatıldı" : "Akıyor"}</p>
    </div>
  );
}

function OpenSites({ groups, minute, error, onOpenSite, onVisitedChange, visited }) {
  if (error) {
    return <Section title="Şu an girilebilen siteler"><p className="wt-empty">{error}</p></Section>;
  }
  if (groups === null) {
    return <Section title="Şu an girilebilen siteler"><p className="wt-empty">Site programı yükleniyor…</p></Section>;
  }
  if (typeof minute !== "number") {
    return <Section title="Şu an girilebilen siteler"><p className="wt-empty">Oyun saati verisi bekleniyor.</p></Section>;
  }

  const minuteOfHour = ((minute % 60) + 60) % 60;
  const slot = ["00", "15", "30", "45"][Math.floor(minuteOfHour / 15)];
  const scheduledGroups = groups
    .filter((group) => group.group !== "ALWAYS" && group.group !== "FBI SEIZED")
    .map((group) => ({
      ...group,
      sites: group.sites.filter((site) => site[slot])
    }))
    .filter((group) => group.sites.length > 0);
  const alwaysSites = groups.find((group) => group.group === "ALWAYS")?.sites ?? [];
  const renderSite = (site, group) => {
    const visitKey = `${group}|${site.name}`;
    return (
      <li className="wt-site-entry" key={visitKey}>
        <input
          aria-label={`${site.name} ziyaret edildi`}
          checked={Boolean(visited[visitKey])}
          className="wt-site-check"
          onChange={(event) => onVisitedChange(visitKey, event.target.checked)}
          type="checkbox"
        />
        <button
          className={`wt-site-link${visited[visitKey] ? " is-visited" : ""}`}
          onClick={() => onOpenSite(site.name)}
          type="button"
        >
          {site.name}
        </button>
      </li>
    );
  };

  return (
    <Section title="Açık siteler" aside={`${String(minuteOfHour).padStart(2, "0")}. dakika`}>
      <div className="wt-open-site-groups">
        <div className="wt-scheduled-sites">
          {scheduledGroups.length > 0 ? scheduledGroups.map((group) => (
            <div className="wt-open-site-group" key={group.group}>
              <h3>{group.group.replace(/\s+TO\s+/i, "–")} <span>{group.sites.length}</span></h3>
              <ul className="wt-site-list">
                {group.sites.map((site) => renderSite(site, group.group))}
              </ul>
            </div>
          )) : <p className="wt-empty">Bu zaman aralığında açık site yok.</p>}
        </div>
        <div className="wt-open-site-group wt-always-sites">
          <h3>Hep açık <span>{alwaysSites.length}</span></h3>
          <ul className="wt-site-list">
            {alwaysSites.map((site) => renderSite(site, "ALWAYS"))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

/* ---------- sayfa ---------- */

export default function WttgTracker({ onOpenSite, onVisitedChange, visited }) {
  const [mode, setMode] = useState("live"); // live | demo
  const { state, link } = useWttgLive(mode === "live");
  const now = useNow();
  const [siteGroups, setSiteGroups] = useState(null);
  const [siteLoadError, setSiteLoadError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/json/sites.json", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`sites.json request failed with status ${response.status}.`);
        return response.json();
      })
      .then((siteData) => setSiteGroups(validateSiteData(siteData)))
      .catch((error) => {
        if (error.name === "AbortError") return;
        setSiteLoadError("Site programı yüklenemedi.");
        console.error("Could not load tracker site availability.", error);
      });
    return () => controller.abort();
  }, []);

  const data = mode === "demo" ? DEMO : state;
  const age = state?.updated_at ? now / 1000 - state.updated_at : null;
  const stale = mode === "live" && age != null && age > STALE_SECONDS;

  let statusText;
  let statusTone;
  if (mode === "demo") { statusText = "Demo verisi"; statusTone = "demo"; }
  else if (link === "closed") { statusText = "Köprü çalışmıyor"; statusTone = "bad"; }
  else if (!state) { statusText = "Bağlanıyor"; statusTone = "wait"; }
  else if (stale) { statusText = "Oyundan veri gelmiyor"; statusTone = "bad"; }
  else if (!state.in_game) { statusText = "Oyun menüde"; statusTone = "wait"; }
  else { statusText = "Oyuna bağlı"; statusTone = "ok"; }

  const showData = data && data.in_game && !stale;
  const threatActive = Boolean(data?.threat?.active_event) || (data?.threat?.actors?.length ?? 0) > 0;
  const p = data?.player ?? {};

  return (
    <div className={`wt${showData && threatActive ? " is-threat-active" : ""}`}>
      <header className="wt-top">
        <div>
          <p className="wt-eyebrow">NIGHT SHIFT <span>//</span> OPERASYON PANELİ</p>
          <h1>WTTG3 Tracker</h1>
          <p>Oyundaki durumun canlı kontrol merkezi</p>
        </div>
        <div className="wt-top-r">
          <span className={`wt-status ${statusTone}`}>
            <i aria-hidden="true" />
            {statusText}
          </span>
          <button type="button" className="wt-btn" onClick={() => setMode(mode === "live" ? "demo" : "live")}>
            {mode === "live" ? "Demo verisini göster" : "Canlı moda dön"}
          </button>
        </div>
      </header>

      {!showData && (
        <div className="wt-setup">
          <h2>{stale ? "Oyundan veri gelmiyor" : data && !data.in_game ? "Oyun ana menüde" : "Oyuna bağlanmak için"}</h2>
          {stale || (data && !data.in_game) ? (
            <p>Oyunu açıp bir kayda girdiğinde veriler otomatik görünür.</p>
          ) : (
            <ol>
              <li>WTTG3'ü UE4SS ve WTTG3Helper modu ile aç.</li>
              <li>Köprü programını (bridge) çalıştır.</li>
              <li>Tarayıcı yerel ağ erişimi izni isterse izin ver.</li>
            </ol>
          )}
        </div>
      )}

      {showData && (
        <>
          <section aria-label="Hızlı durum özeti" className="wt-overview">
            <StatCard label="DOS COIN" value={num(p.dos_coin)} detail="Mevcut bakiye" tone="cyan" />
            <StatCard label="YOLO YEN" value={num(p.yolo_yen)} detail="Mevcut bakiye" tone="violet" />
            <StatCard label="İTİBAR" value={num(p.rep_level)} detail={`${num(p.rep_xp)} XP deneyimi`} tone="amber" />
            <StatCard
              label="DAYANIKLILIK"
              value={typeof p.stamina === "number" ? `%${Math.round(p.stamina * 100)}` : "–"}
              detail="Enerji seviyesi"
              tone="green"
            >
              <Meter ratio={p.stamina} tone={p.stamina < 0.25 ? "low" : ""} />
            </StatCard>
          </section>

          <div className="wt-hero">
            <ThreatHero threat={data.threat} />
            <GameClock time={data.time} />
          </div>

          <div className="wt-grid">
            <div className="wt-main">
              <Section
                title="Bekleyen siparişler"
                aside={(data.orders?.deliveries?.length ?? 0) + (data.orders?.darkdrop?.length ?? 0)}
              >
                <Rows
                  items={[...(data.orders?.deliveries ?? []), ...(data.orders?.darkdrop ?? [])].map((o) => ({ ...o, value: "Yolda" }))}
                  empty="Bekleyen sipariş yok."
                />
              </Section>

              <Section title="Tehdit geçmişi" aside="Bu oturum">
                {(data.threat?.history ?? []).length === 0 ? (
                  <Empty>Henüz bir tehdit değişimi kaydedilmedi.</Empty>
                ) : (
                  <ul className="wt-log">
                    {[...data.threat.history].reverse().map((h, i) => (
                      <li key={`${h.at}-${i}`}>
                        <time>{h.at ? clock(h.at) : "–"}</time>
                        <span>
                          {h.actors?.length
                            ? h.actors.map(pretty).join(", ")
                            : h.event_name
                              ? pretty(h.event_name)
                              : "Tehdit sona erdi"}
                        </span>
                        <em>{typeof h.hours_left === "number" ? `${h.hours_left} sa kaldı` : ""}</em>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>

            <aside className="wt-side">
              <Section title="Durum">
                <dl className="wt-facts">
                  <div><dt>Güvenlik duvarı</dt><dd>{p.firewall_on ? `Açık, seviye ${p.firewall_tier ?? "–"}` : "Kapalı"}</dd></div>
                  <div><dt>Sanal makine limiti</dt><dd>{num(p.max_vms)}</dd></div>
                  {p.locked_out ? <div><dt>Koşma</dt><dd>Kilitli</dd></div> : null}
                </dl>
              </Section>

              <Section title="Madenciler" aside={(data.crypto_miners ?? []).length}>
                <Rows items={data.crypto_miners} empty="Çalışan madenci yok." />
              </Section>

              <Section title="Hareket sensörleri" aside={(data.motion_sensors ?? []).length}>
                <Chips items={data.motion_sensors} empty="Yerleştirilmiş sensör yok." />
              </Section>
            </aside>
          </div>

          <div className="wt-sites">
            <OpenSites
              groups={siteGroups}
              minute={data.time?.minute_count}
              error={siteLoadError}
              onOpenSite={onOpenSite}
              onVisitedChange={onVisitedChange}
              visited={visited}
            />
          </div>

          <section aria-label="Tier list">
            <div className="section-label">Mining tiers</div>
            <div className="tiers-grid">
              {MINING_TIERS.map((tier) => <MiningTier key={tier.name} tier={tier} />)}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
