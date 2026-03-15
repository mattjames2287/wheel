const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbztoxKIHtLnHcZmNiL7HyMU6r8k4ze5caW4q2tc7vHk_-XvHvyYc-QtFKV2v6xCCpyK/exec";

const canvas = document.getElementById("wheel");
const ctx = canvas ? canvas.getContext("2d") : null;

const spinBtn = document.getElementById("spin");
const dateNightBtn = document.getElementById("dateNight");
const reloadBtn = document.getElementById("reloadData");
const bucketSelect = document.getElementById("bucket");
const resultBox = document.getElementById("result");
const winnerOverlay = document.getElementById("winnerOverlay");
const winnerText = document.getElementById("winnerText");
const winnerSub = document.getElementById("winnerSub");
const spinAgainBtn = document.getElementById("spinAgain");
const closeWinnerBtn = document.getElementById("closeWinner");
const musicToggleBtn = document.getElementById("musicToggle");
const confettiLayer = document.getElementById("confettiLayer");
const coinLayer = document.getElementById("coinLayer");
const activityCountEl = document.getElementById("activityCount");
const lastUpdatedEl = document.getElementById("lastUpdated");

let activities = [];
let currentRotation = 0;
let isSpinning = false;
let audioStarted = false;
let musicEnabled = true;
let audioCtx = null;
let musicNodes = [];
let refreshTimer = null;

function safeText(v) {
  return (v || "").toString().trim();
}

function updateMeta() {
  if (activityCountEl) activityCountEl.textContent = String(activities.length);
  if (lastUpdatedEl) lastUpdatedEl.textContent = "Last updated: " + new Date().toLocaleTimeString();
}

function jsonpLoadActivities() {
  return new Promise((resolve, reject) => {
    const callbackName = "wheelDataCallback_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    const script = document.createElement("script");
    const separator = APPS_SCRIPT_URL.includes("?") ? "&" : "?";

    window[callbackName] = function (payload) {
      cleanup();
      if (payload && payload.ok && Array.isArray(payload.items)) {
        resolve(payload.items);
      } else {
        reject(new Error((payload && payload.error) || "Invalid data response"));
      }
    };

    function cleanup() {
      if (script.parentNode) script.parentNode.removeChild(script);
      delete window[callbackName];
    }

    script.onerror = function () {
      cleanup();
      reject(new Error("Failed to load shared list"));
    };

    script.src = APPS_SCRIPT_URL + separator + "action=list&callback=" + callbackName + "&t=" + Date.now();
    document.body.appendChild(script);
  });
}

async function loadActivities() {
  try {
    const items = await jsonpLoadActivities();
    activities = items
      .map((item) => ({
        emoji: safeText(item.emoji),
        activity: safeText(item.activity),
        price: safeText(item.price),
        restaurant: safeText(item.restaurant),
        movie: safeText(item.movie),
      }))
      .filter((item) => item.activity);

    updateMeta();
    drawWheel();

    if (resultBox && !isSpinning) {
      resultBox.textContent = activities.length
        ? "Shared list loaded. Choose a budget and spin."
        : "No shared activities found yet.";
    }
  } catch (err) {
    console.error(err);
    if (resultBox && !isSpinning) {
      resultBox.textContent = "Could not load shared list: " + err.message;
    }
  }
}

function startAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    if (!isSpinning) loadActivities();
  }, 30000);
}

function filteredActivities() {
  if (!bucketSelect || bucketSelect.value === "all") return activities;
  return activities.filter((a) => a.price === bucketSelect.value);
}

function alternatingColor(index) {
  return index % 2 === 0 ? "#121212" : "#86131d";
}

