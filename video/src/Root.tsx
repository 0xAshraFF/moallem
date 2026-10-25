import { Composition } from 'remotion';
import { FADE, FILM_SECONDS, MoallemFilm } from './MoallemFilm';
import { Film2, FILM2_SECONDS, T } from './v2/Film2';

const FPS = 30;
const duration = FILM_SECONDS.reduce((a, s) => a + Math.round(s * FPS), 0) - FADE * (FILM_SECONDS.length - 1);
const duration2 = FILM2_SECONDS.reduce((a, s) => a + Math.round(s * FPS), 0) - T * (FILM2_SECONDS.length - 1);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="MoallemFilm2" component={Film2} width={1920} height={1080} fps={FPS} durationInFrames={duration2} />
    <Composition id="MoallemFilm" component={MoallemFilm} width={1920} height={1080} fps={FPS} durationInFrames={duration} />
  </>
);
