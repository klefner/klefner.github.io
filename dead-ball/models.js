// Dead Ball cartoon zombie renderer, ¾ view.
// drawZombie(ctx, x, y, size, o): (x,y) = feet on the ground, size = on-screen height in px of a standing QB.
// o = {team:STYLE, body:'line'|'wr'|'qb'|'rb', view:'front'|'back'|'side', flip:bool, phase:rad, speed:0..1,
//      limbs:{la,ra,ll,rl,head}, pose:'run'|'stand'|'zombie'|'carry'|'down'|'dive'|'block', num:int, t:seconds, seed:int}
const ZSTYLE={
  zombie:{jersey:'#6a2c9c',jerseyDk:'#4a1a72',trim:'#f3c34b',pants:'#e8dcc0',pantsDk:'#bfae8c',sock:'#6a2c9c',
    helmet:'#5a2388',helmetHi:'#9a5fd0',stripe:'#f3c34b',mask:'#c9ccd2',skin:'#9fbf86',skinDk:'#6f8f5c',skinHi:'#c4dcab',species:'zombie'},
  mummy:{jersey:'#c25a26',jerseyDk:'#8e3a12',trim:'#efe6cf',pants:'#3a2a20',pantsDk:'#24180f',sock:'#c25a26',
    helmet:'#c9561f',helmetHi:'#f39a5e',stripe:'#efe6cf',mask:'#e9d9a6',skin:'#d8ccaa',skinDk:'#a89870',skinHi:'#f2ead2',species:'mummy'}};
const ZBODY={
  line:{w:1.42,leg:24,legW:12,arm:24,armW:11,torso:32,head:0.96,belly:1},
  rb:  {w:1.14,leg:28,legW:10.5,arm:25,armW:9.5,torso:30,head:0.98,belly:0},
  qb:  {w:1.0, leg:31,legW:9,arm:27,armW:8.2,torso:29,head:1.0,belly:0},
  wr:  {w:0.84,leg:36,legW:7.4,arm:31,armW:6.6,torso:28,head:1.02,belly:0}};
const ZOUT='#1b1a17';

function zLimb(c,pts,w,col,hi){              // a cartoon limb: dark outline stroke, then color, then a thin highlight
  c.lineCap='round';c.lineJoin='round';
  c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);
  c.strokeStyle=ZOUT;c.lineWidth=w+5;c.stroke();c.strokeStyle=col;c.lineWidth=w;c.stroke();
  if(hi){c.strokeStyle=hi;c.lineWidth=Math.max(1.2,w*0.22);c.globalAlpha=0.55;c.beginPath();
    c.moveTo(pts[0][0]-w*0.2,pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0]-w*0.2,pts[i][1]);c.stroke();c.globalAlpha=1;}}
function zFill(c,col,lw){c.fillStyle=col;c.fill();c.strokeStyle=ZOUT;c.lineWidth=lw||3;c.stroke();}
function zEll(c,x,y,rx,ry,col,lw){c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);zFill(c,col,lw);}
function zStump(c,x,y,r,bone){                 // ragged bloody stump with a bone nub
  c.beginPath();for(let i=0;i<10;i++){const a=i/10*Math.PI*2,rr=r*(i%2?0.78:1.05);c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();zFill(c,'#a3121a',2.2);
  zEll(c,x,y,r*0.55,r*0.5,'#5e0a0e',0);if(bone){zEll(c,x+r*0.12,y-r*0.1,r*0.3,r*0.28,'#f4ecd6',1.6);}}
function zLeg(c,S,B,side,hip,foot,knee,mum){  // pants to the knee, team sock, chunky cleat
  zLimb(c,[hip,knee],B.legW+2,S.pants,'#fff');
  zLimb(c,[knee,foot],B.legW*0.85,mum?S.skin:S.sock,mum?S.skinHi:null);
  if(mum){c.strokeStyle=S.skinDk;c.lineWidth=1.2;for(let k=0.25;k<0.95;k+=0.25){const x=knee[0]+(foot[0]-knee[0])*k,y=knee[1]+(foot[1]-knee[1])*k;c.beginPath();c.moveTo(x-B.legW*0.45,y-1.5);c.lineTo(x+B.legW*0.45,y+1.5);c.stroke();}}
  else{const x=knee[0]+(foot[0]-knee[0])*0.35,y=knee[1]+(foot[1]-knee[1])*0.35;c.strokeStyle=S.trim;c.lineWidth=2.4;c.beginPath();c.moveTo(x-B.legW*0.42,y);c.lineTo(x+B.legW*0.42,y);c.stroke();}
  zEll(c,foot[0]+side*1.5,foot[1]+1.5,B.legW*0.72,B.legW*0.42,'#22211d',2.4);
  c.fillStyle='#fff';c.globalAlpha=0.35;c.beginPath();c.ellipse(foot[0]+side*1.5-1,foot[1],B.legW*0.35,1.4,0,0,7);c.fill();c.globalAlpha=1;}
function zHand(c,S,x,y,r,claw){zEll(c,x,y,r,r*0.9,S.skin,2.4);
  if(claw){c.strokeStyle=ZOUT;c.lineWidth=1.6;for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(x+i*r*0.5,y+r*0.5);c.lineTo(x+i*r*0.6,y+r*1.1);c.stroke();}}}
