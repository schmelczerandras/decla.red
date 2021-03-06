import { vec2 } from 'gl-matrix';

import {
  clamp,
  clamp01,
  id,
  serializesTo,
  settings,
  PlanetBase,
  CharacterTeam,
  PropertyUpdatesForObject,
  UpdatePropertyCommand,
  CommandExecutors,
  CommandReceiver,
} from 'shared';
import { GeneratePointsCommand } from '../commands/generate-points';
import { StepCommand } from '../commands/step';

import { ImmutableBoundingBox } from '../physics/bounding-boxes/immutable-bounding-box';
import { StaticPhysical } from '../physics/physicals/static-physical';

@serializesTo(PlanetBase)
export class PlanetPhysical extends PlanetBase implements StaticPhysical {
  public readonly canCollide = true;
  public readonly canMove = false;

  private _boundingBox?: ImmutableBoundingBox;

  protected commandExecutors: CommandExecutors = {
    [StepCommand.type]: this.step.bind(this),
  };

  constructor(vertices: Array<vec2>) {
    super(id(), vertices);
  }

  public distance(target: vec2): number {
    const startEnd = this.vertices[0];
    let vb = startEnd;

    let d = vec2.squaredDistance(target, vb);
    let sign = 1;

    for (let i = 1; i <= this.vertices.length; i++) {
      const va = vb;
      vb = i === this.vertices.length ? startEnd : this.vertices[i];
      const targetFromDelta = vec2.subtract(vec2.create(), target, va);
      const toFromDelta = vec2.subtract(vec2.create(), vb, va);
      const h = clamp01(
        vec2.dot(targetFromDelta, toFromDelta) / vec2.squaredLength(toFromDelta),
      );

      const ds = vec2.fromValues(
        vec2.dist(targetFromDelta, vec2.scale(vec2.create(), toFromDelta, h)),
        toFromDelta.x * targetFromDelta.y - toFromDelta.y * targetFromDelta.x,
      );

      if (
        (target.y >= va.y && target.y < vb.y && ds.y > 0) ||
        (target.y < va.y && target.y >= vb.y && ds.y <= 0)
      ) {
        sign *= -1;
      }

      d = Math.min(d, ds.x);
    }

    return sign * d;
  }

  public get team(): CharacterTeam {
    return Math.abs(this.ownership - 0.5) < 0.1
      ? CharacterTeam.neutral
      : this.ownership < 0.5
      ? CharacterTeam.decla
      : CharacterTeam.red;
  }

  private timeSinceLastPointGeneration = 0;
  private getPoints(game: CommandReceiver) {
    if (this.timeSinceLastPointGeneration > settings.planetPointGenerationInterval) {
      this.timeSinceLastPointGeneration = 0;
      if (this.team !== CharacterTeam.neutral) {
        this.remoteCall('generatedPoints', settings.planetPointGenerationValue);
      }

      game.handleCommand(
        new GeneratePointsCommand(
          this.team === CharacterTeam.decla ? settings.planetPointGenerationValue : 0,
          this.team === CharacterTeam.red ? settings.planetPointGenerationValue : 0,
        ),
      );
    }
  }

  private step({ deltaTimeInSeconds, game }: StepCommand) {
    this.timeSinceLastPointGeneration += deltaTimeInSeconds;
    // In reverse order, so that teams can achieve a 100% control.
    this.getPoints(game);
    this.takeControl(CharacterTeam.neutral, deltaTimeInSeconds);
  }

  public getPropertyUpdates(): PropertyUpdatesForObject {
    return new PropertyUpdatesForObject(this.id, [
      new UpdatePropertyCommand('ownership', this.ownership, 0),
    ]);
  }

  public takeControl(team: CharacterTeam, deltaTime: number) {
    if (team === CharacterTeam.decla) {
      this.ownership -= (0.5 / settings.takeControlTimeInSeconds) * deltaTime;
    } else if (team === CharacterTeam.red) {
      this.ownership += (0.5 / settings.takeControlTimeInSeconds) * deltaTime;
    } else {
      const previous = this.ownership;
      this.ownership +=
        -Math.sign(this.ownership - 0.5) *
        (0.5 / settings.loseControlTimeInSeconds) *
        deltaTime;
      if (
        (previous < 0.5 && this.ownership > 0.5) ||
        (previous > 0.5 && this.ownership < 0.5)
      ) {
        this.ownership = 0.5;
      }
    }

    this.ownership = clamp01(this.ownership);
  }

  public get boundingBox(): ImmutableBoundingBox {
    if (!this._boundingBox) {
      const { xMin, xMax, yMin, yMax } = this.vertices.reduce(
        (extremities, vertex) => ({
          xMin: Math.min(extremities.xMin, vertex.x),
          xMax: Math.max(extremities.xMax, vertex.x),
          yMin: Math.min(extremities.yMin, vertex.y),
          yMax: Math.max(extremities.yMax, vertex.y),
        }),
        {
          xMin: Infinity,
          xMax: -Infinity,
          yMin: Infinity,
          yMax: -Infinity,
        },
      );

      this._boundingBox = new ImmutableBoundingBox(xMin, xMax, yMin, yMax);
    }

    return this._boundingBox;
  }

  public getForce(position: vec2): vec2 {
    const diff = vec2.subtract(vec2.create(), this.center, position);
    const dist = Math.max(0, vec2.length(diff) - this.radius);
    vec2.normalize(diff, diff);
    const scale = clamp(
      settings.maxGravityQ * ((settings.maxGravityDistance / dist) ** 1.5 - 1),
      0,
      settings.maxGravityStrength,
    );
    return vec2.scale(diff, diff, scale);
  }

  public get gameObject(): this {
    return this;
  }
}
