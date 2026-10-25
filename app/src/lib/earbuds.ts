// Earbud / Bluetooth headset trigger. A silent looping track makes the app the phone's active
// media session; the headset's play/pause button then reaches us via the Media Session API and
// starts listening. Answers are spoken back through the same earbuds. The APK build replaces
// this with a native headset-button receiver.

// 1 second of silence, 8 kHz mono 8-bit WAV.
function silentWav(): string {
  const n = 8000;
  const buf = new ArrayBuffer(44 + n);
  const v = new DataView(buf);
  const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true);
  v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
  let bin = '';
  new Uint8Array(buf).forEach((b) => (bin += String.fromCharCode(b)));
  return `data:audio/wav;base64,${btoa(bin)}`;
}

export const earbudsSupported = () => 'mediaSession' in navigator;

/** Call from a tap (browsers need a gesture to start audio). Returns a stop function. */
export async function enableEarbuds(onPress: () => void, labels: { title: string; artist: string }): Promise<() => void> {
  const audio = new Audio(silentWav());
  audio.loop = true;
  audio.volume = 0.01;
  await audio.play();
  const ms = navigator.mediaSession;
  ms.metadata = new MediaMetadata({ title: labels.title, artist: labels.artist, artwork: [{ src: '/icon.svg', sizes: '64x64', type: 'image/svg+xml' }] });
  const actions: MediaSessionAction[] = ['play', 'pause', 'nexttrack', 'previoustrack'];
  actions.forEach((a) => { try { ms.setActionHandler(a, () => { audio.play().catch(() => {}); onPress(); }); } catch { /* unsupported action */ } });
  ms.playbackState = 'playing';
  return () => {
    actions.forEach((a) => { try { ms.setActionHandler(a, null); } catch { /* ignore */ } });
    audio.pause();
    ms.playbackState = 'none';
  };
}
