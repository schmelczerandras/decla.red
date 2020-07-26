export const createShader = (
  gl: WebGL2RenderingContext,
  type: GLenum,
  source: string,
  substitutions: { [name: string]: string }
): WebGLShader => {
  source = source.replace(/{(.+)}/gm, (_, name: string): string => {
    const value = substitutions[name];
    if (Number.isInteger(value)) {
      return `${value}.0`;
    }
    return value;
  });

  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

  if (!success) {
    throw new Error(gl.getShaderInfoLog(shader));
  }

  return shader;
};
