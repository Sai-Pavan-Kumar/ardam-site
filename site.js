const EDGE_GAP_PX = 8;

function setUpSwitch() {
  const buttons = document.querySelectorAll(".sample__switch button");
  const versions = document.querySelectorAll(".sample__text");

  function show(language) {
    versions.forEach((version) => {
      version.hidden = version.dataset.lang !== language;
    });
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.show === language);
    });
    hideTip();
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => show(button.dataset.show));
  });
  // Readers see the English first, so the switch to Tenglish is the moment that sells it.
  show("en");
}

const tip = document.querySelector(".tip");

function hideTip() {
  tip.hidden = true;
}

function showTip(term) {
  tip.textContent = term.dataset.meaning;
  tip.hidden = false;
  const anchor = term.getBoundingClientRect();
  const box = tip.getBoundingClientRect();
  const maxLeft = window.innerWidth - box.width - EDGE_GAP_PX;
  tip.style.left = `${Math.max(EDGE_GAP_PX, Math.min(anchor.left, maxLeft))}px`;
  const fitsBelow = anchor.bottom + box.height + EDGE_GAP_PX < window.innerHeight;
  const top = fitsBelow
    ? anchor.bottom + EDGE_GAP_PX
    : anchor.top - box.height - EDGE_GAP_PX;
  tip.style.top = `${top}px`;
}

function setUpTerms() {
  document.querySelectorAll(".term").forEach((term) => {
    term.setAttribute("aria-label", `${term.textContent.trim()}: ${term.dataset.meaning}`);
    term.addEventListener("pointerenter", () => showTip(term));
    term.addEventListener("pointerleave", hideTip);
    term.addEventListener("focus", () => showTip(term));
    term.addEventListener("blur", hideTip);
    term.addEventListener("click", () => showTip(term));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hideTip();
  });
  window.addEventListener("scroll", hideTip, { passive: true });
}

function setUpReveals() {
  document.documentElement.classList.add("js");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  document.querySelectorAll(".reveal").forEach((element, index) => {
    element.style.transitionDelay = `${(index % 3) * 70}ms`;
    observer.observe(element);
  });
}

setUpSwitch();
setUpTerms();
setUpReveals();
