import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Copy, Headphones, Link2, LoaderCircle, Mic2, MonitorUp, Play, ShieldCheck, Users, X } from "lucide-react";
import { LiveKitRoom, RoomAudioRenderer, useConnectionState, useLocalParticipant, useParticipants, useRoomContext, useTracks, VideoTrack } from "@livekit/components-react";
import { ConnectionState, Track } from "livekit-client";
import { requestApi, type BootstrapState } from "./api";

export default function RoomRoute() {
  const { roomId = "" } = useParams();
  const location = useLocation();
  const [credentials, setCredentials] = useState<BootstrapState | null>(() => {
    const state = location.state as BootstrapState | null;
    return state?.token ? state : null;
  });
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function join(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await requestApi("join-room", { roomId, name });
      setCredentials({ token: result.token, serverUrl: result.serverUrl, name });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't join that room.");
    } finally {
      setBusy(false);
    }
  }

  if (!credentials) {
    return <main className="entry-page"><Link to="/" className="brand"><span className="brand-mark"><Play size={15} fill="currentColor" /></span>WATCH<span>BUDDY</span></Link><section className="entry-card">
      <div className="dialog-icon"><Users size={20} /></div><span className="eyebrow">YOU'RE INVITED</span><h1>Save you a seat?</h1><p>Enter your name and we'll connect you to the room.</p>
      <form className="dialog-form" onSubmit={join}><label htmlFor="join-name">Your name</label><input id="join-name" autoFocus maxLength={32} placeholder="What should we call you?" value={name} onChange={(event) => setName(event.target.value)} required />{error && <div className="form-error" role="alert">{error}</div>}<button className="button button-primary dialog-submit" disabled={busy}>{busy ? <><LoaderCircle className="spin" size={17} /> Joining...</> : <>Take my seat <ArrowRight size={17} /></>}</button></form>
    </section></main>;
  }

  return <LiveKitRoom token={credentials.token} serverUrl={credentials.serverUrl} connect audio video={false} onError={(cause) => setError(`Media connection failed: ${cause.message}`)}>
    <RoomAudioRenderer />
    <RoomView roomId={roomId} error={error} setError={setError} />
  </LiveKitRoom>;
}

