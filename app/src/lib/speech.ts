// Read text aloud with the phone's own voices. Waits for voices to load (Chrome returns [] at first)
// and refuses to read Bangla in a foreign accent: returns false so the UI can show text instead.
// Production replaces this with pre-recorded Bangla audio from a human Moallem.

let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null;

function voices(): Promise<SpeechSynthesisVoice[]> {
  if (!('speechSynthesis' in window)) return Promise.resolve([]);
  if (!voicesReady) {
    voicesReady = new Promise((resolve) => {
      const have = speechSynthesis.getVoices();
      if (have.length) return resolve(have);
      const done = () => resolve(speechSynthesis.getVoices());
      speechSynthesis.addEventListener('voiceschanged', done, { once: true });
      setTimeout(done, 1500);
    });
  }
  return voicesReady;
}

export async function speak(text: string, lang: 'bn' | 'ar' | 'en', onEnd?: () => void): Promise<boolean> {
  const list = await voices();
  const voice = list.find((v) => v.lang.toLowerCase().startsWith(lang));
  if (!voice) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = lang === 'ar' ? 0.8 : 0.9;
  if (onEnd) u.onend = onEnd;
  speechSynthesis.speak(u);
  return true;
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
