const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbztoxKIHtLnHcZmNiL7HyMU6r8k4ze5caW4q2tc7vHk_-XvHvyYc-QtFKV2v6xCCpyK/exec";
const spinBtn = document.getElementById("spin");
const surpriseBtn = document.getElementById("surprise");
const reloadBtn = document.getElementById("reloadData");
const bucketSelect = document.getElementById("bucket");
const screenMain = document.getElementById("screenMain");
const screenSub = document.getElementById("screenSub");

let activities = [];
let isSpinning = false;
let refreshTimer = null;
let ambientAudio = null;
let spinAudio = null;
let audioUnlocked = false;

function safeText(v) {
  return (v || "").toString().trim();
}

function setDisplay(main, sub) {
  if (screenMain) screenMain.textContent = main;
  if (screenSub) screenSub.textContent = sub || "";
}

function ensureAudio() {
  if (!ambientAudio) {
    ambientAudio = new Audio("casino.mp3");
    ambientAudio.loop = true;
    ambientAudio.volume = 0.26;
  }
  if (!spinAudio) {
    spinAudio = new Audio("tick.mp3");
    spinAudio.volume = 0.65;
  }
}

function unlockAudio() {
  ensureAudio();
  if (audioUnlocked) return;
  audioUnlocked = true;
  ambientAudio.play().then(() => {
    ambientAudio.pause();
    ambientAudio.currentTime = 0;
  }).catch(() => {});
  spinAudio.play().then(() => {
    spinAudio.pause();
    spinAudio.currentTime = 0;
  }).catch(() => {});
}

function startAmbient() {
  ensureAudio();
  ambientAudio.play().catch(() => {});
}

function playSpinSound(duration = 3600) {
  ensureAudio();
  let elapsed = 0;
  let interval = 42;
  function tick() {
    if (elapsed >= duration - 60) return;
    spinAudio.currentTime = 0;
    spinAudio.play().catch(() => {});
    elapsed += interval;
    interval = Math.min(interval + 6, 145);
    setTimeout(tick, interval);
  }
  tick();
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
      activity: safeText(item.activity),
      price: safeText(item.price),
      restaurant: safeText(item.restaurant),
      movie: safeText(item.movie)
    })).filter(item => item.activity);
    if (!isSpinning) setDisplay("READY", "PRESS SPIN TO START");
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

function chooseRandomItem(items) {
  return items.length ? items[Math.floor(Math.random() * items.length)] : null;
}

function runClassicSpin() {
  unlockAudio();
  startAmbient();
  const items = filteredActivities();
  if (!items.length) return setDisplay("NO PICKS", "NO ACTIVITIES IN THIS BUDGET");
  const winner = items[Math.floor(Math.random() * items.length)];
  isSpinning = true;
  setDisplay("SPINNING", "ROULETTE WHEEL IN MOTION");
  playSpinSound();
  setTimeout(() => {
    isSpinning = false;
    setDisplay(safeText(winner.activity).trim(), "CLASSIC SPIN RESULT");
  }, 3600);
}

function runSurpriseNight() {
  unlockAudio();
  startAmbient();
  const items = filteredActivities();
  if (!items.length) return setDisplay("NO PICKS", "NO ACTIVITIES IN THIS BUDGET");
  const activityWinner = items[Math.floor(Math.random() * items.length)];
  const restaurantWinner = chooseRandomItem(items.filter(i => safeText(i.restaurant)));
  const movieWinner = chooseRandomItem(items.filter(i => safeText(i.movie)));
  isSpinning = true;
  setDisplay("SPINNING", "ROULETTE WHEEL IN MOTION");
  playSpinSound(3900);
  setTimeout(() => {
    isSpinning = false;
    const restaurant = restaurantWinner ? safeText(restaurantWinner.restaurant) : "CHEF'S CHOICE";
    const movie = movieWinner ? safeText(movieWinner.movie) : "SURPRISE PICK";
    setDisplay(safeText(activityWinner.activity).trim(), "RESTAURANT: " + restaurant + " • MOVIE: " + movie);
  }, 3900);
}

document.addEventListener("pointerdown", unlockAudio, { once:true });
if (spinBtn) spinBtn.addEventListener("click", runClassicSpin);
if (surpriseBtn) surpriseBtn.addEventListener("click", runSurpriseNight);
if (reloadBtn) reloadBtn.addEventListener("click", () => { unlockAudio(); startAmbient(); loadActivities(); });

loadActivities();
startAutoRefresh();
