import { vec2 } from 'gl-matrix';
import { Circle, GameObject, serializesTo, settings, UpdateObjectMessage } from 'shared';
import { PhysicalBase } from '../physics/physicals/physical-base';
import { BoundingBox } from '../physics/bounding-boxes/bounding-box';
import { BoundingBoxBase } from '../physics/bounding-boxes/bounding-box-base';
import { moveCircle } from '../physics/functions/move-circle';
import { PhysicalContainer } from '../physics/containers/physical-container';
import { DynamicPhysical } from '../physics/physicals/dynamic-physical';
import {
  ReactsToCollision,
  reactsToCollision,
} from '../physics/physicals/reacts-to-collision';

@serializesTo(Circle)
export class CirclePhysical implements Circle, DynamicPhysical, ReactsToCollision {
  readonly canCollide = true;
  readonly canMove = true;

  public velocity = vec2.create();
  private _boundingBox: BoundingBox;

  constructor(
    private _center: vec2,
    private _radius: number,
    public owner: GameObject,
    private readonly container: PhysicalContainer,
    private restitution = 0,
  ) {
    this._boundingBox = new BoundingBox();
    this.recalculateBoundingBox();
  }

  public calculateUpdates(): UpdateObjectMessage | null {
    return null;
  }

  public get boundingBox(): BoundingBoxBase {
    return this._boundingBox;
  }

  public get center(): vec2 {
    return this._center;
  }

  public set center(value: vec2) {
    this._center = value;
    this.recalculateBoundingBox();
  }

  public onCollision(other: GameObject) {
    if (reactsToCollision(this.owner)) {
      this.owner.onCollision(other);
    }
  }

  public get gameObject(): GameObject {
    return this.owner;
  }

  public get radius(): number {
    return this._radius;
  }

  public set radius(value: number) {
    this._radius = value;
    this.recalculateBoundingBox();
  }

  public distance(target: vec2): number {
    return vec2.distance(target, this.center) - this.radius;
  }

  public distanceBetween(target: Circle): number {
    return vec2.distance(target.center, this.center) - this.radius - target.radius;
  }

  public areIntersecting(other: PhysicalBase): boolean {
    return other.distance(this.center) < this.radius;
  }

  public isInside(other: PhysicalBase): boolean {
    return other.distance(this.center) < -this.radius;
  }

  private recalculateBoundingBox() {
    this._boundingBox.xMin = this.center.x - this._radius;
    this._boundingBox.xMax = this.center.x + this._radius;
    this._boundingBox.yMin = this.center.y - this._radius;
    this._boundingBox.yMax = this.center.y + this._radius;
  }

  public applyForce(force: vec2, timeInSeconds: number) {
    vec2.add(
      this.velocity,
      this.velocity,
      vec2.scale(vec2.create(), force, timeInSeconds),
    );
  }

  public step(_: number) {}

  public step2(deltaTimeInSeconds: number): GameObject | undefined {
    vec2.scale(
      this.velocity,
      this.velocity,
      Math.pow(settings.velocityAttenuation, deltaTimeInSeconds),
    );

    const delta = vec2.scale(vec2.create(), this.velocity, deltaTimeInSeconds);

    const stepCount = Math.ceil(vec2.length(delta) / settings.physicsMaxStep);
    vec2.scale(delta, delta, 1 / stepCount);

    let lastHit: GameObject | undefined;

    for (let i = 0; i < stepCount; i++) {
      const distance = vec2.scale(
        vec2.create(),
        this.velocity,
        deltaTimeInSeconds / stepCount,
      );
      this.radius += vec2.length(distance);
      const intersecting = this.container.findIntersecting(this.boundingBox);
      this.radius -= vec2.length(distance);

      const { normal, hitSurface, hitObject } = moveCircle(
        this,
        vec2.clone(distance),
        intersecting,
      );

      if (hitSurface) {
        vec2.subtract(
          this.velocity,
          this.velocity,
          vec2.scale(
            normal!,
            normal!,
            (1 + this.restitution) * vec2.dot(normal!, this.velocity),
          ),
        );

        lastHit = hitObject;
      }
    }

    return lastHit;
  }

  public tryMove(delta: vec2): GameObject | undefined {
    const stepCount = Math.ceil(vec2.length(delta) / settings.physicsMaxStep);
    vec2.scale(delta, delta, 1 / stepCount);

    let lastHit: GameObject | undefined;

    for (let i = 0; i < stepCount; i++) {
      this.radius += vec2.length(delta);
      const intersecting = this.container.findIntersecting(this.boundingBox);
      this.radius -= vec2.length(delta);

      const { tangent, hitSurface, hitObject } = moveCircle(
        this,
        vec2.clone(delta),
        intersecting,
      );

      if (hitSurface) {
        delta = vec2.scale(delta, tangent!, vec2.length(delta));
        lastHit = hitObject;
      }
    }

    return lastHit;
  }

  public toArray(): Array<any> {
    const { center, radius } = this;
    return [center, radius];
  }
}
