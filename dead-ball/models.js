// Dead Ball cartoon zombie renderer, ¾ view.
// drawZombie(ctx, x, y, size, o): (x,y) = feet on the ground, size = on-screen height in px of a standing QB.
// o = {team:STYLE, body:'line'|'wr'|'qb'|'rb', view:'front'|'back'|'side', flip:bool, phase:rad, speed:0..1,
//      look:{skin:hex, hair:{c,s}} (optional), prop:'bone' (optional),
//      limbs:{la,ra,ll,rl,head}, pose:'run'|'stand'|'zombie'|'carry'|'down'|'dive'|'block'|'stiff'|'die' (o.stiffK 0..1 arm reach, o.stiffBall: brain tucked in the far arm;
//      'die' is side on: o.knee 0..1 knees buckle to kneeling, o.slump radians the upper body folds forward, o.hang radians of extra
//      tilt the hanging arms correct for, o.arms 'limp'|'flail'|'clutch'|'cheer'|'out'), num:int, t:seconds, seed:int}
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
function zArm(c,S,B,sh,el,hand,claw,mum,bare){
  zLimb(c,[sh,el,hand],B.armW,S.skin,S.skinHi);
  if(mum){c.strokeStyle=S.skinDk;c.lineWidth=1.1;for(const [a,b] of [[sh,el],[el,hand]])for(let k=0.3;k<1;k+=0.35){const x=a[0]+(b[0]-a[0])*k,y=a[1]+(b[1]-a[1])*k;c.beginPath();c.moveTo(x-B.armW*0.5,y-1);c.lineTo(x+B.armW*0.5,y+1.5);c.stroke();}}
  else{zEll(c,el[0],el[1],B.armW*0.32,B.armW*0.26,S.skinDk,0);}
  const sx=sh[0]+(el[0]-sh[0])*0.5,sy=sh[1]+(el[1]-sh[1])*0.5;
  if(!bare){zLimb(c,[sh,[sx,sy]],B.armW+3.5,S.jersey);                         // short sleeve (cheerleaders' tops are sleeveless)
  c.strokeStyle=S.trim;c.lineWidth=2;c.beginPath();c.moveTo(sx-(B.armW*0.5),sy);c.lineTo(sx+(B.armW*0.5),sy);c.stroke();}
  zHand(c,S,hand[0],hand[1],B.armW*0.62,claw);}
function zNumber(c,S,n,x,y,sz){c.save();c.translate(x,y);if(c.getTransform().a<0)c.scale(-1,1);x=0;y=0;c.font=`900 ${sz}px Arial Black, Arial, sans-serif`;c.textAlign='center';c.textBaseline='middle';
  c.lineWidth=3;c.strokeStyle=S.jerseyDk;c.strokeText(n,x,y);c.fillStyle=S.trim;c.fillText(n,x,y);c.restore();}
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
// Hair for zombies who have it (o.look.hair = {c:color, s:'long'|'braids'|'pony'|'shag'}): it hangs from under the helmet.
// Front and side views draw it behind the face; the back view draws it over the back of the head.
function zHair(c,H,hx,hy,r,view,o){
  const col=H.c||'#3a2a1c',dk=zShade(col,-0.35),sw=Math.sin((o.t||0)*2.4+(o.seed||0))*r*0.06+Math.sin(o.phase||0)*r*0.08;
  const fillJag=(x0,x1,yTop,yBot,n)=>{c.beginPath();c.moveTo(x0,yTop);c.lineTo(x0-r*0.08+sw*0.4,yBot);
    for(let i=1;i<=n;i++){const x=x0+(x1-x0)*i/n;c.lineTo(x-(x1-x0)/n*0.5+sw*0.5,yBot-r*(i%2?0.22:0.05));c.lineTo(x+sw*0.5,yBot+(i%3===1?r*0.08:0));}
    c.lineTo(x1,yTop);c.closePath();zFill(c,col,2.4);
    c.strokeStyle=dk;c.lineWidth=1.3;for(let i=1;i<n;i++){const x=x0+(x1-x0)*i/n;c.beginPath();c.moveTo(x,yTop+r*0.15);c.lineTo(x+sw*0.4,yBot-r*0.28);c.stroke();}};
  const braid=(x,y0,y1,s)=>{const n=6,dy=(y1-y0)/n;for(let i=0;i<n;i++){const xx=x+sw*(i/n)+s*(i%2?1:-1)*r*0.05;zEll(c,xx,y0+dy*(i+0.5),r*0.15,dy*0.62,col,1.8);}
    zEll(c,x+sw,y1+r*0.06,r*0.12,r*0.08,'#b8323a',1.4);};
  const tail=(x,y,dx,dy)=>{c.beginPath();c.moveTo(x-r*0.18,y);c.quadraticCurveTo(x+dx*0.6-r*0.25,y+dy*0.4,x+dx+sw,y+dy);c.quadraticCurveTo(x+dx*0.5+r*0.25,y+dy*0.5,x+r*0.18,y);c.closePath();zFill(c,col,2.2);
    zEll(c,x,y,r*0.16,r*0.12,'#b8323a',1.4);};
  const st=H.s||'long';
  if(view==='front'){
    if(st==='long')fillJag(hx-r*1.16,hx+r*1.16,hy-r*0.1,hy+r*1.45,7);
    else if(st==='shag')fillJag(hx-r*1.14,hx+r*1.14,hy-r*0.1,hy+r*0.95,6);
    else if(st==='braids'){fillJag(hx-r*1.1,hx+r*1.1,hy-r*0.1,hy+r*0.55,5);braid(hx-r*1.0,hy+r*0.35,hy+r*1.75,-1);braid(hx+r*1.0,hy+r*0.35,hy+r*1.75,1);}
    else{tail(hx-r*0.75,hy-r*0.35,-r*0.75,r*1.35);fillJag(hx-r*1.1,hx+r*1.1,hy-r*0.1,hy+r*0.6,5);}}
  else if(view==='side'){
    if(st==='long')fillJag(hx-r*1.02,hx-r*0.05,hy-r*0.2,hy+r*1.45,5);
    else if(st==='shag')fillJag(hx-r*1.0,hx-r*0.1,hy-r*0.2,hy+r*0.95,4);
    else if(st==='braids'){fillJag(hx-r*0.98,hx-r*0.15,hy-r*0.2,hy+r*0.6,4);braid(hx-r*0.62,hy+r*0.4,hy+r*1.75,-1);}
    else tail(hx-r*0.95,hy-r*0.2,-r*0.75,r*1.25);}
  else{
    if(st==='long')fillJag(hx-r*1.06,hx+r*1.06,hy-r*0.05,hy+r*1.5,7);
    else if(st==='shag')fillJag(hx-r*1.04,hx+r*1.04,hy-r*0.05,hy+r*1.0,6);
    else if(st==='braids'){fillJag(hx-r*1.0,hx+r*1.0,hy-r*0.05,hy+r*0.7,6);braid(hx-r*0.5,hy+r*0.5,hy+r*1.8,-1);braid(hx+r*0.5,hy+r*0.5,hy+r*1.8,1);}
    else{fillJag(hx-r*1.0,hx+r*1.0,hy-r*0.05,hy+r*0.6,6);tail(hx,hy+r*0.1,sw*2,r*1.45);}}}