function zArm(c,S,B,sh,el,hand,claw,mum){
  zLimb(c,[sh,el,hand],B.armW,S.skin,S.skinHi);
  if(mum){c.strokeStyle=S.skinDk;c.lineWidth=1.1;for(const [a,b] of [[sh,el],[el,hand]])for(let k=0.3;k<1;k+=0.35){const x=a[0]+(b[0]-a[0])*k,y=a[1]+(b[1]-a[1])*k;c.beginPath();c.moveTo(x-B.armW*0.5,y-1);c.lineTo(x+B.armW*0.5,y+1.5);c.stroke();}}
  else{zEll(c,el[0],el[1],B.armW*0.32,B.armW*0.26,S.skinDk,0);}
  const sx=sh[0]+(el[0]-sh[0])*0.5,sy=sh[1]+(el[1]-sh[1])*0.5;
  zLimb(c,[sh,[sx,sy]],B.armW+3.5,S.jersey);                         // short sleeve
  c.strokeStyle=S.trim;c.lineWidth=2;c.beginPath();c.moveTo(sx-(B.armW*0.5),sy);c.lineTo(sx+(B.armW*0.5),sy);c.stroke();
  zHand(c,S,hand[0],hand[1],B.armW*0.62,claw);}
function zNumber(c,S,n,x,y,sz){c.font=`900 ${sz}px Arial Black, Arial, sans-serif`;c.textAlign='center';c.textBaseline='middle';
  c.lineWidth=3;c.strokeStyle=S.jerseyDk;c.strokeText(n,x,y);c.fillStyle=S.trim;c.fillText(n,x,y);}
function zTorso(c,S,B,o,sy,hy,back){           // jersey with shoulder pads, belly, rips or bandage strips
  const w=B.w,top=15*w,bot=(B.belly?17:10)*w;
  c.beginPath();c.moveTo(-top,sy+4);c.quadraticCurveTo(-top-2,hy-6,-bot,hy);c.quadraticCurveTo(0,hy+(B.belly?7:3),bot,hy);
  c.quadraticCurveTo(top+2,hy-6,top,sy+4);c.quadraticCurveTo(0,sy-2,-top,sy+4);c.closePath();
  const g=c.createLinearGradient(-top,0,top,0);g.addColorStop(0,S.jersey);g.addColorStop(0.65,S.jersey);g.addColorStop(1,S.jerseyDk);
  zFill(c,g,3);
  if(!back){                                  // a rip in the jersey showing rotten skin, or loose bandage
    if(S.species==='zombie'){c.beginPath();const rx=bot*0.35,ry=hy-9;c.moveTo(rx-5,ry-4);c.lineTo(rx-1,ry-7);c.lineTo(rx+2,ry-3);c.lineTo(rx+6,ry-6);c.lineTo(rx+5,ry+2);c.lineTo(rx-4,ry+3);c.closePath();zFill(c,S.skinDk,1.6);
      c.strokeStyle='#4d3a3a';c.lineWidth=1;c.beginPath();c.moveTo(rx-2,ry-3);c.lineTo(rx+3,ry-2);c.moveTo(rx-2,ry);c.lineTo(rx+3,ry+0.5);c.stroke();}
    else{c.strokeStyle=S.skin;c.lineWidth=3.2;c.beginPath();c.moveTo(-bot*0.6,hy-3);c.quadraticCurveTo(-bot*0.2,hy+4,-bot*0.1,hy+11);c.stroke();c.strokeStyle=S.skinDk;c.lineWidth=0.8;c.stroke();}}
  zNumber(c,S,o.num,0,sy+(hy-sy)*(back?0.48:0.5),back?15:11);
  for(const s of [-1,1]){c.beginPath();c.ellipse(s*(top-1),sy+3,9*w,6.5,s*0.25,0,7);zFill(c,S.jersey,2.6);
    c.strokeStyle=S.trim;c.lineWidth=2;c.beginPath();c.ellipse(s*(top-1),sy+3,6*w,3.5,s*0.25,Math.PI*0.15,Math.PI*0.85);c.stroke();}}
