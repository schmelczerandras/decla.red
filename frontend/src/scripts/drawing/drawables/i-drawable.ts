import { vec2 } from 'gl-matrix';

export interface IDrawable {
  serializeToUniforms(uniforms: any): void;
  distance(target: vec2): number;
  minimumDistance(target: vec2): number;
}