function zShade(hex,k){const n=parseInt(hex.slice(1),16),f=v=>Math.max(0,Math.min(255,Math.round(k<0?v*(1+k):v+(255-v)*k)));
  return '#'+[n>>16,(n>>8)&255,n&255].map(f).map(v=>v.toString(16).padStart(2,'0')).join('');}
const Z_SKIN={};   // a zombie's own skin color, on top of the team style: {skin, skinDk, skinHi} shaded from one base color
function zSkinOf(S,base){const k=S.helmet+base;return Z_SKIN[k]||(Z_SKIN[k]=Object.assign({},S,{skin:base,skinDk:zShade(base,-0.3),skinHi:zShade(base,0.3)}));}
function zHead(c,S,B,o,hx,hy,view){
  const r=21*B.head,H=o.look&&o.look.hair;
  if(H&&view!=='back')zHair(c,H,hx,hy,r,view,o);
  if(view==='back'){const g=c.createRadialGradient(hx,hy,r*0.2,hx,hy+r*0.2,r*1.05);g.addColorStop(0,S.skin);g.addColorStop(1,S.skinDk);c.beginPath();c.ellipse(hx,hy+r*0.1,r*0.98,r,0,0,7);zFill(c,g,3);
    if(S.species==='mummy'){c.strokeStyle=S.skinDk;c.lineWidth=1.6;for(let i=0;i<4;i++){c.beginPath();c.moveTo(hx-r,hy+r*(0.4+i*0.18));c.lineTo(hx+r,hy+r*(0.5+i*0.18));c.stroke();}}}
  else zFace(c,S,hx,hy,r,o,view);
  if(H&&view==='back')zHair(c,H,hx,hy,r,view,o);
  zHelmet(c,S,hx,hy,r,view,o);}
