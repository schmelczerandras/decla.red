import { vec2, vec3 } from 'gl-matrix';
import { CircleLight, Renderer } from 'sdf-2d';
import { CommandExecutors, Id, LampBase, UpdateMessage } from 'shared';
import { RenderCommand } from '../commands/types/render';
import { ViewObject } from './view-object';

export class LampView extends LampBase implements ViewObject {
  private light: CircleLight;

  protected commandExecutors: CommandExecutors = {
    [RenderCommand.type]: (c: RenderCommand) => c.renderer.addDrawable(this.light),
  };

  constructor(id: Id, center: vec2, color: vec3, lightness: number) {
    super(id, center, color, lightness);
    this.light = new CircleLight(center, color, lightness);
  }

  public step(deltaTimeInMilliseconds: number): void {}

  public beforeDestroy(): void {}

  public draw(renderer: Renderer, overlay: HTMLElement): void {
    renderer.addDrawable(this.light);
  }
}
