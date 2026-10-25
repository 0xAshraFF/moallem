import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { bangla, banglaDisplay, C, FeatureLayout, Phone, PhotoBg, Rise, sans, serif } from './theme';

const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

function PhoneIn({ delay = 6, children, style }: { delay?: number; children: ReactNode; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  return (
    <div style={{
      opacity: interpolate(frame, [delay, delay + 20], [0, 1], clamp),
      translate: `0 ${interpolate(frame, [delay, delay + 30], [90, 0], { ...clamp, easing: ease })}px`,
      ...style,
    }}>{children}</div>
  );
}

/** Crossfade between screenshots inside one phone. `at` = frame each screen starts. */
function ScreenSequence({ screens, at, height = 860 }: { screens: string[]; at: number[]; height?: number }) {
  const frame = useCurrentFrame();
  return (
    <Phone height={height}>
      {screens.map((s, i) => (
        <Img key={s} src={staticFile(`screens/${s}.png`)} style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
          opacity: i === 0 ? 1 : interpolate(frame, [at[i], at[i] + 8], [0, 1], clamp),
        }} />
      ))}
    </Phone>
  );
}

/** A soft ring that draws attention to part of a phone screen. */
function Highlight({ x, y, w, h, from }: { x: number; y: number; w: number; h: number; from: number }) {
  const frame = useCurrentFrame();
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 28, border: `5px solid ${C.brass}`,
      opacity: interpolate(frame, [from, from + 12], [0, 1], clamp),
      scale: String(interpolate(frame, [from, from + 18], [1.12, 1], { ...clamp, easing: ease })),
      boxShadow: '0 0 0 9999px rgba(10,14,12,0.18)',
    }} />
  );
}

// ---------- 1. Opening ----------
export function Opening() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <PhotoBg name="tawaf-night" scrim={0.55} from={1.18} to={1.04} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <p style={{
          fontFamily: banglaDisplay, fontSize: 150, color: C.brass, margin: 0, lineHeight: 1.2,
          opacity: interpolate(frame, [10, 40], [0, 1], clamp), letterSpacing: '0.01em',
        }}>লাব্বাইক</p>
        <p style={{ fontFamily: serif, fontSize: 54, color: C.ivory, margin: '12px 0 0', opacity: interpolate(frame, [34, 60], [0, 0.9], clamp) }}>
          Here I am, O Allah. Here I am.
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ---------- 2. Pain points ----------
export function Pain({ photo, line, lineBn, position }: { photo: string; line: string; lineBn: string; position?: string }) {
  return (
    <AbsoluteFill>
      <PhotoBg name={photo} scrim={0.5} position={position} />
      <AbsoluteFill style={{ justifyContent: 'flex-end', padding: '0 160px 150px' }}>
        <Rise delay={6}><p style={{ fontFamily: bangla, fontWeight: 600, fontSize: 52, color: C.brass, margin: 0 }}>{lineBn}</p></Rise>
        <Rise delay={14}><h2 style={{ fontFamily: serif, fontWeight: 500, fontSize: 104, lineHeight: 1.04, color: C.ivory, margin: '16px 0 0', maxWidth: 1500, letterSpacing: '-0.02em' }}>{line}</h2></Rise>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ---------- 3. Reveal ----------
export function Reveal() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.ivory, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ opacity: interpolate(frame, [0, 18], [0, 1], clamp), scale: String(interpolate(frame, [0, 30], [0.86, 1], { ...clamp, easing: ease })) }}>
        <svg width="168" height="168" viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" rx="16" fill={C.green} />
          <rect x="20" y="20" width="24" height="26" rx="2" fill={C.ink} />
          <rect x="20" y="25" width="24" height="3" fill={C.brass} />
          <path d="M14 46h36" stroke={C.ivory} strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      <Rise delay={10}><p style={{ fontFamily: banglaDisplay, fontSize: 168, color: C.ink, margin: '24px 0 0', lineHeight: 1.1 }}>মোয়াল্লেম</p></Rise>
      <Rise delay={20}><p style={{ fontFamily: serif, fontSize: 60, color: C.green, margin: '8px 0 0' }}>A calm companion for every Haji.</p></Rise>
    </AbsoluteFill>
  );
}

// ---------- 4. Features ----------
export function KnowsToday() {
  const { fps } = useVideoConfig();
  return (
    <FeatureLayout titleBn="আজ কী করবেন, জানে" title="It knows what today is." line="Date, place and the one thing to do now. Day and night, at a glance.">
      <PhoneIn delay={8}><Phone src="today-arafah" height={800} /></PhoneIn>
      <PhoneIn delay={8 + Math.round(0.5 * fps)}><Phone src="today-night" height={800} /></PhoneIn>
    </FeatureLayout>
  );
}

export function TawafScene() {
  const { fps } = useVideoConfig();
  const step = Math.round(0.42 * fps);
  const start = Math.round(0.9 * fps);
  const screens = ['tawaf-0', 'tawaf-1', 'tawaf-2', 'tawaf-3', 'tawaf-4', 'tawaf-5', 'tawaf-6', 'tawaf-7'];
  return (
    <FeatureLayout titleBn="এক চাপে এক চক্কর" title="One tap. One round." line="No more counting on fingers in the crowd. The dua for each round plays in the ear.">
      <PhoneIn delay={6}><ScreenSequence screens={screens} at={screens.map((_, i) => start + i * step)} /></PhoneIn>
    </FeatureLayout>
  );
}

