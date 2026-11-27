let context: AudioContext | undefined;

export function listenForNotificationSoundPermission() {
  const unlock = () => {
    if (!window.AudioContext) return;
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume().catch(() => {});
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  return () => {
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
}

export function playNotificationSound() {
  if (!context || context.state !== 'running' || !document.hasFocus()) return;
  const audio = context;
  const start = audio.currentTime;
  for (const [index, frequency] of [660, 880].entries()) {
    const note = audio.createOscillator();
    const volume = audio.createGain();
    const at = start + index * 0.095;
    note.type = 'sine';
    note.frequency.value = frequency;
    volume.gain.setValueAtTime(0.001, at);
    volume.gain.exponentialRampToValueAtTime(0.12, at + 0.025);
    volume.gain.exponentialRampToValueAtTime(0.001, at + 0.16);
    note.connect(volume).connect(audio.destination);
    note.onended = () => { note.disconnect(); volume.disconnect(); };
    note.start(at);
    note.stop(at + 0.17);
  }
}
