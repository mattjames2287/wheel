const STORAGE_KEY = "vegasWheelBuckets_v1";
const MODE_KEY = "vegasWheelMode_v1";

const DEFAULT_BUCKETS = {
  "$0–25": {
    color: "#111111",
    items: [
      { emoji: "🍦", name: "Ice Cream Date" },
      { emoji: "☕", name: "Coffee Shop Run" },
      { emoji: "🌳", name: "Park Walk" },
      { emoji: "🧺", name: "Sunset Picnic" },
      { emoji: "🎲", name: "Board Game Night" },
      { emoji: "🍩", name: "Dessert Crawl" },
      { emoji: "📸", name: "Photo Walk" },
      { emoji: "🎬", name: "Movie Night at Home" }
    ]
  },
  "$25–50": {
    color: "#b10f1d",
    items: [
      { emoji: "🎳", name: "Bowling" },
      { emoji: "🍔", name: "Casual Dinner Out" },
      { emoji: "🖼️", name: "Museum Visit" },
      { emoji: "🕹️", name: "Arcade Night" },
      { emoji: "🧩", name: "Escape Room" },
      { emoji: "🥞", name: "Brunch Date" },
      { emoji: "🐘", name: "Zoo Visit" },
      { emoji: "🎨", name: "Paint Night" }
    ]
  },
  "$50–100": {
    color: "#111111",
    items: [
      { emoji: "🍽️", name: "Nice Dinner" },
      { emoji: "🎤", name: "Concert Tickets" },
      { emoji: "🚣", name: "Kayaking Adventure" },
      { emoji: "👩‍🍳", name: "Cooking Class" },
      { emoji: "😂", name: "Comedy Show" },
      { emoji: "🚗", name: "Day Trip" },
      { emoji: "🎟️", name: "Event Tickets" },
      { emoji: "🧖", name: "Spa Visit" }
    ]
  },
  "$100+": {
    color: "#b10f1d",
    items: [
      { emoji: "🏕️", name: "Weekend Getaway" },
      { emoji: "🎈", name: "Hot Air Balloon Ride" },
      { emoji: "🏨", name: "Hotel Night" },
      { emoji: "🥂", name: "Fancy Tasting Menu" },
      { emoji: "🚁", name: "Adventure Experience" },
      { emoji: "🚆", name: "Special Day Trip" },
      { emoji: "🌄", name: "Cabin Stay" },
      { emoji: "🛥️", name: "Private Tour" }
    ]
  }
};

const RESTAURANT_TYPES = [
  "🍝 Italian", "🍣 Sushi", "🌮 Tacos", "🍔 Burgers", "🥩 Steakhouse", "🍜 Ramen",
  "🍕 Pizza", "🥞 Breakfast Spot", "🍛 Curry", "🥗 Healthy Café", "🥟 Dumplings", "🥘 Mediterranean"
];

const MOVIE_GENRES = [
  "🎬 Rom-Com", "🕵️ Mystery", "😂 Comedy", "💥 Action", "👻 Horror", "🚀 Sci-Fi",
  "✨ Fantasy", "❤️ Romance", "🎵 Musical", "🧠 Thriller", "🧸 Animated", "📚 Drama"
];

const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const bucketButtons = document.getElementById("bucketButtons");
const classicModeBtn = document.getElementById("classicModeBtn");
const dateNightModeBtn = document.getElementById("dateNightModeBtn");
const spinBtn = document.getElementById("spinBtn");
const removeWinnerToggle = document.getElementById("removeWinnerToggle");
const soundToggle = document.getElementById("soundToggle");
const resultText = document.getElementById("resultText");
const resultSub = document.getElementById("resultSub");
const dateNightMini = document.getElementById("dateNightMini");
const wheelNote = document.getElementById("wheelNote");
const adminBucket = document.getElementById("adminBucket");
const activityEmoji = document.getElementById("activityEmoji");
const activityName = document.getElementById("activityName");
const addActivityBtn = document.getElementById("addActivityBtn");
const activityList = document.getElementById("activityList");
const bucketCount = document.getElementById("bucketCount");
const resetBucketBtn = document.getElementById("resetBucketBtn");
const resetAllBtn = document.getElementById("resetAllBtn");
const winnerOverlay = document.getElementById("winnerOverlay");
const winnerMain = document.getElementById("winnerMain");
const winnerBudget = document.getElementById("winnerBudget");
const winnerExtras = document.getElementById("winnerExtras");
const spinAgainBtn = document.getElementById("spinAgainBtn");
const closeWinnerBtn = document.getElementById("closeWinnerBtn");
const coinsLayer = document.getElementById("coins");
const wheelLights = document.getElementById("wheelLights");