function drawWheel() {
  if (!ctx) return;

  const items = filteredActivities();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!items.length) {
    ctx.fillStyle = "#f6e7c0";
    ctx.font = "bold 34px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("No activities in this budget.", canvas.width / 2, canvas.height / 2);
    return;
  }

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = 320;
  const outerRadius = 350;
  const slice = (Math.PI * 2) / items.length;

  for (let i = 0; i < 44; i++) {
    const angle = (Math.PI * 2 / 44) * i + currentRotation * 0.06;
    const x = cx + Math.cos(angle) * outerRadius;
    const y = cy + Math.sin(angle) * outerRadius;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 ? "#f4d27e" : "#ffe8ac";
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#f4d27e";
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  for (let i = 0; i < items.length; i++) {
    const start = currentRotation + i * slice - Math.PI / 2;
    const end = start + slice;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = alternatingColor(i);
    ctx.fill();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + slice / 2);
    ctx.fillStyle = "#f6e7c0";
    ctx.font = "bold 22px Georgia";
    ctx.textAlign = "right";
    const text = `${safeText(items[i].emoji)} ${safeText(items[i].activity)}`.trim();
    wrapWheelText(text, radius - 22);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#caa14f";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 62, 0, Math.PI * 2);
  const centerGradient = ctx.createRadialGradient(cx - 12, cy - 12, 10, cx, cy, 62);
  centerGradient.addColorStop(0, "#fff0c7");
  centerGradient.addColorStop(0.55, "#d9ac48");
  centerGradient.addColorStop(1, "#7e5316");
  ctx.fillStyle = centerGradient;
  ctx.fill();
}

function wrapWheelText(text, xPos) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  const maxWidth = 185;

  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  const startY = -((lines.length - 1) * 24) / 2;
  lines.forEach((ln, idx) => ctx.fillText(ln, xPos, startY + idx * 24));
}

function chooseRandomItem() {
  const items = filteredActivities();
  if (!items.length) return null;
  const index = Math.floor(Math.random() * items.length);
  return { item: items[index], index, total: items.length };
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function spinToIndex(index, total, callback) {
  if (isSpinning) return;
  isSpinning = true;

  const slice = (Math.PI * 2) / total;
  const targetCenter = index * slice + slice / 2;
  const normalizedTarget = -targetCenter;
  const extraSpins = (Math.PI * 2) * (7 + Math.random() * 1.8);
  const startRotation = currentRotation;
  const endRotation = extraSpins + normalizedTarget - (currentRotation % (Math.PI * 2));

  const duration = 5200;
  const startTime = performance.now();
  playSpinBurst();

  function frame(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = easeOutCubic(progress);
    currentRotation = startRotation + endRotation * eased;
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      currentRotation = currentRotation % (Math.PI * 2);
      drawWheel();
      isSpinning = false;
      callback && callback();
    }
  }

  requestAnimationFrame(frame);
}

function showWinner(main, sub = "") {
  if (resultBox) resultBox.textContent = main;
  if (winnerText) winnerText.textContent = main;
  if (winnerSub) winnerSub.textContent = sub;
  if (winnerOverlay) winnerOverlay.classList.remove("hidden");
  burstConfetti();
  dropCoins();
}

function burstConfetti() {
  if (!confettiLayer) return;
  confettiLayer.innerHTML = "";
  const colors = ["#f4d27e", "#ffffff", "#a5171f", "#111111"];

  for (let i = 0; i < 110; i++) {
    const el = document.createElement("div");
    el.className = "confetti";
    el.style.left = Math.random() * 100 + "vw";
    el.style.background = colors[i % colors.length];
    el.style.animationDelay = Math.random() * 0.4 + "s";
    el.style.transform = `translateY(-10vh) rotate(${Math.random() * 360}deg)`;
    confettiLayer.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }
}

function dropCoins() {
  if (!coinLayer) return;
  coinLayer.innerHTML = "";

  for (let i = 0; i < 26; i++) {
    const coin = document.createElement("div");
    coin.className = "coin";
    coin.style.left = 10 + Math.random() * 80 + "vw";
    coin.style.animationDelay = Math.random() * 0.6 + "s";
    coinLayer.appendChild(coin);
    setTimeout(() => coin.remove(), 2600);
  }
}

function ensureAudio() {
  if (audioCtx) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  audioCtx = new AudioContextClass();
}

