import { Command } from '../command';

export class KeyUpCommand extends Command {
  public constructor(public readonly key?: string) {
    super();
  }

  public get type(): string {
    return 'KeyUpCommand';
  }
}
