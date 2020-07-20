import { Drawer } from '../../drawing/drawer';
import { Command } from '../command';

export class BeforeDrawCommand extends Command {
  public constructor(public readonly drawer?: Drawer) {
    super();
  }
}
