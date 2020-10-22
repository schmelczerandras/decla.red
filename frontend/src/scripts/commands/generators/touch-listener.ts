import { vec2 } from 'gl-matrix';
import {
  CommandGenerator,
  PrimaryActionCommand,
  SecondaryActionCommand,
  TernaryActionCommand,
  MoveActionCommand,
} from 'shared';
import { Game } from '../../game';
import { OptionsHandler } from '../../options-handler';

export class TouchListener extends CommandGenerator {
  private previousPosition = vec2.create();

  constructor(target: HTMLElement, private readonly game: Game) {
    super();

    target.addEventListener('touchstart', (event: TouchEvent) => {
      event.preventDefault();

      const touchCount = event.touches.length;
      const position = this.positionFromEvent(event);
      this.previousPosition = position;

      if (touchCount == 1) {
        this.sendCommandToSubcribers(new PrimaryActionCommand(position));
      } else if (touchCount == 2) {
        this.sendCommandToSubcribers(new SecondaryActionCommand(position));
      } else {
        this.sendCommandToSubcribers(new TernaryActionCommand(position));
      }
    });

    target.addEventListener('touchmove', (event: TouchEvent) => {
      event.preventDefault();

      const position = this.positionFromEvent(event, true);
      const movement = vec2.subtract(vec2.create(), position, this.previousPosition);

      if (vec2.squaredLength(movement) > 0) {
        vec2.normalize(movement, movement);
        this.sendCommandToSubcribers(
          new MoveActionCommand(movement, OptionsHandler.options.relativeMovementEnabled),
        );
      }

      this.previousPosition = position;
    });

    target.addEventListener('touchend', (event: TouchEvent) => {
      event.preventDefault();
      this.sendCommandToSubcribers(
        new MoveActionCommand(
          vec2.create(),
          OptionsHandler.options.relativeMovementEnabled,
        ),
      );
    });
  }

  private positionFromEvent(event: TouchEvent, invert = false): vec2 {
    const touches = Array.prototype.slice.call(event.touches);
    const center = touches.reduce(
      (center: vec2, touch: Touch) =>
        vec2.add(
          center,
          center,
          vec2.fromValues(
            touch.clientX * (invert ? -1 : 1),
            touch.clientY * (invert ? -1 : 1),
          ),
        ),
      vec2.create(),
    );

    return this.game.displayToWorldCoordinates(
      vec2.scale(center, center, 1 / event.touches.length),
    );
  }
}