function startMusic() {
  ensureAudio();
  if (!audioCtx || audioStarted) return;
  audioStarted = true;

  const master = audioCtx.createGain();
  master.gain.value = 0.03;
  master.connect(audioCtx.destination);

  const low = audioCtx.createOscillator();
  low.type = "triangle";
  low.frequency.value = 73.42;

  const mid = audioCtx.createOscillator();
  mid.type = "sine";
  mid.frequency.value = 146.83;

  const shimmer = audioCtx.createOscillator();
  shimmer.type = "sine";
  shimmer.frequency.value = 293.66;

  const lowGain = audioCtx.createGain();
  const midGain = audioCtx.createGain();
  const shimmerGain = audioCtx.createGain();

  lowGain.gain.value = 0.25;
  midGain.gain.value = 0.11;
  shimmerGain.gain.value = 0.03;

  const lowFilter = audioCtx.createBiquadFilter();
  lowFilter.type = "lowpass";
  lowFilter.frequency.value = 380;

  const midFilter = audioCtx.createBiquadFilter();
  midFilter.type = "lowpass";
  midFilter.frequency.value = 900;

  low.connect(lowGain).connect(lowFilter).connect(master);
  mid.connect(midGain).connect(midFilter).connect(master);
  shimmer.connect(shimmerGain).connect(master);

  low.start();
  mid.start();
  shimmer.start();

  function pulse(node, base, depth, speed) {
    const now = audioCtx.currentTime;
    node.gain.cancelScheduledValues(now);
    for (let i = 0; i < 64; i++) {
      const t = now + i * speed;
      const v = base + Math.sin(i * 0.7) * depth;
      node.gain.linearRampToValueAtTime(Math.max(0.001, v), t);
    }
  }

  pulse(lowGain, 0.22, 0.04, 1.3);
  pulse(midGain, 0.09, 0.03, 1.05);
  pulse(shimmerGain, 0.025, 0.01, 0.8);

  musicNodes = [master, low, mid, shimmer, lowGain, midGain, shimmerGain];
}

function stopMusic() {
  if (!audioCtx || !audioStarted) return;
  try {
    musicNodes.forEach((node) => {
      if (node.stop) node.stop();
    });
  } catch (e) {
    console.error(e);
  }
  audioStarted = false;
  musicNodes = [];
  audioCtx.close();
  audioCtx = null;
}

function toggleMusic() {
  musicEnabled = !musicEnabled;
  if (musicEnabled) {
    startMusic();
    if (musicToggleBtn) musicToggleBtn.textContent = "♪ Music On";
  } else {
    stopMusic();
    if (musicToggleBtn) musicToggleBtn.textContent = "♪ Music Off";
  }
}

function playSpinBurst() {
  ensureAudio();
  if (!audioCtx || !musicEnabled) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sawtooth";
  osc.frequency.value = 220;
  gain.gain.value = 0.0001;
  osc.connect(gain).connect(audioCtx.destination);

  const now = audioCtx.currentTime;
  gain.gain.exponentialRampToValueAtTime(0.015, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
  osc.frequency.exponentialRampToValueAtTime(90, now + 1.2);
  osc.start(now);
  osc.stop(now + 1.21);
}

function runClassicSpin() {
  const selected = chooseRandomItem();
  if (!selected) {
    if (resultBox) resultBox.textContent = "No activities in this budget.";
    return;
  }

  spinToIndex(selected.index, selected.total, () => {
    showWinner(`${safeText(selected.item.emoji)} ${safeText(selected.item.activity)}`.trim(), "Classic spin result");
  });
}

function runDateNightSpin() {
  const selected = chooseRandomItem();
  if (!selected) {
    if (resultBox) resultBox.textContent = "No activities in this budget.";
    return;
  }

  spinToIndex(selected.index, selected.total, () => {
    const activity = `${safeText(selected.item.emoji)} ${safeText(selected.item.activity)}`.trim();
    const food = safeText(selected.item.restaurant) || "Chef's Choice";
    const movie = safeText(selected.item.movie) || "Surprise Pick";
    showWinner(activity, `Dinner: ${food} • Movie: ${movie}`);
  });
}

if (spinBtn) spinBtn.addEventListener("click", runClassicSpin);
if (dateNightBtn) dateNightBtn.addEventListener("click", runDateNightSpin);
if (reloadBtn) reloadBtn.addEventListener("click", loadActivities);
if (bucketSelect) bucketSelect.addEventListener("change", drawWheel);
if (spinAgainBtn) {
  spinAgainBtn.addEventListener("click", () => {
    if (winnerOverlay) winnerOverlay.classList.add("hidden");
    runClassicSpin();
  });
}
if (closeWinnerBtn) {
  closeWinnerBtn.addEventListener("click", () => {
    if (winnerOverlay) winnerOverlay.classList.add("hidden");
  });
}
if (musicToggleBtn) {
  musicToggleBtn.addEventListener("click", async () => {
    if (!audioStarted && musicEnabled) startMusic();
    else toggleMusic();
  });
}

loadActivities();
startAutoRefresh();
