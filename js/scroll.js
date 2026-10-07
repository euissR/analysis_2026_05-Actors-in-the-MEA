// scroll.js: activates the step whose top has crossed a trigger line.
// A plain scroll listener (not IntersectionObserver): reliable when scrolling
// back up, and steps of any length trigger.

const mobile = matchMedia("(max-width: 768px)");

export function scrollEngine(steps, onStep) {
  let current = null;
  let ticking = false;

  function check() {
    ticking = false;
    // trigger line: middle of the screen on desktop, lower on mobile, so the active card rests below the map
    const line = window.innerHeight * (mobile.matches ? 0.75 : 0.75);
    let next = steps[0];
    for (const step of steps) {
      if (step.getBoundingClientRect().top <= line) next = step;
      else break;
    }
    if (next !== current) {
      current?.classList.remove("is-active");
      next.classList.add("is-active");
      current = next;
      onStep(next.dataset.step);
    }
  }

  const request = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(check);
    }
  };

  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  check();
}
