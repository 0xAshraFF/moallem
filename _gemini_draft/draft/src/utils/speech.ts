/**
 * Native TTS & Gemini TTS Audio Playback Utility
 * Designed for elderly Bangladeshi pilgrims with Web Speech API + Server Gemini TTS fallback + Web Audio tone feedback.
 */

let currentAudio: HTMLAudioElement | null = null;

export function stopAllSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
      // ignore
    }
    currentAudio = null;
  }
}

function playGentleChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // ignore audio context restrictions
  }
}

export async function speakText(
  text: string,
  lang: 'bn-BD' | 'ar-SA' | 'en-US' = 'bn-BD',
  onEnd?: () => void
): Promise<void> {
  stopAllSpeech();
  playGentleChime();

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      const voices = window.speechSynthesis.getVoices();
      const targetPrefix = lang.split('-')[0].toLowerCase();
      const matchedVoice = voices.find((v) =>
        v.lang.toLowerCase().startsWith(targetPrefix)
      );

      if (matchedVoice || voices.length > 0) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9; // Slightly slower for 60+ elderly clarity
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }
        utterance.onend = () => {
          onEnd?.();
        };
        utterance.onerror = () => {
          onEnd?.();
        };
        window.speechSynthesis.speak(utterance);
        return;
      }
    } catch {
      // Fallback to Gemini TTS endpoint
    }
  }

  // Fallback to Server-Side Gemini TTS (/api/tts)
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.audioBase64) {
        currentAudio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        currentAudio.onended = () => onEnd?.();
        currentAudio.onerror = () => onEnd?.();
        await currentAudio.play();
        return;
      }
    }
  } catch {
    // Offline fallback timer
  }

  setTimeout(() => {
    onEnd?.();
  }, 1800);
}
