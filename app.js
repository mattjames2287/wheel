const SCRIPT_URL = "PASTE_YOUR_APPS_SCRIPT_URL_HERE";

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

let activities = [];
let filtered = [];

let angle = 0;
let spinning = false;

const spinBtn = document.getElementById("spin");
const reloadBtn = document.getElementById("reloadData");
const bucketSelect = document.getElementById("bucket");

const resultBox = document.getElementById("result");
const countLabel = document.getElementById("activityCount");
const updatedLabel = document.getElementById("lastUpdated");

const overlay = document.getElementById("winnerOverlay");
const winnerText = document.getElementById("winnerText");
const winnerSub = document.getElementById("winnerSub");

const spinAgain = document.getElementById("spinAgain");
const closeWinner = document.getElementById("closeWinner");

const musicBtn = document.getElementById("musicToggle");

let musicStarted = false;
let bgMusic = new Audio("casino.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.35;

const tickSound = new Audio("tick.mp3");

function playTick(){
  tickSound.currentTime = 0;
  tickSound.play();
}

musicBtn.addEventListener("click", ()=>{
  if(!musicStarted){
    bgMusic.play();
    musicStarted = true;
    musicBtn.innerText = "♪ Music On";
  }else{
    bgMusic.pause();
    musicStarted = false;
    musicBtn.innerText = "♪ Music Off";
  }
});

async function loadActivities(){

  try{

    const res = await fetch(SCRIPT_URL + "?route=list");
    const data = await res.json();

    activities = data;

    applyFilter();

    updatedLabel.innerText = "updated " + new Date().toLocaleTimeString();

  }catch(e){

    console.log(e);

  }

}

function applyFilter(){

  const bucket = bucketSelect.value;

  if(bucket === "all"){
    filtered = activities;
  }else{
    filtered = activities.filter(a => a.price === bucket);
  }

  countLabel.innerText = filtered.length;

  drawWheel();

}

bucketSelect.addEventListener("change", applyFilter);

reloadBtn.addEventListener("click", loadActivities);

function drawWheel(){

  const size = canvas.width;
  const center = size / 2;

  ctx.clearRect(0,0,size,size);

  if(filtered.length === 0) return;

  const slice = (Math.PI * 2) / filtered.length;

  filtered.forEach((item,i)=>{

    const start = angle + (i * slice);
    const end = start + slice;

    ctx.beginPath();
    ctx.moveTo(center,center);
    ctx.arc(center,center,center,start,end);
    ctx.fillStyle = i % 2 ? "#8b0000" : "#111";
    ctx.fill();

    ctx.save();
    ctx.translate(center,center);
    ctx.rotate(start + slice/2);

    ctx.fillStyle = "#fff";
    ctx.font = "18px sans-serif";

    const label = item.emoji + " " + item.activity;

    ctx.fillText(label, center*0.45, 0);

    ctx.restore();

  });

}

spinBtn.addEventListener("click", spinWheel);

function spinWheel(){

  if(spinning || filtered.length === 0) return;

  spinning = true;

  const spins = 4 + Math.random()*3;
  const spinAngle = spins * Math.PI * 2;

  let start = null;

  function animate(t){

    if(!start) start = t;

    const progress = (t-start)/3000;

    if(progress >= 1){

      angle += spinAngle;

      finishSpin();

      return;

    }

    angle += spinAngle/180;

    if(Math.random() < .15) playTick();

    drawWheel();

    requestAnimationFrame(animate);

  }

  requestAnimationFrame(animate);

}

function finishSpin(){

  const slice = (Math.PI*2)/filtered.length;

  const index = Math.floor((filtered.length - (angle%(Math.PI*2))/slice) % filtered.length);

  const winner = filtered[index];

  resultBox.innerText = winner.emoji + " " + winner.activity;

  showWinner(winner);

  spinning = false;

}

function showWinner(item){

  winnerText.innerText = item.emoji + " " + item.activity;

  let sub = "";

  if(item.restaurant) sub += "Restaurant: " + item.restaurant + " ";
  if(item.movie) sub += "Movie: " + item.movie;

  winnerSub.innerText = sub;

  overlay.classList.remove("hidden");

  confettiBurst();
  coinBurst();

}

spinAgain.onclick = ()=>{
  overlay.classList.add("hidden");
  spinWheel();
};

closeWinner.onclick = ()=>{
  overlay.classList.add("hidden");
};

function confettiBurst(){

  const layer = document.getElementById("confettiLayer");

  for(let i=0;i<80;i++){

    const el = document.createElement("div");

    el.className = "confetti";

    el.style.left = Math.random()*100+"vw";
    el.style.background = ["#ffd700","#ff0040","#00e0ff"][Math.floor(Math.random()*3)];

    layer.appendChild(el);

    setTimeout(()=>el.remove(),3000);

  }

}

function coinBurst(){

  const layer = document.getElementById("coinLayer");

  for(let i=0;i<25;i++){

    const el = document.createElement("div");

    el.className = "coin";

    el.style.left = Math.random()*100+"vw";

    layer.appendChild(el);

    setTimeout(()=>el.remove(),2500);

  }

}

setInterval(()=>{

  if(!spinning){
    loadActivities();
  }

},30000);

loadActivities();
drawWheel();