const size = canvas.width;
const center = size / 2;
const radius = 320;
const ringRadius = 360;

let buckets = loadBuckets();
let selectedBucket = null;
let currentItems = [];
let currentRotation = 0;
let isSpinning = false;
let currentMode = loadMode();

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadBuckets() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return deepClone(DEFAULT_BUCKETS);
  try {
    return JSON.parse(saved);
  } catch {
    return deepClone(DEFAULT_BUCKETS);
  }
}

function saveBuckets() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(buckets));
}

function loadMode() {
  return localStorage.getItem(MODE_KEY) || "classic";
}

function saveMode() {
  localStorage.setItem(MODE_KEY, currentMode);
}

function initBulbs() {
  document.querySelectorAll(".bulbs").forEach((row) => {
    row.innerHTML = "";
    for (let i = 0; i < 22; i++) {
      const bulb = document.createElement("span");
      bulb.style.animationDelay = `${(i % 6) * 0.12}s`;
      row.appendChild(bulb);
    }
  });
}

function initWheelLights() {
  for (let i = 0; i < 24; i++) {
    const bulb = document.createElement("span");
    const angle = (i / 24) * Math.PI * 2;
    const x = 50 + Math.cos(angle) * 49;
    const y = 50 + Math.sin(angle) * 49;
    bulb.style.cssText = `
      position:absolute;
      left:${x}%;
      top:${y}%;
      width:16px;height:16px;border-radius:50%;
      transform:translate(-50%,-50%);
      background:${i % 2 === 0 ? '#ffd66d' : '#fff1bc'};
      box-shadow:0 0 8px rgba(255,212,97,.85),0 0 18px rgba(255,212,97,.55);
      animation: bulbFlash ${0.8 + (i % 3) * 0.18}s infinite alternate;
      animation-delay:${i * 0.05}s;
    `;
    wheelLights.appendChild(bulb);
  }
}

function setMode(mode) {
  currentMode = mode;
  classicModeBtn.classList.toggle("active", mode === "classic");
  dateNightModeBtn.classList.toggle("active", mode === "dateNight");
  saveMode();

  if (mode === "dateNight") {
    wheelNote.textContent = selectedBucket
      ? `${currentItems.length} activities in ${selectedBucket}. Spin also picks food and movie ideas.`
      : "Date Night Mode adds a restaurant type and movie genre to the winning activity.";
  } else if (selectedBucket) {
    wheelNote.textContent = `${currentItems.length} possible activities in ${selectedBucket}`;
  } else {
    wheelNote.textContent = "Wheel will load after you choose a budget.";
  }
}

function buildBucketButtons() {
  bucketButtons.innerHTML = "";
  Object.keys(buckets).forEach((bucketName) => {
    const btn = document.createElement("button");
    btn.className = "bucket-btn";
    btn.style.background = `linear-gradient(180deg, ${shadeColor(buckets[bucketName].color, 20)}, ${buckets[bucketName].color})`;
    btn.textContent = `${bucketName} (${buckets[bucketName].items.length})`;
    btn.addEventListener("click", () => selectBucket(bucketName));
    bucketButtons.appendChild(btn);
  });
}

function buildAdminBucketSelect() {
  adminBucket.innerHTML = "";
  Object.keys(buckets).forEach((bucketName) => {
    const option = document.createElement("option");
    option.value = bucketName;
    option.textContent = bucketName;
    adminBucket.appendChild(option);
  });
}

function setActiveBucketButton(bucketName) {
  document.querySelectorAll(".bucket-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.textContent.startsWith(bucketName));
  });
}

