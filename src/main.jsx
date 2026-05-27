import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDotDashed,
  CircleDot,
  Dumbbell,
  Goal,
  Heart,
  Medal,
  RefreshCw,
  Search,
  Shield,
  Star,
  Trophy,
  WifiOff,
} from "lucide-react";
import "./styles.css";

const API_KEY = import.meta.env.VITE_FOOTBALL_API_KEY;
const API_HOST = import.meta.env.VITE_FOOTBALL_API_HOST || "v3.football.api-sports.io";
const API_BASE = import.meta.env.VITE_FOOTBALL_API_BASE || "https://v3.football.api-sports.io";

const liveStatuses = ["1H", "2H", "HT", "ET", "BT", "P", "LIVE"];
const finishedStatuses = ["FT", "AET", "PEN"];
const upcomingStatuses = ["NS", "TBD"];

const sports = [
  { name: "Trending", icon: <Star size={17} /> },
  { name: "Football", icon: <Goal size={17} />, active: true },
  { name: "Basketball", icon: <CircleDotDashed size={17} /> },
  { name: "Tennis", icon: <CircleDot size={17} /> },
  { name: "Hockey", icon: <Dumbbell size={17} /> },
  { name: "Baseball", icon: <Shield size={17} /> },
];

const tabs = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "finished", label: "Finished" },
  { id: "upcoming", label: "Upcoming" },
];

const demoFixtures = [
  fixture(101, "England", "Premier League", "Regular Season - 30", "1H", 33, "Manchester City", "Arsenal", 1, 1),
  fixture(102, "England", "Premier League", "Regular Season - 30", "NS", null, "Chelsea", "Liverpool", null, null),
  fixture(103, "Italy", "Serie A", "Regular Season - 27", "HT", 45, "Inter", "Juventus", 0, 0),
  fixture(104, "Germany", "Bundesliga", "Regular Season - 29", "NS", null, "Borussia Dortmund", "Bayern Munich", null, null),
  fixture(105, "France", "Ligue 1", "Regular Season - 31", "FT", 90, "Paris Saint-Germain", "Lyon", 3, 2),
  fixture(106, "Spain", "LaLiga", "Regular Season - 32", "FT", 90, "Real Madrid", "Valencia", 2, 0),
];

function fixture(id, country, league, round, status, elapsed, home, away, homeGoals, awayGoals) {
  return {
    fixture: {
      id,
      date: new Date().toISOString(),
      status: { short: status, elapsed },
      venue: { name: status === "NS" ? "Fixture venue TBA" : "Main Stadium" },
    },
    league: { id: `${country}-${league}`, name: league, country, round },
    teams: {
      home: { name: home, logo: "" },
      away: { name: away, logo: "" },
    },
    goals: { home: homeGoals, away: awayGoals },
    score: { halftime: { home: null, away: null } },
  };
}