function drawZombie(c,x,y,size,o){
  const CH=o.cheer,S=CH?cheerStyle(o.team,CH):o.look&&o.look.skin?zSkinOf(o.team,o.look.skin):o.team,B=CH?zCheerBody(ZBODY[o.body||CH.build]||ZBODY.wr,CH):ZBODY[o.body||'qb'],L=o.limbs||{la:1,ra:1,ll:1,rl:1,head:1},mum=S.species==='mummy';
  let view=o.view||'front',pose=o.pose||'run';if(view!=='side'&&pose!=='down'&&pose!=='dive')o=Object.assign({},o,{flip:false});const ph=o.phase||0,spd=o.speed==null?1:o.speed;
  const nLegs=(L.ll?1:0)+(L.rl?1:0);
  if(nLegs===0&&pose!=='down'&&pose!=='dive'&&pose!=='stand'&&pose!=='die')pose='crawl';                 // no legs: drag himself along on his arms
  const hop=nLegs===1&&['run','carry','zombie','block','stiff'].includes(pose)&&spd>0.15;          // one leg: hops
  const hopH=hop?Math.abs(Math.sin(ph*0.5))*13*Math.min(1,spd+0.3):0;
  c.save();c.translate(x,y);const k=size/100;c.scale(k*(o.flip&&(view==='side'||pose==='down'||pose==='dive'||pose==='crawl')?-1:1),k);
  // shadow
  if(!o.noShadow){c.fillStyle='rgba(0,0,0,0.28)';c.beginPath();c.ellipse(0,1,pose==='down'||pose==='dive'||pose==='crawl'?52:pose==='feed'?34:(24*B.w+4)*(1-hopH/40),7*(1-hopH/40),0,0,7);c.fill();}
  if(hop)c.translate(0,-hopH);
  const DJ=pose==='dance'?(o.dj||{}):null;if(DJ&&DJ.air)c.translate(0,-DJ.air);   // dancing: a real jump lifts the whole body off its shadow
  if(pose==='down'){c.translate(46,-9);c.rotate(-Math.PI/2);view='side';}          // flat on his back, head to the left
  else if(pose==='dive'){c.translate(-44,-26);c.rotate(Math.PI/2*0.82);view='side';}  // airborne, head first to the right
  else if(pose==='crawl'){c.translate(-38+Math.sin(ph)*2,-12);c.rotate(Math.PI/2*0.9);view='side';}  // belly down, head first to the right
  else if(pose==='feed'||pose==='die')view='side';
  else if(pose==='stiff')view='side';                                                  // stiff arm: always side on, shoving to the right                                                   // on hands and knees over a meal, head to the right
  const kn=pose==='die'?Math.max(0,Math.min(1,o.knee||0)):0;
  const bob=hop||pose==='crawl'||pose==='feed'||pose==='die'||pose==='dance'?0:pose==='stand'||pose==='down'?Math.sin((o.t||0)*2.2)*0.8:-Math.abs(Math.sin(ph))*3*spd;
  const lean=pose==='stiff'?-5:view==='side'&&pose!=='stand'&&pose!=='down'&&pose!=='crawl'&&pose!=='feed'&&pose!=='die'?6*spd:0;
  const hip=(pose==='feed'?-B.leg*0.5:pose==='die'?-B.leg*(1-0.5*kn):DJ?-B.leg*(1-0.4*(DJ.sq||0)):-B.leg)+bob,sh=hip-B.torso,hd=sh-19*B.head;
  c.translate(0,0);
  const legOK={l:L.ll,r:L.rl},armOK={l:L.la,r:L.ra};
  // ---------- legs
  const legs=[];
  for(const [s,key] of [[-1,'l'],[1,'r']]){
    const hx=s*7*B.w;let foot,knee;
    if(pose==='feed'){legs.push([s,[s*2,hip],[-22+s*3,-1],[3+s*2,-3],key]);continue;}   // kneeling: knee on the turf, shin flat behind
    if(DJ){const f=(s<0?DJ.lf:DJ.rf)||[0,0],hx2=(view==='side'?lean:hx)+(DJ.hx||0),sq=DJ.sq||0;   // dancing: feet planted where the move puts them, knees bend to fit
      const ft=view==='side'?[f[0],-f[1]]:[hx*(B.belly?1.15:1)+s*sq*5+f[0],-f[1]],hp=[hx2,hip],l=B.leg*0.53,dx=ft[0]-hp[0],dy=ft[1]-hp[1],d=Math.hypot(dx,dy)||1,m=Math.sqrt(Math.max(0,l*l-d*d/4));
      const nx=-dy/d,ny=dx/d,out=view==='side'?(nx>=0?1:-1):(nx*s>=0?1:-1);legs.push([s,hp,ft,[(hp[0]+ft[0])/2+nx*m*out,(hp[1]+ft[1])/2+ny*m*out],key]);continue;}
    if(pose==='die'){const L2=(a,b)=>a+(b-a)*kn;legs.push([s,[L2(0,s*2),hip],[L2(s*1.5,-22+s*3),L2(0,-1)],[L2(3,3+s*2),L2(-B.leg*0.5,-3)],key]);continue;}   // knees buckle from standing to kneeling
    if(hop){foot=[s*1.5,-hopH*0.35];knee=[hx+(view==='side'?6:0),hip*0.5-hopH*0.25];legs.push([s,[hx,hip],foot,knee,key]);continue;}
    if(view==='side'){const a=ph+(s>0?Math.PI:0);const st=pose==='stand'?0:Math.sin(a)*14*spd*(B.leg/30),lift=pose==='stand'?0:Math.max(0,Math.cos(a))*9*spd;
      foot=[st+lean*0.2,-lift];knee=[(st*0.55)+5*spd+lean*0.5,hip*0.5-lift*0.6];legs.push([s,[lean,hip],foot,knee,key]);}
    else{const a=ph+(s>0?Math.PI:0),lift=pose==='stand'?0:Math.max(0,Math.sin(a))*B.leg*0.32*spd;
      foot=[hx*(B.belly?1.15:1),-lift];knee=[hx*1.05,hip*0.5-lift*0.5];legs.push([s,[hx,hip],foot,knee,key]);}}
  if(view==='side')legs.sort((a,b)=>a[0]-b[0]);
  for(const [s,hp,ft,kn,key] of legs){if(legOK[key]){if(CH)zCheerLeg(c,S,B,s,hp,ft,kn,CH);else zLeg(c,S,B,s,hp,ft,kn,mum);}else zStump(c,hp[0],hp[1]+3,B.legW*0.7,true);}
  if(pose==='feed'){c.translate(0,hip);c.rotate(o.feedRot==null?1:o.feedRot);c.translate(0,-hip);}   // hunch the upper body over the food
  if(pose==='stiff'){c.translate(0,hip);c.rotate(-0.3*Math.min(1,(o.stiffK||0)*1.5));c.translate(0,-hip);}   // lean the body away from the tackler
  if(DJ){c.translate((DJ.hx||0),hip);c.rotate(DJ.tilt||0);c.translate(0,-hip);}   // hips shift and the upper body leans with the move
  const slump=pose==='die'?(o.slump||0):0;if(slump){c.translate(0,hip);c.rotate(slump);c.translate(0,-hip);}   // dying: the upper body folds forward at the hips
  // ---------- arms helper
  const armPts=(s)=>{const sx=view==='side'?lean+(s>0?2:-2):s*16*B.w,sp=[sx,sh+6];let el,hn;
    if(pose==='feed'){if(o.feedLift&&s>0){el=[sx+16,sh+12];hn=[sx+12,hd+12];}
      else{const r=Math.sin(ph*2+(s>0?0:Math.PI));el=[sx+B.arm*0.45,sh+B.arm*0.42];hn=[sx+B.arm*0.98+r*5,sh+B.arm*0.12-r*4];}}
    else if(pose==='stiff'){const r=Math.max(0,Math.min(1,o.stiffK==null?1:o.stiffK));
      if(s>0){el=[sx+B.arm*(0.25+0.6*r),sh+B.arm*(0.45-0.45*r)];hn=[sx+B.arm*(0.35+1.3*r),sh+B.arm*(0.5-0.55*r)];}   // near arm: punches straight out at shoulder height
      else{el=[sx-7,sh+B.arm*0.55];hn=[sx-1,sh+B.arm*0.38];}}                                                         // far arm: brain tucked to the chest
    else if(pose==='die'){const tt=o.t||0,A=o.arms||'limp',sd=o.seed||0;
      if(A==='flail'){el=[sx+6+Math.sin(tt*17+s+sd)*7,sh-6+Math.cos(tt*13+s)*4];hn=[sx+10+Math.sin(tt*21+s*2+sd)*12,sh-B.arm*0.85+Math.cos(tt*19+s*3)*7];}
      else if(A==='cheer'){const pu=Math.sin(tt*8+sd+(s>0?0:1.3));el=[sx+(s>0?13:-11),sh-6-pu*3];hn=[sx+(s>0?25:-21),sh-B.arm*0.85-pu*7];}   // both fists pumping up and out, clear of the helmet
      else if(A==='clutch'){const j=Math.sin(tt*40+s)*1.6;el=[sx+13,sh+12];hn=[sx+8+j,hd+14-j];}
      else if(A==='out'){el=[sx+B.arm*0.55,sh+3];hn=[sx+B.arm*1.05,sh+1+Math.sin(tt*9+s)*3];}
      else{const g=(o.hang==null?slump:o.hang),gx=Math.sin(g),gy=Math.cos(g),sw=Math.sin(tt*2.6+s+sd)*2;   // limp: the arms hang straight down, whatever the body is doing
        el=[sx+gx*B.arm*0.5+sw*0.5,sh+gy*B.arm*0.5];hn=[sx+gx*B.arm*0.95+sw,sh+gy*B.arm*0.95];}}
    else if(DJ){const a=(s<0?DJ.la:DJ.ra)||[0.2,0.3],U=B.arm*0.52,mx=view==='side'?1:s;   // dancing: shoulder angle (0 down, 1.57 out, 3.14 up) and elbow bend, per arm
      el=[sx+mx*U*Math.sin(a[0]),sh+6+U*Math.cos(a[0])];hn=[el[0]+mx*U*Math.sin(a[0]+a[1]),el[1]+U*Math.cos(a[0]+a[1])];}
    else if(pose==='crawl'){const r=Math.sin(ph+(s>0?0:Math.PI));el=[sx+17,sh-30-r*6];hn=[sx+23,sh-58-r*10];}
    else if(pose==='zombie'||pose==='block'){ if(view==='side'){el=[sx+B.arm*0.55,sh+8+(s>0?0:2)];hn=[sx+B.arm*1.05,sh+10+Math.sin((o.t||0)*3+s)*2];}
                       else if(view==='front'){el=[s*12*B.w,sh+12];hn=[s*8*B.w,sh+16+Math.sin((o.t||0)*3+s)*1.5];}
                       else{el=[s*20*B.w,sh+14];hn=[s*19*B.w,sh+22];} }
    else if(pose==='carry'&&s>0){el=view==='side'?[sx+4,sh+B.arm*0.6]:[s*15*B.w,sh+B.arm*0.6];hn=view==='side'?[sx+9,sh+B.arm*0.45]:[s*4,sh+B.arm*0.5];}
    else{const sw=pose==='stand'||pose==='down'?0:Math.sin(ph+(s>0?0:Math.PI))*spd;
      if(view==='side'){el=[sx+sw*9,sh+B.arm*0.5];hn=[sx+sw*16+4,sh+B.arm*0.88-Math.abs(sw)*4];}
      else{el=[s*(19*B.w+2),sh+B.arm*0.5-sw*3];hn=[s*(19*B.w+1),sh+B.arm*0.95-sw*7];}}
    return [sp,el,hn];};
  const drawArm=(s,key)=>{const [sp,el,hn]=armPts(s);if(armOK[key])zArm(c,S,B,sp,el,hn,pose==='zombie'||pose==='crawl',mum,CH);else zStump(c,sp[0],sp[1],B.armW*0.75,true);};
  const behind=view==='back'||pose==='zombie'?[]:[];
  // far arm in side view goes behind the body
  if(view==='side')drawArm(-1,'l');
  if(view==='back'&&pose==='zombie'){drawArm(-1,'l');drawArm(1,'r');}
  // ---------- torso
  if(CH){c.save();if(view==='side')c.translate(lean*0.5,0);zCheerTop(c,S,B,o,sh,hip,view);zCheerSkirt(c,S,B,o,hip,view);c.restore();}
  else if(view==='side')zTorsoSide(c,S,B,o,sh,hip,lean);else zTorso(c,S,B,o,sh,hip,view==='back');
  // ---------- ball for carriers
  const ball=()=>{const [,,hn]=armPts(1);c.save();c.translate(view==='side'?hn[0]+3:hn[0]-2,hn[1]-3);c.rotate(-0.5);
    c.beginPath();c.ellipse(0,0,8,5.2,0,0,7);zFill(c,'#f4a6b4',2.2);c.strokeStyle='#b0485a';c.lineWidth=1.1;c.beginPath();c.moveTo(-5,-1);c.quadraticCurveTo(0,-3,5,-1);c.moveTo(-4,1.5);c.quadraticCurveTo(0,-0.5,4,1.5);c.stroke();c.restore();};
  // ---------- head
  const hx=view==='side'?lean+4:0;
  if(view!=='back'||pose!=='zombie'){}
  if(L.head){if(CH)zCheerHead(c,S,B,o,hx,hd,view);else zHead(c,S,B,o,hx,hd,view);}
  else{zStump(c,hx,sh+1,7,true);c.fillStyle='#c0141c';for(let i=0;i<5;i++){const a=(o.t||0)*9+i*1.3;c.beginPath();c.arc(hx+Math.sin(a)*5,sh-6-((a*4)%14),1.8,0,7);c.fill();}}
  // ---------- front arms
  if(view==='front'){drawArm(-1,'l');drawArm(1,'r');}
  else if(view==='side'){drawArm(1,'r');}
  else if(pose!=='zombie'){drawArm(-1,'l');drawArm(1,'r');}
  if(pose==='carry'&&L.ra&&o.ball!==false)ball();
  if(o.prop==='bone'&&L.ra){const [,,hn]=armPts(1);c.save();c.translate(hn[0],hn[1]-4);c.rotate(-0.9+Math.sin((o.t||0)*7)*0.15);   // a bone to chew on
    c.beginPath();c.rect(-2.6,-11,5.2,22);zFill(c,'#efe6cf',1.8);for(const y of [-11,11])for(const x of [-2.6,2.6])zEll(c,x,y,3.4,3.4,'#efe6cf',1.8);
    c.fillStyle='#efe6cf';c.fillRect(-1.6,-10,3.2,20);c.restore();}
  if(pose==='stiff'&&L.ra&&(o.stiffK||0)>0.55){const [,,hn]=armPts(1);c.save();c.translate(hn[0]+2,hn[1]);   // big open palm facing the tackler
    c.beginPath();c.ellipse(1,0,6.5,10,0,0,7);zFill(c,S.skin,2.6);c.strokeStyle=S.skinDk||'#333';c.lineWidth=2;
    for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(4,i*4.8);c.lineTo(9,i*5.6);c.stroke();}c.restore();}
  if(pose==='feed'&&o.feedLift&&L.ra){const [,,hn]=armPts(1);c.fillStyle='#e88a9c';c.beginPath();c.ellipse(hn[0]+4,hn[1]-3,7,5,0.4,0,7);c.fill();c.strokeStyle='#a8394e';c.lineWidth=1.4;c.stroke();
    c.fillStyle='#c3122c';c.beginPath();c.arc(hn[0]+8,hn[1]+1,1.8,0,7);c.fill();}   // a scrap of brain, lifted to the mouth
  c.restore();}
