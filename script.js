// ===== Utilities =====
const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// ===== Theme =====
const themeToggle = $("#themeToggle");
const root = document.documentElement;

function setTheme(theme){
  if(theme === "light") root.setAttribute("data-theme", "light");
  else root.removeAttribute("data-theme");
  localStorage.setItem("theme", theme);
}

(function initTheme(){
  const saved = localStorage.getItem("theme");
  if(saved) setTheme(saved);
  else {
    const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)")?.matches;
    setTheme(prefersLight ? "light" : "dark");
  }
})();

themeToggle?.addEventListener("click", () => {
  const isLight = root.getAttribute("data-theme") === "light";
  setTheme(isLight ? "dark" : "light");
});

// ===== Mobile nav =====
const navToggle = $("#navToggle");
const navList = $("#navList");

navToggle?.addEventListener("click", () => {
  const open = navList.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(open));
});

$$(".nav__link").forEach(a => a.addEventListener("click", () => navList.classList.remove("is-open")));

document.addEventListener("click", (e) => {
  if(!navList || !navToggle) return;
  const inside = navList.contains(e.target) || navToggle.contains(e.target);
  if(!inside) navList.classList.remove("is-open");
});

// ===== Scroll progress + active section =====
const progress = $("#progress");
const sections = ["about","skills","projects","experience","contact"]
  .map(id => document.getElementById(id))
  .filter(Boolean);
const navLinks = $$(".nav__link");

function onScroll(){
  const doc = document.documentElement;
  const scrollTop = doc.scrollTop || document.body.scrollTop;
  const scrollHeight = doc.scrollHeight - doc.clientHeight;
  const pct = scrollHeight ? (scrollTop / scrollHeight) * 100 : 0;
  if(progress) progress.style.width = `${clamp(pct, 0, 100)}%`;

  const y = window.scrollY + 120;
  let current = "";
  for(const s of sections){
    if(s.offsetTop <= y) current = s.id;
  }
  navLinks.forEach(a => {
    const hash = a.getAttribute("href")?.replace("#","");
    a.classList.toggle("is-active", hash === current);
  });
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ===== Reveal animations =====
const reveals = $$(".reveal");
const io = new IntersectionObserver((entries) => {
  entries.forEach(ent => {
    if(ent.isIntersecting){
      ent.target.classList.add("is-visible");
      io.unobserve(ent.target);
    }
  });
}, { threshold: 0.12 });
reveals.forEach(el => io.observe(el));

// ===== Typing effect =====
const typingEl = $("#typing");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function typeLoop(el){
  if(!el) return;
  const words = JSON.parse(el.dataset.words || "[]");
  if(!words.length) return;

  let i = 0;
  while(true){
    const w = words[i % words.length];
    for(let c = 0; c <= w.length; c++){
      el.textContent = w.slice(0, c);
      await sleep(38);
    }
    await sleep(900);
    for(let c = w.length; c >= 0; c--){
      el.textContent = w.slice(0, c);
      await sleep(24);
    }
    await sleep(260);
    i++;
  }
}
typeLoop(typingEl);

// ===== Projects filter =====
const filterBtns = $$(".fbtn");
const cards = $$(".projects__grid .card");

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");

    const f = btn.dataset.filter;
    cards.forEach(card => {
      const type = card.dataset.type;
      const show = (f === "all") || (type === f);
      card.style.display = show ? "block" : "none";
    });
  });
});

// ===== Modal =====
const modal = $("#modal");
const modalClose = $("#modalClose");
const modalTitle = $("#modalTitle");
const modalDesc = $("#modalDesc");
const modalTech = $("#modalTech");
const modalLink = $("#modalLink");
const modalPoints = $("#modalPoints");
const modalBadge = $("#modalBadge");

function openModal(data){
  if(!modal) return;
  modalTitle.textContent = data.title || "Project";
  modalDesc.textContent = data.desc || "";
  modalTech.textContent = data.tech || "—";
  modalLink.href = data.link || "#";
  modalBadge.textContent = data.badge || "Project";

  modalPoints.innerHTML = "";
  (data.points || []).forEach(p => {
    const li = document.createElement("li");
    li.textContent = p;
    modalPoints.appendChild(li);
  });

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal(){
  if(!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

cards.forEach(card => {
  card.addEventListener("click", () => {
    const type = card.dataset.type;
    openModal({
      badge: type === "wp" ? "WordPress" : type === "ui" ? "UI" : "Web",
      title: card.dataset.title,
      desc: card.dataset.desc,
      tech: card.dataset.tech,
      link: card.dataset.link,
      points: JSON.parse(card.dataset.points || "[]")
    });
  });
});

modalClose?.addEventListener("click", closeModal);
modal?.addEventListener("click", (e) => { if(e.target?.dataset?.close) closeModal(); });
document.addEventListener("keydown", (e) => { if(e.key === "Escape") closeModal(); });

// ===== Contact (Formspree AJAX - no Gmail app) =====
const form = $("#contactForm");
const formHint = $("#formHint");
const emailLink = $("#emailLink");
const copyEmailBtn = $("#copyEmail");
const sendBtn = $("#sendBtn");

const CONTACT_EMAIL = "msxaladzegiorgi87@gmail.com";

if(emailLink){
  emailLink.textContent = CONTACT_EMAIL;
  emailLink.href = `mailto:${CONTACT_EMAIL}`;
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  // If you didn't set Formspree URL yet:
  if(!form.action || form.action.includes("PUT_YOUR_FORM_ID_HERE")){
    if(formHint) formHint.textContent = "Set your Formspree link in index.html first.";
    return;
  }

  if(sendBtn) sendBtn.disabled = true;
  if(formHint) formHint.textContent = "Sending...";

  try {
    const res = await fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { "Accept": "application/json" }
    });

    if(res.ok){
      form.reset();
      if(formHint) formHint.textContent = "Sent ✅ I will reply soon.";
    } else {
      if(formHint) formHint.textContent = "Failed to send. Try again.";
    }
  } catch {
    if(formHint) formHint.textContent = "Network error. Check internet and retry.";
  } finally {
    if(sendBtn) sendBtn.disabled = false;
  }
});

// Copy email
copyEmailBtn?.addEventListener("click", async () => {
  try{
    await navigator.clipboard.writeText(CONTACT_EMAIL);
    if(formHint) formHint.textContent = "Email copied ✅";
  }catch{
    if(formHint) formHint.textContent = "Could not copy (browser blocked).";
  }
});

// ===== Download CV button =====
const CV_FILE = "resume.pdf";
$("#downloadBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  window.open(CV_FILE, "_blank", "noopener");
});

// ===== Footer year =====
$("#year").textContent = new Date().getFullYear();

// ===== Card tilt + shine (premium hover) =====
const tiltCards = document.querySelectorAll(".card");
tiltCards.forEach(card => {
  card.addEventListener("mousemove", (e) => {
    const r = card.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;

    card.style.setProperty("--mx", `${(x / r.width) * 100}%`);
    card.style.setProperty("--my", `${(y / r.height) * 100}%`);

    const rx = ((y / r.height) - 0.5) * -8;
    const ry = ((x / r.width) - 0.5) * 10;
    card.style.transform = `translateY(-4px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
    card.style.removeProperty("--mx");
    card.style.removeProperty("--my");
  });
});