function selectBucket(bucketName) {
  selectedBucket = bucketName;
  currentItems = [...buckets[bucketName].items];
  currentRotation = 0;
  adminBucket.value = bucketName;
  setActiveBucketButton(bucketName);
  spinBtn.disabled = currentItems.length === 0;
  resultText.textContent = "Ready to spin";
  resultSub.textContent = `Budget selected: ${bucketName}`;
  dateNightMini.classList.add("hidden");
  dateNightMini.innerHTML = "";
  setMode(currentMode);
  syncAdminList();
  drawWheel();
}

function syncAdminList() {
  const bucketName = adminBucket.value || Object.keys(buckets)[0];
  const items = buckets[bucketName].items;
  bucketCount.textContent = `${items.length} activit${items.length === 1 ? "y" : "ies"}`;
  activityList.innerHTML = "";

  items.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "activity-item";

    const text = document.createElement("div");
    text.className = "activity-text";
    text.textContent = `${item.emoji || "🎯"} ${item.name}`;

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => {
      buckets[bucketName].items.splice(index, 1);
      saveBuckets();
      buildBucketButtons();
      syncAdminList();
      if (selectedBucket === bucketName) {
        currentItems = [...buckets[bucketName].items];
        spinBtn.disabled = currentItems.length === 0;
        setMode(currentMode);
        drawWheel();
      }
    });

    row.appendChild(text);
    row.appendChild(removeBtn);
    activityList.appendChild(row);
  });
}

function addActivity() {
  const bucketName = adminBucket.value;
  const emoji = activityEmoji.value.trim() || "🎯";
  const name = activityName.value.trim();
  if (!name) return;

  buckets[bucketName].items.push({ emoji, name });
  saveBuckets();
  buildBucketButtons();
  syncAdminList();

  if (selectedBucket === bucketName) {
    currentItems = [...buckets[bucketName].items];
    spinBtn.disabled = currentItems.length === 0;
    setMode(currentMode);
    drawWheel();
  }

  activityEmoji.value = "";
  activityName.value = "";
  activityName.focus();
}

function resetCurrentBucket() {
  if (!selectedBucket) return;
  buckets[selectedBucket].items = deepClone(DEFAULT_BUCKETS[selectedBucket].items);
  saveBuckets();
  buildBucketButtons();
  syncAdminList();
  currentItems = [...buckets[selectedBucket].items];
  spinBtn.disabled = currentItems.length === 0;
  setMode(currentMode);
  drawWheel();
}

function resetAllBuckets() {
  buckets = deepClone(DEFAULT_BUCKETS);
  saveBuckets();
  buildBucketButtons();
  buildAdminBucketSelect();
  if (selectedBucket) {
    currentItems = [...buckets[selectedBucket].items];
    adminBucket.value = selectedBucket;
    spinBtn.disabled = currentItems.length === 0;
    setMode(currentMode);
    drawWheel();
  } else {
    drawEmptyWheel();
  }
  syncAdminList();
}

function drawEmptyWheel() {
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(center, center);
  ctx.beginPath();
  ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,215,120,.08)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(15,8,9,.95)";
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#fff0b0";
  ctx.textAlign = "center";
  ctx.font = "bold 36px Arial";
  ctx.fillText("Pick a budget", center, center - 12);
  ctx.font = "20px Arial";
  ctx.fillStyle = "#e2cfa4";
  ctx.fillText("The Vegas wheel loads your activities here", center, center + 26);
}

function shadeColor(hex, amt) {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  let r = (num >> 16) + amt;
  let g = ((num >> 8) & 255) + amt;
  let b = (num & 255) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function drawWheelText(text) {
  const maxWidth = radius - 80;
  const words = text.split(" ");
  const lines = [];
  let line = "";

  ctx.font = "bold 24px Arial";
  ctx.fillStyle = "#fff7de";
  ctx.textAlign = "right";

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });
  if (line) lines.push(line);

  const lineHeight = 28;
  const startY = -((lines.length - 1) * lineHeight) / 2;
  lines.forEach((ln, index) => {
    ctx.fillText(ln, radius - 36, startY + index * lineHeight);
  });
}

