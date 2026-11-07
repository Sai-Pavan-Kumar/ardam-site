// Ardam's take on the SurfBoard stage light: Vedhika glows, Boltools cracks a bolt,
// EvenTime opens a ticket, and Ardam opens the question mark from "ayindha?".
// Drawn at half resolution because the light is soft by nature, which keeps phones cool.

const RENDER_SCALE = 0.5;
const MAX_PIXEL_RATIO = 1.5;

const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAGMENT = `
precision mediump float;
uniform vec2 uRes;
uniform float uReveal;
uniform float uTime;

float segment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}

float questionMark(vec2 p) {
  vec2 center = vec2(0.0, 0.14);
  float radius = 0.2;
  vec2 arcStart = center + radius * vec2(-1.0, 0.0);
  vec2 arcEnd = center + radius * vec2(0.5, -0.866);
  vec2 q = p - center;
  float angle = atan(q.y, q.x);
  float arc = angle > -1.05
    ? abs(length(q) - radius)
    : min(length(p - arcStart), length(p - arcEnd));
  float stem = segment(p, arcEnd, vec2(0.0, -0.14));
  float dot_ = length(p - vec2(0.0, -0.33));
  return min(min(arc, stem), dot_);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  float size = mix(1.0, 14.0, uReveal * uReveal * uReveal);
  float d = questionMark(uv / size) * size - 0.05 * size;
  d += 0.02 * sin(uv.x * 6.0 + uTime * 0.7) * sin(uv.y * 5.0 - uTime * 0.5);

  float appear = smoothstep(0.0, 0.14, uReveal);
  float glow = (1.0 - smoothstep(-0.02, 0.32, d)) * appear;
  float core = (1.0 - smoothstep(-0.12, 0.05, d)) * appear;
  vec3 paper = vec3(1.0);
  vec3 edge = vec3(0.98, 0.72, 0.79);
  vec3 deep = vec3(0.612, 0.063, 0.22);
  vec3 col = mix(paper, edge, glow);
  col = mix(col, deep, core);
  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "Shader failed");
  }
  return shader;
}

// Returns null without WebGL, so the scene still works on its colour fade alone.
export function createStageLight(canvas) {
  const gl = canvas.getContext("webgl", {
    antialias: false,
    alpha: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, "uRes");
  const uReveal = gl.getUniformLocation(program, "uReveal");
  const uTime = gl.getUniformLocation(program, "uTime");
  const started = performance.now();
  let reveal = 0;
  let frame = 0;

  const draw = (now) => {
    frame = 0;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uReveal, reveal);
    gl.uniform1f(uTime, (now - started) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // Once the field has taken over, this light is hidden and should cost nothing.
    if (reveal > 0.001 && reveal < 0.999) frame = requestAnimationFrame(draw);
  };
  const wake = () => {
    if (!frame) frame = requestAnimationFrame(draw);
  };

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO) * RENDER_SCALE;
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    gl.viewport(0, 0, canvas.width, canvas.height);
    wake();
  };
  window.addEventListener("resize", resize);
  resize();

  return {
    setReveal(value) {
      reveal = value;
      wake();
    },
  };
}