function zTorsoSide(c,S,B,o,sy,hy,lean){     // profile torso: one shoulder pad, belly forward, sleeve number
  const w=B.w*0.78,f=lean;
  c.beginPath();c.moveTo(-10*w+f*0.3,sy+3);c.quadraticCurveTo(-13*w,hy-8,-9*w,hy);c.lineTo(9*w+(B.belly?7:0),hy);
  c.quadraticCurveTo(13*w+(B.belly?10:0)+f*0.4,hy-12,10*w+f,sy+4);c.quadraticCurveTo(0+f*0.6,sy-3,-10*w+f*0.3,sy+3);c.closePath();
  const g=c.createLinearGradient(0,sy,0,hy);g.addColorStop(0,S.jersey);g.addColorStop(1,S.jerseyDk);zFill(c,g,3);
  if(S.species==='zombie'){c.beginPath();const rx=3*w+f*0.5,ry=hy-8;c.moveTo(rx-4,ry-3);c.lineTo(rx,ry-6);c.lineTo(rx+4,ry-2);c.lineTo(rx+2,ry+3);c.lineTo(rx-3,ry+2);c.closePath();zFill(c,S.skinDk,1.5);}
  c.beginPath();c.ellipse(1*w+f*0.6,sy+4,10*w+2,7.5,-0.15,0,7);zFill(c,S.jersey,2.6);
  c.strokeStyle=S.trim;c.lineWidth=2;c.beginPath();c.ellipse(1*w+f*0.6,sy+4,7*w+1,4,-0.15,Math.PI*0.15,Math.PI*0.85);c.stroke();
  zNumber(c,S,o.num,1*w+f*0.6,sy+4,8);}