function drawWheel() {
  ctx.clearRect(0, 0, size, size);
  if (!selectedBucket || !currentItems.length) {
    drawEmptyWheel();
    return;
  }

  const slice = (Math.PI * 2) / currentItems.length;
  for (let i = 0; i < currentItems.length; i++) {
    const start = currentRotation + i * slice;
    const end = start + slice;
    const isRed = i % 2 === 0;
    const segColor = isRed ? "#b11420" : "#111111";

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = segColor;
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#d2a034";
    ctx.stroke();

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(start + slice / 2);
    drawWheelText(`${currentItems[i].emoji || "🎯"} ${currentItems[i].name}`);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(center, center, ringRadius, 0, Math.PI * 2);
  ctx.lineWidth = 18;
  ctx.strokeStyle = "#d7a438";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(center, center, radius + 10, 0, Math.PI * 2);
  ctx.lineWidth = 10;
  ctx.strokeStyle = "rgba(255,235,185,.9)";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(center, center, 95, 0, Math.PI * 2);
  ctx.fillStyle = "#130607";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(center, center, 88, 0, Math.PI * 2);
  ctx.fillStyle = "#f2c24c";
  ctx.fill();
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function playTick(durationMs = 42, freq = 900, volume = 0.022) {
  if (!soundToggle.checked) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  if (!window.__vegasAudioCtx) window.__vegasAudioCtx = new AudioContextClass();
  const ac = window.__vegasAudioCtx;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const now = ac.currentTime;
  osc.type = "square";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + durationMs / 1000);
}

function playWinSound() {
  if (!soundToggle.checked) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  if (!window.__vegasAudioCtx) window.__vegasAudioCtx = new AudioContextClass();
  const ac = window.__vegasAudioCtx;
  const notes = [660, 880, 1046, 1320];
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const start = ac.currentTime + i * 0.09;
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.05, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(start);
    osc.stop(start + 0.23);
  });
}

function launchConfetti() {
  const duration = 1800;
  const end = Date.now() + duration;
  const colors = ["#ffd66d", "#b11420", "#ffffff", "#111111"];
  const confettiContainer = document.createElement("div");
  confettiContainer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:24;overflow:hidden;";
  document.body.appendChild(confettiContainer);

  const timer = setInterval(() => {
    for (let i = 0; i < 24; i++) {
      const piece = document.createElement("span");
      const left = Math.random() * 100;
      const size = 6 + Math.random() * 8;
      piece.style.cssText = `position:absolute;left:${left}%;top:-18px;width:${size}px;height:${size * 1.6}px;background:${colors[Math.floor(Math.random() * colors.length)]};transform:rotate(${Math.random() * 360}deg);opacity:1;border-radius:2px;animation:confettiDrop ${1.3 + Math.random() * 1.3}s linear forwards;`;
      confettiContainer.appendChild(piece);
      piece.animate([
        { transform: `translateY(0) rotate(0deg)` },
        { transform: `translateY(${window.innerHeight + 50}px) rotate(${260 + Math.random() * 300}deg)` }
      ], {
        duration: 1300 + Math.random() * 1200,
        easing: "cubic-bezier(.2,.6,.3,1)",
        fill: "forwards"
      });
      setTimeout(() => piece.remove(), 2600);
    }
    if (Date.now() > end) {
      clearInterval(timer);
      setTimeout(() => confettiContainer.remove(), 2800);
    }
  }, 120);
}

function launchCoins() {
  for (let i = 0; i < 26; i++) {
    const coin = document.createElement("span");
    coin.className = "coin";
    coin.style.left = `${Math.random() * 100}%`;
    coin.style.animationDuration = `${2.3 + Math.random() * 1.8}s`;
    coin.style.animationDelay = `${Math.random() * 0.35}s`;
    coin.style.width = `${14 + Math.random() * 16}px`;
    coin.style.height = coin.style.width;
    coinsLayer.appendChild(coin);
    setTimeout(() => coin.remove(), 4200);
  }
}

function showWinnerPopup(mainText, budgetText, extrasHtml) {
  winnerMain.textContent = mainText;
  winnerBudget.textContent = budgetText;
  winnerExtras.innerHTML = extrasHtml || "";
  winnerOverlay.classList.remove("hidden");
  winnerOverlay.setAttribute("aria-hidden", "false");
}

