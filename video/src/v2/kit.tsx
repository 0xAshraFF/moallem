import { Audio, Video } from '@remotion/media';
import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { bangla, banglaDisplay, C, sans, serif } from '../theme';

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

/** Sound effect at the start of the enclosing sequence. */
export function Sfx({ name, volume = 0.5, from = 0 }: { name: string; volume?: number; from?: number }) {
  return (
    <Sequence from={from} layout="none" name={`sfx ${name}`}>
      <Audio src={staticFile(`audio/${name}.wav`)} volume={volume} />
    </Sequence>
  );
}

/** Words spring in one after another. */
export function Kinetic({ text, delay = 0, stagger = 4, style }: { text: string; delay?: number; stagger?: number; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(' ');
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: '0.28em', ...style }}>
      {words.map((w, i) => {
        const s = spring({ frame: frame - delay - i * stagger, fps, config: { damping: 16, stiffness: 160 } });
        return (
          <span key={i} style={{ display: 'inline-block', opacity: interpolate(s, [0, 1], [0, 1]), translate: `0 ${interpolate(s, [0, 1], [40, 0])}px`, filter: `blur(${interpolate(s, [0, 1], [8, 0])}px)` }}>{w}</span>
        );
      })}
    </div>
  );
}

/** A phone playing a real screen recording (780x1688). */
export function PhoneVideo({ src, height = 880, trimBefore = 0, playbackRate = 1, style, tilt = 0, children }: {
  src: string; height?: number; trimBefore?: number; playbackRate?: number; style?: CSSProperties; tilt?: number; children?: ReactNode;
}) {
  const width = Math.round(height * (780 / 1688));
  return (
    <div style={{ perspective: 1800, ...style }}>
      <div style={{
        width: width + 26, height: height + 26, padding: 13, borderRadius: 66, background: '#0A0C0B',
        boxShadow: '0 50px 100px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.08) inset', transform: `rotateY(${tilt}deg)`, position: 'relative',
      }}>
        <div style={{ width, height, borderRadius: 54, overflow: 'hidden', position: 'relative', background: C.ivory }}>
          <Video src={staticFile(`rec/${src}.mp4`)} muted trimBefore={trimBefore} playbackRate={playbackRate} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {children}
        </div>
      </div>
    </div>
  );
}

/** Blurred, darkened photo behind a scene. */
export function Bg({ photo, blur = 18, dim = 0.62, zoom = [1.15, 1.05] }: { photo: string; blur?: number; dim?: number; zoom?: [number, number] }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: C.night, overflow: 'hidden' }}>
      <Img src={staticFile(`photos/${photo}.webp`)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: `blur(${blur}px) saturate(1.1)`,
        scale: String(interpolate(frame, [0, durationInFrames], zoom, clamp)) }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 70% 50%, rgba(10,14,12,${dim - 0.25}) 0%, rgba(10,14,12,${dim + 0.15}) 70%)` }} />
    </AbsoluteFill>
  );
}

/** Left column headline used by feature scenes. */
export function Headline({ bn, en, sub, delay = 6 }: { bn: string; en: string; sub?: string; delay?: number }) {
  const frame = useCurrentFrame();
  return (
    <div style={{ width: 860 }}>
      <Kinetic text={bn} delay={delay} style={{ fontFamily: banglaDisplay, fontSize: 92, lineHeight: 1.18, color: C.ivory }} />
      <Kinetic text={en} delay={delay + 14} stagger={3} style={{ fontFamily: serif, fontSize: 54, lineHeight: 1.15, color: C.brass, marginTop: 18 }} />
      {sub && <p style={{ fontFamily: sans, fontSize: 32, color: 'rgba(244,245,242,0.75)', marginTop: 26, lineHeight: 1.4, opacity: interpolate(frame, [delay + 30, delay + 45], [0, 1], clamp) }}>{sub}</p>}
    </div>
  );
}

/** Small pill label that pops in. */
export function Pill({ children, delay, style }: { children: ReactNode; delay: number; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14 } });
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '14px 26px', borderRadius: 999, background: 'rgba(244,245,242,0.12)',
      border: '1.5px solid rgba(244,245,242,0.25)', color: C.ivory, fontFamily: bangla, fontWeight: 600, fontSize: 32, scale: String(s), opacity: s, ...style }}>{children}</div>
  );
}
