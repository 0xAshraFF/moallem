import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { bangla, banglaDisplay, C, sans, serif } from '../theme';
import { Bg, clamp, easeOut, Headline, Kinetic, PhoneVideo, Pill, Sfx } from './kit';

// ---------------------------------------------------------------- 1. Cold open
const FLASH = ['kaaba-close', 'mina', 'arafat', 'muzdalifah', 'tawaf-night', 'jamarat', 'madinah-dome'];

export function ColdOpen() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const per = 7;
  const idx = Math.min(FLASH.length - 1, Math.floor(frame / per));
  const settle = frame > FLASH.length * per;
  return (
    <AbsoluteFill style={{ backgroundColor: C.night }}>
      <Img src={staticFile(`photos/${settle ? 'tawaf-night' : FLASH[idx]}.webp`)} style={{
        width: '100%', height: '100%', objectFit: 'cover',
        scale: String(settle ? interpolate(frame, [FLASH.length * per, 5 * fps], [1.25, 1.08], clamp) : 1.3 - (frame % per) * 0.02),
        filter: settle ? 'brightness(0.55)' : 'brightness(0.8) contrast(1.1)',
      }} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <Kinetic text="৪০ জন হাজী। একজন মোয়াল্লেম।" delay={FLASH.length * per + 2} stagger={5}
          style={{ fontFamily: banglaDisplay, fontSize: 130, color: C.ivory, justifyContent: 'center', textShadow: '0 6px 30px rgba(0,0,0,0.5)' }} />
        <Kinetic text="40 pilgrims. One Moallem." delay={FLASH.length * per + 22} stagger={3}
          style={{ fontFamily: serif, fontSize: 60, color: C.brass, justifyContent: 'center', marginTop: 10 }} />
      </AbsoluteFill>
      {FLASH.map((_, i) => <Sfx key={i} name="switch" volume={0.18} from={i * per} />)}
      <Sfx name="whoosh" volume={0.5} from={FLASH.length * per} />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- 2. The questions
const QUESTIONS = [
  { q: 'চা কোথায় পাবো?', x: 180, y: 190 },
  { q: 'বাস কখন ছাড়বে?', x: 1150, y: 150 },
  { q: 'কয়টায় উঠতে হবে?', x: 660, y: 330 },
  { q: 'টয়লেট কোথায়?', x: 120, y: 520 },
  { q: 'মদিনায় কয়দিন থাকবো?', x: 1180, y: 470 },
  { q: 'কলা কোথায় পাবো?', x: 520, y: 640 },
  { q: 'কয় চক্কর হলো?', x: 1260, y: 760 },
  { q: 'হোটেলে ফিরবো কীভাবে?', x: 160, y: 820 },
  { q: 'কবে মিনা যাবো?', x: 700, y: 790 },
];

export function Questions() {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const gather = durationInFrames - Math.round(1.3 * fps);
  return (
    <AbsoluteFill style={{ backgroundColor: '#0C100E' }}>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 50%, rgba(30,91,63,0.35), transparent 60%)' }} />
      {QUESTIONS.map((b, i) => {
        const start = 4 + i * 6;
        const s = spring({ frame: frame - start, fps, config: { damping: 11, stiffness: 180 } });
        const g = interpolate(frame, [gather, gather + 18], [0, 1], { ...clamp, easing: easeOut });
        const x = interpolate(g, [0, 1], [b.x, 860]);
        const y = interpolate(g, [0, 1], [b.y, 500]);
        const wobble = Math.sin((frame + i * 9) / 9) * 6;
        return (
          <div key={b.q} style={{
            position: 'absolute', left: x, top: y + wobble, scale: String(s * (1 - g * 0.85)), opacity: Math.min(1, s) * (1 - g),
            padding: '22px 34px', borderRadius: '34px 34px 34px 8px', background: i % 3 === 0 ? C.ivory : i % 3 === 1 ? '#1E5B3F' : '#24302A',
            color: i % 3 === 0 ? C.ink : C.ivory, fontFamily: bangla, fontWeight: 700, fontSize: 48, boxShadow: '0 20px 50px rgba(0,0,0,0.35)', whiteSpace: 'nowrap',
          }}>{b.q}</div>
        );
      })}
      <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', paddingTop: 36 }}>
        <p style={{ margin: 0, fontFamily: serif, fontSize: 44, color: 'rgba(244,245,242,0.7)', opacity: interpolate(frame, [30, 50], [0, 1], clamp) * (1 - interpolate(frame, [gather, gather + 10], [0, 1], clamp)) }}>
          Every day. Hundreds of times.
        </p>
      </AbsoluteFill>
      {QUESTIONS.map((_, i) => <Sfx key={i} name="mouse-click" volume={0.35} from={4 + i * 6} />)}
      <Sfx name="whoosh" volume={0.6} from={gather} />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- 3. Reveal
export function Reveal() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 13 } });
  return (
    <AbsoluteFill style={{ backgroundColor: C.ivory, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ scale: String(s), rotate: `${interpolate(s, [0, 1], [-20, 0])}deg` }}>
        <svg width="180" height="180" viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" rx="16" fill={C.green} /><rect x="20" y="20" width="24" height="26" rx="2" fill={C.ink} />
          <rect x="20" y="25" width="24" height="3" fill={C.brass} /><path d="M14 46h36" stroke={C.ivory} strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      <Kinetic text="মোয়াল্লেম" delay={8} style={{ fontFamily: banglaDisplay, fontSize: 170, color: C.ink, justifyContent: 'center', marginTop: 10 }} />
      <Kinetic text="Your Moallem, in every pilgrim's pocket." delay={20} stagger={2} style={{ fontFamily: serif, fontSize: 56, color: C.green, justifyContent: 'center' }} />
      <Sfx name="ding" volume={0.35} from={2} />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- 4. Ticket -> whole trip
const TRIP = [
  { label: 'ঢাকা', sub: '২২ এপ্রিল', w: 0.06, color: '#4A5650' },
  { label: 'মদিনা', sub: '৮ দিন', w: 0.24, color: '#2E7D57' },
  { label: 'মক্কা', sub: 'উমরাহ', w: 0.36, color: '#1E5B3F' },
  { label: 'মিনা · আরাফা', sub: '১৪–১৫ মে', w: 0.16, color: '#B08A2E' },
  { label: 'মক্কা', sub: 'তাওয়াফ', w: 0.12, color: '#1E5B3F' },
  { label: 'দেশে', sub: '২৮ মে', w: 0.06, color: '#4A5650' },
];

export function TicketScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const draw = interpolate(frame, [Math.round(2.2 * fps), Math.round(4.6 * fps)], [0, 1], { ...clamp, easing: easeOut });
  let acc = 0;
  return (
    <AbsoluteFill>
      <Bg photo="haram-aerial" />
      <AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', padding: '0 120px 120px 150px', gap: 90 }}>
        <Headline bn="একটা ছবি। পুরো হজ সাজানো।" en="Snap the ticket once. Every day of Hajj, planned." sub="Madinah days, bus days, Mina, Arafah, flight home. From the fixed Hajj calendar." />
        <PhoneVideo src="ticket" height={820} tilt={-10} />
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: 150, right: 150, bottom: 70, display: 'flex', gap: 8 }}>
        {TRIP.map((s, i) => {
          const start = acc; acc += s.w;
          const fill = interpolate(draw, [start, start + s.w], [0, 1], clamp);
          return (
            <div key={i} style={{ flex: s.w, position: 'relative' }}>
              <div style={{ height: 16, borderRadius: 8, background: 'rgba(244,245,242,0.15)', overflow: 'hidden' }}>
                <div style={{ width: `${fill * 100}%`, height: '100%', background: s.color }} />
              </div>
              <p style={{ margin: '12px 0 0', fontFamily: bangla, fontWeight: 700, fontSize: 26, color: C.ivory, opacity: fill, whiteSpace: 'nowrap' }}>{s.label}</p>
              <p style={{ margin: 0, fontFamily: bangla, fontSize: 22, color: C.brass, opacity: fill, whiteSpace: 'nowrap' }}>{s.sub}</p>
            </div>
          );
        })}
      </div>
      <Sfx name="shutter-modern" volume={0.4} from={Math.round(1.5 * fps)} />
      <Sfx name="whoosh" volume={0.35} />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- 5. Location runs the app
