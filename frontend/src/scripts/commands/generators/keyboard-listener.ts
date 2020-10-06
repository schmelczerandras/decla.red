import { vec2 } from 'gl-matrix';
import { CommandGenerator, MoveActionCommand } from 'shared';

export class KeyboardListener extends CommandGenerator {
  private keysDown: Set<string> = new Set();

  constructor(target: Element, private moveScale: number) {
    super();

    target.addEventListener('keydown', (event: KeyboardEvent) => {
      const key = this.normalize(event.key);
      this.keysDown.add(key);
    });

    target.addEventListener('keyup', (event: KeyboardEvent) => {
      const key = this.normalize(event.key);
      this.keysDown.delete(key);
    });
  }

  public generateCommands() {
    const up = ~~(
      this.keysDown.has('w') ||
      this.keysDown.has('arrowup') ||
      this.keysDown.has(' ')
    );
    const down = ~~(this.keysDown.has('s') || this.keysDown.has('arrowdown'));
    const left = ~~(this.keysDown.has('a') || this.keysDown.has('arrowleft'));
    const right = ~~(this.keysDown.has('d') || this.keysDown.has('arrowright'));

    const movement = vec2.fromValues(right - left, up - down);
    if (vec2.squaredLength(movement) > 0) {
      vec2.normalize(movement, movement);
      vec2.scale(movement, movement, this.moveScale);
      this.sendCommandToSubcribers(new MoveActionCommand(movement));
    }
  }

  private normalize(key: string): string {
    return key.toLowerCase();
  }
}