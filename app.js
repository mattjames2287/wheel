const canvas=document.getElementById("wheel");
const ctx=canvas.getContext("2d");

let activities=[];
let angle=0;

const result=document.getElementById("result");

function drawWheel(){
ctx.clearRect(0,0,720,720);
if(!activities.length)return;

const slice=(Math.PI*2)/activities.length;

activities.forEach((a,i)=>{
const start=angle+i*slice;
ctx.beginPath();
ctx.moveTo(360,360);
ctx.arc(360,360,360,start,start+slice);
ctx.fillStyle=i%2?"#8b0000":"#111";
ctx.fill();

ctx.save();
ctx.translate(360,360);
ctx.rotate(start+slice/2);
ctx.fillStyle="#fff";
ctx.font="18px sans-serif";
ctx.fillText(a.emoji+" "+a.activity,200,0);
ctx.restore();
});
}

function spin(){
if(!activities.length)return;
angle+=Math.PI*4;
drawWheel();
const win=activities[Math.floor(Math.random()*activities.length)];
result.textContent=win.emoji+" "+win.activity;
}

document.getElementById("spin").onclick=spin;

activities=[
{emoji:"🎳",activity:"Bowling",restaurant:"Italian",movie:"Comedy"},
{emoji:"🍿",activity:"Movie Night",restaurant:"Burgers",movie:"Action"}
];

drawWheel();
