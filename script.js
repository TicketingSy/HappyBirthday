const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const menuToggle = $("#menuToggle");
const mainNav = $("#mainNav");
menuToggle?.addEventListener("click", () => {
  const open = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});
$$(".nav-link").forEach(link => link.addEventListener("click", () => {
  mainNav?.classList.remove("open");
  menuToggle?.setAttribute("aria-expanded", "false");
  $$(".nav-link").forEach(item => item.classList.toggle("active", item === link));
}));

// Smooth scroll-in reveal effects
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  }), { threshold: .12 });
  $$(".reveal").forEach(el => observer.observe(el));
} else $$(".reveal").forEach(el => el.classList.add("visible"));

// Background music: attempt autoplay on page open, then retry on first visitor interaction.
// Most browsers block audible autoplay until the visitor interacts with the page.
const music = $("#backgroundMusic");
const musicToggle = $("#musicToggle");
const musicLabel = $("#musicLabel");
let musicPlaying = false;

function updateMusicUI() {
  musicPlaying = !music.paused;
  if (musicLabel) musicLabel.textContent = musicPlaying ? "On" : "Music";
  if (musicToggle) musicToggle.setAttribute("aria-pressed", String(musicPlaying));
}
async function tryPlayMusic() {
  if (!music) return;
  try {
    await music.play();
    updateMusicUI();
    window.removeEventListener("pointerdown", firstInteractionPlay);
    window.removeEventListener("keydown", firstInteractionPlay);
  } catch (_) {
    if (musicLabel) musicLabel.textContent = "Tap for music";
  }
}
function firstInteractionPlay() { tryPlayMusic(); }
if (music) {
  music.volume = 0.55;
  tryPlayMusic();
  window.addEventListener("pointerdown", firstInteractionPlay, { once: true });
  window.addEventListener("keydown", firstInteractionPlay, { once: true });
  music.addEventListener("play", updateMusicUI);
  music.addEventListener("pause", updateMusicUI);
}
musicToggle?.addEventListener("click", async () => {
  if (!music) return;
  if (music.paused) await tryPlayMusic();
  else music.pause();
});

// Photo lightbox for Our Memories
const lightbox = $("#lightbox");
const lightboxImage = $("#lightboxImage");
function closeLightbox() {
  lightbox?.classList.remove("open");
  lightbox?.setAttribute("aria-hidden", "true");
  if (lightboxImage) lightboxImage.src = "";
}
$$(".memory-tile").forEach(item => item.addEventListener("click", () => {
  if (!lightbox || !lightboxImage) return;
  lightboxImage.src = item.dataset.full || item.querySelector("img").src;
  lightboxImage.alt = item.querySelector("img").alt;
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
}));
$("#lightboxClose")?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeLightbox(); });

// Falling petals and a few tiny romantic hearts on the existing canvas
const canvas = $("#heartCanvas");
const ctx = canvas?.getContext("2d");
let width = 0, height = 0, petals = [];
function resizeCanvas() {
  if (!canvas || !ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function newPetal(startAbove = true) {
  return {
    x: Math.random() * width,
    y: startAbove ? -20 - Math.random() * height : Math.random() * height,
    size: 5 + Math.random() * 9,
    speed: .45 + Math.random() * 1.05,
    drift: (Math.random() - .5) * .8,
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - .5) * .035,
    sway: Math.random() * 2 + .5,
    phase: Math.random() * 6.28,
    alpha: .32 + Math.random() * .48,
    color: Math.random() > .5 ? "#b83f59" : "#d9b779"
  };
}
function drawPetal(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.moveTo(0, -p.size);
  ctx.bezierCurveTo(p.size * 1.15, -p.size * .55, p.size * 1.05, p.size * .75, 0, p.size);
  ctx.bezierCurveTo(-p.size * 1.05, p.size * .75, -p.size * 1.15, -p.size * .55, 0, -p.size);
  ctx.fill();
  ctx.restore();
}
function animatePetals() {
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  petals.forEach(p => {
    p.y += p.speed;
    p.x += p.drift + Math.sin(p.phase += .018) * p.sway * .25;
    p.rotation += p.spin;
    drawPetal(p);
  });
  petals = petals.filter(p => p.y < height + 30);
  if (petals.length < 30 && Math.random() < .24) petals.push(newPetal());
  requestAnimationFrame(animatePetals);
}
if (canvas && ctx && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  resizeCanvas();
  for (let i = 0; i < 18; i++) petals.push(newPetal(false));
  window.addEventListener("resize", resizeCanvas);
  animatePetals();
}