export function ArafahScene() {
  const { fps } = useVideoConfig();
  return (
    <FeatureLayout titleBn="আরাফায়, শুধু দোয়া" title="On Arafah, it lets you pray." line="A countdown to sunset, duas that play hands-free, and the rules that matter, kept in front of you.">
      <PhoneIn delay={6}>
        <Phone src="arafah" height={860}>
          <Highlight x={14} y={438} w={370} h={110} from={Math.round(1.6 * fps)} />
        </Phone>
      </PhoneIn>
    </FeatureLayout>
  );
}

export function AskScene() {
  const { fps } = useVideoConfig();
  return (
    <FeatureLayout titleBn="বাংলায় বলুন, আরবিতে দেখান" title="Speak Bangla. Show Arabic." line="Food, water, a barber, a wheelchair, the way back. One tap shows locals what you need.">
      <PhoneIn delay={6}><ScreenSequence screens={['ask', 'ask-card']} at={[0, Math.round(1.7 * fps)]} /></PhoneIn>
    </FeatureLayout>
  );
}

export function SosScene() {
  const { fps } = useVideoConfig();
  return (
    <FeatureLayout titleBn="হারিয়ে গেলে, একটি বোতাম" title="Lost? One button." line="Family gets the location at once. Free, always, even without a pass.">
      <PhoneIn delay={6}><ScreenSequence screens={['sos', 'sos-sent']} at={[0, Math.round(1.5 * fps)]} /></PhoneIn>
    </FeatureLayout>
  );
}

// ---------- 5. Family ----------
export function FamilyScene() {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.ivory, alignItems: 'center' }}>
      <div style={{ textAlign: 'center', paddingTop: 70 }}>
        <Rise delay={4}><p style={{ fontFamily: banglaDisplay, fontSize: 58, color: C.brassDeep, margin: 0 }}>দেশে বসেও পাশে থাকুন</p></Rise>
        <Rise delay={10}><h2 style={{ fontFamily: serif, fontWeight: 500, fontSize: 84, color: C.ink, margin: '6px 0 0', letterSpacing: '-0.02em' }}>And the family at home is never far.</h2></Rise>
      </div>
      <div style={{ display: 'flex', gap: 70, alignItems: 'flex-end', marginTop: 40 }}>
        <PhoneIn delay={14}>
          <Phone src="family" height={700} />
          <p style={{ fontFamily: sans, fontSize: 30, color: C.ink2, textAlign: 'center', margin: '18px 0 0' }}>Abba taps “I’m OK”</p>
        </PhoneIn>
        <svg width="120" height="40" viewBox="0 0 120 40" style={{ marginBottom: 360, opacity: interpolate(frame, [Math.round(1.2 * fps), Math.round(1.6 * fps)], [0, 1], clamp) }}>
          <path d="M4 20h100M90 6l16 14-16 14" fill="none" stroke={C.green} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <PhoneIn delay={Math.round(1.1 * fps)}>
          <Phone src="watch" height={700} />
          <p style={{ fontFamily: sans, fontSize: 30, color: C.ink2, textAlign: 'center', margin: '18px 0 0' }}>Rahim sees him in Dhaka</p>
        </PhoneIn>
      </div>
    </AbsoluteFill>
  );
}

export function ConsentScene() {
  return (
    <FeatureLayout dark={false} titleBn="অনুমতি হাজীর হাতে" title="Only who they approve. By name." line="A 6-digit code, a name to approve, a pause button. SOS keeps working, always.">
      <PhoneIn delay={6}><Phone src="join" height={800} /></PhoneIn>
      <PhoneIn delay={16}><Phone src="family" height={800} /></PhoneIn>
    </FeatureLayout>
  );
}

export function PassScene() {
  return (
    <FeatureLayout dark={false} titleBn="হজ সিজন পাস" title="One Season Pass. From ৳299." line="Live map, every Hajj step, battery and last seen, for the whole 45 days. Families pay, so pilgrims never do.">
      <PhoneIn delay={6}><Phone src="pass" height={860} /></PhoneIn>
    </FeatureLayout>
  );
}

// ---------- 6. Close ----------
export function Closing() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <PhotoBg name="madinah" scrim={0.45} from={1.0} to={1.08} position="center 70%" />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 160px' }}>
        <Rise delay={6}><p style={{ fontFamily: banglaDisplay, fontSize: 120, color: C.brass, margin: 0, lineHeight: 1.2 }}>সদকায়ে জারিয়া</p></Rise>
        <Rise delay={18}><h2 style={{ fontFamily: serif, fontWeight: 500, fontSize: 76, color: C.ivory, margin: '12px 0 0', lineHeight: 1.1 }}>Free forever for every pilgrim. No ads.</h2></Rise>
        <div style={{ marginTop: 70, opacity: interpolate(frame, [50, 75], [0, 1], clamp), display: 'flex', alignItems: 'center', gap: 22 }}>
          <svg width="76" height="76" viewBox="0 0 64 64" aria-hidden="true">
            <rect width="64" height="64" rx="16" fill={C.green} /><rect x="20" y="20" width="24" height="26" rx="2" fill={C.ink} />
            <rect x="20" y="25" width="24" height="3" fill={C.brass} /><path d="M14 46h36" stroke={C.ivory} strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: banglaDisplay, fontSize: 64, color: C.ivory }}>মোয়াল্লেম</span>
          <span style={{ fontFamily: sans, fontSize: 40, color: 'rgba(244,245,242,0.7)' }}>· Moallem</span>
        </div>
      </AbsoluteFill>
      <p style={{ position: 'absolute', bottom: 28, right: 40, margin: 0, fontFamily: sans, fontSize: 18, color: 'rgba(244,245,242,0.55)' }}>
        Photos: Wikimedia Commons (CC0 / CC BY / CC BY-SA). Credits in app.
      </p>
    </AbsoluteFill>
  );
}
