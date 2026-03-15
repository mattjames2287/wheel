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
let tickAudio = null;

function playTick() {
  if (!tickAudio) {
    tickAudio = new Audio("tick.mp3");
    tickAudio.volume = 0.72;
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

function playTicking(duration = 3600) {
  let elapsed = 0;
  let interval = 70;
  function nextTick() {
    if (elapsed >= duration - 80) return;
    playTick();
    elapsed += interval;
    interval = Math.min(interval + 12, 260);
    setTimeout(nextTick, interval);
  }
  nextTick();
}

function runClassicSpin() {
  const items = filteredActivities();
  if (!items.length) return setDisplay("NO PICKS", "NO ACTIVITIES IN THIS BUDGET");
  const winner = items[Math.floor(Math.random() * items.length)];
  isSpinning = true;
  setDisplay("SPINNING", "CASINO FLOOR IN MOTION");
  playTicking();
  setTimeout(() => {
    isSpinning = false;
    setDisplay((safeText(winner.emoji) + " " + safeText(winner.activity)).trim(), "CLASSIC SPIN RESULT");
  }, 3600);
}

function runSurpriseNight() {
  const items = filteredActivities();
  if (!items.length) return setDisplay("NO PICKS", "NO ACTIVITIES IN THIS BUDGET");
  const activityWinner = items[Math.floor(Math.random() * items.length)];
  const restaurantWinner = chooseRandomItem(items.filter(i => safeText(i.restaurant)));
  const movieWinner = chooseRandomItem(items.filter(i => safeText(i.movie)));
  isSpinning = true;
  setDisplay("SPINNING", "CASINO FLOOR IN MOTION");
  playTicking();
  setTimeout(() => {
    isSpinning = false;
    const title = (safeText(activityWinner.emoji) + " " + safeText(activityWinner.activity)).trim();
    const restaurant = restaurantWinner ? safeText(restaurantWinner.restaurant) : "CHEF'S CHOICE";
    const movie = movieWinner ? safeText(movieWinner.movie) : "SURPRISE PICK";
    setDisplay(title, "RESTAURANT: " + restaurant + " • MOVIE: " + movie);
  }, 3600);
}

if (spinBtn) spinBtn.addEventListener("click", runClassicSpin);
if (surpriseBtn) surpriseBtn.addEventListener("click", runSurpriseNight);
if (reloadBtn) reloadBtn.addEventListener("click", loadActivities);

loadActivities();
startAutoRefresh();