function zFace(c,S,hx,hy,r,o,view){            // big goofy face; hx,hy = head center
  const t=o.t||0,seed=o.seed||0,blink=((t*0.7+seed*0.37)%3)<0.09,side=view==='side';
  const g=c.createRadialGradient(hx-r*0.3,hy+r*0.05,r*0.15,hx,hy+r*0.2,r*1.05);g.addColorStop(0,S.skinHi);g.addColorStop(0.55,S.skin);g.addColorStop(1,S.skinDk);
  c.beginPath();if(side){c.ellipse(hx+r*0.06,hy+r*0.08,r*0.95,r*0.98,0,0,7);}else c.ellipse(hx,hy+r*0.08,r,r*1.02,0,0,7);zFill(c,g,3);
  if(side){c.beginPath();c.ellipse(hx+r*0.98,hy+r*0.2,r*0.16,r*0.13,0,0,7);zFill(c,S.skin,2);}              // nose
  if(S.species==='zombie'){
    const eyes=side?[[hx+r*0.55,hy+r*0.12,1]]:[[hx-r*0.36,hy+r*0.14,1],[hx+r*0.38,hy+r*0.2,0]];
    for(const [ex,ey,big] of eyes){const er=big?r*0.32:r*0.22;
      c.fillStyle='rgba(70,30,80,0.35)';c.beginPath();c.ellipse(ex,ey+er*0.2,er*1.2,er*1.15,0,0,7);c.fill();
      zEll(c,ex,ey,er,blink?er*0.1:er*(big?1.05:0.85),'#fffbe6',2);
      if(!blink){const px=ex+(side?er*0.3:(big?er*0.15:-er*0.1)),py=ey+(big?er*0.05:er*0.2);c.fillStyle='#e8442e';c.beginPath();c.arc(px,py,er*0.42,0,7);c.fill();c.fillStyle='#111';c.beginPath();c.arc(px,py,er*0.22,0,7);c.fill();
        c.fillStyle='#fff';c.beginPath();c.arc(px-er*0.15,py-er*0.18,er*0.11,0,7);c.fill();}
      if(!big){c.strokeStyle=ZOUT;c.lineWidth=2.4;c.beginPath();c.moveTo(ex-er,ey-er*0.55);c.lineTo(ex+er*0.9,ey-er*0.15);c.stroke();}}
    // stitches across one cheek
    if(!side){c.strokeStyle='#3d2a2a';c.lineWidth=1.4;c.beginPath();c.moveTo(hx-r*0.85,hy+r*0.5);c.quadraticCurveTo(hx-r*0.6,hy+r*0.62,hx-r*0.38,hy+r*0.52);c.stroke();
      for(let i=0;i<4;i++){const sx=hx-r*0.8+i*r*0.13;c.beginPath();c.moveTo(sx,hy+r*0.47);c.lineTo(sx+r*0.03,hy+r*0.63);c.stroke();}}
    // wide open mouth, crooked teeth, tongue
    const mo=0.65+Math.sin(t*5+seed)*0.3,mx=side?hx+r*0.6:hx+r*0.06,my=hy+r*0.66,mw=side?r*0.32:r*0.48,mh=r*0.22*mo+r*0.06;
    c.beginPath();c.ellipse(mx,my,mw,mh,side?0.25:0.08,0,7);zFill(c,'#3a0d13',2.2);
    c.save();c.beginPath();c.ellipse(mx,my,mw,mh,side?0.25:0.08,0,7);c.clip();
    c.fillStyle='#d9506a';c.beginPath();c.ellipse(mx+mw*0.2,my+mh*0.8,mw*0.5,mh*0.6,0,0,7);c.fill();
    c.fillStyle='#f6efcf';c.strokeStyle='#8a7a5a';c.lineWidth=0.8;
    for(const [dx,h,w] of (side?[[0.1,1,0.25],[0.6,0.7,0.2]]:[[-0.55,0.9,0.18],[-0.2,1.2,0.22],[0.3,0.7,0.2],[0.62,1,0.16]])){c.beginPath();c.rect(mx+dx*mw-w*mw*0.5,my-mh-1,w*mw,mh*0.55*h+2);c.fill();c.stroke();}
    c.restore();
  }else{
    c.strokeStyle=S.skinDk;c.lineWidth=1.6;
    for(let i=-3;i<=4;i++){const yy=hy+i*r*0.24;c.beginPath();c.moveTo(hx-r*1.05,yy-r*0.08*(i%2?1:-1));c.quadraticCurveTo(hx,yy+r*0.1,hx+r*1.05,yy+r*0.08*(i%2?-1:1));c.stroke();}
    c.fillStyle='#1d140c';c.beginPath();if(side)c.ellipse(hx+r*0.55,hy+r*0.15,r*0.4,r*0.24,0.1,0,7);else c.ellipse(hx,hy+r*0.17,r*0.78,r*0.27,0.04,0,7);c.fill();
    const gl=0.8+Math.sin(t*5+seed)*0.2;c.shadowColor='#ffd23a';c.shadowBlur=8;c.fillStyle=`rgba(255,226,70,${gl})`;
    for(const [ex,er] of side?[[hx+r*0.62,0.15]]:[[hx-r*0.36,0.17],[hx+r*0.38,0.13]]){c.beginPath();c.ellipse(ex,hy+r*0.17,r*er,blink?r*0.02:r*er*0.75,0,0,7);c.fill();}
    c.shadowBlur=0;
    // dark mouth slit through the wraps
    c.fillStyle='#2a1a10';c.beginPath();c.ellipse(side?hx+r*0.6:hx+r*0.05,hy+r*0.68,side?r*0.22:r*0.32,r*0.07+r*0.05*Math.abs(Math.sin(t*3+seed)),0,0,7);c.fill();
    if(!side){c.beginPath();c.moveTo(hx+r*0.7,hy+r*0.45);c.quadraticCurveTo(hx+r*1.35,hy+r*0.9+Math.sin(t*4)*3,hx+r*1.15,hy+r*1.45+Math.sin(t*4)*3);c.lineTo(hx+r*0.95,hy+r*1.35);c.quadraticCurveTo(hx+r*1.05,hy+r*0.9,hx+r*0.55,hy+r*0.62);c.closePath();zFill(c,S.skinHi,1.6);}}}
