import { loadFont as loadFraunces } from '@remotion/google-fonts/Fraunces';
import { loadFont as loadNotoSans } from '@remotion/google-fonts/NotoSans';
import { loadFont as loadBengali } from '@remotion/google-fonts/NotoSansBengali';
import { loadFont as loadTiro } from '@remotion/google-fonts/TiroBangla';
import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export const serif = loadFraunces('normal', { weights: ['400', '600'], subsets: ['latin'] }).fontFamily;
export const sans = loadNotoSans('normal', { weights: ['400', '600'], subsets: ['latin'] }).fontFamily;
export const bangla = loadBengali('normal', { weights: ['400', '600', '700'], subsets: ['bengali'] }).fontFamily;
export const banglaDisplay = loadTiro('normal', { weights: ['400'], subsets: ['bengali'] }).fontFamily;

// Same tokens as the app.
export const C = {
  night: '#0F1311',
  ivory: '#F4F5F2',
  ink: '#15201B',
  ink2: '#4A5650',
  green: '#1E5B3F',
  greenLight: '#7CC79A',
  brass: '#D4B062',
  brassDeep: '#7A5B12',
  sos: '#B3261E',
};

const ease = Easing.bezier(0.22, 1, 0.36, 1);

/** Fade + rise, starting `delay` frames into the scene. */
export function useRise(delay = 0, dur = 22) {
  const frame = useCurrentFrame();
  return {
    opacity: interpolate(frame, [delay, delay + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease }),
    translate: `0 ${interpolate(frame, [delay, delay + dur], [36, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease })}px`,
  } as CSSProperties;
}

export function Rise({ delay = 0, children, style }: { delay?: number; children: ReactNode; style?: CSSProperties }) {
  const s = useRise(delay);
  return <div style={{ ...s, ...style }}>{children}</div>;
}

/** Full-bleed photo with a slow push-in and a readable scrim. */
export function PhotoBg({ name, scrim = 0.62, from = 1.1, to = 1.0, position = 'center' }: {
  name: string; scrim?: number; from?: number; to?: number; position?: string;
}) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: C.night }}>
      <Img src={staticFile(`photos/${name}.webp`)} style={{
        width: '100%', height: '100%', objectFit: 'cover', objectPosition: position,
        scale: String(interpolate(frame, [0, durationInFrames], [from, to], { extrapolateRight: 'clamp' })),
      }} />
      <AbsoluteFill style={{ background: `linear-gradient(to top, rgba(10,14,12,${scrim + 0.2}) 0%, rgba(10,14,12,${scrim}) 45%, rgba(10,14,12,${scrim * 0.35}) 100%)` }} />
    </AbsoluteFill>
  );
}

/** Phone frame around a real app screenshot (780x1688). */
export function Phone({ src, height = 860, style, children }: { src?: string; height?: number; style?: CSSProperties; children?: ReactNode }) {
  const width = Math.round(height * (780 / 1688));
  return (
    <div style={{
      width: width + 24, height: height + 24, padding: 12, borderRadius: 64, background: '#0B0D0C',
      boxShadow: '0 40px 90px rgba(0,0,0,0.45), 0 0 0 2px rgba(255,255,255,0.06) inset', position: 'relative', ...style,
    }}>
      <div style={{ width, height, borderRadius: 52, overflow: 'hidden', position: 'relative', background: C.ivory }}>
        {src && <Img src={staticFile(`screens/${src}.png`)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        {children}
      </div>
    </div>
  );
}

/** Feature scene: words on the left, phone(s) on the right. */
export function FeatureLayout({ title, titleBn, line, children, dark = true }: {
  title: string; titleBn: string; line?: string; children: ReactNode; dark?: boolean;
}) {
  const fg = dark ? C.ivory : C.ink;
  const sub = dark ? 'rgba(244,245,242,0.72)' : C.ink2;
  return (
    <AbsoluteFill style={{ backgroundColor: dark ? C.night : C.ivory, flexDirection: 'row', alignItems: 'center', padding: '0 140px' }}>
      <div style={{ flex: 1, paddingRight: 80 }}>
        <Rise delay={4}><p style={{ fontFamily: banglaDisplay, fontSize: 64, color: dark ? C.brass : C.brassDeep, margin: 0, lineHeight: 1.3 }}>{titleBn}</p></Rise>
        <Rise delay={10}><h2 style={{ fontFamily: serif, fontWeight: 500, fontSize: 92, lineHeight: 1.04, color: fg, margin: '18px 0 0', letterSpacing: '-0.02em' }}>{title}</h2></Rise>
        {line && <Rise delay={18}><p style={{ fontFamily: sans, fontSize: 40, color: sub, margin: '28px 0 0', lineHeight: 1.35, maxWidth: 760 }}>{line}</p></Rise>}
      </div>
      <div style={{ display: 'flex', gap: 48, alignItems: 'center' }}>{children}</div>
    </AbsoluteFill>
  );
}
