import { PhysicalContainer } from './physics/containers/physical-container';
import ioserver from 'socket.io';
import {
  TransportEvents,
  deserialize,
  settings,
  ServerInformation,
  PlayerInformation,
  UpdateGameState,
  serialize,
  CharacterTeam,
  GameEnd,
  GameStart,
  Command,
} from 'shared';
import { createWorld } from './map/create-world';
import { DeltaTimeCalculator } from './helper/delta-time-calculator';
import { Options } from './options';
import { PlayerContainer } from './players/player-container';

const gameStateSubscribedRoom = 'gameStateSubscribedRoom';

export class GameServer {
  private objects!: PhysicalContainer;
  private players!: PlayerContainer;
  private deltaTimes!: Array<number>;
  private deltaTimeCalculator!: DeltaTimeCalculator;

  private declaPoints = 0;
  private redPoints = 0;

  private isInEndGame = false;
  private timeScaling = 1;

  private serverName: string;
  private playerLimit: number;

  private initialize() {
    const previousPlayers = this.players;
    this.objects = new PhysicalContainer();
    createWorld(this.objects, this.options.worldSize);
    this.objects.initialize();
    this.players = new PlayerContainer(
      this.objects,
      this.options.playerLimit,
      this.options.npcCount,
    );
    this.deltaTimeCalculator = new DeltaTimeCalculator();
    this.deltaTimes = [];
    this.declaPoints = 0;
    this.redPoints = 0;
    this.isInEndGame = false;
    this.timeScaling = 1;
    previousPlayers?.queueCommandForEachClient(new GameStart());
    previousPlayers?.sendQueuedCommands();
  }

  constructor(private readonly io: ioserver.Server, private options: Options) {
    this.serverName = options.name;
    this.playerLimit = options.playerLimit;

    this.initialize();

    io.on('connection', (socket: SocketIO.Socket) => {
      socket.on(TransportEvents.PlayerJoining, (playerInfo: PlayerInformation) => {
        try {
          const player = this.players.createPlayer(playerInfo, socket);
          socket.on(TransportEvents.PlayerToServer, (json: string) => {
            try {
              const commands: Array<Command> = deserialize(json);
              commands.forEach((c) => player.sendCommand(c));
            } catch (e) {
              console.log('Error while processing command', e);
            }
          });

          this.sendServerStateUpdate();

          socket.on('disconnect', () => {
            player.destroy();
            this.players.deletePlayer(player);
            this.sendServerStateUpdate();
          });
        } catch {
          socket.disconnect();
        }
      });

      socket.on(TransportEvents.SubscribeForServerInfoUpdates, () => {
        socket.join(gameStateSubscribedRoom);
      });
    });
  }

  private timeSinceLastServerStateUpdate = 0;
  public sendServerStateUpdate() {
    this.io
      .to(gameStateSubscribedRoom)
      .emit(TransportEvents.ServerInfoUpdate, [this.players.count, this.gameProgress]);
  }

  public start() {
    this.handlePhysics();
  }

  private updatePoints() {
    const { decla, red } = this.objects.getPointsGenerated();
    this.declaPoints += decla;
    this.redPoints += red;
    if (this.declaPoints >= this.options.scoreLimit) {
      this.endGame(CharacterTeam.decla);
    } else if (this.redPoints >= this.options.scoreLimit) {
      this.endGame(CharacterTeam.red);
    }
  }

  private endGame(winningTeam: CharacterTeam) {
    this.isInEndGame = true;
    const endTitleLength = 6000;
    this.players.queueCommandForEachClient(
      new GameEnd(winningTeam, endTitleLength / 1000, true),
    );
    setTimeout(() => this.destroy(), endTitleLength * 1.1);
  }

  private destroy() {
    this.initialize();
  }

  private timeSinceLastPointUpdate = 0;
  private handlePhysics() {
    let delta = this.deltaTimeCalculator.getNextDeltaTimeInSeconds();
    const framesBetweenDeltaTimeCalculation = 1000;

    if (this.deltaTimes.length > framesBetweenDeltaTimeCalculation) {
      this.deltaTimes.sort((a, b) => a - b);
      console.log(
        `Median physics time: ${this.deltaTimes[
          Math.floor(framesBetweenDeltaTimeCalculation / 2)
        ].toFixed(2)} ms`,
      );
      console.log(
        `Memory used: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
      );
      this.deltaTimes = [];
    }

    if ((this.timeSinceLastServerStateUpdate += delta) > 4) {
      this.timeSinceLastServerStateUpdate = 0;
      this.sendServerStateUpdate();
    }

    if ((this.timeSinceLastPointUpdate += delta) > 0.5) {
      this.timeSinceLastPointUpdate = 0;
      this.players.queueCommandForEachClient(
        new UpdateGameState(this.declaPoints, this.redPoints, this.options.scoreLimit),
      );
    }

    if (this.isInEndGame) {
      this.timeScaling *= Math.pow(settings.endGameDeltaScaling, delta);
      delta /= this.timeScaling;
    } else {
      this.updatePoints();
    }

    this.objects.stepObjects(delta);
    this.players.step(delta);
    this.objects.resetRemoteCalls();

    this.players.sendQueuedCommands();

    const physicsDelta = this.deltaTimeCalculator.getDeltaTimeInSeconds() * 1000;
    this.deltaTimes.push(physicsDelta);
    const sleepTime = settings.targetPhysicsDeltaTimeInMilliseconds - physicsDelta;

    if (sleepTime >= settings.minPhysicsSleepTime) {
      setTimeout(this.handlePhysics.bind(this), sleepTime);
    } else {
      setImmediate(this.handlePhysics.bind(this));
    }
  }

  private get gameProgress(): number {
    return (Math.max(this.declaPoints, this.redPoints) / this.options.scoreLimit) * 100;
  }

  public get serverInfo(): ServerInformation {
    return {
      serverName: this.serverName,
      playerCount: this.players.count,
      playerLimit: this.playerLimit,
      gameStatePercent: this.gameProgress,
    };
  }
}
