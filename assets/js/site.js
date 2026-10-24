const screenshotDialog = document.querySelector(".screenshot-dialog");
if (screenshotDialog) {
  const screenshots = [...document.querySelectorAll(".screenshot-link")];
  const image = screenshotDialog.querySelector("figure img");
  const counter = screenshotDialog.querySelector("figcaption");
  const previous = screenshotDialog.querySelector(".screenshot-previous");
  const next = screenshotDialog.querySelector(".screenshot-next");
  let current = 0;

  const show = (index) => {
    current = (index + screenshots.length) % screenshots.length;
    const link = screenshots[current];
    const thumbnail = link.querySelector("img");
    image.src = link.href;
    image.alt = thumbnail.alt;
    counter.textContent = `${link.dataset.galleryTitle} · ${current + 1} of ${screenshots.length}`;
  };

  screenshots.forEach((link, index) => link.addEventListener("click", (event) => {
    event.preventDefault();
    show(index);
    previous.disabled = next.disabled = screenshots.length < 2;
    screenshotDialog.showModal();
  }));
  previous.addEventListener("click", () => show(current - 1));
  next.addEventListener("click", () => show(current + 1));
  screenshotDialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      show(current + (event.key === "ArrowRight" ? 1 : -1));
    }
  });
  screenshotDialog.addEventListener("click", (event) => {
    if (event.target === screenshotDialog) screenshotDialog.close();
  });
}

if ("IntersectionObserver" in window) {
  const backToTop = document.querySelector(".back-to-top");
  const header = document.querySelector(".site-header");
  if (backToTop && header) {
    new IntersectionObserver(([entry]) => {
      backToTop.hidden = entry.isIntersecting;
    }).observe(header);
  }

  const diagram = document.querySelector(".fleet-diagram");
  if (diagram && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const setAnimationPaused = (value) => {
      diagram.querySelectorAll(".fleet-connectors").forEach((svg) => {
        if (value) svg.pauseAnimations();
        else svg.unpauseAnimations();
      });
    };
    const observer = new IntersectionObserver(([entry]) => {
      diagram.classList.toggle("is-visible", entry.isIntersecting);
      setAnimationPaused(!entry.isIntersecting);
    }, { threshold: 0.2 });
    setAnimationPaused(true);
    observer.observe(diagram);
  }
}