function App() {
  const [fixtures, setFixtures] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiMode, setApiMode] = useState("demo");
  const usingDemo = !API_KEY || API_KEY === "your_api_key_here";

  const fetchFixtures = async () => {
    setLoading(true);
    setError("");

    if (usingDemo) {
      window.setTimeout(() => {
        setFixtures(demoFixtures);
        setLastUpdated(new Date());
        setApiMode("demo");
        setLoading(false);
      }, 350);
      return;
    }

    try {
      const dateParam = toApiDate(selectedDate);
      const endpoint =
        activeTab === "live" ? `${API_BASE}/fixtures?live=all` : `${API_BASE}/fixtures?date=${dateParam}`;
      const response = await fetch(endpoint, {
        headers: {
          "x-rapidapi-host": API_HOST,
          "x-rapidapi-key": API_KEY,
          "x-apisports-key": API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Football API returned ${response.status}`);
      }

      const data = await response.json();
      setFixtures(Array.isArray(data.response) ? data.response : []);
      setLastUpdated(new Date());
      setApiMode(activeTab === "live" ? "live" : "date");
    } catch (err) {
      setError(err.message || "Unable to load matches");
      setFixtures([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFixtures();
    const interval = window.setInterval(fetchFixtures, 60000);
    return () => window.clearInterval(interval);
  }, [selectedDate, activeTab]);

  const filteredFixtures = useMemo(() => {
    const term = query.trim().toLowerCase();

    return fixtures.filter((item) => {
      const status = item.fixture.status.short;
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "live" && liveStatuses.includes(status)) ||
        (activeTab === "finished" && finishedStatuses.includes(status)) ||
        (activeTab === "upcoming" && upcomingStatuses.includes(status));
      const text = [item.teams.home.name, item.teams.away.name, item.league.name, item.league.country]
        .join(" ")
        .toLowerCase();
      return matchesTab && text.includes(term);
    });
  }, [activeTab, fixtures, query]);

  const groups = useMemo(() => groupByLeague(filteredFixtures), [filteredFixtures]);
  const liveCount = fixtures.filter((item) => liveStatuses.includes(item.fixture.status.short)).length;
  const finishedCount = fixtures.filter((item) => finishedStatuses.includes(item.fixture.status.short)).length;

  return (
    <main className="app-shell">
      <aside className="sports-rail" aria-label="Sports">
        <div className="brand-mark">
          <Trophy size={20} />
        </div>
        {sports.map((sport) => (
          <button className={sport.active ? "active" : ""} key={sport.name} type="button">
            {sport.icon}
            <span>{sport.name}</span>
          </button>
        ))}
      </aside>

      <section className="content-column">
        <header className="app-header">
          <div>
            <p>Live score center</p>
            <h1>Football</h1>
          </div>
          <button className="refresh-button" onClick={fetchFixtures} disabled={loading} aria-label="Refresh scores">
            <RefreshCw size={19} className={loading ? "spin" : ""} />
          </button>
        </header>

        <section className="match-toolbar">
          <label className="search-box">
            <Search size={18} />
            <input
              type="search"
              value={query}
              placeholder="Search team or competition"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <div className="date-strip" aria-label="Match date">
            <button onClick={() => shiftDate(-1)} aria-label="Previous day" type="button">
              <ChevronLeft size={19} />
            </button>
            <button className="date-button" onClick={() => setSelectedDate(new Date())} type="button">
              <CalendarDays size={17} />
              <span>{dateLabel(selectedDate)}</span>
            </button>
            <button onClick={() => shiftDate(1)} aria-label="Next day" type="button">
              <ChevronRight size={19} />
            </button>
          </div>
        </section>

        <nav className="filter-tabs" aria-label="Match filters">
          {tabs.map((tab) => (
            <button
              className={activeTab === tab.id ? "active" : ""}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {usingDemo && (
          <div className="notice">
            <WifiOff size={17} />
            <span>Add `VITE_FOOTBALL_API_KEY` in `.env` to load live API data.</span>
          </div>
        )}

        {!usingDemo && (
          <div className="api-status">
            <span className={apiMode === "live" ? "live-dot" : ""} />
            {apiMode === "live" ? "Live API endpoint: /fixtures?live=all" : "Daily fixtures endpoint"}
          </div>
        )}

        {error && <div className="error">{error}</div>}

        <section className="score-feed" aria-live="polite">
          {loading && <SkeletonList />}
          {!loading &&
            groups.map((group) => <LeagueSection group={group} key={`${group.country}-${group.name}`} />)}
          {!loading && groups.length === 0 && <EmptyState />}
        </section>
      </section>

      <aside className="insights-panel">
        <PanelCard title="Today">
          <Metric icon={<Trophy size={17} />} label="Matches" value={fixtures.length} />
          <Metric icon={<CircleDot size={17} />} label="Live now" value={liveCount} tone="hot" />
          <Metric icon={<Medal size={17} />} label="Finished" value={finishedCount} />
        </PanelCard>
        <PanelCard title="Top Competitions">
          {groups.slice(0, 4).map((group) => (
            <div className="competition-link" key={group.name}>
              <span>{group.country.slice(0, 2).toUpperCase()}</span>
              <strong>{group.name}</strong>
              <small>{group.matches.length}</small>
            </div>
          ))}
          {groups.length === 0 && <p className="muted">Competitions appear after matches load.</p>}
        </PanelCard>
        <PanelCard title="Refresh">
          <p className="muted">
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "Waiting for scores"}
          </p>
        </PanelCard>
      </aside>
    </main>
  );

  function shiftDate(days) {
    setSelectedDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + days);
      return next;
    });
  }
}

function LeagueSection({ group }) {
  return (
    <article className="league-section">
      <header className="league-header">
        <div className="country-badge">{group.country.slice(0, 2).toUpperCase()}</div>
        <div>
          <span>{group.country}</span>
          <strong>{group.name}</strong>
        </div>
        <ChevronRight size={18} />
      </header>
      <div className="match-table">
        {group.matches.map((item) => (
          <MatchRow fixture={item} key={item.fixture.id} />
        ))}
      </div>
    </article>
  );
}

function MatchRow({ fixture }) {
  const status = fixture.fixture.status.short;
  const live = liveStatuses.includes(status);
  const time = formatStatus(status, fixture.fixture.status.elapsed, fixture.fixture.date);

  return (
    <article className="match-row">
      <button className="favorite-button" aria-label="Add match to favourites" type="button">
        <Heart size={17} />
      </button>
      <div className={`match-time ${live ? "live" : ""}`}>{time}</div>
      <div className="teams">
        <Team team={fixture.teams.home} score={fixture.goals.home} />
        <Team team={fixture.teams.away} score={fixture.goals.away} />
      </div>
      <button className="stats-button" aria-label="Match statistics" type="button">
        <BarChart3 size={17} />
      </button>
    </article>
  );
}

function Team({ team, score }) {
  return (
    <div className="team-line">
      {team.logo ? <img src={team.logo} alt="" /> : <span className="crest">{team.name.slice(0, 1)}</span>}
      <strong>{team.name}</strong>
      <span>{score ?? "-"}</span>
    </div>
  );
}

function PanelCard({ title, children }) {
  return (
    <section className="panel-card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Metric({ icon, label, value, tone = "" }) {
  return (
    <div className={`metric ${tone}`}>
      <span>{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <Shield size={34} />
      <h2>No matches found</h2>
      <p>Try another date, filter, or search term.</p>
    </div>
  );
}

function SkeletonList() {
  return Array.from({ length: 4 }).map((_, index) => (
    <div className="league-section skeleton" key={index}>
      <div />
      <div />
      <div />
    </div>
  ));
}

function groupByLeague(items) {
  const map = new Map();

  items.forEach((item) => {
    const key = `${item.league.country}-${item.league.name}`;
    if (!map.has(key)) {
      map.set(key, {
        country: item.league.country,
        name: item.league.name,
        matches: [],
      });
    }
    map.get(key).matches.push(item);
  });

  return Array.from(map.values());
}

function formatStatus(status, elapsed, date) {
  if (liveStatuses.includes(status)) {
    return elapsed ? `${elapsed}'` : "Live";
  }
  if (finishedStatuses.includes(status)) {
    return "FT";
  }
  if (upcomingStatuses.includes(status)) {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return status;
}

function dateLabel(date) {
  const today = new Date();
  const tomorrow = new Date();
  const yesterday = new Date();
  tomorrow.setDate(today.getDate() + 1);
  yesterday.setDate(today.getDate() - 1);

  if (toApiDate(date) === toApiDate(today)) return "Today";
  if (toApiDate(date) === toApiDate(tomorrow)) return "Tomorrow";
  if (toApiDate(date) === toApiDate(yesterday)) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function toApiDate(date) {
  return date.toISOString().slice(0, 10);
}

createRoot(document.getElementById("root")).render(<App />);