function zHelmet(c,S,hx,hy,r,view,o){           // helmet sits high like a cap; face shows below it
  const g=c.createRadialGradient(hx-r*0.35,hy-r*0.6,r*0.1,hx,hy-r*0.3,r*1.15);g.addColorStop(0,S.helmetHi);g.addColorStop(0.5,S.helmet);g.addColorStop(1,S.helmet);
  c.beginPath();
  if(view==='front'){c.moveTo(hx-r*1.08,hy+r*0.32);c.bezierCurveTo(hx-r*1.2,hy-r*1.35,hx+r*1.2,hy-r*1.35,hx+r*1.08,hy+r*0.32);c.lineTo(hx+r*0.82,hy+r*0.34);c.quadraticCurveTo(hx+r*0.86,hy-r*0.12,hx,hy-r*0.16);c.quadraticCurveTo(hx-r*0.86,hy-r*0.12,hx-r*0.82,hy+r*0.34);c.closePath();}
  else if(view==='back'){c.moveTo(hx-r*1.08,hy+r*0.55);c.bezierCurveTo(hx-r*1.2,hy-r*1.35,hx+r*1.2,hy-r*1.35,hx+r*1.08,hy+r*0.55);c.quadraticCurveTo(hx,hy+r*0.8,hx-r*1.08,hy+r*0.55);c.closePath();}
  else{c.moveTo(hx-r*1.05,hy+r*0.5);c.bezierCurveTo(hx-r*1.25,hy-r*1.3,hx+r*1.1,hy-r*1.45,hx+r*0.95,hy-r*0.12);c.quadraticCurveTo(hx+r*0.3,hy-r*0.22,hx+r*0.05,hy+r*0.1);c.quadraticCurveTo(hx-r*0.05,hy+r*0.55,hx-r*1.05,hy+r*0.5);c.closePath();}
  zFill(c,g,3);
  c.save();c.clip();c.fillStyle=S.stripe;
  if(view==='side'){c.beginPath();c.ellipse(hx-r*0.1,hy-r*0.35,r*1.4,r*0.85,-0.15,Math.PI*1.05,Math.PI*1.75);c.lineWidth=r*0.22;c.strokeStyle=S.stripe;c.stroke();}
  else c.fillRect(hx-r*0.14,hy-r*1.4,r*0.28,r*2.4);
  c.restore();
  c.fillStyle='rgba(255,255,255,0.6)';c.beginPath();c.ellipse(hx-r*0.45,hy-r*0.72,r*0.25,r*0.12,-0.6,0,7);c.fill();
  if(view==='front'){                            // single facemask bar; on zombies it has snapped on one side and dangles
    const broken=S.species==='zombie',sw=Math.sin((o.t||0)*4+(o.seed||0))*0.12;
    const bar=()=>{c.beginPath();c.moveTo(hx-r*0.95,hy+r*0.3);if(broken){c.quadraticCurveTo(hx-r*0.75,hy+r*1.0,hx-r*0.15+sw*r,hy+r*1.25);}else{c.quadraticCurveTo(hx,hy+r*0.85,hx+r*0.95,hy+r*0.3);}};
    c.lineCap='round';bar();c.strokeStyle=ZOUT;c.lineWidth=5;c.stroke();bar();c.strokeStyle=S.mask;c.lineWidth=2.6;c.stroke();
    if(broken){c.strokeStyle=ZOUT;c.lineWidth=5;c.beginPath();c.moveTo(hx+r*0.95,hy+r*0.3);c.lineTo(hx+r*0.78,hy+r*0.5);c.stroke();c.strokeStyle=S.mask;c.lineWidth=2.6;c.stroke();}
    for(const s of [-1,1])zEll(c,hx+s*r*0.98,hy+r*0.3,r*0.12,r*0.12,S.mask,1.6);}
  else if(view==='side'){c.lineCap='round';const bar=()=>{c.beginPath();c.moveTo(hx+r*0.15,hy+r*0.2);c.quadraticCurveTo(hx+r*1.05,hy+r*0.45,hx+r*1.15,hy+r*0.95);};
    bar();c.strokeStyle=ZOUT;c.lineWidth=5;c.stroke();bar();c.strokeStyle=S.mask;c.lineWidth=2.6;c.stroke();zEll(c,hx+r*0.15,hy+r*0.2,r*0.12,r*0.12,S.mask,1.6);}}