function hideWinnerPopup() {
  winnerOverlay.classList.add("hidden");
  winnerOverlay.setAttribute("aria-hidden", "true");
}

function spinWheel() {
  if (!selectedBucket || !currentItems.length || isSpinning) return;
  hideWinnerPopup();
  isSpinning = true;
  spinBtn.disabled = true;
  resultText.textContent = "Spinning...";
  resultSub.textContent = `Budget: ${selectedBucket}`;
  dateNightMini.classList.add("hidden");
  dateNightMini.innerHTML = "";

  const winnerIndex = Math.floor(Math.random() * currentItems.length);
  const slice = (Math.PI * 2) / currentItems.length;
  const targetSliceCenter = winnerIndex * slice + slice / 2;
  const normalizedTarget = Math.PI * 1.5 - targetSliceCenter;
  const extraSpins = Math.PI * 2 * (7 + Math.random() * 2.5);
  const startRotation = currentRotation;
  const finalRotation = extraSpins + normalizedTarget;
  const duration = 5200;
  const startTime = performance.now();
  let lastTick = 0;

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    currentRotation = startRotation + (finalRotation - startRotation) * eased;
    drawWheel();

    const tickGap = 26 + progress * 180;
    if (now - lastTick > tickGap) {
      playTick(38, 970 - progress * 380, 0.02);
      lastTick = now;
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
      return;
    }

    currentRotation = currentRotation % (Math.PI * 2);
    drawWheel();
    const winningItem = currentItems[winnerIndex];
    let extras = "";
    let mini = "";

    resultText.textContent = `${winningItem.emoji || "🎯"} ${winningItem.name}`;
    resultSub.textContent = `Chosen from ${selectedBucket}`;

    if (currentMode === "dateNight") {
      const restaurant = getRandomItem(RESTAURANT_TYPES);
      const movie = getRandomItem(MOVIE_GENRES);
      mini = `<strong>Food:</strong> ${restaurant}<br><strong>Movie:</strong> ${movie}`;
      extras = `<div><strong>Restaurant Type:</strong> ${restaurant}</div><div><strong>Movie Genre:</strong> ${movie}</div>`;
      dateNightMini.innerHTML = mini;
      dateNightMini.classList.remove("hidden");
    }

    playWinSound();
    launchConfetti();
    launchCoins();
    showWinnerPopup(
      `${winningItem.emoji || "🎯"} ${winningItem.name}`,
      `${selectedBucket} • ${currentMode === 'dateNight' ? 'Date Night Mode' : 'Classic Spin'}`,
      extras
    );

    if (removeWinnerToggle.checked) {
      const liveItems = buckets[selectedBucket].items;
      const realIndex = liveItems.findIndex((item) => item.name === winningItem.name && item.emoji === winningItem.emoji);
      if (realIndex !== -1) {
        liveItems.splice(realIndex, 1);
        saveBuckets();
        buildBucketButtons();
        syncAdminList();
      }
      currentItems = [...buckets[selectedBucket].items];
    }

    spinBtn.disabled = currentItems.length === 0;
    setMode(currentMode);
    isSpinning = false;
  }

  requestAnimationFrame(animate);
}

function init() {
  initBulbs();
  initWheelLights();
  buildBucketButtons();
  buildAdminBucketSelect();
  syncAdminList();
  setMode(currentMode);
  drawEmptyWheel();
}

classicModeBtn.addEventListener("click", () => setMode("classic"));
dateNightModeBtn.addEventListener("click", () => setMode("dateNight"));
addActivityBtn.addEventListener("click", addActivity);
spinBtn.addEventListener("click", spinWheel);
resetBucketBtn.addEventListener("click", resetCurrentBucket);
resetAllBtn.addEventListener("click", resetAllBuckets);
spinAgainBtn.addEventListener("click", () => {
  hideWinnerPopup();
  spinWheel();
});
closeWinnerBtn.addEventListener("click", hideWinnerPopup);
winnerOverlay.addEventListener("click", (e) => {
  if (e.target === winnerOverlay) hideWinnerPopup();
});
adminBucket.addEventListener("change", syncAdminList);
activityName.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addActivity();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideWinnerPopup();
});

init();
