import { vec2 } from 'gl-matrix';
import { BeforeDrawCommand } from '../../commands/types/before-draw';
import { CursorMoveCommand } from '../../commands/types/cursor-move-command';
import { MoveToCommand } from '../../commands/types/move-to';
import { ZoomCommand } from '../../commands/types/zoom';
import { GameObject } from '../game-object';
import { CircleLight } from './circle-light';

export class Camera extends GameObject {
  private inViewArea = 1920 * 1080 * 5;
  private cursorPosition = vec2.create();

  constructor(private light: CircleLight) {
    super();

    this.addCommandExecutor(BeforeDrawCommand, this.draw.bind(this));
    this.addCommandExecutor(MoveToCommand, this.moveTo.bind(this));
    this.addCommandExecutor(
      CursorMoveCommand,
      this.setCursorPosition.bind(this)
    );
    this.addCommandExecutor(ZoomCommand, this.zoom.bind(this));
  }

  private draw(c: BeforeDrawCommand) {
    c.drawer.setCameraPosition(this.position);
    c.drawer.setCursorPosition(this.cursorPosition);
    this._boundingBoxSize = c.drawer.setInViewArea(this.inViewArea);
  }

  private moveTo(c: MoveToCommand) {
    this._position = c.position;
    this.light.sendCommand(
      new MoveToCommand(
        vec2.add(
          vec2.create(),
          c.position,
          vec2.scale(vec2.create(), this.boundingBoxSize, 0.5)
        )
      )
    );
  }

  private zoom(c: ZoomCommand) {
    this.inViewArea *= c.factor;
  }

  private setCursorPosition(c: CursorMoveCommand) {
    this.cursorPosition = c.position;
  }
}
