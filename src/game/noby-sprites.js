/* noby-sprites.js — canvas draw functions for the 2D stretch-game art kit.
   Every draw fn: draw(ctx, x, y, s)  where (x,y) is the BOTTOM-CENTER anchor
   and s is a uniform scale (1 = the size listed in the comment).
   No state, no deps. ctx.save/restore handled internally. */

export const PAL = {
  sky:'#A9DCEF', skyDeep:'#7FC8E5', cloud:'#FFFFFF', mtn:'#BCD7E2', snow:'#FFFFFF',
  grassLight:'#8DC63F', grass:'#6FBE44', grassDark:'#4E9B2F', path:'#9ED14E',
  trunk:'#A9793F', treeA:'#3E9B3E', treeB:'#5CB04A',
  pink:'#F4A7A1', pinkLight:'#FBD3CC', cream:'#F7E3C8',
  yellow:'#F2D64B', orange:'#F08A3C', red:'#E8443A', purple:'#7B3F98',
  blue:'#5BB7D8', blueLight:'#A8DDEF', grey:'#C9D9E3', greyDark:'#8FB8CF',
  brown:'#8A5A2B', ink:'#3A3A3A'
};

/* ---------- primitives ---------- */
const circ = (c,x,y,r,f)=>{c.fillStyle=f;c.beginPath();c.arc(x,y,r,0,7);c.fill();};
const ell  = (c,x,y,rx,ry,f,rot=0)=>{c.fillStyle=f;c.beginPath();c.ellipse(x,y,rx,ry,rot,0,7);c.fill();};
const rr   = (c,x,y,w,h,r,f)=>{c.fillStyle=f;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
const poly = (c,pts,f)=>{c.fillStyle=f;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.fill();};
const wrap = (c,x,y,s,fn)=>{c.save();c.translate(x,y);c.scale(s,s);fn(c);c.restore();};
/** soft contact shadow — call first inside any prop */
export const shadow=(c,w,h=w*0.22)=>ell(c,0,0,w/2,h/2,'rgba(40,80,30,0.16)');

/* ---------- the boy ---------- */
/* Head: 76x76 ball with face. Anchor = bottom-center of the ball. */
export function nobyHead(c,x,y,s=1,look=0){wrap(c,x,y,s,c=>{
  rr(c,-56,-64,18,11,5.5,PAL.pink); rr(c,38,-64,18,11,5.5,PAL.pink); // arm nubs
  rr(c,-28,-22,20,12,6,PAL.purple); rr(c,8,-22,20,12,6,PAL.purple);  // feet
  ell(c,0,-55,52,40,PAL.pink);                                       // wide oval head
  ell(c,0,-50,32,25,PAL.pinkLight);
  circ(c,-12+look,-55,3.4,PAL.ink); circ(c,12+look,-55,3.4,PAL.ink);
  ell(c,0+look,-51,3.6,2.6,'#E8887F');                               // nose
  ell(c,0+look,-36,6.8,5.6,PAL.orange);                              // mouth
});}

/* Tail end: 60x60 with two stubby feet. */
/* Butt end — no face, just feet. */
export function nobyTail(c,x,y,s=1){wrap(c,x,y,s,c=>{
  rr(c,-28,-20,20,12,6,PAL.purple); rr(c,8,-20,20,12,6,PAL.purple);
  circ(c,0,-46,32,PAL.pink);
});}

/* Rainbow stripe order used by the body, top -> bottom. */
export const RAINBOW=[PAL.red,PAL.orange,PAL.yellow,PAL.grassLight,PAL.blue,PAL.purple];

/* The stretchy middle: rainbow bands running along the length.
   len = distance between tail and head, h = tube thickness. */
export function nobyBody(c,x,y,len,s=1,t=0,h=44){wrap(c,x,y,s,c=>{
  const w=22, n=Math.max(3,Math.round(len/w)), amp=7;
  for(let i=0;i<n;i++){ // overlapping capsules, phase-shifted = worm wave
    const px=i*w, dy=Math.sin(t*3.3-i*0.55)*amp;
    c.fillStyle=RAINBOW[i%RAINBOW.length];
    c.beginPath();c.roundRect(px,-h+dy,w+6,h,h/2);c.fill();
  }
});}

/* Springy eat pulse. Call eat.trigger() when food is swallowed, then
   feed eat.value(t) into noby() — it drives squash-and-stretch on head+body. */
export function makeEat(dur=1.5){
  let t0=-99;
  const k=[[0,1,1],[0.22,1,1.22],[0.48,1,0.88],[0.72,1,1.08],[0.88,1,0.97],[1,1,1]];
  return {
    trigger(t){t0=t;},
    /** -> {sx, sy} scale pair, {1,1} when idle */
    value(t){
      const p=(t-t0)/dur;
      if(p<0||p>1) return {sx:1,sy:1};
      let i=0; while(i<k.length-2 && p>k[i+1][0]) i++;
      const a=k[i], b=k[i+1], u=(p-a[0])/(b[0]-a[0]);
      const e=u<0.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
      return {sx:a[1]+(b[1]-a[1])*e, sy:a[2]+(b[2]-a[2])*e};
    }
  };
}

/* Whole creature, left-to-right. len = body length in px at scale 1.
   eat = {sx,sy} from makeEat().value(t) — pass nothing for the idle loop. */
export function noby(c,x,y,len=180,s=1,t=0,eat){
  const e=eat||{sx:1,sy:1};
  const idle=1+Math.sin(t*1.5)*0.02;
  shadowUnder(c,x,y,(len+120)*s,s);
  nobyBody(c,x+30*s,y-26*s,len,s,t,44*e.sy*idle);
  c.save(); c.translate(x+34*s+len*s,y); c.scale(1,e.sy*idle); c.translate(0,-0);
  nobyHead(c,0,0,s,Math.sin(t*1.5)*1.5);
  c.restore();
  nobyTail(c,x+26*s,y,s);
}
function shadowUnder(c,x,y,w,s){c.save();c.translate(x+w/2-40*s,y-2);ell(c,0,0,w/2.4,7*s,'rgba(40,80,30,0.16)');c.restore();}

/* ---------- food (all ~90px tall) ---------- */
export function strawberry(c,x,y,s=1){wrap(c,x,y,s,c=>{shadow(c,70);
  c.fillStyle=PAL.red;c.beginPath();c.moveTo(-34,-58);c.quadraticCurveTo(-38,-6,0,-2);c.quadraticCurveTo(38,-6,34,-58);c.quadraticCurveTo(20,-76,0,-76);c.quadraticCurveTo(-20,-76,-34,-58);c.fill();
  for(let i=0;i<10;i++)circ(c,-22+((i*13)%46),-62+((i*17)%50),2.6,PAL.yellow);
  poly(c,[[-22,-74],[0,-64],[22,-74],[10,-86],[0,-78],[-10,-86]],PAL.treeA);
  rr(c,-3,-98,6,14,3,PAL.treeA);
});}

export function grapes(c,x,y,s=1){wrap(c,x,y,s,c=>{shadow(c,76);
  const rows=[[-30,-18],[-10,-18],[10,-18],[30,-18],[-20,-38],[0,-38],[20,-38],[-10,-58],[10,-58],[0,-76]];
  rows.forEach(([gx,gy])=>circ(c,gx,gy,12,PAL.purple));
  rows.forEach(([gx,gy])=>circ(c,gx-3.5,gy-4,3.5,'rgba(255,255,255,0.28)'));
  rr(c,-3,-100,6,16,3,PAL.treeA);
});}

export function dango(c,x,y,s=1){wrap(c,x,y,s,c=>{shadow(c,54);
  rr(c,-3,-110,6,108,3,'#E8D9A8');
  circ(c,0,-22,21,'#BBD6A6'); circ(c,0,-56,21,'#C9B98C'); circ(c,0,-90,21,'#DCE9A8');
});}

export function onigiri(c,x,y,s=1){wrap(c,x,y,s,c=>{shadow(c,88);
  c.fillStyle='#FFFFFF';c.beginPath();c.moveTo(-44,-4);c.quadraticCurveTo(-40,-84,0,-86);c.quadraticCurveTo(40,-84,44,-4);c.quadraticCurveTo(0,4,-44,-4);c.fill();
  rr(c,-14,-40,28,38,6,'#33372F');
});}

export function mushroom(c,x,y,s=1){wrap(c,x,y,s,c=>{shadow(c,70);
  rr(c,-14,-52,28,52,12,'#E4D3A9');
  c.fillStyle=PAL.brown;c.beginPath();c.moveTo(-56,-48);c.quadraticCurveTo(-52,-96,0,-96);c.quadraticCurveTo(52,-96,56,-48);c.quadraticCurveTo(0,-38,-56,-48);c.fill();
  [[-32,-62],[-8,-74],[18,-62],[36,-54],[2,-52]].forEach(([dx,dy])=>circ(c,dx,dy,7,PAL.orange));
});}

export function apple(c,x,y,s=1){wrap(c,x,y,s,c=>{shadow(c,64);
  circ(c,0,-34,32,'#B6D96B'); circ(c,-10,-44,9,'rgba(255,255,255,0.3)');
  rr(c,-2,-76,5,16,2.5,PAL.brown);
});}

/* ---------- scenery props ---------- */
export function treeRound(c,x,y,s=1){wrap(c,x,y,s,c=>{shadow(c,80);
  rr(c,-10,-52,20,52,8,PAL.trunk); circ(c,0,-84,48,PAL.treeA);
});}
export function treeTall(c,x,y,s=1){wrap(c,x,y,s,c=>{shadow(c,60);
  rr(c,-8,-46,16,46,7,PAL.trunk); ell(c,0,-70,34,30,PAL.treeB); ell(c,0,-102,26,24,PAL.treeA);
});}
export function bush(c,x,y,s=1){wrap(c,x,y,s,c=>{shadow(c,90);
  circ(c,-24,-16,22,PAL.grass); circ(c,24,-16,20,PAL.grass); circ(c,0,-28,28,PAL.grassLight);
});}
export function flower(c,x,y,s=1){wrap(c,x,y,s,c=>{
  rr(c,-2.5,-46,5,46,2.5,PAL.grassDark);
  for(let i=0;i<6;i++){const a=i*Math.PI/3;ell(c,Math.cos(a)*13,-52+Math.sin(a)*13,9,6,'#FFFFFF',a);}
  circ(c,0,-52,7,PAL.yellow);
});}
export function car(c,x,y,s=1){wrap(c,x,y,s,c=>{shadow(c,150);
  rr(c,-74,-42,148,34,16,PAL.blue);
  c.fillStyle=PAL.blue;c.beginPath();c.roundRect(-44,-70,80,34,14);c.fill();
  rr(c,-36,-64,32,22,7,PAL.blueLight); rr(c,2,-64,28,22,7,PAL.blueLight);
  circ(c,-44,-8,15,'#5A5F62'); circ(c,44,-8,15,'#5A5F62');
  circ(c,-44,-8,6,PAL.grey); circ(c,44,-8,6,PAL.grey);
});}
export function building(c,x,y,s=1){wrap(c,x,y,s,c=>{shadow(c,110);
  rr(c,-50,-160,100,160,8,PAL.grey);
  for(let r=0;r<7;r++)for(let k=0;k<4;k++)rr(c,-36+k*22,-146+r*20,12,12,3,PAL.greyDark);
  rr(c,-22,-34,44,34,4,PAL.blueLight);
});}
export function giraffe(c,x,y,s=1){wrap(c,x,y,s,c=>{shadow(c,110);
  const Y='#E8D96A',B='#9C6B2F';
  rr(c,-46,-24,18,24,8,Y); rr(c,-8,-24,18,24,8,Y); rr(c,26,-24,18,24,8,Y);
  rr(c,-52,-92,104,74,32,Y);
  rr(c,22,-186,30,102,14,Y);
  rr(c,14,-206,52,30,14,Y);
  rr(c,58,-200,16,10,5,Y);
  rr(c,26,-224,6,20,3,Y); rr(c,46,-224,6,20,3,Y);
  circ(c,29,-216,5,B); circ(c,49,-216,5,B);
  ell(c,50,-188,18,12,'#F5EDBE');
  circ(c,40,-197,3.2,PAL.ink); circ(c,58,-197,3.2,PAL.ink);
  ell(c,50,-193,3.2,2.3,'#C9A84E'); ell(c,53,-183,6,5,PAL.orange);
  [[-30,-70],[6,-54],[26,-76],[-8,-84],[34,-44]].forEach(([dx,dy])=>circ(c,dx,dy,11,B));
});}
/* rainbow-roofed house person — 150x150 at s=1 */
export function house(c,x,y,s=1){wrap(c,x,y,s,c=>{shadow(c,92);
  circ(c,0,-54,46,'#FFFFFF');
  c.save();
  c.beginPath();c.ellipse(0,-76,72,62,0,Math.PI,0);c.closePath();c.clip();
  const bands=[[PAL.red,13],[PAL.orange,11],[PAL.yellow,11],[PAL.grassLight,11],[PAL.blue,11],[PAL.purple,12]];
  let yy=-142; bands.forEach(([col,h])=>{c.fillStyle=col;c.fillRect(-75,yy,150,h+0.5);yy+=h;});
  c.restore();
  circ(c,-18,-58,9,PAL.blue); circ(c,18,-58,9,PAL.blue);
  circ(c,-18,-58,3.4,'#FFFFFF'); circ(c,18,-58,3.4,'#FFFFFF');
  c.save();c.translate(1,-43);c.rotate(-0.21);rr(c,-13,-3.5,26,7,3.5,PAL.pink);c.restore();
  ell(c,0,-28,8,7,PAL.orange);
});}

export function cloud(c,x,y,s=1){wrap(c,x,y,s,c=>{
  circ(c,-34,-18,20,PAL.cloud); circ(c,-2,-28,28,PAL.cloud); circ(c,32,-16,22,PAL.cloud);
  rr(c,-54,-18,108,20,10,PAL.cloud);
});}
export function mountain(c,x,y,s=1){wrap(c,x,y,s,c=>{
  poly(c,[[-150,0],[-46,-124],[0,-70],[54,-150],[150,0]],PAL.mtn);
  poly(c,[[-46,-124],[-22,-96],[-34,-90],[-58,-96]],PAL.snow);
  poly(c,[[54,-150],[80,-114],[64,-108],[42,-116],[30,-110]],PAL.snow);
});}
export function ufo(c,x,y,s=1){wrap(c,x,y,s,c=>{
  ell(c,0,-40,26,20,PAL.cloud);
  ell(c,0,-24,62,18,'#DCE4E8');
  [[-30,-16],[0,-14],[30,-16]].forEach(([dx,dy])=>circ(c,dx,dy,9,PAL.yellow));
});}
export function fairy(c,x,y,s=1,t=0){wrap(c,x,y,s,c=>{shadow(c,60);
  const f=Math.sin(t*8)*6;
  ell(c,-14,-44,20,26,'rgba(255,255,255,0.55)',f/40); ell(c,16,-44,18,24,'rgba(255,255,255,0.55)',-f/40);
  ell(c,0,-34,26,30,PAL.yellow); ell(c,0,-34,17,16,'#FAEBA8');
  circ(c,-7,-39,3.2,PAL.ink); circ(c,7,-39,3.2,PAL.ink);
  ell(c,0,-35,3.2,2.3,'#E0B84A'); ell(c,0,-25,6,5.2,PAL.orange);
  rr(c,-14,-74,4,20,2,PAL.ink); rr(c,10,-74,4,20,2,PAL.ink);
  circ(c,-12,-76,5,PAL.grassDark); circ(c,12,-76,5,PAL.grassDark);
  [0,1,2,3].forEach(i=>circ(c,-26-i*11,-6,6,'#E86FA8'));
});}
/* stretchy bystander — the pink-headed stalk people */
export function friend(c,x,y,s=1,t=0){wrap(c,x,y,s,c=>{shadow(c,50);
  const sway=Math.sin(t*1.6)*4;
  rr(c,-13,-108,26,108,13,PAL.grassLight);
  c.save();c.translate(sway,0);
  ell(c,0,-128,34,29,PAL.pink); ell(c,0,-124,21,18,PAL.pinkLight);
  circ(c,-8,-129,3.2,PAL.ink); circ(c,8,-129,3.2,PAL.ink);
  ell(c,0,-125,3.2,2.3,'#E8887F'); ell(c,0,-114,6.2,5.2,PAL.orange);
  rr(c,-44,-150,18,10,5,PAL.pink); rr(c,26,-150,18,10,5,PAL.pink);
  c.restore();
});}

/* ---------- ground + parallax helper ---------- */
export function ground(c,w,h,horizon){
  const g=c.createLinearGradient(0,horizon,0,h);
  g.addColorStop(0,PAL.grassLight);g.addColorStop(1,PAL.grass);
  c.fillStyle=g;c.fillRect(0,horizon,w,h-horizon);
  c.fillStyle=PAL.grassDark;c.globalAlpha=0.25;
  c.beginPath();c.ellipse(w*0.3,horizon+40,w*0.5,60,0,0,7);c.fill();c.globalAlpha=1;
}
export function sky(c,w,h){
  const g=c.createLinearGradient(0,0,0,h);
  g.addColorStop(0,PAL.skyDeep);g.addColorStop(1,PAL.sky);
  c.fillStyle=g;c.fillRect(0,0,w,h);
}
/** Repeat a prop across a scrolling layer.
 *  layer(ctx, camX, speed, spacing, width, y, (ctx,x,y,i)=>{...}) */
export function layer(c,camX,speed,spacing,width,y,draw){
  const off=(camX*speed)%spacing;
  for(let i=-1;i*spacing-off<width+spacing;i++){
    const px=i*spacing-off;
    draw(c,px,y,i);
  }
}
