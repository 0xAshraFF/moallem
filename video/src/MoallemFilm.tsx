import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { useVideoConfig } from 'remotion';
import {
  ArafahScene, AskScene, Closing, ConsentScene, FamilyScene, KnowsToday, Opening, Pain, PassScene, Reveal, SosScene, TawafScene,
} from './scenes';

export const FADE = 14;

export const MoallemFilm = () => {
  const { fps } = useVideoConfig();
  const t = linearTiming({ durationInFrames: FADE });
  return (
    <TransitionSeries name="Moallem film">
      <TransitionSeries.Sequence name="Opening" durationInFrames={Math.round(4.5 * fps)}><Opening /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Pain: crowd" durationInFrames={Math.round(4 * fps)}>
        <Pain photo="kaaba" line="Two million people. 45°C. Every sign in Arabic." lineBn="লাখো মানুষ। ৪৫ ডিগ্রি। সব লেখা আরবিতে।" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Pain: counting" durationInFrames={Math.round(3.6 * fps)}>
        <Pain photo="kaaba-close" line="Was that the fourth round, or the fifth?" lineBn="চতুর্থ চক্কর, নাকি পঞ্চম?" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Pain: lost" durationInFrames={Math.round(3.8 * fps)}>
        <Pain photo="muzdalifah" line="Forty years of saving. He shouldn’t spend it lost." lineBn="চল্লিশ বছরের সঞ্চয়। পথ হারিয়ে নয়।" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Pain: family" durationInFrames={Math.round(4 * fps)}>
        <Pain photo="mina" line="At home: “Amma’s phone went quiet. Is she okay?”" lineBn="দেশে: আম্মার ফোন বন্ধ। উনি ঠিক আছেন তো?" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Reveal" durationInFrames={Math.round(3.6 * fps)}><Reveal /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Knows today" durationInFrames={Math.round(4.6 * fps)}><KnowsToday /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Tawaf" durationInFrames={Math.round(5.2 * fps)}><TawafScene /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Arafah" durationInFrames={Math.round(4.8 * fps)}><ArafahScene /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Ask" durationInFrames={Math.round(4.6 * fps)}><AskScene /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="SOS" durationInFrames={Math.round(4.2 * fps)}><SosScene /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Family" durationInFrames={Math.round(5.4 * fps)}><FamilyScene /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Consent" durationInFrames={Math.round(4.4 * fps)}><ConsentScene /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Season Pass" durationInFrames={Math.round(4.6 * fps)}><PassScene /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={t} />
      <TransitionSeries.Sequence name="Closing" durationInFrames={Math.round(5.2 * fps)}><Closing /></TransitionSeries.Sequence>
    </TransitionSeries>
  );
};

/** Scene seconds above, minus 14 fades. Kept in one place so Root stays in sync. */
export const FILM_SECONDS = [4.5, 4, 3.6, 3.8, 4, 3.6, 4.6, 5.2, 4.8, 4.6, 4.2, 5.4, 4.4, 4.6, 5.2];