// ===== CHEERLEADERS: every team has its own squad, made up from the team's name. Each one has a monster kind, a size, a tempo and a
// place on the fresh-to-foul scale (rot 0 = rosy cheeks and a sparkle, 1 = mold, flies and an eye on a string). They wear the team's
// cheer top with its initial, a pleated skirt or cheer shorts, and white sneakers. No helmets, no pads, no numbers: they are not players.
const CHEER_KINDS=['zombie','mummy','skeleton','ghoul','vampire','werewolf','swamp'];
const CHEER_SKIN={zombie:'#9fbf86',mummy:'#d8ccaa',skeleton:'#efe8d4',ghoul:'#9aa9bd',vampire:'#e4dbe8',werewolf:'#8c6a48',swamp:'#5f9c88'};
const CHEER_HAIR=['#3a2a1c','#6b3a1e','#c9a24a','#262626','#8a2a5a','#3c6a2a','#d9d4c4','#a3431e','#2f4a8a'];
function zRng(seed){let s=(seed>>>0)||7;return ()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
function zHash(str){let h=2166136261;for(const ch of String(str))h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;return h>>>0;}
function zMix(a,b,k){const A=parseInt(a.slice(1),16),B2=parseInt(b.slice(1),16);return '#'+[16,8,0].map(s=>Math.round(((A>>s)&255)*(1-k)+((B2>>s)&255)*k).toString(16).padStart(2,'0')).join('');}
function makeCheerSquad(name,species,n){const R=zRng(zHash('cheer:'+name)),base=0.08+R()*0.84,home=species==='mummy'?'mummy':'zombie',out=[];
  for(let i=0;i<(n||3);i++){const kind=R()<0.4?home:CHEER_KINDS[Math.floor(R()*CHEER_KINDS.length)],rot=Math.max(0,Math.min(1,base+(R()-0.5)*0.55));
    const hs=['long','pony','braids','shag'][Math.floor(R()*4)],hc=CHEER_HAIR[Math.floor(R()*CHEER_HAIR.length)],bald=kind==='werewolf'||(kind==='skeleton'&&R()<0.4)||(kind==='mummy'&&R()<0.5);
    out.push({kind,rot,size:0.86+R()*0.3,speed:0.8+R()*0.5,build:['wr','wr','qb','rb'][Math.floor(R()*4)],skirt:R()<0.7,
      hair:bald?null:{c:hc,s:hs},eye:rot>0.62&&R()<0.7,seed:Math.floor(R()*997)});}
  return out;}
const Z_CHEER={};
function cheerStyle(S,cl){const k=S.jersey+S.trim+cl.kind+cl.rot.toFixed(2);if(Z_CHEER[k])return Z_CHEER[k];
  const base=cl.kind==='skeleton'?zMix(CHEER_SKIN.skeleton,'#b9a67a',cl.rot*0.6):zMix(CHEER_SKIN[cl.kind],'#6e7444',cl.rot*0.45);
  return Z_CHEER[k]=Object.assign({},S,{skin:base,skinDk:zShade(base,-0.3),skinHi:zShade(base,0.3),species:cl.kind==='mummy'?'mummy':cl.kind});}
function zCheerBody(B,cl){return cl.kind==='skeleton'?Object.assign({},B,{armW:B.armW*0.62,legW:B.legW*0.62}):B;}
function zCheerLeg(c,S,B,side,hip,foot,knee,cl){
  zLimb(c,[hip,knee,foot],B.legW*0.9,S.skin,S.skinHi);
  if(cl.kind==='mummy'){c.strokeStyle=S.skinDk;c.lineWidth=1.2;for(const [a,b] of [[hip,knee],[knee,foot]])for(let k=0.25;k<0.95;k+=0.25){const x=a[0]+(b[0]-a[0])*k,y=a[1]+(b[1]-a[1])*k;c.beginPath();c.moveTo(x-B.legW*0.45,y-1.5);c.lineTo(x+B.legW*0.45,y+1.5);c.stroke();}}
  else zEll(c,knee[0],knee[1],B.legW*0.3,B.legW*0.24,S.skinDk,0);
  const x=knee[0]+(foot[0]-knee[0])*0.74,y=knee[1]+(foot[1]-knee[1])*0.74;zLimb(c,[[x,y],foot],B.legW*0.9+1,'#f4f1ea');   // ankle sock in the trim colour
  c.strokeStyle=S.trim;c.lineWidth=2;c.beginPath();c.moveTo(x-B.legW*0.5,y+1);c.lineTo(x+B.legW*0.5,y+1);c.stroke();
  zEll(c,foot[0]+side*1.5,foot[1]+1.5,Math.max(5,B.legW*0.75),Math.max(3.4,B.legW*0.45),'#f7f5ef',2.4);   // white sneaker
  c.fillStyle=S.jersey;c.fillRect(foot[0]+side*1.5-B.legW*0.4,foot[1]+0.5,B.legW*0.8,1.6);}
function zCheerTop(c,S,B,o,sy,hy,view){const w=B.w,side=view==='side',top=(side?10:13)*w,bot=(side?9:10)*w,rot=o.cheer.rot;
  c.beginPath();c.moveTo(-top,sy+3);c.quadraticCurveTo(-top-1,hy-6,-bot,hy);c.lineTo(bot,hy);c.quadraticCurveTo(top+1,hy-6,top,sy+3);c.quadraticCurveTo(0,sy-1,-top,sy+3);c.closePath();
  const g=c.createLinearGradient(-top,0,top,0);g.addColorStop(0,S.jersey);g.addColorStop(0.65,S.jersey);g.addColorStop(1,S.jerseyDk);zFill(c,g,3);
  c.strokeStyle=S.trim;c.lineWidth=2.6;
  if(view==='front'){c.beginPath();c.moveTo(-top*0.55,sy+2);c.lineTo(0,sy+11);c.lineTo(top*0.55,sy+2);c.stroke();if(o.letter)zNumber(c,S,o.letter,0,sy+(hy-sy)*0.64,12);}
  else if(view==='back'){c.beginPath();c.moveTo(-top*0.5,sy+3);c.quadraticCurveTo(0,sy+7,top*0.5,sy+3);c.stroke();}
  else{c.beginPath();c.moveTo(top*0.2,sy+2);c.lineTo(top*0.9,sy+9);c.stroke();}
  c.beginPath();c.moveTo(-bot,hy-3);c.lineTo(bot,hy-3);c.stroke();
  if(rot>0.45&&view!=='back'){c.fillStyle='rgba(80,90,40,0.5)';c.beginPath();c.ellipse(-bot*0.35,hy-9,4,3,0.3,0,7);c.ellipse(bot*0.3,sy+14,2.5,2,0,0,7);c.fill();}   // stains
  if(rot>0.7&&view==='front'){c.beginPath();c.moveTo(bot*0.15,hy-1);c.lineTo(bot*0.45,hy-9);c.lineTo(bot*0.72,hy-1);c.closePath();zFill(c,S.skinDk,1.4);}}   // a tear
function zCheerSkirt(c,S,B,o,hy,view){const w=B.w,side=view==='side',bot=(side?9:10)*w,len=B.leg*0.36,rot=o.cheer.rot,ph=Math.sin((o.t||0)*9+(o.seed||0))*1.5;
  if(!o.cheer.skirt){const l2=len*0.55;   // cheer shorts
    c.beginPath();c.moveTo(-bot,hy-3);c.lineTo(bot,hy-3);c.lineTo(bot+1.5,hy+l2);c.lineTo(side?-bot-1:1.5,hy+l2);if(!side){c.lineTo(0,hy+3);c.lineTo(-1.5,hy+l2);}c.lineTo(-bot-1.5,hy+l2);c.closePath();zFill(c,S.jersey,2.4);
    c.strokeStyle=S.trim;c.lineWidth=2;c.beginPath();c.moveTo(-bot-1,hy+l2-2);c.lineTo(bot+1,hy+l2-2);c.stroke();return;}
  const fl=side?bot*1.35:bot*1.55,n=6;c.beginPath();c.moveTo(-bot,hy-3);c.lineTo(bot,hy-3);c.lineTo(fl+ph,hy+len);
  for(let i=n;i>=0;i--){const x=-fl+(2*fl)*i/n+ph,yy=hy+len+(i%2?2:0)-(rot>0.55&&i===2?5:0);c.lineTo(x,yy);}c.closePath();   // a ragged hem when it's rotten
  const g=c.createLinearGradient(0,hy,0,hy+len);g.addColorStop(0,S.jersey);g.addColorStop(1,S.jerseyDk);zFill(c,g,2.6);
  c.strokeStyle=S.trim;c.lineWidth=1.6;for(let i=1;i<n;i++){const xt=-bot+(2*bot)*i/n,xb=-fl+(2*fl)*i/n+ph;c.beginPath();c.moveTo(xt,hy);c.lineTo(xb,hy+len-1);c.stroke();}
  c.lineWidth=2.4;c.beginPath();c.moveTo(-fl+ph+1,hy+len-2);c.lineTo(fl+ph-1,hy+len-2);c.stroke();}
function zCheerHead(c,S,B,o,hx,hy,view){const cl=o.cheer,r=21*B.head,side=view==='side',t=o.t||0,sd=o.seed||0,rot=cl.rot,H=cl.hair,k=cl.kind;
  const blink=((t*0.7+sd*0.37)%3)<0.09;
  if(H&&view!=='back')zHair(c,H,hx,hy,r,view,o);
  if(k==='werewolf')for(const s of side?[-1]:[-1,1]){c.beginPath();c.moveTo(hx+s*r*0.85,hy-r*0.3);c.lineTo(hx+s*r*0.78,hy-r*1.4);c.lineTo(hx+s*r*0.2,hy-r*0.78);c.closePath();zFill(c,S.skin,2.6);
    if(view!=='back'){c.beginPath();c.moveTo(hx+s*r*0.72,hy-r*0.5);c.lineTo(hx+s*r*0.7,hy-r*1.08);c.lineTo(hx+s*r*0.38,hy-r*0.76);c.closePath();c.fillStyle='#d99a9a';c.fill();}}
  if(k==='ghoul')for(const s of side?[-1]:[-1,1]){c.beginPath();c.moveTo(hx+s*r*0.88,hy-r*0.1);c.lineTo(hx+s*r*1.62,hy-r*0.6);c.lineTo(hx+s*r*0.94,hy+r*0.32);c.closePath();zFill(c,S.skin,2.4);}
  if(k==='swamp'){c.beginPath();c.moveTo(hx-r*0.55,hy-r*0.75);for(let i=0;i<=4;i++)c.lineTo(hx-r*0.55+i*r*0.275,hy-r*(i%2?1.5:1.05));c.lineTo(hx+r*0.55,hy-r*0.75);c.closePath();zFill(c,zShade(S.skin,-0.18),2.4);}
  const g=c.createRadialGradient(hx-r*0.3,hy,r*0.15,hx,hy+r*0.2,r*1.05);g.addColorStop(0,S.skinHi);g.addColorStop(0.55,S.skin);g.addColorStop(1,S.skinDk);
  c.beginPath();if(k==='skeleton')c.ellipse(hx+(side?r*0.05:0),hy,r*0.95,r*0.92,0,0,7);else c.ellipse(hx+(side?r*0.06:0),hy+r*0.05,r*0.97,r,0,0,7);zFill(c,g,3);
  if(k==='werewolf'&&view!=='back'){c.fillStyle=S.skinDk;for(let i=0;i<5;i++){c.beginPath();c.moveTo(hx-r*0.95+i*r*0.12,hy+r*0.55);c.lineTo(hx-r*1.15,hy+r*(0.3+i*0.12));c.lineTo(hx-r*0.9,hy+r*(0.2+i*0.12));c.fill();}}   // cheek tufts
  const wraps=()=>{c.strokeStyle=S.skinDk;c.lineWidth=1.6;for(let i=-3;i<=3;i++){const yy=hy+i*r*0.26;c.beginPath();c.moveTo(hx-r*0.98,yy-r*0.08*(i%2?1:-1));c.quadraticCurveTo(hx,yy+r*0.1,hx+r*0.98,yy+r*0.08*(i%2?-1:1));c.stroke();}};
  const bow=()=>{const bx=side?hx-r*0.2:hx+r*0.35,by=hy-r*(k==='werewolf'?0.95:0.88);c.save();c.translate(bx,by);c.rotate(-0.25);
    for(const s of [-1,1]){c.beginPath();c.moveTo(0,0);c.lineTo(s*r*0.48,-r*0.28);c.lineTo(s*r*0.48,r*0.28);c.closePath();zFill(c,S.trim,2);}zEll(c,0,0,r*0.13,r*0.13,S.jersey,1.6);c.restore();};
  if(view==='back'){if(k==='mummy')wraps();if(H)zHair(c,H,hx,hy,r,view,o);bow();return;}
  if(k==='mummy')wraps();
  const fx=side?hx+r*0.42:hx,eyes=side?[[hx+r*0.52,hy-r*0.02,1]]:[[hx-r*0.37,hy-r*0.02,1],[hx+r*0.37,hy-r*0.02,0]],dk='#1b1a17';
  // eyes
  for(const [ex,ey,first] of eyes){
    if(k==='skeleton'){zEll(c,ex,ey,r*0.25,r*0.28,'#2a2420',2);if(!blink){c.fillStyle='#ff9a3a';c.beginPath();c.arc(ex,ey+r*0.04,r*0.08,0,7);c.fill();}}
    else if(k==='mummy'){c.fillStyle='#1d140c';c.beginPath();c.ellipse(ex,ey,r*0.24,r*0.13,0,0,7);c.fill();c.fillStyle='#ffe24a';c.beginPath();c.ellipse(ex,ey,r*0.13,blink?r*0.02:r*0.08,0,0,7);c.fill();}
    else{const er=k==='swamp'?r*0.27:r*0.21,iris={zombie:'#e8442e',ghoul:'#f0c020',vampire:'#c0102a',werewolf:'#f0a020',swamp:'#2a6a4a'}[k]||'#333';
      zEll(c,ex,ey,er,blink?er*0.12:er*(k==='zombie'&&!first?0.8:1),'#fffbe6',2);
      if(!blink){c.fillStyle=iris;c.beginPath();c.arc(ex+(side?er*0.3:0),ey+er*0.1,er*0.5,0,7);c.fill();c.fillStyle='#111';c.beginPath();
        if(k==='ghoul'||k==='werewolf')c.ellipse(ex+(side?er*0.3:0),ey+er*0.1,er*0.13,er*0.42,0,0,7);else c.arc(ex+(side?er*0.3:0),ey+er*0.1,er*0.24,0,7);c.fill();
        c.fillStyle='#fff';c.beginPath();c.arc(ex-er*0.2,ey-er*0.2,er*0.14,0,7);c.fill();}
      if(rot<0.5&&k!=='werewolf'){c.strokeStyle=dk;c.lineWidth=1.6;for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(ex+i*er*0.45,ey-er*0.92);c.lineTo(ex+i*er*0.62,ey-er*1.3);c.stroke();}}}}   // lashes on the fresher ones
  if(k==='vampire'&&!side){c.strokeStyle=dk;c.lineWidth=2.6;for(const s of [-1,1]){c.beginPath();c.moveTo(hx+s*r*0.18,hy-r*0.28);c.lineTo(hx+s*r*0.55,hy-r*0.36);c.stroke();}}
  // nose or snout
  if(k==='skeleton'){c.fillStyle='#2a2420';c.beginPath();c.moveTo(fx,hy+r*0.2);c.lineTo(fx-r*0.1,hy+r*0.38);c.lineTo(fx+r*0.1,hy+r*0.38);c.closePath();c.fill();}
  else if(k==='werewolf'){zEll(c,fx+(side?r*0.25:0),hy+r*0.45,r*(side?0.42:0.5),r*0.32,zShade(S.skin,0.35),2.4);zEll(c,fx+(side?r*0.55:0),hy+r*0.3,r*0.14,r*0.1,dk,0);}
  // mouth
  const mx=side?hx+r*0.5:hx,my=hy+r*0.58;
  if(k==='skeleton'){c.fillStyle='#f6efcf';c.strokeStyle='#2a2420';c.lineWidth=1.2;const n=side?3:5,mw=side?r*0.42:r*0.7;c.beginPath();c.rect(mx-mw/2,my-r*0.05,mw,r*0.2);c.fill();c.stroke();
    for(let i=1;i<n;i++){c.beginPath();c.moveTo(mx-mw/2+mw*i/n,my-r*0.05);c.lineTo(mx-mw/2+mw*i/n,my+r*0.15);c.stroke();}}
  else if(k==='mummy'){c.fillStyle='#2a1a10';c.beginPath();c.ellipse(mx,my,side?r*0.2:r*0.3,r*0.07+r*0.04*Math.abs(Math.sin(t*3+sd)),0,0,7);c.fill();}
  else if(k==='vampire'){c.strokeStyle='#5a0e1c';c.lineWidth=2.4;c.beginPath();c.arc(mx,my-r*0.18,r*0.3,0.35,Math.PI-0.35);c.stroke();
    c.fillStyle='#fff';for(const s of side?[1]:[-1,1]){c.beginPath();c.moveTo(mx+s*r*0.14-r*0.05,my+r*0.04);c.lineTo(mx+s*r*0.14+r*0.05,my+r*0.04);c.lineTo(mx+s*r*0.14,my+r*0.22);c.closePath();c.fill();c.strokeStyle=dk;c.lineWidth=0.8;c.stroke();}}
  else if(k==='swamp'){zEll(c,mx,my,r*0.2,r*0.15,'#c2556a',2);c.fillStyle='#5a1020';c.beginPath();c.ellipse(mx,my,r*0.09,r*0.06,0,0,7);c.fill();
    if(!side){c.strokeStyle=S.skinDk;c.lineWidth=1.4;for(const s of [-1,1])for(let i=0;i<3;i++){c.beginPath();c.arc(hx+s*r*0.72,hy+r*(0.2+i*0.14),r*0.12,Math.PI*0.6,Math.PI*1.4);c.stroke();}}}
  else{const open=k==='werewolf'?1:0.55+Math.sin(t*5+sd)*0.25,mw=side?r*0.3:(k==='ghoul'?r*0.62:r*0.42),mh=r*0.12*open+r*0.06,my2=k==='werewolf'?my+r*0.1:my;
    c.beginPath();c.ellipse(mx,my2,mw,mh,0,0,Math.PI);if(k==='ghoul')c.ellipse(mx,my2,mw,mh*0.3,0,Math.PI,0);c.closePath();zFill(c,'#3a0d13',2.2);
    c.fillStyle='#f6efcf';const nt=k==='ghoul'?6:3;for(let i=0;i<nt;i++){const tx=mx-mw*0.7+mw*1.4*(i+0.5)/nt;c.beginPath();c.moveTo(tx-mw*0.09,my2);c.lineTo(tx+mw*0.09,my2);c.lineTo(tx,my2+mh*(k==='ghoul'?0.8:0.5));c.closePath();c.fill();}
    if(k==='werewolf'){c.fillStyle='#d9506a';c.beginPath();c.ellipse(mx+r*0.06,my2+mh*1.1,r*0.12,r*0.16,0,0,7);c.fill();}}
  // fresh to foul
  if(rot<0.3&&!side&&k!=='skeleton'){c.fillStyle='rgba(255,110,140,0.45)';for(const s of [-1,1]){c.beginPath();c.ellipse(hx+s*r*0.6,hy+r*0.38,r*0.17,r*0.1,0,0,7);c.fill();}}
  if(rot<0.15){const tw=Math.abs(Math.sin(t*3+sd));c.strokeStyle='#fff';c.lineWidth=1.6;c.globalAlpha=tw;const px=hx+r*0.95,py=hy-r*0.85;c.beginPath();c.moveTo(px-5,py);c.lineTo(px+5,py);c.moveTo(px,py-5);c.lineTo(px,py+5);c.stroke();c.globalAlpha=1;}
  if(rot>0.4){c.fillStyle='rgba(90,110,40,0.55)';c.beginPath();c.ellipse(hx-r*0.35,hy-r*0.55,r*0.22,r*0.14,0.4,0,7);c.fill();}   // mold
  if(rot>0.55&&!side){c.strokeStyle='#3d2a2a';c.lineWidth=1.3;c.beginPath();c.moveTo(hx+r*0.3,hy+r*0.25);c.lineTo(hx+r*0.8,hy+r*0.45);c.stroke();for(let i=0;i<4;i++){const sx=hx+r*0.35+i*r*0.13;c.beginPath();c.moveTo(sx,hy+r*0.2+i*0.04*r);c.lineTo(sx+r*0.03,hy+r*0.38+i*0.04*r);c.stroke();}}
  if(cl.eye&&!side){const [ex,ey]=eyes[1],sw=Math.sin(t*3+sd)*r*0.18,ly=ey+r*0.75;c.strokeStyle='#a3121a';c.lineWidth=1.6;c.beginPath();c.moveTo(ex,ey+r*0.1);c.quadraticCurveTo(ex+sw*0.5,ey+r*0.45,ex+sw,ly);c.stroke();
    zEll(c,ex+sw,ly,r*0.15,r*0.15,'#fffbe6',1.6);c.fillStyle='#e8442e';c.beginPath();c.arc(ex+sw,ly+r*0.04,r*0.07,0,7);c.fill();}   // an eye on a string
  if(rot>0.68){c.fillStyle='#111';for(let i=0;i<3;i++){const a=t*(5+i)+i*2.1+sd;c.beginPath();c.arc(hx+Math.cos(a)*r*1.35,hy-r*0.5+Math.sin(a*1.3)*r*0.6,1.8,0,7);c.fill();}}   // flies
  bow();}
// draw one cheerleader's head on its own (the halftime pyramid toss): (x,y) is the head's centre
function drawCheerHead(c,x,y,size,team,cl,t,rot){const S=cheerStyle(team,cl),B=zCheerBody(ZBODY[cl.build]||ZBODY.wr,cl),k=size/100;
  c.save();c.translate(x,y);if(rot)c.rotate(rot);c.scale(k,k);zCheerHead(c,S,B,{cheer:cl,t,seed:cl.seed},0,0,'front');c.restore();}
if(typeof module!=='undefined')module.exports={drawZombie,ZSTYLE,ZBODY,makeCheerSquad,drawCheerHead};
