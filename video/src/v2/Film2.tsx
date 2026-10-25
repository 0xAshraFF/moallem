import { Audio } from '@remotion/media';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { interpolate, staticFile, useVideoConfig } from 'remotion';
import { Close, ColdOpen, FeatureScene, JourneyScene, Questions, Reveal, TicketScene } from './scenes';

export const T = 12;
export const FILM2_SECONDS = [4.6, 6.2, 3.4, 8.2, 11.2, 8.0, 10.0, 9.0, 7.6, 7.4, 6.4];

export const Film2 = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  const t = linearTiming({ durationInFrames: T });
  const S = FILM2_SECONDS;
  return (
    <>
      <Audio src={staticFile('audio/ambient.mp3')} volume={(fr) => interpolate(fr, [0, 30, durationInFrames - 45, durationInFrames], [0, 0.55, 0.55, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
      <TransitionSeries name="Moallem film v2">
        <TransitionSeries.Sequence name="Cold open" durationInFrames={f(S[0])}><ColdOpen /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />
        <TransitionSeries.Sequence name="Questions" durationInFrames={f(S[1])}><Questions /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />
        <TransitionSeries.Sequence name="Reveal" durationInFrames={f(S[2])}><Reveal /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: 'from-bottom' })} timing={t} />
        <TransitionSeries.Sequence name="Ticket" durationInFrames={f(S[3])}><TicketScene /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: 'from-left' })} timing={t} />
        <TransitionSeries.Sequence name="Journey" durationInFrames={f(S[4])}><JourneyScene /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={t} />
        <TransitionSeries.Sequence name="Nearby" durationInFrames={f(S[5])}>
          <FeatureScene photo="kaaba" video="toilet" trimBefore={f(1.5)} bn="টয়লেট, ওযু, পানি, গেট।" en="The nearest one, from real map data." sub="Every gate, toilet, wudu area and water point around both Harams, stored offline."
            pills={['টয়লেট', 'ওযুখানা', 'পানি', 'গেট', 'হোটেল']} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={t} />
        <TransitionSeries.Sequence name="Guide" durationInFrames={f(S[6])}>
          <FeatureScene photo="hotel-makkah" video="guide" bn="চলুন বললেই পথ দেখাবে।" en="Tap Go. It walks you there, like WhatsApp." sub="Turn by turn, out loud, in Bangla. Back to the hotel just as easily."
            trimBefore={f(2.4)} zoom={{ from: 1, to: 1.18, at: [3, 6], origin: '50% 20%' }} sfx={{ name: 'mouse-click', at: 0.6, volume: 0.5 }} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: 'from-right' })} timing={t} />
        <TransitionSeries.Sequence name="Tawaf" durationInFrames={f(S[7])}>
          <FeatureScene photo="tawaf-night" video="tawaf" trimBefore={f(1.2)} playbackRate={2} bn="তাওয়াফ নিজেই গুনবে।" en="Tawaf counts itself. No tapping." sub="Compass, GPS around the Kaaba and steps, together. The dua for each round plays in the ear."
            pills={['কম্পাস', 'GPS', 'পদক্ষেপ']} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: 'from-bottom' })} timing={t} />
        <TransitionSeries.Sequence name="Moallem" durationInFrames={f(S[8])}>
          <FeatureScene photo="mina" video="moallem" bn="মোয়াল্লেম একবার বলবেন, সবাই শুনবে।" en="The Moallem says it once. Every haji hears it."
            pills={['বাস ছাড়বে', 'উঠতে হবে', 'হেডফোনে প্রশ্ন']} sfx={{ name: 'ding', at: 1.2, volume: 0.3 }} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={t} />
        <TransitionSeries.Sequence name="Family" durationInFrames={f(S[9])}>
          <FeatureScene photo="arafat" video="family" bn="দেশে বসেও পাশে।" en="Family at home sees where Abba is." pills={['লাইভ ম্যাপ', 'আমি ভালো আছি', 'SOS ফ্রি']} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />
        <TransitionSeries.Sequence name="Close" durationInFrames={f(S[10])}><Close /></TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
};
