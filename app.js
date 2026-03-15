const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbztoxKIHtLnHcZmNiL7HyMU6r8k4ze5caW4q2tc7vHk_-XvHvyYc-QtFKV2v6xCCpyK/exec";
const canvas = document.getElementById("wheel");
const ctx = canvas ? canvas.getContext("2d") : null;
const spinBtn = document.getElementById("spin");
const surpriseBtn = document.getElementById("surprise");
const reloadBtn = document.getElementById("reloadData");
const bucketSelect = document.getElementById("bucket");
const screenMain = document.getElementById("screenMain");
const screenSub = document.getElementById("screenSub");
const winnerOverlay = document.getElementById("winnerOverlay");
const winnerText = document.getElementById("winnerText");
const winnerSub = document.getElementById("winnerSub");
const spinAgainBtn = document.getElementById("spinAgain");
const closeWinnerBtn = document.getElementById("closeWinner");
const confettiLayer = document.getElementById("confettiLayer");
const ball = document.getElementById("ball");

let activities = [];
let currentRotation = 0;
let isSpinning = false;
let refreshTimer = null;
let tickAudio = null;

function playTick() {
  if (!tickAudio) {
    tickAudio = new Audio("tick.mp3");
    tickAudio.volume = 0.75;
  }
  tickAudio.currentTime = 0;
  tickAudio.play().catch(() => {});
}

function safeText(v) {
  return (v || "").toString().trim();
}

function setDisplay(main, sub) {
  if (screenMain) screenMain.textContent = main;
  if (screenSub) screenSub.textContent = sub || "";
}

function jsonpLoadActivities() {
  return new Promise((resolve, reject) => {
    const callbackName = "wheelDataCallback_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    const script = document.createElement("script");
    const separator = APPS_SCRIPT_URL.includes("?") ? "&" : "?";
    window[callbackName] = function(payload) {
      cleanup();
      if (payload && payload.ok && Array.isArray(payload.items)) resolve(payload.items);
      else reject(new Error((payload && payload.error) || "Invalid data response"));
    };
    function cleanup() {
      if (script.parentNode) script.parentNode.removeChild(script);
      delete window[callbackName];
    }
    script.onerror = function() {
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
    activities = items.map(item => ({
      emoji: safeText(item.emoji),
      activity: safeText(item.activity),
      price: safeText(item.price),
      restaurant: safeText(item.restaurant),
      movie: safeText(item.movie)
    })).filter(item => item.activity);
    drawWheel();
    if (!isSpinning) setDisplay("READY", "Press SPIN to start");
  } catch (err) {
    console.error(err);
    if (!isSpinning) setDisplay("LOAD ERROR", err.message);
  }
}

function startAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    if (!isSpinning) loadActivities();
  }, 30000);
}

function filteredActivities() {
  return !bucketSelect || bucketSelect.value === "all"
    ? activities
    : activities.filter(a => a.price === bucketSelect.value);
}

