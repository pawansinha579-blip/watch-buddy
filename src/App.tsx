import { lazy, Suspense, useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import { ArrowRight, Clapperboard, Headphones, Link2, LoaderCircle, LockKeyhole, Mic2, MonitorUp, Play, ShieldCheck, Sparkles, Users, X } from "lucide-react";
import { requestApi, roomIdFromInput, type BootstrapState } from "./api";

const RoomRoute = lazy(() => import("./Room"));

function App() {
  return <Routes><Route path="/" element={<Home />} /><Route path="/room/:roomId" element={<Suspense fallback={<main className="entry-page"><p>Getting the room ready...</p></main>}><RoomRoute /></Suspense>} /><Route path="*" element={<NotFound />} /></Routes>;
}

function Home() {
  const [dialog, setDialog] = useState<"create" | "join" | null>(null);
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (dialog === "create") {
        const credentials = await requestApi("create-room", { name });
        if (!credentials.roomId) throw new Error("Room creation returned no room ID.");
        const state: BootstrapState = { token: credentials.token, serverUrl: credentials.serverUrl, name };
        navigate(`/room/${credentials.roomId}`, { state });
      } else {
        const normalizedRoomId = roomIdFromInput(roomId);
        const result = await requestApi("join-room", { roomId: normalizedRoomId, name });
        const state: BootstrapState = { token: result.token, serverUrl: result.serverUrl, name };
        navigate(`/room/${normalizedRoomId}`, { state });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function showDialog(next: "create" | "join") {
    setName("");
    setRoomId("");
    setError("");
    setDialog(next);
  }

  return (
    <main className="landing min-h-screen overflow-hidden">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="site-header page-wrap">
        <Link to="/" className="brand"><span className="brand-mark"><Play size={15} fill="currentColor" /></span>WATCH<span>BUDDY</span></Link>
        <a className="header-note" href="#how-it-works"><span className="status-dot" /> YOUR PEOPLE, YOUR MOVIE NIGHT</a>
      </header>

      <section className="hero page-wrap">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> DISTANCE IS JUST A NUMBER</div>
          <h1>Movies are<br />better <span className="gradient-text">together.</span></h1>
          <p className="hero-subtitle">Watch together. Talk together.<br className="desktop-break" /> Feel closer.</p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={() => showDialog("create")}>Create a room <ArrowRight size={17} /></button>
            <button className="button button-secondary" onClick={() => showDialog("join")}><Link2 size={16} /> Join a room</button>
          </div>
          <div className="trust-line"><LockKeyhole size={13} /> Private rooms. No recordings. Just your people.</div>
        </div>

        <div className="cinema-art" aria-hidden="true">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="poster poster-back"><div className="poster-stars">✦ &nbsp; · &nbsp; ✦</div><div className="poster-sun" /><span>THE<br />LONG WAY<br />HOME</span></div>
          <div className="poster poster-front"><div className="poster-sky" /><div className="poster-horizon" /><div className="poster-mountain" /><div className="poster-person" /><div className="poster-title">SOMEWHERE<br /><i>TOGETHER</i></div><div className="poster-caption">A STORY ABOUT US</div></div>
          <div className="float-card float-card-top"><span className="avatar avatar-lavender">J</span><div><strong>Jamie joined</strong><small>Movie night is on ✨</small></div><span className="mini-sparkle">✦</span></div>
          <div className="float-card float-card-bottom"><div className="sound-bars"><i /><i /><i /><i /><i /></div><div><strong>Sounds like home</strong><small>Voice chat is live</small></div><span className="audio-rings"><Headphones size={17} /></span></div>
          <span className="art-sparkle sparkle-a">✳</span><span className="art-sparkle sparkle-b">✦</span>
        </div>
      </section>

      <section className="how-section page-wrap" id="how-it-works">
        <div className="section-heading"><span className="eyebrow">YOUR COUCH, CONNECTED</span><h2>Movie night, <span className="gradient-text">made easy.</span></h2></div>
        <div className="steps-grid">
          <Step number="01" icon={<Users size={19} />} title="Make your room" text="Start a private room and invite your favorite people with one link." />
          <Step number="02" icon={<MonitorUp size={19} />} title="Share your screen" text="Pick a screen, window, or tab. Everyone watches together in real time." />
          <Step number="03" icon={<Mic2 size={19} />} title="Feel right there" text="Talk, laugh, and react live with crystal-clear voice chat." />
        </div>
      </section>
      <footer className="site-footer page-wrap"><span>WATCHBUDDY <span className="footer-dim">© 2026</span></span><span>MADE FOR THE PEOPLE YOU MISS.</span></footer>

      {dialog && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}>
        <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
          <button className="icon-button dialog-close" onClick={() => setDialog(null)} aria-label="Close"><X size={18} /></button>
          <div className="dialog-icon"><Clapperboard size={20} /></div>
          <span className="eyebrow">{dialog === "create" ? "YOUR PRIVATE CINEMA" : "THE MORE, THE MERRIER"}</span>
          <h2 id="dialog-title">{dialog === "create" ? "Start a movie night." : "Join your people."}</h2>
          <p>{dialog === "create" ? "We'll make your room and give you an invite link to share." : "Pop in your invite link or room code to get started."}</p>
          <form onSubmit={submit} className="dialog-form">
            <label htmlFor="display-name">Your name</label>
            <input id="display-name" autoFocus maxLength={32} placeholder="What should we call you?" value={name} onChange={(event) => setName(event.target.value)} required />
            {dialog === "join" && <><label htmlFor="room-code">Room link or code</label><input id="room-code" placeholder="Paste an invite link or room ID" value={roomId} onChange={(event) => setRoomId(event.target.value)} required /></>}
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="button button-primary dialog-submit" disabled={busy}>{busy ? <><LoaderCircle className="spin" size={17} /> Connecting...</> : <>{dialog === "create" ? "Create my room" : "Join the room"} <ArrowRight size={17} /></>}</button>
          </form>
          <div className="dialog-safety"><ShieldCheck size={14} /> No accounts. No recordings. Just a good time.</div>
        </section>
      </div>}
    </main>
  );
}

function Step({ number, icon, title, text }: { number: string; icon: React.ReactNode; title: string; text: string }) {
  return <article className="step-card"><div className="step-top"><span className="step-icon">{icon}</span><span className="step-number">{number}</span></div><h3>{title}</h3><p>{text}</p></article>;
}

function NotFound() {
  return <main className="not-found"><span className="eyebrow">WRONG AISLE</span><h1>We lost the plot.</h1><p>That page doesn't exist, but movie night is just a click away.</p><Link className="button button-primary" to="/">Back to WatchBuddy <ArrowRight size={16} /></Link></main>;
}

export default App;
