import { rgb255 } from './helper/rgb255';
import { CharacterTeam } from './objects/types/character-base';

const declaColor = rgb255(64, 105, 165);
const neutralColor = rgb255(82, 165, 64);
const redColor = rgb255(209, 86, 82);
const q = 2.5;
const declaColorDim = rgb255(64 * q, 105 * q, 165 * q);
const redColorDim = rgb255(209 * q, 8 * q, 82 * q);
const declaPlanetColor = declaColorDim;
const redPlanetColor = redColorDim;

export const settings = {
  lightCutoffDistance: 600,
  maxVelocityX: 1000,
  maxVelocityY: 1000,
  radiusSteps: 500,
  spawnDespawnTime: 0.7,
  worldRadius: 10000,
  objectsOnCircleLength: 0.002,
  planetEdgeCount: 7,
  playerKillPoint: 10,
  takeControlTimeInSeconds: 4,
  loseControlTimeInSeconds: 24,
  planetPointGenerationInterval: 1.5,
  planetPointGenerationValue: 1,
  maxGravityDistance: 800,
  maxGravityQ: 5000,
  planetControlThreshold: 0.2,
  playerMaxHealth: 100,
  maxGravityStrength: 10000,
  maxAcceleration: 60000,
  playerMaxStrength: 80,
  endGameDeltaScaling: 4,
  playerDiedTimeout: 5,
  playerStrengthRegenerationPerSeconds: 80,
  projectileMaxStrength: 40,
  projectileSpeed: 2500,
  projectileMaxBounceCount: 2,
  projectileTimeout: 3,
  projectileFadeSpeed: 20,
  projectileCreationInterval: 0.1,
  playerColorIndexOffset: 3,
  backgroundGradient: [rgb255(90, 38, 43), rgb255(43, 39, 73)],
  declaColor,
  declaPlanetColor,
  npcNames: [
    'Adam',
    'Andrew',
    'Clarence',
    'Elliot',
    'Elmer',
    'Ernie',
    'Eugene',
    'Fergus',
    'Ferris',
    'Frank',
    'Frasier',
    'Fred',
    'George',
    'Graham',
    'Harvey',
    'Irwin',
    'Larry',
    'Lester',
    'Marvin',
    'Neil',
    'Niles',
    'Oliver',
    'Blaise',
    'Opie',
    'Ryan',
    'Toby',
    'Ulric',
    'Ulysses',
    'Uri',
    'Waldo',
    'Wally',
    'Walt',
    'Wesley',
    'Yanni',
    'Yogi',
    'Yuri',
    'Dean',
    'Dustin',
    'Ethan',
    'Harold',
    'Henry',
    'Irving',
    'Jason',
    'Jenssen',
    'Josh',
    'Martin',
    'Nick',
    'Norm',
    'Orin',
    'Pat',
    'Perry',
    'Ron',
    'Shawn',
    'Tim',
    'Will',
    'Wyatt',
  ],
  redColor,
  redPlanetColor,
  colorIndices: {
    [CharacterTeam.decla]: 0,
    [CharacterTeam.neutral]: 1,
    [CharacterTeam.red]: 2,
  },
  palette: [declaColor, neutralColor, redColor],
  paletteDim: [declaColorDim, neutralColor, redColorDim],
  targetPhysicsDeltaTimeInSeconds: 1 / 100,
  inViewAreaSize: 1920 * 1080 * 4,
};
