import { initGrainient } from "./grainient.js";
import { createStageLight } from "./stage-light.js";

// One hue from dark to light, the same recipe that makes Vedhika's green feel expensive.
const RUBY_RAMP = ["#2A0410", "#5E0A26", "#9C1038", "#D42E5B", "#F58CA6"];
const NAV_SOLID_AT = 0.97;
const NAV_VISIBLE_AT = 0.5;

const smooth = (from, to, value) => {
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
};

const startField = (selector, options) =>
  initGrainient(document.querySelector(selector), {
    colors: RUBY_RAMP,
    angle: 55,
    // Faster than Vedhika on purpose: a one-hue ramp hides slow drift, so it read as a still image.
    flow: 1.5,
    silk: 0.35,
    grainAmount: 0.08,
    grainSize: 1.2,
    speed: 3,
    // Soft colour loses nothing below 2x, and phones keep the frame rate this motion now needs.
    dpr: Math.min(window.devicePixelRatio || 1, 1.5),
    intro: false,
    ...options,
  });

function playStage() {
  const stage = document.querySelector(".stage");
  const nav = document.querySelector(".nav");
  const light = createStageLight(document.querySelector(".stage__light"));
  document.documentElement.classList.add("stage-live");

  // The hidden lead and button still take up room, which would push the headline above centre.
  const measureLift = () => {
    const copy = document.querySelector(".stage__copy");
    const headline = document.querySelector(".stage__headline");
    stage.style.setProperty("--lift", `${(copy.offsetHeight - headline.offsetHeight) / 2}px`);
  };

  const update = () => {
    const box = stage.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -box.top / (box.height - window.innerHeight)));
    const reveal = smooth(0.04, 0.58, progress);
    light?.setReveal(reveal);
    stage.style.setProperty("--covered", smooth(0.44, 0.54, progress));
    stage.style.setProperty("--one-in", 1 - smooth(0.5, 0.58, progress));
    stage.style.setProperty("--field-in", smooth(0.46, 0.6, progress));
    stage.style.setProperty("--two-in", smooth(0.58, 0.66, progress));
    stage.style.setProperty("--after-in", smooth(0.63, 0.72, progress));
    stage.style.setProperty("--melt", smooth(0.82, 1, progress));
    nav.classList.toggle("is-on", progress > NAV_VISIBLE_AT);
    nav.classList.toggle("is-solid", progress > NAV_SOLID_AT);
  };

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", () => {
    measureLift();
    update();
  });
  document.fonts.ready.then(measureLift);
  measureLift();
  update();
}

const prefersStill = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!prefersStill) playStage();
startField("[data-field='hero']");
startField("[data-field='close']", { variation: 2, clickSwirl: false });