function drawWheel() {
  if (!ctx) return;
  const items = filteredActivities();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!items.length) {
    ctx.fillStyle = "#f6e7c0";
    ctx.font = "bold 34px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("No picks", canvas.width / 2, canvas.height / 2);
    return;
  }

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = 320;
  const outerRadius = 350;
  const slice = (Math.PI * 2) / items.length;

  for (let i = 0; i < 34; i++) {
    const a = (Math.PI * 2 / 34) * i;
    const x = cx + Math.cos(a) * outerRadius;
    const y = cy + Math.sin(a) * outerRadius;
    ctx.beginPath();
    ctx.arc(x, y, 6.2, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 ? "#f4d27e" : "#ffe8ac";
    ctx.shadowBlur = 14;
    ctx.shadowColor = "#f4d27e";
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  for (let i = 0; i < items.length; i++) {
    const start = i * slice - Math.PI / 2;
    const end = start + slice;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? "#111315" : "#9b0b12";
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, radius + 5, 0, Math.PI * 2);
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#caa14f";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 62, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(cx - 12, cy - 12, 10, cx, cy, 62);
  g.addColorStop(0, "#fff0c7");
  g.addColorStop(0.55, "#d9ac48");
  g.addColorStop(1, "#7e5316");
  ctx.fillStyle = g;
  ctx.fill();
}

function chooseRandomItem(items) {
  return items.length ? items[Math.floor(Math.random() * items.length)] : null;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function positionBall(progress, totalTurns) {
  if (!ball) return;
  const angle = (-Math.PI / 2) + (progress * totalTurns * Math.PI * 2 * 1.55);
  const r = 45;
  const x = 50 + Math.cos(angle) * r;
  const y = 50 + Math.sin(angle) * r;
  ball.style.left = x + "%";
  ball.style.top = y + "%";
}

function playTicking(duration = 5200) {
  let elapsed = 0;
  let interval = 58;
  function nextTick() {
    if (elapsed >= duration - 80) return;
    playTick();
    elapsed += interval;
    interval = Math.min(interval + 10, 300);
    setTimeout(nextTick, interval);
  }
  nextTick();
}

function spinToIndex(index, total, callback) {
  if (isSpinning) return;
  isSpinning = true;

  const slice = 360 / total;
  const targetDeg = 360 - (index * slice) - (slice / 2);
  const extraSpins = 360 * (7 + Math.random() * 1.5);
  const startDeg = currentRotation;
  const endDeg = extraSpins + targetDeg - (currentRotation % 360);
  const duration = 5200;
  const startTime = performance.now();

  playTicking(duration);

  function frame(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = easeOutCubic(progress);
    currentRotation = startDeg + endDeg * eased;
    if (canvas) canvas.style.transform = "rotate(" + currentRotation + "deg)";
    positionBall(progress, 5.5);

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      currentRotation = currentRotation % 360;
      if (canvas) canvas.style.transform = "rotate(" + currentRotation + "deg)";
      positionBall(1, 0.2);
      isSpinning = false;
      callback && callback();
    }
  }

  requestAnimationFrame(frame);
}

function burstConfetti() {
  if (!confettiLayer) return;
  confettiLayer.innerHTML = "";
  const colors = ["#f4d27e", "#ffffff", "#a5171f", "#111111"];
  for (let i = 0; i < 70; i++) {
    const el = document.createElement("div");
    el.className = "confetti";
    el.style.left = Math.random() * 100 + "vw";
    el.style.background = colors[i % colors.length];
    el.style.animationDelay = Math.random() * 0.25 + "s";
    el.style.transform = "translateY(-10vh) rotate(" + (Math.random() * 360) + "deg)";
    confettiLayer.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }
}

function showWinner(main, sub) {
  setDisplay(main, sub);
  if (winnerText) winnerText.textContent = main;
  if (winnerSub) winnerSub.textContent = sub || "";
  if (winnerOverlay) winnerOverlay.classList.remove("hidden");
  burstConfetti();
}

function runClassicSpin() {
  const items = filteredActivities();
  if (!items.length) return setDisplay("NO PICKS", "No activities in this budget.");
  const winnerIndex = Math.floor(Math.random() * items.length);
  const winner = items[winnerIndex];
  spinToIndex(winnerIndex, items.length, () => {
    showWinner((safeText(winner.emoji) + " " + safeText(winner.activity)).trim(), "Classic spin result");
  });
}

function runSurpriseNight() {
  const items = filteredActivities();
  if (!items.length) return setDisplay("NO PICKS", "No activities in this budget.");
  const activityWinnerIndex = Math.floor(Math.random() * items.length);
  const activityWinner = items[activityWinnerIndex];
  const restaurantWinner = chooseRandomItem(items.filter(i => safeText(i.restaurant)));
  const movieWinner = chooseRandomItem(items.filter(i => safeText(i.movie)));
  spinToIndex(activityWinnerIndex, items.length, () => {
    const title = (safeText(activityWinner.emoji) + " " + safeText(activityWinner.activity)).trim();
    const restaurant = restaurantWinner ? safeText(restaurantWinner.restaurant) : "Chef's Choice";
    const movie = movieWinner ? safeText(movieWinner.movie) : "Surprise Pick";
    showWinner(title, "Restaurant: " + restaurant + " • Movie: " + movie);
  });
}

if (spinBtn) spinBtn.addEventListener("click", runClassicSpin);
if (surpriseBtn) surpriseBtn.addEventListener("click", runSurpriseNight);
if (reloadBtn) reloadBtn.addEventListener("click", loadActivities);
if (bucketSelect) bucketSelect.addEventListener("change", drawWheel);
if (spinAgainBtn) spinAgainBtn.addEventListener("click", () => {
  if (winnerOverlay) winnerOverlay.classList.add("hidden");
  runClassicSpin();
});
if (closeWinnerBtn) closeWinnerBtn.addEventListener("click", () => {
  if (winnerOverlay) winnerOverlay.classList.add("hidden");
});

loadActivities();
startAutoRefresh();