function zHead(c,S,B,o,hx,hy,view){
  const r=21*B.head;
  if(view==='back'){const g=c.createRadialGradient(hx,hy,r*0.2,hx,hy+r*0.2,r*1.05);g.addColorStop(0,S.skin);g.addColorStop(1,S.skinDk);c.beginPath();c.ellipse(hx,hy+r*0.1,r*0.98,r,0,0,7);zFill(c,g,3);
    if(S.species==='mummy'){c.strokeStyle=S.skinDk;c.lineWidth=1.6;for(let i=0;i<4;i++){c.beginPath();c.moveTo(hx-r,hy+r*(0.4+i*0.18));c.lineTo(hx+r,hy+r*(0.5+i*0.18));c.stroke();}}}
  else zFace(c,S,hx,hy,r,o,view);
  zHelmet(c,S,hx,hy,r,view,o);}
function drawZombie(c,x,y,size,o){
  const S=o.team,B=ZBODY[o.body||'qb'],L=o.limbs||{la:1,ra:1,ll:1,rl:1,head:1},mum=S.species==='mummy';
  let view=o.view||'front',pose=o.pose||'run';const ph=o.phase||0,spd=o.speed==null?1:o.speed;
  c.save();c.translate(x,y);const k=size/100;c.scale(k*(o.flip?-1:1),k);
  // shadow
  c.fillStyle='rgba(0,0,0,0.28)';c.beginPath();c.ellipse(0,1,pose==='down'||pose==='dive'?52:24*B.w+4,7,0,0,7);c.fill();
  if(pose==='down'){c.translate(46,-9);c.rotate(-Math.PI/2);view='side';}          // flat on his back, head to the left
  else if(pose==='dive'){c.translate(-44,-26);c.rotate(Math.PI/2*0.82);view='side';}  // airborne, head first to the right
  const bob=pose==='stand'||pose==='down'?Math.sin((o.t||0)*2.2)*0.8:-Math.abs(Math.sin(ph))*3*spd;
  const lean=view==='side'&&pose!=='stand'&&pose!=='down'?6*spd:0;
  const hip=-B.leg+bob,sh=hip-B.torso,hd=sh-19*B.head;
  c.translate(0,0);
  const legOK={l:L.ll,r:L.rl},armOK={l:L.la,r:L.ra};
  // ---------- legs
  const legs=[];
  for(const [s,key] of [[-1,'l'],[1,'r']]){
    const hx=s*7*B.w;let foot,knee;
    if(view==='side'){const a=ph+(s>0?Math.PI:0);const st=pose==='stand'?0:Math.sin(a)*14*spd*(B.leg/30),lift=pose==='stand'?0:Math.max(0,Math.cos(a))*9*spd;
      foot=[st+lean*0.2,-lift];knee=[(st*0.55)+5*spd+lean*0.5,hip*0.5-lift*0.6];legs.push([s,[lean,hip],foot,knee,key]);}
    else{const a=ph+(s>0?Math.PI:0),lift=pose==='stand'?0:Math.max(0,Math.sin(a))*B.leg*0.32*spd;
      foot=[hx*(B.belly?1.15:1),-lift];knee=[hx*1.05,hip*0.5-lift*0.5];legs.push([s,[hx,hip],foot,knee,key]);}}
  if(view==='side')legs.sort((a,b)=>a[0]-b[0]);
  for(const [s,hp,ft,kn,key] of legs){if(legOK[key])zLeg(c,S,B,s,hp,ft,kn,mum);else zStump(c,hp[0],hp[1]+3,B.legW*0.7,true);}
  // ---------- arms helper
  const armPts=(s)=>{const sx=view==='side'?lean+(s>0?2:-2):s*16*B.w,sp=[sx,sh+6];let el,hn;
    if(pose==='zombie'||pose==='block'){ if(view==='side'){el=[sx+B.arm*0.55,sh+8+(s>0?0:2)];hn=[sx+B.arm*1.05,sh+10+Math.sin((o.t||0)*3+s)*2];}
                       else if(view==='front'){el=[s*12*B.w,sh+12];hn=[s*8*B.w,sh+16+Math.sin((o.t||0)*3+s)*1.5];}
                       else{el=[s*20*B.w,sh+14];hn=[s*19*B.w,sh+22];} }
    else if(pose==='carry'&&s>0){el=view==='side'?[sx+4,sh+B.arm*0.6]:[s*15*B.w,sh+B.arm*0.6];hn=view==='side'?[sx+9,sh+B.arm*0.45]:[s*4,sh+B.arm*0.5];}
    else{const sw=pose==='stand'||pose==='down'?0:Math.sin(ph+(s>0?0:Math.PI))*spd;
      if(view==='side'){el=[sx+sw*9,sh+B.arm*0.5];hn=[sx+sw*16+4,sh+B.arm*0.88-Math.abs(sw)*4];}
      else{el=[s*(19*B.w+2),sh+B.arm*0.5-sw*3];hn=[s*(19*B.w+1),sh+B.arm*0.95-sw*7];}}
    return [sp,el,hn];};
  const drawArm=(s,key)=>{const [sp,el,hn]=armPts(s);if(armOK[key])zArm(c,S,B,sp,el,hn,pose==='zombie',mum);else zStump(c,sp[0],sp[1],B.armW*0.75,true);};
  const behind=view==='back'||pose==='zombie'?[]:[];
  // far arm in side view goes behind the body
  if(view==='side')drawArm(-1,'l');
  if(view==='back'&&pose==='zombie'){drawArm(-1,'l');drawArm(1,'r');}
  // ---------- torso
  if(view==='side')zTorsoSide(c,S,B,o,sh,hip,lean);else zTorso(c,S,B,o,sh,hip,view==='back');
  // ---------- ball for carriers
  const ball=()=>{const [,,hn]=armPts(1);c.save();c.translate(view==='side'?hn[0]+3:hn[0]-2,hn[1]-3);c.rotate(-0.5);
    c.beginPath();c.ellipse(0,0,8,5.2,0,0,7);zFill(c,'#f4a6b4',2.2);c.strokeStyle='#b0485a';c.lineWidth=1.1;c.beginPath();c.moveTo(-5,-1);c.quadraticCurveTo(0,-3,5,-1);c.moveTo(-4,1.5);c.quadraticCurveTo(0,-0.5,4,1.5);c.stroke();c.restore();};
  // ---------- head
  const hx=view==='side'?lean+4:0;
  if(view!=='back'||pose!=='zombie'){}
  if(L.head)zHead(c,S,B,o,hx,hd,view);
  else{zStump(c,hx,sh+1,7,true);c.fillStyle='#c0141c';for(let i=0;i<5;i++){const a=(o.t||0)*9+i*1.3;c.beginPath();c.arc(hx+Math.sin(a)*5,sh-6-((a*4)%14),1.8,0,7);c.fill();}}
  // ---------- front arms
  if(view==='front'){drawArm(-1,'l');drawArm(1,'r');}
  else if(view==='side'){drawArm(1,'r');}
  else if(pose!=='zombie'){drawArm(-1,'l');drawArm(1,'r');}
  if(pose==='carry'&&L.ra)ball();
  c.restore();}
if(typeof module!=='undefined')module.exports={drawZombie,ZSTYLE,ZBODY};
