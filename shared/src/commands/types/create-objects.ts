import { Command } from '../command';

export class CreateObjectsCommand extends Command {
  public constructor(public readonly serializedObjects: string) {
    super();
  }

  public toJSON(): any {
    return [this.type, this.serializedObjects];
  }
}
