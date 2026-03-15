const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbztoxKIHtLnHcZmNiL7HyMU6r8k4ze5caW4q2tc7vHk_-XvHvyYc-QtFKV2v6xCCpyK/exec";
const bowlRing = document.getElementById("bowlRing");
const spinBtn = document.getElementById("spin");
const surpriseBtn = document.getElementById("surprise");
const reloadBtn = document.getElementById("reloadData");
const bucketSelect = document.getElementById("bucket");
const screenMain = document.getElementById("screenMain");
const screenSub = document.getElementById("screenSub");
const ball = document.getElementById("ball");

let activities = [];
let currentRotation = 0;
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

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function positionBall(progress) {
  if (!ball) return;
  const angle = (-Math.PI / 2) + (progress * Math.PI * 2 * 6.2);
  const rx = 36;
  const ry = 14;
  const x = 50 + Math.cos(angle) * rx;
  const y = 50 + Math.sin(angle) * ry;
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
    interval = Math.min(interval + 10, 280);
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
  const duration = 5600;
  const startTime = performance.now();

  playTicking(duration);

  function frame(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = easeOutCubic(progress);
    currentRotation = startDeg + endDeg * eased;
    if (bowlRing) bowlRing.style.transform = "translate(-50%,-50%) rotate(" + currentRotation + "deg)";
    positionBall(progress);
    if (progress < 1) requestAnimationFrame(frame);
    else {
      currentRotation = currentRotation % 360;
      if (bowlRing) bowlRing.style.transform = "translate(-50%,-50%) rotate(" + currentRotation + "deg)";
      positionBall(1);
      isSpinning = false;
      callback && callback();
    }
  }
  requestAnimationFrame(frame);
}

function runClassicSpin() {
  const items = filteredActivities();
  if (!items.length) return setDisplay("NO PICKS", "NO ACTIVITIES IN THIS BUDGET");
  const winnerIndex = Math.floor(Math.random() * items.length);
  const winner = items[winnerIndex];
  spinToIndex(winnerIndex, items.length, () => {
    setDisplay((safeText(winner.emoji) + " " + safeText(winner.activity)).trim(), "CLASSIC SPIN RESULT");
  });
}

function runSurpriseNight() {
  const items = filteredActivities();
  if (!items.length) return setDisplay("NO PICKS", "NO ACTIVITIES IN THIS BUDGET");
  const activityWinnerIndex = Math.floor(Math.random() * items.length);
  const activityWinner = items[activityWinnerIndex];
  const restaurantWinner = chooseRandomItem(items.filter(i => safeText(i.restaurant)));
  const movieWinner = chooseRandomItem(items.filter(i => safeText(i.movie)));
  spinToIndex(activityWinnerIndex, items.length, () => {
    const title = (safeText(activityWinner.emoji) + " " + safeText(activityWinner.activity)).trim();
    const restaurant = restaurantWinner ? safeText(restaurantWinner.restaurant) : "CHEF'S CHOICE";
    const movie = movieWinner ? safeText(movieWinner.movie) : "SURPRISE PICK";
    setDisplay(title, "RESTAURANT: " + restaurant + " • MOVIE: " + movie);
  });
}

if (spinBtn) spinBtn.addEventListener("click", runClassicSpin);
if (surpriseBtn) surpriseBtn.addEventListener("click", runSurpriseNight);
if (reloadBtn) reloadBtn.addEventListener("click", loadActivities);

loadActivities();
startAutoRefresh();
