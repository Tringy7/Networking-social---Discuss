import { useEffect, useRef, useState } from 'react';
import './videoPlayer.css';

type Recognition = EventTarget & {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  processLocally: boolean;
  start(track: MediaStreamTrack): void;
  abort(): void;
};
type RecognitionClass = {
  new(): Recognition;
  available?(options: { langs: string[]; processLocally: boolean }): Promise<string>;
  install?(options: { langs: string[]; processLocally: boolean }): Promise<boolean>;
};
type CapturableVideo = HTMLVideoElement & { captureStream?(): MediaStream };
type RecognitionResult = Event & {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type PlayerProps = { src?: string; label?: string; onError?: () => void; onLoaded?: () => void };

export default function VideoPlayer(props: PlayerProps) {
  return <Player key={props.src} {...props} />;
}

function Player({ src, label = 'Video', onError, onLoaded }: PlayerProps) {
  const video = useRef<CapturableVideo>(null);
  const frame = useRef<HTMLDivElement>(null);
  const session = useRef<Recognition | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const generation = useRef(0);
  const enabled = useRef(false);
  const [captions, setCaptions] = useState(false);
  const [caption, setCaption] = useState('');
  const [message, setMessage] = useState('');
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [cors, setCors] = useState(true);

  function stopRecognition() {
    generation.current++;
    const active = session.current;
    session.current = null;
    active?.abort();
  }

  useEffect(() => () => {
    generation.current++;
    session.current?.abort();
    session.current = null;
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
  }, []);

  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === frame.current);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  async function startCaptions() {
    const element = video.current;
    if (!element || !enabled.current || element.paused || session.current) return;
    const attempt = ++generation.current;
    const stillActive = () => enabled.current && attempt === generation.current && !element.paused;
    const SpeechRecognition = (window as Window & { SpeechRecognition?: RecognitionClass }).SpeechRecognition;
    const unavailable = () => {
      enabled.current = false;
      setCaptions(false);
      setMessage('Phụ đề tự động tiếng Việt chưa khả dụng cho video này trên trình duyệt của bạn.');
    };

    if (!SpeechRecognition?.available || !element.captureStream || !cors) {
      unavailable();
      return;
    }
    const options = { langs: ['vi-VN'], processLocally: true };
    try {
      const status = await SpeechRecognition.available(options);
      if (!stillActive()) return;
      if (status !== 'available') {
        if (status === 'unavailable' || !SpeechRecognition.install) { unavailable(); return; }
        setMessage('Đang tải gói nhận dạng tiếng Việt trên thiết bị…');
        const installed = await SpeechRecognition.install(options);
        if (!stillActive()) return;
        if (!installed) { unavailable(); return; }
      }
      stream.current ??= element.captureStream();
      const track = stream.current.getAudioTracks().find(item => item.readyState === 'live' && !item.muted);
      if (!track) { unavailable(); return; }
      const recognizer = new SpeechRecognition();
      recognizer.lang = 'vi-VN';
      recognizer.processLocally = true;
      recognizer.interimResults = true;
      recognizer.continuous = true;
      recognizer.addEventListener('result', (event) => {
        if (session.current !== recognizer) return;
        const result = event as RecognitionResult;
        const latest = result.results[result.results.length - 1];
        setCaption(latest?.[0]?.transcript.trim() ?? '');
      });
      recognizer.addEventListener('end', () => {
        if (session.current !== recognizer) return;
        session.current = null;
        setCaption('');
        if (!element.paused && !element.ended) {
          enabled.current = false;
          setCaptions(false);
          setMessage('Nhận dạng đã dừng. Bật lại phụ đề để tiếp tục.');
        }
      });
      recognizer.addEventListener('error', () => {
        if (session.current !== recognizer) return;
        stopRecognition();
        setCaption('');
        unavailable();
      });
      session.current = recognizer;
      recognizer.start(track);
      setMessage('');
    } catch {
      if (stillActive()) {
        stopRecognition();
        unavailable();
      }
    }
  }

  function toggleCaptions() {
    enabled.current = !enabled.current;
    setCaptions(enabled.current);
    setCaption('');
    setMessage('');
    if (enabled.current) {
      if (video.current?.paused) setMessage('Phát video để tạo phụ đề tiếng Việt.');
      else void startCaptions();
    } else stopRecognition();
  }

  async function enlarge() {
    if (document.fullscreenElement === frame.current) {
      await document.exitFullscreen();
      return;
    }
    if (expanded) { setExpanded(false); return; }
    try {
      if (!frame.current?.requestFullscreen) { setExpanded(true); return; }
      await frame.current.requestFullscreen();
    } catch {
      setExpanded(true);
    }
  }

  return <div ref={frame} className={expanded ? 'discuss-video discuss-video-expanded' : 'discuss-video'}
    onKeyDown={event => { if (event.key === 'Escape') setExpanded(false); }}>
    <div className="discuss-video-screen">
      <video ref={video} src={src} aria-label={label} controls playsInline preload="metadata"
        crossOrigin={cors ? 'anonymous' : undefined}
        onPlaying={() => void startCaptions()} onPause={stopRecognition}
        onSeeking={() => { stopRecognition(); setCaption(''); }}
        onSeeked={() => void startCaptions()} onEnded={() => { stopRecognition(); setCaption(''); }}
        onError={() => {
          if (cors) {
            const element = video.current;
            if (element) { element.removeAttribute('crossorigin'); element.load(); }
            setCors(false);
          } else onError?.();
        }}
        onLoadedMetadata={onLoaded}
        onRateChange={event => setSpeed(event.currentTarget.playbackRate)}
        onVolumeChange={event => setVolume(event.currentTarget.muted ? 0 : event.currentTarget.volume)} />
      {captions && caption && <div className="discuss-video-caption">{caption}</div>}
    </div>
    <div className="discuss-video-controls" aria-label="Điều khiển video">
      <button type="button" aria-pressed={captions} onClick={toggleCaptions}>Phụ đề tự động</button>
      <label>Tốc độ <select value={speed} onChange={event => {
        if (video.current) video.current.playbackRate = Number(event.target.value);
      }}>
        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(value => <option key={value} value={value}>{value}×</option>)}
      </select></label>
      <label>Âm lượng <input type="range" min="0" max="1" step="0.05" value={volume} onChange={event => {
        if (video.current) {
          video.current.volume = Number(event.target.value);
          video.current.muted = false;
        }
      }} /></label>
      <button type="button" onClick={() => void enlarge()}>{expanded || fullscreen ? 'Thu nhỏ' : 'Phóng to'}</button>
    </div>
    {message && <p className="discuss-video-status" role="status">{message}</p>}
  </div>;
}