const STOPS = [
  { at: 0, photo: 'dhaka', bn: 'ঢাকা', y: 0 },
  { at: 1.8, photo: 'madinah-dome', bn: 'মদিনা', y: 1 },
  { at: 3.7, photo: 'hotel-makkah', bn: 'হোটেল', y: 2 },
  { at: 5.6, photo: 'kaaba-close', bn: 'হারাম', y: 3 },
  { at: 7.5, photo: 'mina', bn: 'মিনা', y: 4 },
  { at: 9.4, photo: 'arafat', bn: 'আরাফা', y: 5 },
];

export function JourneyScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps; // matches the recording's timeline
  const cur = [...STOPS].reverse().find((s) => t >= s.at) ?? STOPS[0];
  return (
    <AbsoluteFill>
      {STOPS.map((s) => (
        <AbsoluteFill key={s.photo} style={{ opacity: interpolate(t, [s.at, s.at + 0.5], [0, 1], clamp) * (s === cur || t < s.at + 0.5 ? 1 : 0) }}>
          <Img src={staticFile(`photos/${s.photo}.webp`)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(6px) brightness(0.42)', scale: '1.1' }} />
        </AbsoluteFill>
      ))}
      <AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', padding: '0 140px', gap: 80 }}>
        <div style={{ width: 860 }}>
          <Kinetic text="যেখানে যান, অ্যাপ জানে।" delay={4} style={{ fontFamily: banglaDisplay, fontSize: 92, color: C.ivory, lineHeight: 1.15 }} />
          <Kinetic text="The wallpaper and the plan follow the pilgrim, everywhere." delay={18} stagger={2} style={{ fontFamily: serif, fontSize: 48, color: C.brass, marginTop: 14 }} />
          <div style={{ marginTop: 50, position: 'relative', paddingLeft: 60 }}>
            <div style={{ position: 'absolute', left: 21, top: 18, bottom: 18, width: 4, background: 'rgba(244,245,242,0.2)', borderRadius: 2 }} />
            {STOPS.map((s) => {
              const on = t >= s.at;
              return (
                <div key={s.bn} style={{ display: 'flex', alignItems: 'center', gap: 22, height: 62, opacity: on ? 1 : 0.35 }}>
                  <div style={{ position: 'absolute', left: on && s === cur ? 6 : 12, width: on && s === cur ? 34 : 22, height: on && s === cur ? 34 : 22, borderRadius: 99,
                    background: on ? (s === cur ? C.brass : C.greenLight) : 'rgba(244,245,242,0.3)', border: s === cur ? `5px solid ${C.ivory}` : 'none' }} />
                  <span style={{ fontFamily: bangla, fontWeight: 700, fontSize: s === cur ? 44 : 34, color: s === cur ? C.ivory : 'rgba(244,245,242,0.8)' }}>{s.bn}</span>
                </div>
              );
            })}
          </div>
        </div>
        <PhoneVideo src="journey" height={880} tilt={-8} />
      </AbsoluteFill>
      {STOPS.slice(1).map((s) => <Sfx key={s.bn} name="page-turn" volume={0.35} from={Math.round(s.at * fps)} />)}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- 6/7/8/9/10. Feature scenes
export function FeatureScene({ photo, video, bn, en, sub, pills = [], trimBefore = 0, playbackRate = 1, zoom, sfx }: {
  photo: string; video: string; bn: string; en: string; sub?: string; pills?: string[]; trimBefore?: number; playbackRate?: number;
  zoom?: { from: number; to: number; at: [number, number]; origin: string }; sfx?: { name: string; at: number; volume?: number };
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const z = zoom ? interpolate(frame, [zoom.at[0] * fps, zoom.at[1] * fps], [zoom.from, zoom.to], { ...clamp, easing: easeOut }) : 1;
  const enter = spring({ frame, fps, config: { damping: 18 } });
  return (
    <AbsoluteFill>
      <Bg photo={photo} />
      <AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', padding: '0 140px', gap: 80 }}>
        <div>
          <Headline bn={bn} en={en} sub={sub} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 34, maxWidth: 860 }}>
            {pills.map((p, i) => <Pill key={p} delay={36 + i * 6}>{p}</Pill>)}
          </div>
        </div>
        <div style={{ translate: `0 ${interpolate(enter, [0, 1], [120, 0])}px`, opacity: enter, scale: String(z), transformOrigin: zoom?.origin ?? 'center' }}>
          <PhoneVideo src={video} height={880} tilt={-8} trimBefore={trimBefore} playbackRate={playbackRate} />
        </div>
      </AbsoluteFill>
      <Sfx name="whoosh" volume={0.35} />
      {sfx && <Sfx name={sfx.name} volume={sfx.volume ?? 0.4} from={Math.round(sfx.at * fps)} />}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- 11. Close
export function Close() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Img src={staticFile('photos/madinah-dome.webp')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 70%', filter: 'brightness(0.5)',
        scale: String(interpolate(frame, [0, 180], [1.0, 1.08], clamp)) }} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 160px' }}>
        <Kinetic text="সদকায়ে জারিয়া" delay={6} stagger={6} style={{ fontFamily: banglaDisplay, fontSize: 140, color: C.brass, justifyContent: 'center' }} />
        <Kinetic text="Free for every pilgrim. SOS free for all. No ads." delay={22} stagger={3} style={{ fontFamily: serif, fontSize: 64, color: C.ivory, justifyContent: 'center', marginTop: 6 }} />
        <p style={{ fontFamily: sans, fontSize: 34, color: 'rgba(244,245,242,0.75)', marginTop: 34, opacity: interpolate(frame, [55, 75], [0, 1], clamp) }}>
          Families keep them close with a Hajj Season Pass.
        </p>
      </AbsoluteFill>
      <p style={{ position: 'absolute', bottom: 26, right: 40, margin: 0, fontFamily: sans, fontSize: 18, color: 'rgba(244,245,242,0.55)' }}>
        Photos: Wikimedia Commons (CC0 / CC BY / CC BY-SA) · Map data © OpenStreetMap contributors
      </p>
    </AbsoluteFill>
  );
}
