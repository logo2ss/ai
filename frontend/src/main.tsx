import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  Library,
  Folders,
  ChartNoAxesCombined,
  Sparkles,
  SlidersHorizontal,
  BookOpen,
  PenLine,
  Settings,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Upload,
  Search,
  X,
  Check,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  FileText,
  CircleHelp,
  Sun,
  Moon,
  LoaderCircle,
  Download,
  Trash2,
  Heart,
  Copy,
  RefreshCw,
  CheckCheck,
  ShieldCheck,
  HardDrive,
  PanelLeftClose,
  Menu,
  Leaf,
  Feather,
  Activity,
  Clock3,
  WandSparkles,
  AlertCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import "./style.css";

type RecordData = Record<string, any>;
type Page =
  | "Dashboard"
  | "Story Library"
  | "Collections"
  | "Analysis Studio"
  | "Story Generator"
  | "Story Mixer"
  | "Generated Stories"
  | "Story Editor"
  | "Settings";
const nav: [Page, LucideIcon][] = [
  ["Dashboard", LayoutDashboard],
  ["Story Library", Library],
  ["Collections", Folders],
  ["Analysis Studio", ChartNoAxesCombined],
  ["Story Generator", Sparkles],
  ["Story Mixer", SlidersHorizontal],
  ["Generated Stories", BookOpen],
  ["Story Editor", PenLine],
];
const number = (v: number = 0) =>
  Intl.NumberFormat("en", {
    notation: v > 99999 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(v);
const date = (v: string) =>
  v
    ? new Date(v).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "—";
async function api(path: string, body?: any, method?: string): Promise<any> {
  const r = await fetch("/api" + path, {
    method: method || (body !== undefined ? "POST" : "GET"),
    headers:
      body instanceof FormData
        ? undefined
        : body !== undefined
          ? { "Content-Type": "application/json" }
          : undefined,
    body:
      body instanceof FormData
        ? body
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
  });
  if (!r.ok) {
    let d;
    try {
      d = await r.json();
    } catch {
      d = { detail: r.statusText };
    }
    throw new Error(
      typeof d.detail === "string" ? d.detail : JSON.stringify(d.detail),
    );
  }
  return r.json();
}
function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Button({
  children,
  onClick,
  variant = "",
  disabled = false,
  type = "button",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`button ${variant} ${className}`}
    >
      {children}
    </button>
  );
}
function Badge({
  children,
  tone = "",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={"badge " + tone}>{children}</span>;
}
function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {React.isValidElement(children) &&
      ["input", "select", "textarea"].includes(children.type as string)
        ? React.cloneElement(children as React.ReactElement<any>, {
            "aria-label": label,
          })
        : children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function Empty({
  icon: Icon = BookOpen,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={27} strokeWidth={1.3} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
function Modal({
  title,
  children,
  close,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  close: () => void;
  wide?: boolean;
}) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [close]);
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        className={"modal " + (wide ? "wide" : "")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-button" aria-label="Close" onClick={close}>
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
function Illustration() {
  return (
    <svg
      className="hero-art"
      viewBox="0 0 350 240"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="200" cy="125" r="100" fill="#e2e7d9" />
      <circle cx="202" cy="125" r="80" stroke="#cbd4bf" strokeDasharray="3 8" />
      <path d="M60 182L181 202L292 168L180 149L60 182Z" fill="#bac6aa" />
      <path
        d="M61 173L181 194L292 160V168L181 202L61 182V173Z"
        fill="#5a6c4d"
      />
      <path
        d="M70 154L181 175L282 145V159L181 190L70 170V154Z"
        fill="#fdfbf1"
        stroke="#526343"
      />
      <path
        d="M63 150L181 171L290 138L180 120L63 150Z"
        fill="#91a47f"
        stroke="#526343"
      />
      <path d="M181 171V182M83 160L171 177M205 170L264 152" stroke="#a9b29b" />
      <path d="M96 141L182 151L261 127L180 117L96 141Z" fill="#e2cba4" />
      <path
        d="M95 131L182 143L261 119V127L182 151L95 141V131Z"
        fill="#b89d71"
      />
      <path
        d="M96 126L182 139L262 114L178 102L96 126Z"
        fill="#f5ecd9"
        stroke="#988361"
      />
      <path
        d="M190 110C175 83 194 60 221 48C222 75 212 100 190 110Z"
        fill="#5d7451"
      />
      <path d="M188 116L221 48M203 79L206 65M198 88L214 78" stroke="#d3dbc8" />
      <path d="M191 111L182 143" stroke="#526343" strokeWidth="2" />
      <path
        d="M115 114C91 98 100 74 77 65C78 91 86 110 115 114Z"
        fill="#a0ad8b"
      />
      <path d="M117 121L80 70" stroke="#687b58" />
      <path
        d="M260 81C249 72 250 52 263 43C276 59 273 76 260 81Z"
        fill="#bac5a9"
      />
      <path d="M260 81L256 111" stroke="#7f916c" />
      <path
        d="M73 57V72M66 64H80M278 109V122M272 115H285"
        stroke="#9aab83"
        strokeWidth="1.5"
      />
      <circle cx="117" cy="47" r="3" fill="#a6b58f" />
      <circle cx="289" cy="72" r="3" fill="#baa37c" />
      <path
        d="M143 94C149 92 155 93 159 96M142 102C149 100 156 101 164 104"
        stroke="#bca987"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function App() {
  const [page, setPage] = useState<Page>("Dashboard"),
    [collections, setCollections] = useState<RecordData[]>([]),
    [dashboard, setDashboard] = useState<RecordData | null>(null),
    [model, setModel] = useState<RecordData | null>(null),
    [allJobs, setJobs] = useState<RecordData[]>([]),
    [refresh, setRefresh] = useState(0),
    [importOpen, setImportOpen] = useState(false),
    [jobsOpen, setJobsOpen] = useState(false),
    [help, setHelp] = useState(false),
    [toast, setToast] = useState(""),
    [theme, setTheme] = useState(
      localStorage.getItem("folio-theme") || "light",
    ),
    [mobile, setMobile] = useState(false),
    [editing, setEditing] = useState<number | null>(null),
    [filterCollection, setFilterCollection] = useState<number | null>(null);
  const notify = (s: string) => setToast(s);
  const reload = () => setRefresh((v) => v + 1);
  const go = (p: Page) => {
    setPage(p);
    setMobile(false);
    window.scrollTo(0, 0);
  };
  const openEditor = (id: number) => {
    setEditing(id);
    go("Story Editor");
  };
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("folio-theme", theme);
  }, [theme]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 6000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    Promise.all([api("/collections"), api("/dashboard")])
      .then(([c, d]) => {
        setCollections(c);
        setDashboard(d);
      })
      .catch((e) => notify(e.message));
  }, [refresh]);
  useEffect(() => {
    api("/models")
      .then(setModel)
      .catch(() => setModel({ connected: false }));
  }, [refresh]);
  const lastJobs = useRef("");
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const j = await api("/jobs");
        if (!alive) return;
        setJobs(j);
        const s = JSON.stringify(j.map((x: RecordData) => [x.id, x.status]));
        if (lastJobs.current && lastJobs.current !== s) reload();
        lastJobs.current = s;
      } catch {}
    };
    load();
    const t = setInterval(load, 2000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  const perform = async (action: () => Promise<any>, message?: string) => {
    try {
      const r = await action();
      if (message) notify(message);
      reload();
      return r;
    } catch (e: any) {
      notify(e.message);
      return null;
    }
  };
  const active = allJobs.filter((j) =>
    ["queued", "running"].includes(j.status),
  );
  const common = { collections, notify, reload, refresh, perform };
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (mobile ? "open" : "")}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("Dashboard");
          }}
        >
          <span className="brand-mark">
            <Feather size={23} />
          </span>
          folio<span className="brand-dot">.</span>
        </a>
        <div className="workspace-switch">
          <span className="workspace-avatar">M</span>
          <div>
            <strong>My workspace</strong>
            <small>Personal studio</small>
          </div>
          <ChevronDown size={14} />
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav>
          {nav.slice(0, 4).map(([p, Icon]) => (
            <button
              key={p}
              aria-label={p}
              className={page === p ? "active" : ""}
              onClick={() => go(p)}
            >
              <Icon size={18} />
              {p}
              {p === "Story Library" && dashboard?.stats.source_stories > 0 && (
                <span className="nav-count">
                  {number(dashboard?.stats.source_stories)}
                </span>
              )}
            </button>
          ))}
          <span className="nav-label create-label">CREATE</span>
          {nav.slice(4).map(([p, Icon]) => (
            <button
              key={p}
              aria-label={p}
              className={page === p ? "active" : ""}
              onClick={() => go(p)}
            >
              <Icon size={18} />
              {p}
              {p === "Story Generator" && <span className="tiny-spark">✧</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="private-card">
            <span className="status-dot" />
            <strong>Your stories. Your space.</strong>
            <p>Stored locally. Always yours.</p>
            <div>
              <HardDrive size={13} /> Local-first workspace
            </div>
          </div>
          <button
            onClick={() => go("Settings")}
            className={"nav-bottom " + (page === "Settings" ? "active" : "")}
          >
            <Settings size={18} />
            Settings
          </button>
          <button className="nav-bottom" onClick={() => setHelp(true)}>
            <CircleHelp size={18} />
            Help & getting started
            <ArrowUpRight size={13} />
          </button>
          <div className="profile-row">
            <span className="user-avatar">Y</span>
            <div>
              <strong>Your creative space</strong>
              <small>No account needed</small>
            </div>
            <button
              className="icon-button"
              aria-label="Toggle color theme"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
            </button>
          </div>
        </div>
      </aside>
      {mobile && (
        <div className="mobile-scrim" onClick={() => setMobile(false)} />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div>
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={20} />
            </button>
            <span className="breadcrumb-root">Workspace</span>
            <ChevronRight size={13} />
            <span>{page}</span>
          </div>
          <div>
            <span className="local-pill">
              <span className="status-dot" />
              Local workspace
            </span>
            <span className="top-divider" />
            <button
              className="icon-button"
              aria-label="View processing jobs"
              onClick={() => setJobsOpen(true)}
            >
              <Activity size={18} />
              {active.length > 0 && <i className="notification-dot" />}
            </button>
            <span className="top-avatar">Y</span>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">YOUR STORYTELLING WORKSPACE</div>
              <h1>
                {page === "Dashboard"
                  ? "A little inspiration. Endless possibilities."
                  : page}
              </h1>
              <p>
                {
                  {
                    Dashboard:
                      "A home for your stories, and the ones you haven’t written yet.",
                    "Story Library":
                      "The stories that inspire your own. Build a library of possibilities.",
                    Collections:
                      "Give every storytelling world a place to grow.",
                    "Analysis Studio":
                      "Discover the patterns between the lines.",
                    "Story Generator":
                      "A new idea, shaped by the way you love to tell stories.",
                    "Story Mixer":
                      "A little of this world. A little of that feeling.",
                    "Generated Stories":
                      "Your ideas, brought to life and kept in one place.",
                    "Story Editor": "Make every word feel like your own.",
                    Settings: "Make this space work for you.",
                  }[page]
                }
              </p>
            </div>
            <div className="heading-actions">
              {page === "Dashboard" || page === "Story Library" ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setImportOpen(true)}
                  >
                    <Upload size={16} />
                    Import stories
                  </Button>
                  {page === "Dashboard" && (
                    <Button onClick={() => go("Story Generator")}>
                      <Plus size={17} />
                      New story
                    </Button>
                  )}
                </>
              ) : page === "Generated Stories" ? (
                <Button onClick={() => go("Story Generator")}>
                  <Plus size={16} />
                  New story
                </Button>
              ) : null}
            </div>
          </div>
          {page === "Dashboard" && (
            <>
              <section className="welcome-card">
                <div className="welcome-copy">
                  <span className="section-kicker">
                    <Leaf size={14} /> A SPACE FOR YOUR IMAGINATION
                  </span>
                  <h2>
                    Great stories grow
                    <br />
                    from great inspiration.
                  </h2>
                  <p>
                    Gather the stories you love. Discover what makes them
                    <br className="desktop-break" /> work. Create something
                    entirely your own.
                  </p>
                  <Button onClick={() => go("Story Generator")}>
                    Let’s write something <ArrowRight size={16} />
                  </Button>
                  <span className="hero-foot">
                    <ShieldCheck size={13} /> Private by design. Powered by your
                    imagination.
                  </span>
                </div>
                <Illustration />
                <span className="hero-corner">a new chapter awaits ↗</span>
              </section>
              <div className="stats-grid">
                {[
                  [
                    Library,
                    "Stories in your library",
                    dashboard?.stats.source_stories,
                    "Your collection of inspiration",
                  ],
                  [
                    Folders,
                    "Story collections",
                    dashboard?.stats.collections,
                    "Different worlds, neatly organized",
                  ],
                  [
                    FileText,
                    "Words of inspiration",
                    dashboard?.stats.source_words,
                    "Every word holds a possibility",
                  ],
                  [
                    Sparkles,
                    "Stories you’ve created",
                    dashboard?.stats.generated_stories,
                    `${number(dashboard?.generated_words)} words brought to life`,
                  ],
                ].map(([Icon, label, value, caption]: any) => (
                  <div className="stat-card" key={label}>
                    <div className="stat-label">
                      <span>{label}</span>
                      <Icon size={17} />
                    </div>
                    <strong>{number(value)}</strong>
                    <small>{caption}</small>
                  </div>
                ))}
              </div>
              <div className="dashboard-columns">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Your collections</h2>
                      <p>A world of inspiration, organized your way.</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => go("Collections")}
                    >
                      View all
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                  {collections.length ? (
                    <div className="collection-preview">
                      {collections.slice(0, 3).map((c, i) => (
                        <button
                          key={c.id}
                          className="mini-collection"
                          onClick={() => {
                            setFilterCollection(c.id);
                            go("Story Library");
                          }}
                        >
                          <div
                            className={"collection-art art-" + (i % 3)}
                            style={{ background: c.color }}
                          >
                            <BookOpen size={34} strokeWidth={1} />
                            <span>0{i + 1}</span>
                            <i />
                            <b />
                          </div>
                          <div>
                            <h3>{c.name}</h3>
                            <small>
                              {number(c.story_count)} stories <span>·</span>{" "}
                              {number(c.words)} words
                            </small>
                          </div>
                          <ArrowUpRight size={17} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      icon={Folders}
                      title="A place for every kind of story"
                      description="Group your reference stories into collections. Each one develops its own storytelling profile."
                      action={
                        <Button
                          variant="secondary"
                          onClick={() => go("Collections")}
                        >
                          <Plus size={15} />
                          Create a collection
                        </Button>
                      }
                    />
                  )}
                </section>
                <section className="panel writing-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Your creative pulse</h2>
                      <p>Small steps. Beautiful stories.</p>
                    </div>
                    <ChartNoAxesCombined size={18} />
                  </div>
                  <div className="pulse-summary">
                    <strong>
                      {number(dashboard?.stats.analyzed)}
                      <small>
                        {" "}
                        / {number(dashboard?.stats.source_stories)}
                      </small>
                    </strong>
                    <Badge tone="sage">Stories analyzed</Badge>
                  </div>
                  <div className="pulse-chart">
                    <div className="chart-grid">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="progress-track">
                      <div
                        style={{
                          width: `${dashboard?.stats.source_stories ? (dashboard.stats.analyzed / dashboard.stats.source_stories) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="chart-caption">
                      {dashboard?.stats.source_stories
                        ? `${dashboard.stats.source_stories - dashboard.stats.analyzed} stories awaiting analysis`
                        : "Your creative journey starts with a story."}
                    </span>
                  </div>
                  <div className="insight-note">
                    <span className="spark-circle">
                      <Sparkles size={17} />
                    </span>
                    <p>
                      Every story you add helps reveal
                      <br />
                      <strong>your next story’s possibilities.</strong>
                    </p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => go("Analysis Studio")}
                  >
                    Explore your storytelling patterns <ArrowRight size={15} />
                  </button>
                </section>
              </div>
              <div className="dashboard-columns bottom-columns">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Recently added</h2>
                      <p>The latest additions to your inspiration shelf.</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => go("Story Library")}
                    >
                      Open library
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                  {dashboard?.recent.length ? (
                    <div className="recent-list">
                      {dashboard.recent.map((s: RecordData) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setFilterCollection(s.collection_id);
                            go("Story Library");
                          }}
                        >
                          <span className="file-icon">
                            <FileText size={19} />
                          </span>
                          <div>
                            <strong>{s.title}</strong>
                            <small>
                              {s.genre} · {number(s.words)} words
                            </small>
                          </div>
                          <Badge tone={s.analyzed ? "sage" : ""}>
                            {s.analyzed ? "Analyzed" : "Ready to analyze"}
                          </Badge>
                          <small>{date(s.created)}</small>
                          <ChevronRight size={15} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="recent-empty">
                      <FileText size={27} strokeWidth={1.2} />
                      <div>
                        <strong>Your library is a blank page.</strong>
                        <p>Import a favorite story to start filling it.</p>
                      </div>
                      <button
                        className="icon-button"
                        onClick={() => setImportOpen(true)}
                        aria-label="Import first story"
                      >
                        <Plus size={19} />
                      </button>
                    </div>
                  )}
                </section>
                <section className="next-card">
                  <span className="section-kicker">
                    A LITTLE CREATIVE NUDGE
                  </span>
                  <Feather size={25} strokeWidth={1.1} />
                  <h3>
                    What if the ordinary
                    <br />
                    held something extraordinary?
                  </h3>
                  <p>Start with a small idea. See where it takes you.</p>
                  <button
                    className="text-button"
                    onClick={() => go("Story Generator")}
                  >
                    Explore a new idea
                    <ArrowRight size={16} />
                  </button>
                </section>
              </div>
              <div className="page-footer">
                <span>
                  <ShieldCheck size={13} /> Your library stays on your computer.
                  Your imagination goes everywhere.
                </span>
                <span>Made for the stories only you can tell.</span>
              </div>
            </>
          )}
          {page === "Story Library" && (
            <LibraryPage
              {...common}
              initialCollection={filterCollection}
              onImport={() => setImportOpen(true)}
            />
          )}
          {page === "Collections" && (
            <CollectionsPage
              {...common}
              openLibrary={(id: number) => {
                setFilterCollection(id);
                go("Story Library");
              }}
            />
          )}
          {page === "Analysis Studio" && <AnalysisPage {...common} />}
          {page === "Story Generator" && (
            <Generator
              {...common}
              model={model}
              allJobs={allJobs}
              openEditor={openEditor}
              openSettings={() => go("Settings")}
              openJobs={() => setJobsOpen(true)}
            />
          )}
          {page === "Story Mixer" && (
            <Mixer {...common} generate={() => go("Story Generator")} />
          )}
          {page === "Generated Stories" && (
            <GeneratedPage {...common} openEditor={openEditor} />
          )}
          {page === "Story Editor" && (
            <Editor
              {...common}
              id={editing}
              pick={() => go("Generated Stories")}
              onSelect={openEditor}
            />
          )}
          {page === "Settings" && (
            <SettingsPage
              {...common}
              model={model}
              setModel={setModel}
              openJobs={() => setJobsOpen(true)}
            />
          )}
        </main>
      </div>
      {importOpen && (
        <ImportModal
          {...common}
          close={() => setImportOpen(false)}
          openJobs={() => setJobsOpen(true)}
        />
      )}
      {jobsOpen && (
        <Modal
          title="Processing activity"
          close={() => setJobsOpen(false)}
          wide
        >
          <div className="modal-body">
            {!allJobs.length ? (
              <Empty
                icon={Activity}
                title="All quiet in the studio"
                description="Imports, analysis and generation tasks will appear here."
              />
            ) : (
              allJobs.map((j) => (
                <div className="job" key={j.id}>
                  <div className="job-heading">
                    <strong>
                      {j.kind === "generate"
                        ? "Story generation"
                        : j.kind === "pull"
                          ? "Model download"
                          : j.kind === "analysis"
                            ? "Story analysis"
                            : "Library import"}{" "}
                      <small>#{j.id}</small>
                    </strong>
                    <Badge
                      tone={
                        j.status === "completed"
                          ? "sage"
                          : j.status === "failed"
                            ? "danger"
                            : ""
                      }
                    >
                      {j.status}
                    </Badge>
                  </div>
                  <p>{j.error || j.message}</p>
                  <progress value={j.progress} max="100" />
                  <div className="job-actions">
                    <small>
                      {Math.round(j.progress)}% · {date(j.created)}
                    </small>
                    {["queued", "running"].includes(j.status) ? (
                      <Button
                        variant="ghost"
                        onClick={() =>
                          perform(
                            () => api(`/jobs/${j.id}/cancel`, {}),
                            "Cancellation requested",
                          )
                        }
                      >
                        Cancel
                      </Button>
                    ) : ["failed", "cancelled"].includes(j.status) &&
                      j.kind !== "import" ? (
                      <Button
                        variant="ghost"
                        onClick={() =>
                          perform(
                            () => api(`/jobs/${j.id}/retry`, {}),
                            "Job queued",
                          )
                        }
                      >
                        Retry
                      </Button>
                    ) : j.result?.story_id ? (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          openEditor(j.result.story_id);
                          setJobsOpen(false);
                        }}
                      >
                        Open story
                        <ArrowRight size={14} />
                      </Button>
                    ) : null}
                  </div>
                  {j.result?.files && (
                    <details>
                      <summary>
                        Per-file import results ({j.result.files.length})
                      </summary>
                      {j.result.files.map((f: RecordData, i: number) => (
                        <p key={i} className={f.error ? "error-text" : ""}>
                          {f.file}:{" "}
                          {f.error ||
                            (f.duplicate ? "Duplicate skipped" : "Imported")}
                        </p>
                      ))}
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </Modal>
      )}
      {help && (
        <Modal
          title="Your first chapter starts here"
          close={() => setHelp(false)}
        >
          <div className="modal-body help-content">
            <div className="help-step">
              <b>01</b>
              <div>
                <h3>Gather your inspiration</h3>
                <p>
                  Create a collection and import TXT, Markdown, PDF, DOCX, EPUB
                  or ZIP files. You can also paste a story.
                </p>
              </div>
            </div>
            <div className="help-step">
              <b>02</b>
              <div>
                <h3>Discover your patterns</h3>
                <p>
                  Open Analysis Studio to measure your writing. Connect Ollama
                  for narrative, character and language interpretation.
                </p>
              </div>
            </div>
            <div className="help-step">
              <b>03</b>
              <div>
                <h3>Create something original</h3>
                <p>
                  Choose a collection, enter an idea and generate. Review the
                  outline and originality report, then edit and export your
                  work.
                </p>
              </div>
            </div>
            <div className="notice">
              <ShieldCheck size={19} />
              <p>
                Runs on your computer. No accounts, telemetry, cloud services or
                API keys required. Install dependencies and models once; the
                local workflow then works offline.
              </p>
            </div>
            <Button
              onClick={() => {
                setHelp(false);
                go("Settings");
              }}
            >
              Set up a local model
              <ArrowRight size={15} />
            </Button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>{toast}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

type Common = {
  collections: RecordData[];
  notify: (s: string) => void;
  reload: () => void;
  refresh: number;
  perform: (action: () => Promise<any>, message?: string) => Promise<any>;
};
function ImportModal({
  collections,
  close,
  perform,
  openJobs,
}: Common & { close: () => void; openJobs: () => void }) {
  const [tab, setTab] = useState("files"),
    [collection, setCollection] = useState(""),
    [genre, setGenre] = useState("Uncategorized"),
    [title, setTitle] = useState(""),
    [content, setContent] = useState(""),
    [files, setFiles] = useState<File[]>([]),
    [busy, setBusy] = useState(false),
    [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const submit = async () => {
    setBusy(true);
    let r;
    if (tab === "paste") {
      r = await perform(() =>
        api("/stories", {
          title,
          content,
          collection_id: collection ? Number(collection) : null,
          genre,
        }),
      );
      if (r && r.duplicate)
        alert("This exact story is already in the library: " + r.title);
    } else {
      const data = new FormData();
      files.forEach((f) => data.append("files", f));
      if (collection) data.append("collection_id", collection);
      data.append("genre", genre);
      r = await perform(
        () => api("/import", data),
        "Import queued. You can keep working.",
      );
    }
    setBusy(false);
    if (r) {
      close();
      if (tab === "files") openJobs();
    }
  };
  return (
    <Modal title="Add a little inspiration" close={close}>
      <div className="modal-body">
        <div className="tabs">
          <button
            className={tab === "files" ? "active" : ""}
            onClick={() => setTab("files")}
          >
            <Upload size={15} />
            Upload files
          </button>
          <button
            className={tab === "paste" ? "active" : ""}
            onClick={() => setTab("paste")}
          >
            <PenLine size={15} />
            Paste a story
          </button>
        </div>
        <div className="form-grid">
          <Field label="Collection">
            <select
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
            >
              <option value="">Unsorted stories</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Genre">
            <input
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="e.g. Mystery"
            />
          </Field>
        </div>
        {tab === "files" ? (
          <>
            <div
              className={"dropzone " + (drag ? "dragging" : "")}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                setFiles((f) => [...f, ...Array.from(e.dataTransfer.files)]);
              }}
            >
              <Upload size={29} strokeWidth={1.3} />
              <h3>Good stories belong here.</h3>
              <p>Drop your files, or choose them from your computer.</p>
              <Button
                variant="secondary"
                onClick={() => input.current?.click()}
              >
                Choose files
              </Button>
              <input
                ref={input}
                hidden
                type="file"
                multiple
                accept=".txt,.md,.pdf,.docx,.epub,.zip"
                onChange={(e) =>
                  setFiles((f) => [...f, ...Array.from(e.target.files || [])])
                }
              />
              <small>TXT, MD, PDF, DOCX, EPUB, ZIP · 30 MB per file</small>
            </div>
            <label className="folder-input text-button">
              <Folders size={15} /> Or import a folder
              <input
                type="file"
                hidden
                multiple
                {...({ webkitdirectory: "" } as any)}
                onChange={(e) =>
                  setFiles((f) => [...f, ...Array.from(e.target.files || [])])
                }
              />
            </label>
            {files.length > 0 && (
              <div className="file-list">
                {files.map((f, i) => (
                  <div key={i}>
                    <FileText size={14} />
                    <span>{f.name}</span>
                    <small>{Math.round(f.size / 1024)} KB</small>
                    <button
                      className="icon-button"
                      aria-label={"Remove " + f.name}
                      onClick={() => setFiles(files.filter((_, x) => x !== i))}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <Field label="Story title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your story a name"
              />
            </Field>
            <Field label="Story text">
              <textarea
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Once upon a time…"
              />
            </Field>
          </>
        )}
        <div className="modal-footer">
          <span>
            <ShieldCheck size={14} />
            Saved only to your local library
          </span>
          <Button
            disabled={
              busy ||
              (tab === "files"
                ? !files.length
                : !title.trim() || !content.trim())
            }
            onClick={submit}
          >
            {busy ? (
              <LoaderCircle size={16} className="spin" />
            ) : (
              <Plus size={16} />
            )}{" "}
            {tab === "files"
              ? `Import ${files.length || ""} ${files.length === 1 ? "story" : "stories"}`
              : "Add story"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
function LibraryPage({
  collections,
  notify,
  perform,
  refresh,
  initialCollection,
  onImport,
}: Common & { initialCollection: number | null; onImport: () => void }) {
  const [items, setItems] = useState<RecordData[]>([]),
    [total, setTotal] = useState(0),
    [q, setQ] = useState(""),
    [collection, setCollection] = useState(initialCollection?.toString() || ""),
    [sort, setSort] = useState("newest"),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState<RecordData | null>(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    const t = setTimeout(
      () =>
        api(
          `/stories?q=${encodeURIComponent(q)}&sort=${sort}&page=${page}${collection ? "&collection_id=" + collection : ""}`,
        )
          .then((d) => {
            if (alive) {
              setItems(d.items);
              setTotal(d.total);
              setLoading(false);
            }
          })
          .catch((e) => notify(e.message)),
      200,
    );
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q, collection, sort, page, refresh]);
  const open = async (id: number) => {
    try {
      setSelected(await api("/stories/" + id));
    } catch (e: any) {
      notify(e.message);
    }
  };
  return (
    <>
      <div className="toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            aria-label="Search library"
            placeholder="Search titles, story text or tags…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          aria-label="Filter collection"
          value={collection}
          onChange={(e) => {
            setCollection(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All collections</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort stories"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Recently added</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A–Z</option>
          <option value="length">Longest first</option>
          <option value="genre">Genre</option>
          <option value="collection">Collection</option>
        </select>
      </div>
      <section className="panel library-panel">
        <div className="panel-heading">
          <h2>
            Your inspiration shelf <span className="count-pill">{total}</span>
          </h2>
          <Button
            variant="ghost"
            disabled={!total}
            onClick={() =>
              perform(
                () =>
                  api("/analyze", {
                    collection_id: collection ? Number(collection) : null,
                    use_ai: false,
                  }),
                "Measured analysis queued",
              )
            }
          >
            <ChartNoAxesCombined size={15} />
            Measure stories
          </Button>
        </div>
        {loading ? (
          <div className="loading">
            <LoaderCircle className="spin" />
            Opening the library…
          </div>
        ) : !items.length ? (
          <Empty
            icon={Library}
            title={q ? "No stories found" : "Your next story starts here"}
            description={
              q
                ? "Try a different title, phrase or tag."
                : "Bring in the stories that move you. Folio will help you find what makes them work."
            }
            action={
              !q && (
                <Button onClick={onImport}>
                  <Upload size={16} />
                  Import your first stories
                </Button>
              )
            }
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>STORY</th>
                  <th>COLLECTION</th>
                  <th>WORDS</th>
                  <th>STATUS</th>
                  <th>ADDED</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => open(s.id)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") open(s.id);
                    }}
                  >
                    <td>
                      <div className="story-cell">
                        <span className="file-icon">
                          <FileText size={18} />
                        </span>
                        <div>
                          <strong>{s.title}</strong>
                          <small>
                            {s.genre}
                            {s.tags ? " · " + s.tags : ""}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      {collections.find((c) => c.id === s.collection_id)
                        ?.name || "Unsorted"}
                    </td>
                    <td>{number(s.words)}</td>
                    <td>
                      <Badge tone={s.analyzed ? "sage" : ""}>
                        {s.analyzed ? "Analyzed" : "Awaiting analysis"}
                      </Badge>
                    </td>
                    <td>{date(s.created)}</td>
                    <td>
                      <ChevronRight size={16} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer">
          <span>
            {total} {total === 1 ? "story" : "stories"} · Local library
          </span>
          <div>
            <Button
              variant="ghost"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span>Page {page}</span>
            <Button
              variant="ghost"
              disabled={page * 40 >= total}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </section>
      {selected && (
        <Modal
          title={`Story details · #${selected.id}`}
          close={() => setSelected(null)}
          wide
        >
          <div className="modal-body">
            <div className="form-grid">
              <Field label="Title">
                <input
                  value={selected.title}
                  onChange={(e) =>
                    setSelected({ ...selected, title: e.target.value })
                  }
                />
              </Field>
              <Field label="Collection">
                <select
                  value={selected.collection_id || ""}
                  onChange={(e) =>
                    setSelected({
                      ...selected,
                      collection_id: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                >
                  <option value="">Unsorted</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Genre">
                <input
                  value={selected.genre}
                  onChange={(e) =>
                    setSelected({ ...selected, genre: e.target.value })
                  }
                />
              </Field>
              <Field label="Tags (comma separated)">
                <input
                  value={selected.tags}
                  onChange={(e) =>
                    setSelected({ ...selected, tags: e.target.value })
                  }
                />
              </Field>
            </div>
            <Field label="Story text">
              <textarea
                className="prose-input"
                rows={12}
                value={selected.content}
                onChange={(e) =>
                  setSelected({ ...selected, content: e.target.value })
                }
              />
            </Field>
            {selected.analysis && (
              <details>
                <summary>
                  Writing analysis · {selected.analysis.analysis_type}
                </summary>
                <Metrics metrics={selected.analysis.measurements} />
                {selected.analysis.interpretation && (
                  <Interpretation value={selected.analysis.interpretation} />
                )}
              </details>
            )}
            <div className="modal-footer">
              <Button
                variant="danger ghost"
                onClick={async () => {
                  if (confirm("Delete this source story?")) {
                    await perform(
                      () => api("/stories/" + selected.id, {}, "DELETE"),
                      "Story deleted",
                    );
                    setSelected(null);
                  }
                }}
              >
                <Trash2 size={15} />
                Delete
              </Button>
              <Button
                onClick={async () => {
                  const r = await perform(
                    () => api("/stories/" + selected.id, selected, "PUT"),
                    "Story saved",
                  );
                  if (r) setSelected(null);
                }}
              >
                Save changes
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
function CollectionsPage({
  collections,
  perform,
  openLibrary,
}: Common & { openLibrary: (id: number) => void }) {
  const [form, setForm] = useState<RecordData | null>(null);
  const colors = ["#e5eadb", "#eee4d5", "#dfe8e9", "#e8e0eb", "#e8e4cf"];
  return (
    <>
      <div className="section-toolbar">
        <span>{collections.length} storytelling worlds</span>
        <Button
          onClick={() =>
            setForm({ name: "", description: "", color: colors[0] })
          }
        >
          <Plus size={16} />
          Create collection
        </Button>
      </div>
      {!collections.length ? (
        <section className="panel">
          <Empty
            icon={Folders}
            title="Every world needs a home"
            description="Create a collection for a genre, a mood, or a storytelling style. Its profile grows as you add and analyze stories."
            action={
              <Button
                onClick={() =>
                  setForm({ name: "", description: "", color: colors[0] })
                }
              >
                <Plus size={16} />
                Create your first collection
              </Button>
            }
          />
        </section>
      ) : (
        <div className="collections-grid">
          {collections.map((c, i) => (
            <section className="collection-card" key={c.id}>
              <button
                className={"large-collection-art art-" + (i % 3)}
                style={{ background: c.color }}
                onClick={() => openLibrary(c.id)}
              >
                <span className="collection-number">
                  COLLECTION / {String(i + 1).padStart(2, "0")}
                </span>
                <BookOpen size={62} strokeWidth={0.8} />
                <span className="collection-art-name">{c.name}</span>
                <ArrowUpRight size={19} />
              </button>
              <div className="collection-card-body">
                <div>
                  <h2>{c.name}</h2>
                  <button
                    className="icon-button"
                    aria-label={"Edit " + c.name}
                    onClick={() => setForm(c)}
                  >
                    <PenLine size={15} />
                  </button>
                </div>
                <p>
                  {c.description || "A new world of stories and possibilities."}
                </p>
                <div>
                  <small>
                    {number(c.story_count)} stories · {number(c.words)} words
                  </small>
                  <Badge tone={c.profile ? "sage" : ""}>
                    {c.profile
                      ? "Profile v" + c.profile.version
                      : "No profile yet"}
                  </Badge>
                </div>
                <button
                  className="text-button"
                  onClick={() => openLibrary(c.id)}
                >
                  Explore collection
                  <ArrowRight size={14} />
                </button>
              </div>
            </section>
          ))}
        </div>
      )}
      {form && (
        <Modal
          title={form.id ? "Edit collection" : "Create a collection"}
          close={() => setForm(null)}
        >
          <form
            className="modal-body"
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await perform(
                () =>
                  api(
                    "/collections" + (form.id ? "/" + form.id : ""),
                    form,
                    form.id ? "PUT" : "POST",
                  ),
                "Collection saved",
              );
              if (r) setForm(null);
            }}
          >
            <Field label="Collection name">
              <input
                required
                maxLength={120}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Quiet mysteries"
                autoFocus
              />
            </Field>
            <Field label="A few words about this world">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="What brings these stories together?"
              />
            </Field>
            <Field label="Shelf color">
              <div className="color-options">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    style={{ background: c }}
                    className={form.color === c ? "chosen" : ""}
                    aria-label={"Color " + c}
                    onClick={() => setForm({ ...form, color: c })}
                  >
                    {form.color === c && <Check size={17} />}
                  </button>
                ))}
              </div>
            </Field>
            <div className="modal-footer">
              {form.id ? (
                <Button
                  variant="danger ghost"
                  onClick={async () => {
                    if (
                      confirm(
                        "Remove this collection? Its stories will become unsorted.",
                      )
                    ) {
                      const r = await perform(
                        () => api("/collections/" + form.id, {}, "DELETE"),
                        "Collection removed",
                      );
                      if (r) setForm(null);
                    }
                  }}
                >
                  <Trash2 size={15} />
                  Delete
                </Button>
              ) : (
                <span />
              )}
              <Button type="submit" disabled={!form.name.trim()}>
                Save collection
                <Check size={15} />
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
function Metrics({ metrics }: { metrics: RecordData }) {
  const data = [
    ["words", "Story length", "words", 5000],
    ["avg_sentence", "Sentence length", "words", 40],
    ["dialogue_pct", "Dialogue", "%", 100],
    ["vocabulary_pct", "Unique vocabulary", "%", 100],
  ];
  return (
    <div className="metrics-grid">
      {data.map(([key, label, unit, max]) => (
        <div className="metric" key={key}>
          <span>{label}</span>
          <strong>
            {number(metrics[key])}
            <small>{unit}</small>
          </strong>
          <div className="metric-bar">
            <i
              style={{
                width:
                  Math.min(100, ((metrics[key] || 0) / Number(max)) * 100) +
                  "%",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
function Interpretation({ value }: { value: any }) {
  return (
    <div className="interpretations">
      {(Array.isArray(value) ? value : [value]).map(
        (part: any, index: number) => (
          <div key={index}>
            {part.patterns && <h3>{part.title}</h3>}
            {Object.entries(part.patterns || part)
              .filter(([k]) => !["story_id", "title"].includes(k))
              .map(([key, v]) => (
                <div className="interpretation-item" key={key}>
                  <strong>{key.replaceAll("_", " ")}</strong>
                  <p>
                    {typeof v === "string" ? v : JSON.stringify(v, null, 2)}
                  </p>
                </div>
              ))}
          </div>
        ),
      )}
    </div>
  );
}
function AnalysisPage({ collections, perform }: Common) {
  const [collection, setCollection] = useState(""),
    [useAI, setUseAI] = useState(false);
  const current = collections.find((c) => c.id === Number(collection));
  const p = current?.profile;
  return (
    <>
      <div className="toolbar">
        <select
          aria-label="Collection to analyze"
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
        >
          <option value="">Choose a collection</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={useAI}
            onChange={(e) => setUseAI(e.target.checked)}
          />{" "}
          Include model-assisted interpretation
        </label>
        <Button
          disabled={!collection}
          onClick={() =>
            perform(
              () =>
                api("/analyze", {
                  collection_id: Number(collection),
                  use_ai: useAI,
                }),
              "Analysis queued. Follow progress in Processing activity.",
            )
          }
        >
          <Sparkles size={16} />
          Analyze collection
        </Button>
      </div>
      {!current ? (
        <section className="panel">
          <Empty
            icon={ChartNoAxesCombined}
            title="Find the patterns between the lines"
            description="Choose a collection to explore its sentence rhythm, dialogue, vocabulary and narrative characteristics. Measured analysis needs no AI model."
          />
        </section>
      ) : (
        <>
          <section className="profile-banner">
            <span className="spark-circle">
              <ChartNoAxesCombined size={23} />
            </span>
            <div>
              <h2>{current.name} · Storytelling profile</h2>
              <p>
                {p
                  ? `${p.analyzed} of ${p.total} stories analyzed · Updated ${date(p.updated)} · Version ${p.version}`
                  : "No current profile. Analyze this collection to get started, or rebuild from existing story analyses."}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() =>
                perform(
                  () => api("/collections/" + current.id + "/profile", {}),
                  "Profile refreshed",
                )
              }
            >
              <RefreshCw size={15} />
              Refresh profile
            </Button>
          </section>
          {p?.analyzed > 0 ? (
            <>
              <Metrics metrics={p.metrics} />
              <div className="dashboard-columns">
                <section className="panel padded">
                  <h2>Genre distribution</h2>
                  <p className="muted">
                    Genres assigned to your reference stories.
                  </p>
                  <div className="genre-chart">
                    {Object.entries(p.genres as Record<string, number>).map(
                      ([g, n]) => (
                        <div key={g}>
                          <span>{g}</span>
                          <div>
                            <i style={{ width: (n / p.total) * 100 + "%" }} />
                          </div>
                          <strong>{n}</strong>
                        </div>
                      ),
                    )}
                  </div>
                  <h3 className="subheading">Reading characteristics</h3>
                  <p>
                    Average paragraph:{" "}
                    <strong>{p.metrics.avg_paragraph} words</strong>
                  </p>
                  <p>
                    Approximate readability:{" "}
                    <strong>{p.metrics.readability}</strong>
                  </p>
                  <small className="muted">
                    English-language heuristics. Vocabulary ratios depend on
                    text length. These measurements do not establish narrative
                    quality.
                  </small>
                </section>
                <section className="panel padded">
                  <h2>Model-assisted observations</h2>
                  <p className="muted">
                    Interpretations may be subjective or uncertain.
                  </p>
                  {p.synthesis ? (
                    <>
                      <Interpretation value={p.synthesis} />
                      <details>
                        <summary>Individual story observations</summary>
                        <Interpretation value={p.patterns} />
                      </details>
                    </>
                  ) : p.patterns.length ? (
                    <Interpretation value={p.patterns} />
                  ) : (
                    <Empty
                      icon={Feather}
                      title="There’s more beneath the surface"
                      description="Enable model-assisted interpretation to explore character arcs, plot, tone, point of view and endings. Requires a connected language model."
                    />
                  )}
                </section>
              </div>
            </>
          ) : (
            <section className="panel">
              <Empty
                icon={FileText}
                title="Your profile is ready to take shape"
                description="Analyze the stories in this collection to reveal its writing characteristics."
              />
            </section>
          )}
        </>
      )}
    </>
  );
}
function Mixer({
  collections,
  perform,
  generate,
}: Common & { generate: () => void }) {
  const [weights, setWeights] = useState<Record<string, number>>({}),
    [result, setResult] = useState<RecordData | null>(null);
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const selected = Object.entries(weights)
    .filter(([, w]) => w > 0)
    .map(([id, weight]) => ({ id: Number(id), weight }));
  return (
    <div className="split-layout">
      <section className="panel padded">
        <span className="section-kicker">MAKE SOMETHING UNEXPECTED</span>
        <h2>A blend that’s entirely yours.</h2>
        <p className="muted">
          Mix broad writing characteristics across collections. Weights are
          normalized automatically.
        </p>
        {!collections.length ? (
          <Empty
            icon={Folders}
            title="Add a few worlds first"
            description="Create and analyze collections to start blending their characteristics."
          />
        ) : (
          collections.map((c) => (
            <div className="mix-row" key={c.id}>
              <div>
                <span className="color-dot" style={{ background: c.color }} />
                <strong>{c.name}</strong>
                <span>
                  {total ? Math.round(((weights[c.id] || 0) / total) * 100) : 0}
                  %
                </span>
              </div>
              <input
                aria-label={c.name + " influence"}
                type="range"
                min="0"
                max="100"
                value={weights[c.id] || 0}
                onChange={(e) => {
                  setWeights({ ...weights, [c.id]: Number(e.target.value) });
                  setResult(null);
                }}
              />
            </div>
          ))
        )}
        <Button
          disabled={!total}
          onClick={async () => {
            const r = await perform(() =>
              api("/mix", { collections: selected }),
            );
            if (r) setResult(r);
          }}
        >
          <SlidersHorizontal size={16} />
          Preview blended profile
        </Button>
      </section>
      <section className="panel padded">
        <h2>Your combined storytelling profile</h2>
        {result ? (
          <>
            <Metrics metrics={result.metrics} />
            <div className="blend-sources">
              {result.sources.map((s: RecordData) => (
                <Badge tone="sage" key={s.id}>
                  {s.name} · {Math.round(s.weight * 100)}%
                </Badge>
              ))}
            </div>
            <p className="muted">
              This blend uses analyzed characteristics. It does not combine
              passages or train the model.
            </p>
            <Button
              onClick={() => {
                sessionStorage.setItem("folio-mix", JSON.stringify(selected));
                generate();
              }}
            >
              Write with this blend
              <ArrowRight size={15} />
            </Button>
          </>
        ) : (
          <Empty
            icon={SlidersHorizontal}
            title="Find your balance"
            description="Adjust collection influences, then preview the mix before creating a new story."
          />
        )}
      </section>
    </div>
  );
}
const generationDefaults = {
  idea: "",
  title: "",
  genre: "Literary fiction",
  word_count: 1500,
  chapters: 1,
  language: "English",
  audience: "Adults",
  reading_age: "Adult",
  pov: "Third person",
  tense: "Past",
  characters: "",
  character_count: 2,
  relationships: "",
  protagonist_goals: "",
  pacing: "Balanced",
  emotion: 50,
  dialogue: 40,
  description: 50,
  suspense: 50,
  humor: 20,
  complexity: "Moderate",
  ending: "Hopeful",
  creativity: 70,
  twists: 1,
  influence: 60,
};
function Generator({
  collections,
  perform,
  notify,
  model,
  allJobs,
  openEditor,
  openSettings,
  openJobs,
}: Common & {
  model: RecordData | null;
  allJobs: RecordData[];
  openEditor: (id: number) => void;
  openSettings: () => void;
  openJobs: () => void;
}) {
  const [form, setForm] = useState<RecordData>(() => {
      try {
        return {
          ...generationDefaults,
          ...JSON.parse(localStorage.getItem("folio-generation") || "{}"),
        };
      } catch {
        return generationDefaults;
      }
    }),
    [advanced, setAdvanced] = useState(false),
    [collection, setCollection] = useState(""),
    [mix, setMix] = useState<RecordData[]>(() => {
      const s = sessionStorage.getItem("folio-mix");
      sessionStorage.removeItem("folio-mix");
      return s ? JSON.parse(s) : [];
    }),
    [jobId, setJobId] = useState<number | null>(null),
    [busy, setBusy] = useState(false),
    [emphasize, setEmphasize] = useState(""),
    [exclude, setExclude] = useState("");
  const set = (key: string, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));
  useEffect(() => {
    localStorage.setItem("folio-generation", JSON.stringify(form));
  }, [form]);
  const job = allJobs.find((j) => j.id === jobId);
  const isActive = busy || (job && ["running", "queued"].includes(job.status));
  const select = (key: string, label: string, options: string[]) => (
    <Field key={key} label={label}>
      <select value={form[key]} onChange={(e) => set(key, e.target.value)}>
        {options.map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
    </Field>
  );
  const text = (key: string, label: string, type = "text") => (
    <Field key={key} label={label}>
      <input
        type={type}
        value={form[key]}
        onChange={(e) =>
          set(key, type === "number" ? Number(e.target.value) : e.target.value)
        }
      />
    </Field>
  );
  return (
    <div className="generator-layout">
      <section className="panel generator-panel">
        <div className="panel-heading">
          <div>
            <h2>What story is waiting to be told?</h2>
            <p>You bring the spark. Let’s give it a world.</p>
          </div>
          <span className="small-logo">
            <Sparkles size={19} />
          </span>
        </div>
        <div className="padded">
          <div className="tabs">
            <button
              className={!advanced ? "active" : ""}
              onClick={() => setAdvanced(false)}
            >
              Simple mode
            </button>
            <button
              className={advanced ? "active" : ""}
              onClick={() => setAdvanced(true)}
            >
              <SlidersHorizontal size={14} />
              Advanced mode
            </button>
          </div>
          <Field label="Your story idea">
            <textarea
              className="idea-input"
              rows={5}
              value={form.idea}
              onChange={(e) => set("idea", e.target.value)}
              placeholder="A student discovers a room in an abandoned school that only appears when it rains…"
            />
          </Field>
          <Field
            label="Learn from a collection"
            hint="Only broad storytelling characteristics are used. Source passages stay out of generation prompts."
          >
            <select
              value={collection}
              onChange={(e) => {
                setCollection(e.target.value);
                setMix([]);
              }}
            >
              <option value="">
                No reference collection · Your idea alone
              </option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.story_count} stories
                </option>
              ))}
            </select>
          </Field>
          {mix.length > 0 && (
            <div className="notice">
              <SlidersHorizontal size={18} />
              <p>
                Using your custom blend:{" "}
                {mix
                  .map((s) => collections.find((c) => c.id === s.id)?.name)
                  .join(", ")}
                .
              </p>
              <button
                className="icon-button"
                aria-label="Remove blend"
                onClick={() => setMix([])}
              >
                <X size={15} />
              </button>
            </div>
          )}
          <div className="form-grid">
            {select("genre", "Genre", [
              "Literary fiction",
              "Mystery",
              "Fantasy",
              "Science fiction",
              "Romance",
              "Drama",
              "Adventure",
              "Horror",
              "Children’s fiction",
            ])}
            <Field label="Target word count">
              <input
                type="number"
                min="100"
                max="100000"
                value={form.word_count}
                onChange={(e) => {
                  set("word_count", Number(e.target.value));
                  if (Number(e.target.value) > 3000 * form.chapters)
                    set("chapters", Math.ceil(Number(e.target.value) / 2500));
                }}
              />
            </Field>
          </div>
          {advanced && (
            <div className="advanced-fields">
              <h3>Story foundations</h3>
              <div className="form-grid">
                {text("title", "Title (blank for AI title)")}
                {text("chapters", "Chapters", "number")}
                {text("language", "Language")}
                {text("reading_age", "Target reading age")}
                {select("audience", "Audience", [
                  "Adults",
                  "Young adults",
                  "Middle grade",
                  "Children",
                ])}
                {select("pov", "Point of view", [
                  "First person",
                  "Third person limited",
                  "Third person omniscient",
                  "Second person",
                ])}
                {select("tense", "Narrative tense", ["Past", "Present"])}
                {select("ending", "Ending", [
                  "Hopeful",
                  "Happy",
                  "Tragic",
                  "Ambiguous",
                  "Surprising",
                  "Open-ended",
                ])}
              </div>
              <h3>Characters & relationships</h3>
              <div className="form-grid">
                {text("character_count", "Main characters", "number")}
                {text("protagonist_goals", "Protagonist goals")}
                {text("relationships", "Relationship dynamics")}
              </div>
              <Field label="Names, descriptions & personalities">
                <textarea
                  rows={3}
                  value={form.characters}
                  onChange={(e) => set("characters", e.target.value)}
                  placeholder="Who lives in this story?"
                />
              </Field>
              <h3>Shape the feeling</h3>
              <div className="form-grid">
                {select("pacing", "Pacing", [
                  "Slow burn",
                  "Balanced",
                  "Fast-paced",
                ])}
                {select("complexity", "Plot complexity", [
                  "Simple",
                  "Moderate",
                  "Layered",
                ])}
                {text("twists", "Plot twists", "number")}
              </div>
              <div className="form-grid">
                {[
                  ["emotion", "Emotional intensity"],
                  ["dialogue", "Dialogue frequency"],
                  ["description", "Description level"],
                  ["suspense", "Suspense"],
                  ["humor", "Humor"],
                  ["creativity", "Creativity"],
                  ["influence", "Reference influence"],
                ].map(([key, label]) => (
                  <Field key={key} label={`${label} · ${form[key]}%`}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={form[key]}
                      onChange={(e) => set(key, Number(e.target.value))}
                    />
                  </Field>
                ))}
              </div>
              <h3>Reference controls</h3>
              <div className="form-grid">
                <Field label="Emphasize story IDs (comma separated)">
                  <input
                    value={emphasize}
                    onChange={(e) => setEmphasize(e.target.value)}
                    placeholder="e.g. 1, 4, 8"
                  />
                </Field>
                <Field label="Exclude story IDs (comma separated)">
                  <input
                    value={exclude}
                    onChange={(e) => setExclude(e.target.value)}
                    placeholder="e.g. 2, 9"
                  />
                </Field>
              </div>
            </div>
          )}
          <div className="generator-action">
            <span>
              <ShieldCheck size={14} />{" "}
              {model?.connected
                ? "Connected inference provider"
                : "A local model is required"}
            </span>
            <Button
              disabled={isActive || form.idea.trim().length < 5}
              onClick={async () => {
                setBusy(true);
                const parseIds = (s: string) =>
                  s
                    .split(",")
                    .map((v) => Number(v.trim()))
                    .filter((v) => v > 0);
                const r = await perform(() =>
                  api("/generate", {
                    ...form,
                    collections: mix.length
                      ? mix
                      : collection
                        ? [{ id: Number(collection), weight: 1 }]
                        : [],
                    emphasize_ids: parseIds(emphasize),
                    exclude_ids: parseIds(exclude),
                  }),
                );
                if (r) {
                  setJobId(r.job_id);
                  notify(
                    "Your story is in progress. You can keep using the studio.",
                  );
                }
                setBusy(false);
              }}
            >
              {isActive ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <Sparkles size={17} />
              )}
              Generate story
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </section>
      <aside className="generator-aside">
        <section className="panel padded">
          <span className="section-kicker">A THOUGHTFUL PROCESS</span>
          <h2>From spark to story.</h2>
          <div className="pipeline">
            {[
              "Understand your idea",
              "Retrieve writing patterns",
              "Create a fresh premise",
              "Plan the narrative arc",
              "Write chapter by chapter",
              "Review & check originality",
              "Revise, then save",
            ].map((s, i) => (
              <div key={s}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <p>{s}</p>
              </div>
            ))}
          </div>
          <p className="muted small-text">
            Every story is original work shaped by general patterns. No
            fine-tuning or model training takes place.
          </p>
        </section>
        {!model?.connected && (
          <div className="notice stacked">
            <AlertCircle size={21} />
            <h3>Meet your writing partner.</h3>
            <p>
              Start Ollama and select a local model to bring your ideas to life.
              Your library works in the meantime.
            </p>
            <button className="text-button" onClick={openSettings}>
              Set up local AI
              <ArrowRight size={14} />
            </button>
          </div>
        )}
        {job && (
          <section className="panel padded">
            <Badge tone={job.status === "completed" ? "sage" : ""}>
              {job.status}
            </Badge>
            <h3>{job.error || job.message}</h3>
            <progress value={job.progress} max="100" />
            {job.result?.story_id ? (
              <Button onClick={() => openEditor(job.result.story_id)}>
                Read your story
                <ArrowRight size={15} />
              </Button>
            ) : (
              <button className="text-button" onClick={openJobs}>
                View processing activity
                <ArrowUpRight size={14} />
              </button>
            )}
          </section>
        )}
      </aside>
    </div>
  );
}
function GeneratedPage({
  perform,
  refresh,
  notify,
  openEditor,
}: Common & { openEditor: (id: number) => void }) {
  const [items, setItems] = useState<RecordData[]>([]),
    [q, setQ] = useState(""),
    [genre, setGenre] = useState(""),
    [folder, setFolder] = useState(""),
    [favorites, setFavorites] = useState(false),
    [sort, setSort] = useState("newest"),
    [selected, setSelected] = useState<number[]>([]),
    [format, setFormat] = useState("md");
  useEffect(() => {
    const t = setTimeout(
      () =>
        api(
          `/generated?q=${encodeURIComponent(q)}&genre=${encodeURIComponent(genre)}&folder=${encodeURIComponent(folder)}&favorite=${favorites}&sort=${sort}`,
        )
          .then(setItems)
          .catch((e) => notify(e.message)),
      180,
    );
    return () => clearTimeout(t);
  }, [q, genre, folder, favorites, sort, refresh]);
  return (
    <>
      <div className="toolbar wrap">
        <div className="search-box">
          <Search size={16} />
          <input
            aria-label="Search generated stories"
            placeholder="Find your next chapter…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <input
          className="short-input"
          aria-label="Filter genre"
          placeholder="Filter by genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        />
        <input
          className="short-input"
          aria-label="Filter folder"
          placeholder="Filter by folder"
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
        />
        <Button
          variant={favorites ? "" : "secondary"}
          onClick={() => setFavorites(!favorites)}
        >
          <Heart size={15} />
          Favorites
        </Button>
        <select
          aria-label="Sort generated stories"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>
      {selected.length > 0 && (
        <div className="selection-bar">
          <span>{selected.length} selected</span>
          <select
            aria-label="Batch export format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            {["md", "txt", "docx", "pdf", "epub"].map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                const r = await fetch("/api/export", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ids: selected, format }),
                });
                if (!r.ok) throw Error("Export failed");
                downloadBlob(await r.blob(), "folio-stories.zip");
              } catch (e: any) {
                notify(e.message);
              }
            }}
          >
            <Download size={15} />
            Export selected
          </Button>
          <button className="text-button" onClick={() => setSelected([])}>
            Clear selection
          </button>
        </div>
      )}
      {!items.length ? (
        <section className="panel">
          <Empty
            icon={Feather}
            title="A shelf for the stories only you can tell"
            description="Your generated stories will live here, ready to read, refine, organize and export."
          />
        </section>
      ) : (
        <div className="generated-grid">
          {items.map((s) => (
            <article className="generated-card" key={s.id}>
              <div>
                <label className="checkbox-label">
                  <input
                    aria-label={"Select " + s.title}
                    type="checkbox"
                    checked={selected.includes(s.id)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, s.id]
                          : selected.filter((id) => id !== s.id),
                      )
                    }
                  />
                  <Badge>{s.genre}</Badge>
                </label>
                <button
                  className={"icon-button " + (s.favorite ? "hearted" : "")}
                  aria-label="Toggle favorite"
                  onClick={async () => {
                    const full = await api("/generated/" + s.id);
                    perform(() =>
                      api(
                        "/generated/" + s.id,
                        { ...full, favorite: !s.favorite },
                        "PUT",
                      ),
                    );
                  }}
                >
                  <Heart
                    size={17}
                    fill={s.favorite ? "currentColor" : "none"}
                  />
                </button>
              </div>
              <button
                className="story-card-link"
                onClick={() => openEditor(s.id)}
              >
                <h2>{s.title}</h2>
                <p>{s.preview?.replace(/## /g, "")}</p>
              </button>
              <div>
                <small>
                  {date(s.created)}
                  {s.folder ? " · " + s.folder : ""}
                </small>
                <button
                  className="text-button"
                  onClick={() => openEditor(s.id)}
                >
                  Open story
                  <ArrowUpRight size={15} />
                </button>
              </div>
              <div className="card-bottom">
                <button
                  className="text-button"
                  onClick={async () => {
                    const r = await perform(
                      () => api("/generated/" + s.id + "/duplicate", {}),
                      "Story duplicated",
                    );
                    if (r) openEditor(r.id);
                  }}
                >
                  <Copy size={13} />
                  Duplicate
                </button>
                <button
                  className="icon-button"
                  aria-label="Delete story"
                  onClick={() => {
                    if (confirm("Delete this story and its versions?"))
                      perform(
                        () => api("/generated/" + s.id, {}, "DELETE"),
                        "Story deleted",
                      );
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
function Editor({
  id,
  perform,
  notify,
  pick,
  onSelect,
}: Common & {
  id: number | null;
  pick: () => void;
  onSelect: (id: number) => void;
}) {
  const [story, setStory] = useState<RecordData | null>(null),
    [content, setContent] = useState(""),
    [title, setTitle] = useState(""),
    [folder, setFolder] = useState(""),
    [tab, setTab] = useState("write"),
    [saved, setSaved] = useState("Saved locally"),
    [versions, setVersions] = useState<RecordData[]>([]),
    [compare, setCompare] = useState<RecordData | null>(null),
    [instruction, setInstruction] = useState("Improve descriptions"),
    [selection, setSelection] = useState({ text: "", start: 0, end: 0 }),
    [suggestion, setSuggestion] = useState(""),
    [assistBusy, setAssistBusy] = useState(false),
    [rating, setRating] = useState(4),
    [note, setNote] = useState(""),
    [retryToken, setRetryToken] = useState(0);
  const latestDraft = useRef<RecordData | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null),
    loaded = useRef(""),
    saving = useRef(false),
    previousId = useRef(id);
  useEffect(() => {
    previousId.current = id;
    setStory(null);
    setSuggestion("");
    setCompare(null);
    if (!id) return;
    api("/generated/" + id)
      .then((s) => {
        if (previousId.current !== id) return;
        loaded.current = JSON.stringify([s.title, s.content, s.folder]);
        setStory(s);
        setContent(s.content);
        setTitle(s.title);
        setFolder(s.folder);
        setVersions(s.versions);
        setSaved("Saved locally");
      })
      .catch((e) => notify(e.message));
  }, [id]);
  latestDraft.current = story
    ? { id: story.id, title, content, folder, favorite: !!story.favorite }
    : null;
  useEffect(
    () => () => {
      const draft = latestDraft.current;
      if (
        draft &&
        JSON.stringify([draft.title, draft.content, draft.folder]) !==
          loaded.current
      ) {
        fetch("/api/generated/" + draft.id, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
          keepalive: true,
        }).catch(() => {});
      }
    },
    [],
  );
  const save = async () => {
    if (!story || saving.current) return;
    saving.current = true;
    const snapshot = JSON.stringify([title, content, folder]);
    try {
      await api(
        "/generated/" + story.id,
        { title, content, folder, favorite: !!story.favorite },
        "PUT",
      );
      loaded.current = snapshot;
      setSaved("Saved locally");
      const s = await api("/generated/" + story.id);
      if (previousId.current === s.id) {
        setVersions(s.versions);
        setStory(s);
      }
    } catch (e: any) {
      setSaved("Save failed · use Save to retry");
      notify(e.message);
    } finally {
      saving.current = false;
    }
  };
  useEffect(() => {
    if (!story) return;
    const snapshot = JSON.stringify([title, content, folder]);
    if (snapshot === loaded.current) return;
    setSaved("Unsaved changes");
    const timer = setTimeout(() => save(), 900);
    return () => clearTimeout(timer);
  }, [title, content, folder, story, retryToken]);
  useEffect(() => {
    const fn = (e: BeforeUnloadEvent) => {
      if (
        story &&
        JSON.stringify([title, content, folder]) !== loaded.current
      ) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, [story, title, content, folder]);
  if (!id)
    return (
      <section className="panel">
        <Empty
          icon={PenLine}
          title="Good writing is rewriting"
          description="Open a generated story to shape its next draft. Your revisions are saved locally, with a history of every change."
          action={
            <Button onClick={pick}>
              Choose a story
              <ArrowRight size={15} />
            </Button>
          }
        />
      </section>
    );
  if (!story)
    return (
      <div className="loading">
        <LoaderCircle className="spin" />
        Opening your manuscript…
        <button className="text-button" onClick={pick}>
          Back to stories
        </button>
      </div>
    );
  return (
    <>
      <div className="editor-toolbar">
        <button className="text-button" onClick={pick}>
          ← Your stories
        </button>
        <span className="save-status">
          <CheckCheck size={14} />
          {saved}
        </span>
        <Button
          variant="secondary"
          onClick={() => {
            setRetryToken((v) => v + 1);
            save();
          }}
        >
          Save
        </Button>
        <select
          aria-label="Export story"
          value=""
          onChange={async (e) => {
            const fmt = e.target.value;
            if (!fmt) return;
            await save();
            const r = await fetch(`/api/generated/${id}/export/${fmt}`);
            if (r.ok) downloadBlob(await r.blob(), `story-${id}.${fmt}`);
            else notify("Export failed");
          }}
        >
          <option value="">Export story…</option>
          {["txt", "md", "docx", "pdf", "epub"].map((f) => (
            <option key={f} value={f}>
              {f.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
      <div className="editor-layout">
        <section className="panel manuscript">
          <div className="tabs editor-tabs">
            {[
              "write",
              "read",
              "outline",
              "originality",
              "versions",
              "feedback",
            ].map((t) => (
              <button
                key={t}
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          {["write", "read"].includes(tab) ? (
            <div className="manuscript-body">
              <input
                className="title-input"
                aria-label="Story title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="manuscript-meta">
                <Badge>{story.genre}</Badge>
                <span>
                  {number(content.split(/\s+/).filter(Boolean).length)} words
                </span>
                <span>·</span>
                <span>{date(story.updated)}</span>
              </div>
              {tab === "write" ? (
                <textarea
                  className="writing-area"
                  aria-label="Story manuscript"
                  ref={textarea}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onSelect={(e) => {
                    const el = e.currentTarget;
                    setSelection({
                      text: el.value.slice(el.selectionStart, el.selectionEnd),
                      start: el.selectionStart,
                      end: el.selectionEnd,
                    });
                  }}
                />
              ) : (
                <div className="reading-area">
                  {content
                    .split("\n\n")
                    .map((p, i) =>
                      p.startsWith("## ") ? (
                        <h2 key={i}>{p.slice(3)}</h2>
                      ) : (
                        <p key={i}>{p}</p>
                      ),
                    )}
                </div>
              )}
            </div>
          ) : tab === "outline" ? (
            <div className="padded">
              <h2>The narrative plan</h2>
              <Interpretation value={story.outline} />
              <h3>Review notes</h3>
              <Interpretation value={story.review} />
            </div>
          ) : tab === "originality" ? (
            <div className="padded">
              <div className="panel-heading">
                <h2>Originality report</h2>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await save();
                    const r = await perform(() =>
                      api("/generated/" + id + "/originality", {}),
                    );
                    if (r) setStory({ ...story, originality: r });
                  }}
                >
                  <RefreshCw size={14} />
                  Recheck
                </Button>
              </div>
              {!story.originality ? (
                <p className="muted">
                  The text has changed since the last check. Recheck to get a
                  current report.
                </p>
              ) : (
                <>
                  <div className="notice">
                    <ShieldCheck size={20} />
                    <p>
                      {story.originality.checked_sources} sources checked.{" "}
                      {story.originality.flags.length} sources with overlapping
                      eight-word phrases.
                    </p>
                  </div>
                  {story.originality.flags.map((f: RecordData) => (
                    <div className="overlap" key={f.story_id}>
                      <h3>
                        {f.title} · {f.overlap_pct}% overlap
                      </h3>
                      {f.matched_phrases.map((p: string) => (
                        <mark key={p}>{p}</mark>
                      ))}
                    </div>
                  ))}
                  {story.originality.semantic?.length > 0 && (
                    <>
                      <h3>Semantic review signals</h3>
                      {story.originality.semantic.map((s: RecordData) => (
                        <p key={s.story_id}>
                          {s.title}: cosine similarity {s.cosine}
                        </p>
                      ))}
                    </>
                  )}
                  <p>{story.originality.method}</p>
                  <p className="muted">{story.originality.notice}</p>
                </>
              )}
            </div>
          ) : tab === "versions" ? (
            <div className="padded">
              <h2>Every draft has a place</h2>
              {versions.map((v) => (
                <div className="version-row" key={v.id}>
                  <div>
                    <strong>{v.label}</strong>
                    <small>{new Date(v.created).toLocaleString()}</small>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={async () =>
                      setCompare(await api(`/generated/${id}/versions/${v.id}`))
                    }
                  >
                    Compare
                  </Button>
                </div>
              ))}
              {compare && (
                <>
                  <div className="compare-grid">
                    <div>
                      <h3>Selected version</h3>
                      <pre>{compare.content}</pre>
                    </div>
                    <div>
                      <h3>Current draft</h3>
                      <pre>{content}</pre>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setContent(compare.content);
                      setTab("write");
                      setCompare(null);
                    }}
                  >
                    Restore this version
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="padded">
              <h2>Help your next story feel more like you</h2>
              <p className="muted">
                Feedback is saved and used as guidance in future generation
                prompts.
              </p>
              <Field label="Your rating">
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option value={n} key={n}>
                      {n} / 5
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="What would you change?">
                <textarea
                  rows={5}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Too much dialogue? A weak ending? Tell your next story what to do differently."
                />
              </Field>
              <Button
                onClick={() =>
                  perform(
                    () =>
                      api("/generated/" + id + "/feedback", { rating, note }),
                    "Feedback saved",
                  )
                }
              >
                Save feedback
                <Check size={15} />
              </Button>
            </div>
          )}
        </section>
        <aside className="editor-aside">
          <section className="panel padded">
            <h2>
              <WandSparkles size={18} />
              Your editing companion
            </h2>
            <p className="muted">
              Select a passage in the Write tab. AI changes stay separate until
              you accept them.
            </p>
            <Field label="Selected passage">
              <div className="selection-preview">
                {selection.text || "Highlight a passage in your manuscript."}
              </div>
            </Field>
            <Field label="How can we shape it?">
              <select
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
              >
                {[
                  "Improve descriptions",
                  "Expand this passage",
                  "Shorten this passage",
                  "Rewrite dialogue",
                  "Add tension",
                  "Change pacing",
                  "Improve the ending",
                  "Continue from this ending",
                  "Generate an additional chapter",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Button
              disabled={!selection.text || assistBusy}
              onClick={async () => {
                setAssistBusy(true);
                const r = await perform(() =>
                  api("/generated/" + id + "/assist", {
                    selection: selection.text,
                    instruction,
                  }),
                );
                if (r) setSuggestion(r.suggestion);
                setAssistBusy(false);
              }}
            >
              {assistBusy ? (
                <LoaderCircle size={15} className="spin" />
              ) : (
                <Sparkles size={15} />
              )}
              Suggest an edit
            </Button>
            {suggestion && (
              <div className="suggestion">
                <h3>A possible new direction</h3>
                <p>{suggestion}</p>
                <div>
                  <Button
                    onClick={() => {
                      if (
                        content.slice(selection.start, selection.end) !==
                        selection.text
                      ) {
                        notify(
                          "The selected text has changed. Select it again before accepting.",
                        );
                        return;
                      }
                      const append =
                        instruction.startsWith("Continue") ||
                        instruction.startsWith("Generate an additional");
                      setContent(
                        content.slice(0, selection.start) +
                          (append ? selection.text + "\n\n" : "") +
                          suggestion +
                          content.slice(selection.end),
                      );
                      setSuggestion("");
                      setTab("write");
                    }}
                  >
                    <Check size={14} />
                    Accept
                  </Button>
                  <Button variant="ghost" onClick={() => setSuggestion("")}>
                    Discard
                  </Button>
                </div>
              </div>
            )}
          </section>
          <section className="panel padded">
            <Field label="Organize in a folder">
              <input
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                placeholder="e.g. Work in progress"
              />
            </Field>
            <p className="muted small-text">
              Edits autosave after a short pause. Earlier text stays in version
              history. Originality reports need a fresh check after edits.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
function SettingsPage({
  perform,
  notify,
  model,
  setModel,
  openJobs,
}: Common & {
  model: RecordData | null;
  setModel: (m: RecordData) => void;
  openJobs: () => void;
}) {
  const [settings, setSettings] = useState<RecordData | null>(null),
    [form, setForm] = useState<RecordData>({}),
    [testing, setTesting] = useState(false),
    [pull, setPull] = useState("qwen2.5:7b"),
    [approve, setApprove] = useState(false);
  const restoreInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    api("/settings")
      .then((s) => {
        setSettings(s);
        setForm(s.ai);
      })
      .catch((e) => notify(e.message));
  }, []);
  const save = () =>
    perform(() => api("/settings", form, "PUT"), "AI configuration saved");
  if (!settings)
    return (
      <div className="loading">
        <LoaderCircle className="spin" />
        Opening settings…
      </div>
    );
  return (
    <div className="settings-layout">
      <section className="panel padded">
        <span className="section-kicker">YOUR LOCAL WRITING PARTNER</span>
        <h2>AI model configuration</h2>
        <p className="muted">
          Ollama runs models on your computer. Install a model once, then write
          offline.
        </p>
        <div className="connection-status">
          <span
            className={"status-dot " + (model?.connected ? "" : "offline")}
          />
          <strong>
            {model?.connected ? "Provider connected" : "No model connection"}
          </strong>
          <Button
            variant="ghost"
            disabled={testing}
            onClick={async () => {
              setTesting(true);
              const r = await save();
              if (r) {
                const m = await api("/models");
                setModel(m);
                notify(m.message);
              }
              setTesting(false);
            }}
          >
            {testing ? (
              <LoaderCircle size={14} className="spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Test connection
          </Button>
        </div>
        <Field label="Provider">
          <select
            value={form.provider}
            onChange={(e) =>
              setForm({
                ...form,
                provider: e.target.value,
                url:
                  e.target.value === "ollama"
                    ? "http://127.0.0.1:11434"
                    : "https://api.openai.com/v1",
                remote_enabled: false,
                model: "",
              })
            }
          >
            <option value="ollama">Ollama · Local & offline</option>
            <option value="openai">
              OpenAI-compatible API · Optional remote
            </option>
          </select>
        </Field>
        {form.provider === "openai" && (
          <div className="notice stacked">
            <h3>Remote processing is optional</h3>
            <p>
              When enabled, story segments, analysis, prompts and generated text
              may leave your computer for this provider. API charges may apply.
              Set FOLIO_REMOTE_API_KEY in your local environment; never paste it
              here.
            </p>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.remote_enabled}
                onChange={(e) =>
                  setForm({ ...form, remote_enabled: e.target.checked })
                }
              />
              I understand and enable remote processing
            </label>
            <small>
              API key environment variable:{" "}
              {settings.remote_key_present ? "Present" : "Not set"}
            </small>
          </div>
        )}
        <Field label="Provider address">
          <input
            value={form.url || ""}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
        </Field>
        <Field
          label="Language model"
          hint="Choose an installed model or enter its exact model name."
        >
          <input
            list="model-options"
            value={form.model || ""}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            placeholder="e.g. qwen2.5:7b"
          />
          <datalist id="model-options">
            {model?.models?.map((m: string) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </Field>
        <div className="form-grid">
          <Field label="Embedding model (optional)">
            <input
              value={form.embedding_model || ""}
              onChange={(e) =>
                setForm({ ...form, embedding_model: e.target.value })
              }
              placeholder="e.g. nomic-embed-text"
            />
          </Field>
          <Field label={"Temperature · " + (form.temperature || 0)}>
            <input
              type="range"
              min="0"
              max="2"
              step=".05"
              value={form.temperature || 0}
              onChange={(e) =>
                setForm({ ...form, temperature: Number(e.target.value) })
              }
            />
          </Field>
        </div>
        <Button onClick={save}>
          Save configuration
          <Check size={15} />
        </Button>
        <hr />
        <h3>Download a local model</h3>
        <p className="muted">
          Downloads require an internet connection and several GB of storage.
          Nothing is downloaded automatically.
        </p>
        <Field label="Ollama model name">
          <input value={pull} onChange={(e) => setPull(e.target.value)} />
        </Field>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={approve}
            onChange={(e) => setApprove(e.target.checked)}
          />
          I approve downloading this model to my computer.
        </label>
        <Button
          variant="secondary"
          disabled={!approve || form.provider !== "ollama"}
          onClick={async () => {
            const saved = await save();
            if (!saved) return;
            const r = await perform(
              () => api("/models/pull", { model: pull, approved: approve }),
              "Model download queued",
            );
            if (r) openJobs();
          }}
        >
          <Download size={15} />
          Download model
        </Button>
      </section>
      <div>
        <section className="panel padded">
          <h2>Start writing offline</h2>
          <ol className="setup-steps">
            <li>
              Install Ollama from{" "}
              <a href="https://ollama.com" target="_blank" rel="noreferrer">
                ollama.com
                <ArrowUpRight size={12} />
              </a>
              .
            </li>
            <li>
              Start the Ollama app, or run <code>ollama serve</code>.
            </li>
            <li>
              Download a model:
              <code className="code-block">ollama pull qwen2.5:7b</code>
              <small>
                For less memory, try qwen2.5:3b. Larger models usually produce
                better fiction.
              </small>
            </li>
            <li>Test the connection and select the model here.</li>
          </ol>
          <div className="notice">
            <ShieldCheck size={19} />
            <p>
              No external services are called by the local workflow. Model
              downloads are the only network step after installation.
            </p>
          </div>
        </section>
        <section className="panel padded">
          <h2>Your data, on your computer</h2>
          <p className="muted">
            SQLite stores your library, profiles, drafts, versions and settings.
          </p>
          <code className="path-code">{settings.data_dir}</code>
          <p className="small-text muted">
            {settings.platform} · {settings.cpu_count} CPU threads · One
            background worker
          </p>
          <div className="backup-buttons">
            <a className="button secondary" href="/api/backup" download>
              <Download size={15} />
              Back up workspace
            </a>
            <Button
              variant="ghost"
              onClick={() => restoreInput.current?.click()}
            >
              <Upload size={15} />
              Restore backup
            </Button>
            <input
              ref={restoreInput}
              hidden
              type="file"
              accept=".sqlite3,.db"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (
                  !confirm(
                    "Replace this workspace with the backup? A copy of current data will be saved locally.",
                  )
                )
                  return;
                const fd = new FormData();
                fd.append("file", f);
                await perform(
                  () => api("/restore", fd),
                  "Workspace restored. AI settings were preserved.",
                );
              }}
            />
          </div>
          <p className="muted small-text">
            Restoration replaces library and writing data. AI settings stay as
            configured. Finish or cancel jobs before restoring.
          </p>
        </section>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
