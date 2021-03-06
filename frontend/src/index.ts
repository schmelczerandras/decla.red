import { glMatrix } from 'gl-matrix';
import {
  LampBase,
  overrideDeserialization,
  PlanetBase,
  CharacterBase,
  ProjectileBase,
} from 'shared';
import './main.scss';
import '../static/og-image.png';
import '../static/favicons/apple-touch-icon.png';
import '../static/favicons/favicon-16x16.png';
import '../static/favicons/favicon-32x32.png';
import '../static/favicons/favicon.ico';
import { LandingPageBackground } from './scripts/landing-page-background';
import { JoinFormHandler } from './scripts/join-form-handler';
import { handleFullScreen } from './scripts/helper/handle-full-screen';
import { Game } from './scripts/game';
import { handleInsights } from './scripts/handle-insights';
import { getInsightsFromRenderer } from './scripts/get-insights-from-renderer';
import { Renderer } from 'sdf-2d';
import ResizeObserver from 'resize-observer-polyfill';
import { OptionsHandler } from './scripts/options-handler';
import { hide } from './scripts/helper/hide';
import { show } from './scripts/helper/show';
import { SoundHandler, Sounds } from './scripts/sound-handler';
import { VibrationHandler } from './scripts/vibration-handler';
import { CharacterView } from './scripts/objects/types/character-view';
import { LampView } from './scripts/objects/types/lamp-view';
import { PlanetView } from './scripts/objects/types/planet-view';
import { ProjectileView } from './scripts/objects/types/projectile-view';

glMatrix.setMatrixArrayType(Array);

overrideDeserialization(CharacterBase, CharacterView);
overrideDeserialization(PlanetBase, PlanetView);
overrideDeserialization(LampBase, LampView);
overrideDeserialization(ProjectileBase, ProjectileView);

const landingUI = document.querySelector('#landing-ui') as HTMLElement;
const nameInput = document.querySelector('#name') as HTMLInputElement;
const joinGameForm = document.querySelector('#join-game-form') as HTMLFormElement;
const serverContainer = document.querySelector('#server-container') as HTMLElement;
const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const overlay = document.querySelector('#overlay') as HTMLElement;
const settings = document.querySelector('#settings') as HTMLElement;
const toggleSettingsButton = document.querySelector(
  '#toggle-settings-container',
) as HTMLElement;
const minimize = document.querySelector('#minimize') as HTMLElement;
const maximize = document.querySelector('#maximize') as HTMLElement;
const logoutButton = document.querySelector('#logout') as HTMLElement;
const enableSounds = document.querySelector('#enable-sounds') as HTMLInputElement;
const enableMusic = document.querySelector('#enable-music') as HTMLInputElement;
const enableVibration = document.querySelector('#enable-vibration') as HTMLInputElement;
const spinner = document.querySelector('#spinner-container') as HTMLElement;

let isInGame = false;

const startInsights = (getRenderer: () => Renderer | undefined) => {
  const { vendor, renderer } = getInsightsFromRenderer(getRenderer());
  handleInsights(
    {
      vendor,
      renderer,
      referrer: document.referrer,
      connection: (navigator as any)?.connection?.effectiveType,
      devicePixelRatio: devicePixelRatio,
    },
    () => {
      const {
        fps,
        renderScale,
        lightScale,
        canvasWidth,
        canvasHeight,
      } = getInsightsFromRenderer(getRenderer());

      return {
        isInGame,
        fps,
        renderScale,
        lightScale,
        canvasWidth,
        canvasHeight,
      };
    },
  );
};

const toggleSettings = () => {
  settings.className = settings.className === 'open' ? '' : 'open';
  SoundHandler.play(Sounds.click);
};

const applyServerContainerShadows = () => {
  const topShadow = 'inset 0 -8px 8px -8px rgba(0, 0, 0, 0.4)';
  const bottomShadow = 'inset 0 8px 8px -8px rgba(0, 0, 0, 0.4)';

  const { scrollHeight, clientHeight, scrollTop } = serverContainer;
  if (scrollHeight > clientHeight) {
    if (scrollTop <= 0) {
      serverContainer.style.boxShadow = topShadow;
    } else if (scrollTop + clientHeight >= scrollHeight) {
      serverContainer.style.boxShadow = bottomShadow;
    } else {
      serverContainer.style.boxShadow = topShadow + ',' + bottomShadow;
    }
  } else {
    serverContainer.style.boxShadow = '';
  }
};

const main = async () => {
  try {
    let game: Game;

    const storedUserName = localStorage?.getItem('userName');
    if (storedUserName) {
      nameInput.value = JSON.parse(storedUserName);
    }

    const firstClickListener = () => {
      SoundHandler.initialize(
        () => {
          enableMusic.checked = true;
          enableMusic.dispatchEvent(new Event('change'));
        },
        () => {
          enableMusic.checked = false;
          enableMusic.dispatchEvent(new Event('change'));
        },
      );
      document.removeEventListener('click', firstClickListener);
    };
    document.addEventListener('click', firstClickListener);

    if (!VibrationHandler.isVibrationEnabledHeuristics) {
      hide(document.querySelector("label[for='enable-vibration']") as HTMLElement, true);
    }

    handleFullScreen(minimize, maximize);
    toggleSettingsButton.addEventListener('click', toggleSettings);

    new ResizeObserver(applyServerContainerShadows).observe(serverContainer);
    serverContainer.addEventListener('scroll', applyServerContainerShadows);

    OptionsHandler.initialize({
      soundsEnabled: enableSounds,
      vibrationEnabled: enableVibration,
      musicEnabled: enableMusic,
    });

    logoutButton.addEventListener('click', () => {
      game.destroy();
      toggleSettings();
    });
    window.onpopstate = () => game.destroy();

    let backgroundRenderer: Renderer | undefined;
    startInsights(() => (isInGame ? game.renderer : backgroundRenderer));

    for (;;) {
      show(spinner);
      hide(logoutButton, true);
      show(landingUI, true, 'flex');

      const background = new LandingPageBackground(canvas);
      const joinHandler = new JoinFormHandler(joinGameForm, serverContainer);

      backgroundRenderer = await background.renderer;
      hide(spinner);

      const playerDecision = await joinHandler.getPlayerDecision();

      localStorage?.setItem('userName', JSON.stringify(playerDecision.name));

      if (!history.state) {
        history.pushState(true, '');
      }

      hide(landingUI, true);
      show(spinner);
      background.destroy();
      game = new Game(playerDecision, canvas, overlay);
      const gameOver = game.start();
      await game.started;
      isInGame = true;
      hide(spinner);
      show(logoutButton, true, 'block');
      await gameOver;
      isInGame = false;
    }
  } catch (e) {
    console.error(e);
    alert(e);
  }
};

main();