function RoomView({ roomId, error, setError }: { roomId: string; error: string; setError: (message: string) => void }) {
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const { localParticipant, isMicrophoneEnabled, isScreenShareEnabled } = useLocalParticipant();
  const room = useRoomContext();
  const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState("");
  const invitation = `${window.location.origin}/room/${roomId}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(invitation);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setActionError("Couldn't copy automatically. Copy the room link from your browser address bar.");
    }
  }

  async function toggleMic() {
    try {
      setActionError("");
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (cause) {
      setActionError(cause instanceof Error && cause.name === "NotAllowedError" ? "Microphone permission was denied. Allow microphone access in your browser settings." : "Couldn't access your microphone. Check your device and browser permissions.");
    }
  }

  async function toggleShare() {
    try {
      setActionError("");
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled, { audio: false });
    } catch (cause) {
      const err = cause as Error;
      setActionError(err.name === "NotAllowedError" ? "Screen sharing was cancelled or not allowed. Choose a screen to share when prompted." : err.name === "NotSupportedError" ? "Screen sharing isn't supported in this browser. Try a recent version of Chrome, Edge, or Firefox." : "Couldn't start screen sharing. Check your browser permissions and try again.");
    }
  }

  async function leave() {
    await room.disconnect();
    window.location.assign("/");
  }

  const shareTrack = screenTracks.find((track) => track.publication?.track);
  const sharer = shareTrack?.participant;
  const connected = connectionState === ConnectionState.Connected;
  const connectionLabel = connectionState === ConnectionState.Connected ? "Connected" : connectionState === ConnectionState.Connecting ? "Connecting" : connectionState === ConnectionState.Reconnecting ? "Reconnecting" : "Disconnected";

  return <main className="room-page">
    <header className="room-header"><Link to="/" className="brand"><span className="brand-mark"><Play size={13} fill="currentColor" /></span>WATCH<span>BUDDY</span></Link><div className="room-header-center"><span className={`connection-pill ${connected ? "is-connected" : ""}`}><span className="status-dot" />{connectionLabel}</span><span className="room-code">ROOM <b>{roomId.slice(0, 8).toUpperCase()}</b></span></div><button className="button button-small button-secondary" onClick={copyLink}><Link2 size={15} />{copied ? "Copied!" : "Invite"}</button></header>
    <div className="room-layout">
      <section className="watch-column">
        <div className="video-stage">
          {shareTrack ? <VideoTrack trackRef={shareTrack} className="shared-video" /> : <div className="empty-stage">
            <div className="empty-visual"><span className="empty-screen"><MonitorUp size={32} /></span><span className="empty-orbit" /></div>
            <span className="eyebrow">{connected ? "YOUR SCREEN, THEIR SCREEN" : "GETTING THE ROOM READY"}</span><h1>{connected ? "The screen is yours." : "Connecting you..."}</h1>
            <p>{connected ? "Start sharing to bring everyone into the same scene." : "Hang tight while we set up your watch party."}</p>
            {connected && <button className="button button-primary stage-share" onClick={toggleShare}><MonitorUp size={17} /> Start sharing</button>}
          </div>}
          {shareTrack && <div className="screen-label"><span className="live-indicator" />{sharer?.identity === localParticipant.identity ? "You are sharing" : `${sharer?.name || "Someone"} is sharing`}</div>}
          <div className="stage-corner stage-corner-left"><span className="stage-brand-dot" /><span>WATCHBUDDY CINEMA</span></div>
        </div>
        {(error || actionError) && <div className="room-error" role="alert">{error || actionError}<button onClick={() => { setError(""); setActionError(""); }} aria-label="Dismiss"><X size={15} /></button></div>}
        <div className="room-controls">
          <button className={`control-button ${isScreenShareEnabled ? "control-active" : ""}`} onClick={toggleShare}><span className="control-icon"><MonitorUp size={18} /></span><span>{isScreenShareEnabled ? "Stop sharing" : "Share screen"}</span></button>
          <button className={`control-button ${isMicrophoneEnabled ? "control-on" : "control-muted"}`} onClick={toggleMic}><span className="control-icon"><Mic2 size={18} /></span><span>{isMicrophoneEnabled ? "Mute mic" : "Unmute mic"}</span></button>
          <button className="control-button control-copy" onClick={copyLink}><span className="control-icon">{copied ? <Check size={18} /> : <Copy size={18} />}</span><span>{copied ? "Link copied" : "Copy invite"}</span></button>
          <button className="control-button control-leave" onClick={leave}><span className="control-icon"><ArrowLeft size={18} /></span><span>Leave room</span></button>
        </div>
      </section>
      <aside className="room-sidebar">
        <div className="sidebar-heading"><div><span className="eyebrow">YOUR MOVIE NIGHT</span><h2>The living room</h2></div><span className="people-count">{participants.length}<Users size={14} /></span></div>
        <div className="participant-list"><div className="list-label">IN THE ROOM <span>{participants.length}</span></div>{participants.map((participant, index) => <ParticipantRow key={participant.identity} participant={participant} isCurrent={participant.identity === localParticipant.identity} colorIndex={index} />)}</div>
        <div className="sidebar-divider" />
        <div className="invite-panel"><div className="invite-icon"><Link2 size={16} /></div><div><strong>Bring your people</strong><p>Send them an invite and save them a seat.</p></div><button className="icon-button invite-copy" onClick={copyLink} aria-label="Copy invitation link">{copied ? <Check size={16} /> : <Copy size={16} />}</button></div>
        <div className="room-note"><ShieldCheck size={14} /><span>Private room · No recordings</span></div>
        <div className="sidebar-footer"><Headphones size={14} /><span>Voice chat is on while you watch.</span></div>
      </aside>
    </div>
  </main>;
}

function ParticipantRow({ participant, isCurrent, colorIndex }: { participant: ReturnType<typeof useParticipants>[number]; isCurrent: boolean; colorIndex: number }) {
  const colors = ["avatar-lavender", "avatar-blue", "avatar-peach", "avatar-mint"];
  const micEnabled = participant.isMicrophoneEnabled;
  return <div className="participant-row">
    <span className={`avatar ${colors[colorIndex % colors.length]} ${participant.isSpeaking ? "avatar-speaking" : ""}`}>{(participant.name || participant.identity || "?").slice(0, 1).toUpperCase()}</span>
    <div className="participant-info"><strong>{participant.name || participant.identity}{isCurrent && <span className="you-tag">YOU</span>}</strong><small><span className="online-dot" /> Here for movie night</small></div>
    <span className={`mic-status ${micEnabled ? "mic-live" : ""}`} title={micEnabled ? "Microphone on" : "Microphone muted"}><Mic2 size={15} /></span>
  </div>;
}
