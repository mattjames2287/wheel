
const wheel = document.getElementById("wheel");
const ctx = wheel.getContext("2d");
const spinBtn = document.getElementById("spin");
const dateNightBtn = document.getElementById("dateNight");
const bucketSelect = document.getElementById("bucket");

let activities = [];

async function loadActivities(){
const res = await fetch("activities.json");
activities = await res.json();
drawWheel();
}

function filteredActivities(){

if(bucketSelect.value==="all") return activities;

return activities.filter(a=>a.price===bucketSelect.value);

}

function drawWheel(){

const items = filteredActivities();
ctx.clearRect(0,0,500,500);

const arc = Math.PI*2/items.length;

items.forEach((item,i)=>{

ctx.beginPath();
ctx.fillStyle = i%2 ? "#c40000":"#000";
ctx.moveTo(250,250);
ctx.arc(250,250,250,i*arc,(i+1)*arc);
ctx.fill();

ctx.fillStyle="white";
ctx.save();
ctx.translate(250,250);
ctx.rotate(i*arc + arc/2);
ctx.fillText(item.emoji+" "+item.activity,100,0);
ctx.restore();

});

}

spinBtn.onclick=()=>{

const items = filteredActivities();
const result = items[Math.floor(Math.random()*items.length)];

document.getElementById("result").innerText = result.emoji+" "+result.activity;

confetti();

};

dateNightBtn.onclick=()=>{

const items = filteredActivities();
const result = items[Math.floor(Math.random()*items.length)];

document.getElementById("result").innerText =
result.activity+" | "+result.restaurant+" | "+result.movie;

confetti();

};

function confetti(){

for(let i=0;i<50;i++){
const div=document.createElement("div");
div.className="confetti";
div.style.position="fixed";
div.style.top="0";
div.style.left=Math.random()*100+"vw";
div.style.width="6px";
div.style.height="6px";
div.style.background="gold";
div.style.animation="fall 2s linear";
document.body.appendChild(div);

setTimeout(()=>div.remove(),2000);
}

}

loadActivities();
