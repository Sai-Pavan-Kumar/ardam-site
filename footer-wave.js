const CELL_PX = 14;
const FRAME_MS = 80;
// Faint on purpose: the eye should catch a passing wave first and only then notice the digits.
const WAVE_ALPHA = 0.16;
const WAVE_SPEED = 0.00035;
const DIGIT_FLIPS_PER_RADIAN = 0.5;
// Canvas room around the line box, because the 0.82 line height lets glyphs poke out of it.
const BLEED_EM = 0.12;

function waveAt(column, row, time) {
  return (Math.sin(column * 0.16 + row * 0.3 + time) + Math.sin(column * 0.05 - row * 0.12 - time * 0.6)) / 2;
}

function noiseAt(column, row, step) {
  const seed = Math.sin(column * 127.1 + row * 311.7 + step * 74.7) * 43758.5453;
  return seed - Math.floor(seed);
}

// Each cell flips on its own clock, so the digits never line up into a pattern.
function digitAt(column, row, time) {
  const step = Math.floor(time * DIGIT_FLIPS_PER_RADIAN + noiseAt(column, row, 0) * 10);
  return noiseAt(column, row, step + 1) > 0.5 ? "1" : "0";
}

function drawDigits(ctx, width, height, time) {
  ctx.font = `600 ${CELL_PX - 2}px "Overused Grotesk", sans-serif`;
  ctx.letterSpacing = "0px";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let row = 0; row * CELL_PX < height; row += 1) {
    for (let column = 0; column * CELL_PX < width; column += 1) {
      const wave = waveAt(column, row, time);
      ctx.fillStyle = `rgb(255 255 255 / ${WAVE_ALPHA * ((wave + 1) / 2) ** 2})`;
      ctx.fillText(digitAt(column, row, time), (column + 0.5) * CELL_PX, (row + 0.5) * CELL_PX);
    }
  }
}

// The digits only exist inside the letters, so the same word is stamped over them as a mask.
function maskToWord(ctx, mark, width, bleed) {
  const style = getComputedStyle(mark);
  const fontSize = parseFloat(style.fontSize);
  ctx.globalCompositeOperation = "destination-in";
  ctx.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
  ctx.letterSpacing = style.letterSpacing;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#000";
  const metrics = ctx.measureText(mark.textContent);
  const ascent = metrics.fontBoundingBoxAscent;
  const contentHeight = ascent + metrics.fontBoundingBoxDescent;
  const baseline = bleed + (mark.clientHeight - contentHeight) / 2 + ascent;
  ctx.fillText(mark.textContent, width / 2, baseline);
  ctx.globalCompositeOperation = "source-over";
}

function setUpFooterWave() {
  const mark = document.querySelector(".footer__mark");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!("letterSpacing" in ctx)) return;
  mark.append(canvas);
  let bleed = 0;
  let width = 0;
  let height = 0;

  function paint(now) {
    const scale = canvas.width / width;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, width, height);
    drawDigits(ctx, width, height, now * WAVE_SPEED);
    maskToWord(ctx, mark, width, bleed);
  }

  function resize() {
    bleed = parseFloat(getComputedStyle(mark).fontSize) * BLEED_EM;
    width = mark.clientWidth;
    height = mark.clientHeight + bleed * 2;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.top = `${-bleed}px`;
    canvas.style.height = `${height}px`;
    paint(performance.now());
  }

  let onScreen = false;
  let lastFrame = 0;
  function loop(now) {
    if (!onScreen) return;
    if (now - lastFrame >= FRAME_MS) {
      lastFrame = now;
      paint(now);
    }
    requestAnimationFrame(loop);
  }

  const stayStill = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  new ResizeObserver(resize).observe(mark);
  if (stayStill) return;
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) requestAnimationFrame(loop);
  }).observe(mark);
}

document.fonts.ready.then(setUpFooterWave);
