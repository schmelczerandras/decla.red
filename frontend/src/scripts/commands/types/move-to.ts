import { vec2 } from 'gl-matrix';
import { Command } from 'shared';

export class MoveToCommand extends Command {
  public constructor(public readonly position: vec2) {
    super();
  }
}
