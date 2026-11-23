// altar.js: THE ALTAR, the other side of the Graveyard (Season mode). Loaded after yard.js and shares its canvas, its state
// (YD) and its helpers. Walk right from the graves to a torch-lit crypt run by Madame Morgue, a stern undertaker in her
// mourning gown behind her ledger. Your zombies wait in a line along the floor. Pick one, pick a station, and Madame pays
// Bones for it: more for a spry, healthy zombie, less for a worn-out has-been (sacBones in season.js). Each station sends
// a zombie off its own way: the Bone Mill, the Cauldron, the Spider's Loom or the Trapdoor. The team plays fired up next game.
const A_SIDE={x:6,y:356,w:102,h:120},A_FLOOR=560,A_LINE_Y=1168;
const A_ST=[
  {id:'loom',name:"The Spider's Loom",x:176,y:660,k:0.82,say:'Gertrude! Supper!',w:200,h:300},
  {id:'pot',name:'The Cauldron',x:572,y:668,k:0.82,say:'Mind the splash, dearie.',w:180,h:200},
  {id:'mill',name:'The Bone Mill',x:150,y:944,k:1,say:'Into the mill you go!',w:180,h:230},
  {id:'door',name:'The Trapdoor',x:588,y:930,k:1,say:'Going down!',w:200,h:150}];
const A_DUR=4.2,A_WALK=1.4;
const YA={zi:-1,hover:-1,st:-1,stHover:-1,act:null,say:null,parts:[],imps:[],bg:null,plus:null,seen:false,millA:0,spider:{y:0},tagged:null};
const A_HELLO=['Welcome to the Altar, dearie. Bring me heroes or has-beens. The better they are, the more I pay.',
  'Back again? Pick someone from the line, then a station.','The ledger is open. Who is it today?'];
const A_AFTER=['Every bone accounted for.','Lovely. Next!','Gertrude says thank you.','That one had spirit. Had.'];

function altarEnter(){YA.zi=-1;YA.st=-1;YA.hover=-1;YA.stHover=-1;if(!YA.imps.length)aImps();
  if(!YA.act)aSay(A_HELLO[YA.seen?1+Math.floor(Math.random()*2):0],6);YA.seen=true;}
// open the Altar with one zombie already picked (from a Time's up screen)
function altarGo(id){YD.view=1;YD.pan=1;altarEnter();const L=altarLine(),i=L.findIndex(z=>z.id===id);if(i>=0){YA.zi=i;aAppraise(L[i]);}}
function altarLine(){const u=userTeam();return u.squad.concat(u.bench).filter(z=>z&&!(YA.act&&YA.act.hide===z.id));}
function aLinePos(i,n){const sp=Math.min(68,620/Math.max(1,n-1)),x0=YW/2-(n-1)*sp/2;return {x:x0+i*sp,y:A_LINE_Y-(i%2?10:0)};}
const aScale=y=>yClamp(0.5+(y-600)/(A_LINE_Y-600)*0.5,0.45,1.05);
function aSay(t,d){YA.say={t,life:d||5,max:d||5};}
function aCond(z){if(z.kept)return 'kept past the end';return lifeWord(z);}
function aAppraise(z){if(z.free){aSay(`${z.name}, a free walk-on? I don't pay for freebies, dearie.`,5);return;}
  const b=sacBones(z),v=zValue(z),q=b/v;sfx.blip&&sfx.blip();
  const P=zPower(z),worn=z.kept||zLife(z)/lifeMax(z)<0.3;
  const tone=z.frail?'A Z-team scrap. I can use the knuckles.':worn?'This one has seen better centuries.':P>=60?'Ooh, a fine specimen.':P>=42?'Serviceable.':'Scrawny, but bones are bones.';
  aSay(`${z.name}, Power ${zPower(z)}, ${aCond(z)}. ${tone} I'll give you ${b} Bones.`,8);}

// ----- input
function aHitZombie(x,y){const L=altarLine();for(let i=L.length-1;i>=0;i--){const p=aLinePos(i,L.length),s=aScale(p.y);if(Math.abs(x-p.x)<32*s+4&&y<p.y+6&&y>p.y-140*s)return i;}return -1;}
function aHitStation(x,y){for(let i=0;i<A_ST.length;i++){const S=A_ST[i],w=S.w*S.k,h=S.h*S.k;if(x>S.x-w/2&&x<S.x+w/2&&y>S.y-h&&y<S.y+30*S.k)return i;}return -1;}
function altarPointer(kind,x,y,ptype){
  if(kind==='move'){if(ptype&&ptype!=='mouse')return;YA.hover=YA.act?-1:aHitZombie(x,y);YA.stHover=YA.act?-1:aHitStation(x,y);YD.signHover=yIn(A_SIDE,x,y)?-1:0;
    const cv=document.getElementById('yardCv');if(cv&&cv.style)cv.style.cursor=YA.hover>=0||YA.stHover>=0||YD.signHover||yIn(Y_BACK,x,y)?'pointer':'default';return;}
  if(yIn(Y_BACK,x,y)){sfx.select&&sfx.select();yardClose();return;}
  if(yIn(A_SIDE,x,y)){yardSide(0);return;}
  if(YA.act)return;
  const i=aHitZombie(x,y);if(i>=0){YA.zi=i;aAppraise(altarLine()[i]);return;}
  const st=aHitStation(x,y);if(st>=0){YA.st=st;aAsk(st);return;}}
function altarKey(c){if(c==='Escape'||c==='Backspace'||c==='KeyQ'||c==='PageUp'){yardSide(0);return;}if(YA.act)return;const L=altarLine();
  if(c==='ArrowLeft'||c==='KeyA'){if(YA.zi<=0){yardSide(0);return;}YA.zi--;aAppraise(L[YA.zi]);return;}
  if(c==='ArrowRight'||c==='KeyD'){if(!L.length)return;YA.zi=Math.min(L.length-1,YA.zi+1);aAppraise(L[YA.zi]);return;}
  if(c==='ArrowUp'||c==='KeyW'||c==='ArrowDown'||c==='KeyS'){const d=c==='ArrowUp'||c==='KeyW'?-1:1;YA.st=YA.st<0?(d>0?0:3):(YA.st+d+4)%4;sfx.blip&&sfx.blip();aSay(`${A_ST[YA.st].name}. ${YA.zi>=0?'Press Enter to send '+L[YA.zi].name+' there.':'Pick someone from the line first.'}`,4);return;}
  if((c==='Enter'||c==='Space'||c==='NumpadEnter')){if(YA.zi<0){YA.zi=0;if(L[0])aAppraise(L[0]);return;}if(YA.st<0){YA.st=0;aSay(`${A_ST[0].name}? Up and down to choose, Enter to send.`,4);return;}aAsk(YA.st);}}
function aAsk(st){const L=altarLine(),z=L[YA.zi];if(!z){aSay('Pick someone from the line first, dearie.',4);sfx.groan&&sfx.groan();return;}
  if(z.free){aAppraise(z);return;}const f=zFind(z.id),u=userTeam(),S=A_ST[st],b=sacBones(z);
  const fill=!f||f.where!=='squad'?'':benchFor(f.i)>=0?` ${u.bench[benchFor(f.i)].name} moves up from the bench.`:' A free Z-team walk-on takes the spot.';
  YD.ask={text:`Send ${z.name} to ${S.name}? ${z.name} is gone for good. Madame pays ${b} Bones, and the ${TEAMS[0].name} play fired up next game.${fill}`,
    btns:[{label:'Do it',danger:true,fn:()=>aStart(st,z)},{label:'Not now',fn:()=>{}}]};yAskLayout();}
function aStart(st,z){if(YA.act)return;const L=altarLine(),i=L.findIndex(q=>q.id===z.id),from=aLinePos(i<0?0:i,L.length);
  const snap={id:z.id,name:z.name,num:z.num,look:z.look,kind:z.kind,hurt:Object.assign({},z.hurt||{}),seed:parseInt(String(z.id).replace(/\D/g,''))||1};
  const r=sacrificeZ(z.id);if(!r){sfx.groan&&sfx.groan();return;}
  YA.act={st,z:snap,t0:YD.t,from,r,paid:r.bones,hide:r.walkOn?r.walkOn.id:null,fx:{}};YA.zi=-1;YA.hover=-1;YA.st=st;
  aSay(A_ST[st].say,3);sfx.groan&&sfx.groan();}
function aFinish(){const A=YA.act;if(!A)return;const L=A.r.walkOn?` ${A.r.walkOn.name}, a free Z-team walk-on, takes the spot.`:A.r.slot>=0?` ${userTeam().squad[A.r.slot].name} moves up from the bench.`:'';
  aSay(`${A.paid} Bones. ${A_AFTER[Math.floor(Math.random()*A_AFTER.length)]} The team plays fired up for ${A.z.name}.${L}`,7);
  YA.plus={t:`+${A.paid} Bones`,life:2.4};sfx.cheer&&sfx.cheer();YA.act=null;YA.st=-1;}

// ----- each frame
function altarTick(dt){if(!YD.on)return;const T=YD.t;if(YA.say&&YD.pan>0.99&&(YA.say.life-=dt)<=0)YA.say=null;if(YA.plus&&(YA.plus.life-=dt)<=0)YA.plus=null;
  for(const p of YA.parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.g==null?900:p.g)*dt;p.a+=(p.va||0)*dt;p.life-=dt;if(p.floor&&p.y>p.floor){p.y=p.floor;p.vy*=-0.3;p.vx*=0.6;p.va=0;}}
  YA.parts=YA.parts.filter(p=>p.life>0);
  for(const m of YA.imps){m.t-=dt;if(m.t<=0){m.tx=yLerp(150,570,Math.random());m.ty=yLerp(A_FLOOR+60,1000,Math.random());m.t=yLerp(2,5,Math.random());}
    const dx=m.tx-m.x,dy=m.ty-m.y,d=Math.hypot(dx,dy);if(d>3){const v=Math.min(d,90*dt);m.x+=dx/d*v;m.y+=dy/d*v;m.walk+=dt*12;m.dir=dx<0?-1:1;}}
  const A=YA.act;if(!A)return;const k=T-A.t0-A_WALK,S=A_ST[A.st],F=A.fx,once=(n,at)=>{if(k>=at&&!F[n]){F[n]=1;return true;}return false;};
  if(k<0)return;
  if(S.id==='mill'){YA.millA+=dt*(k>0.5&&k<3.1?14:1);if(k>1.1&&k<3.1&&Math.random()<dt*9){aBone(S.x+54*S.k,S.y-34*S.k,60+Math.random()*80,-80-Math.random()*60,S.y+6);}
    if(once('in',0.55))sfx.chomp&&sfx.chomp(0.7);if(once('grind',0.8)&&sfx.noise)sfx.noise(2.2,'bandpass',180,0.45,3);}
  if(S.id==='pot'){if(once('splash',0.6)){sfx.fwump&&sfx.fwump();for(let n=0;n<30;n++)YA.parts.push({x:S.x+(Math.random()-0.5)*80,y:S.y-96*S.k,vx:(Math.random()-0.5)*420,vy:-200-Math.random()*360,life:1,a:0,k:'drop'});}
    if(k>2.2&&k<3.4&&Math.random()<dt*7)aBone(S.x+(Math.random()-0.5)*50,S.y-100*S.k,(Math.random()-0.5)*260,-420-Math.random()*200,S.y+20+Math.random()*30);}
  if(S.id==='loom'){if(once('drop',0.05)&&sfx.tone)sfx.tone('sine',900,300,0.8,0.06);if(once('wrap',0.8)&&sfx.noise)sfx.noise(1.1,'highpass',3000,0.18,2);
    if(k>2.9&&k<3.7&&Math.random()<dt*10)aBone(S.x+(Math.random()-0.5)*120,S.y-380,(Math.random()-0.5)*60,0,S.y+10+Math.random()*20);}
  if(S.id==='door'){if(once('lever',0.3))sfx.hit&&sfx.hit();if(once('fall',0.5)&&sfx.tone)sfx.tone('sine',600,90,0.9,0.12);
    if(once('burp',1.6)){if(sfx.tone)sfx.tone('sawtooth',110,70,0.5,0.15);YA.burp=T;}
    if(k>2.0&&k<3.1&&Math.random()<dt*9)aBone(S.x+(Math.random()-0.5)*40,S.y-30,(Math.random()-0.5)*320,-560-Math.random()*200,S.y+12+Math.random()*40);
    if(once('shut',3.3))sfx.hit&&sfx.hit();}
  if(k>=A_DUR)aFinish();}
function aBone(x,y,vx,vy,floor){YA.parts.push({x,y,vx,vy,life:2.4,a:Math.random()*6,va:(Math.random()-0.5)*12,k:'bone',floor,sk:Math.random()<0.15});if(Math.random()<0.4)sfx.pop&&sfx.pop();}
function aImps(){YA.imps=[0,1,2].map(i=>({x:yLerp(200,520,Math.random()),y:yLerp(A_FLOOR+80,980,Math.random()),tx:0,ty:0,t:Math.random()*2,walk:0,dir:1,bone:i!==1}));}

// ----- drawing
function altarDraw(c){const T=YD.t;c.save();
  if(!YA.bg)YA.bg=aBackground();if(YA.bg&&YA.bg.getContext)c.drawImage(YA.bg,0,0);else aBackDraw(c);
  aTorches(c,T);aArchGlow(c,T);
  const L=altarLine(),list=[];
  A_ST.forEach((S,i)=>list.push({y:S.y,fn:()=>aStation(c,S,i,T)}));
  list.push({y:900,fn:()=>aMadame(c,T)});
  for(const m of YA.imps)list.push({y:m.y,fn:()=>aImp(c,m,T)});
  L.forEach((z,i)=>{const p=aLinePos(i,L.length);list.push({y:p.y,fn:()=>aLiner(c,z,i,p,T)});});
  if(YA.act)list.push({y:aActY(),fn:()=>aActor(c,T)});
  list.sort((a,b)=>a.y-b.y).forEach(o=>o.fn());
  aOverStation(c,T);
  for(const p of YA.parts){c.globalAlpha=yClamp(p.life*2,0,1);if(p.k==='bone')yBone(c,p.x,p.y,0.9,p.a,p.sk);else{c.fillStyle='#8cff5a';c.beginPath();c.arc(p.x,p.y,4,0,7);c.fill();}}c.globalAlpha=1;
  ySign(c,A_SIDE,'THE GRAVES',-1,T);yVignette(c);aHUD(c,T);aBubble(c,T);c.restore();}
function aBackground(){let cv=null;try{cv=document.createElement('canvas');cv.width=YW;cv.height=YH;}catch(e){}const c=cv&&cv.getContext&&cv.getContext('2d');if(!c||!c.fillRect)return null;aBackDraw(c);return cv;}
function aBackDraw(c){const r=yRng(4242);
  // the back wall: big dark stones
  let gr=c.createLinearGradient(0,0,0,A_FLOOR);gr.addColorStop(0,'#120d16');gr.addColorStop(1,'#2c2333');c.fillStyle=gr;c.fillRect(0,0,YW,A_FLOOR+4);
  c.strokeStyle='rgba(0,0,0,0.55)';c.lineWidth=3;for(let y=140,row=0;y<A_FLOOR;y+=46,row++){c.beginPath();c.moveTo(0,y);c.lineTo(YW,y);c.stroke();for(let x=(row%2)*40;x<YW;x+=80){c.beginPath();c.moveTo(x,y);c.lineTo(x,y+46);c.stroke();}}
  c.fillStyle='rgba(255,255,255,0.03)';for(let i=0;i<60;i++)c.fillRect(r()*YW,130+r()*(A_FLOOR-130),20+r()*40,4);
  // banners and chains
  for(const bx of [200,520]){c.fillStyle='#3d1452';c.beginPath();c.moveTo(bx-34,150);c.lineTo(bx+34,150);c.lineTo(bx+34,320);c.lineTo(bx,296);c.lineTo(bx-34,320);c.closePath();c.fill();
    c.fillStyle='#d9d2bd';c.beginPath();c.arc(bx,210,16,0,7);c.fill();c.fillRect(bx-9,222,18,10);c.fillStyle='#3d1452';c.beginPath();c.arc(bx-6,208,4.5,0,7);c.arc(bx+6,208,4.5,0,7);c.fill();c.fillRect(bx-1,216,2,6);
    c.fillStyle='#b48a2a';c.fillRect(bx-38,144,76,8);}
  c.strokeStyle='#4a4450';c.lineWidth=3;for(const cx of [40,300,420,680]){for(let y=130;y<130+r()*120+60;y+=14){c.beginPath();c.ellipse(cx,y,4,7,0,0,7);c.stroke();}}
  // the arch behind Madame
  c.fillStyle='#0a060c';c.beginPath();c.moveTo(250,A_FLOOR);c.lineTo(250,340);c.quadraticCurveTo(250,240,360,214);c.quadraticCurveTo(470,240,470,340);c.lineTo(470,A_FLOOR);c.closePath();c.fill();
  c.strokeStyle='#5b5066';c.lineWidth=14;c.stroke();c.strokeStyle='#2a2230';c.lineWidth=4;c.stroke();
  c.fillStyle='#d9d2bd';c.beginPath();c.arc(360,222,20,0,7);c.fill();c.fillRect(349,236,22,12);c.fillStyle='#0a060c';c.beginPath();c.arc(353,220,5.5,0,7);c.arc(367,220,5.5,0,7);c.fill();
  // the floor: flagstones in perspective
  gr=c.createLinearGradient(0,A_FLOOR,0,YH);gr.addColorStop(0,'#2a2329');gr.addColorStop(1,'#4a3f45');c.fillStyle=gr;c.fillRect(0,A_FLOOR,YW,YH-A_FLOOR);
  c.strokeStyle='rgba(0,0,0,0.45)';c.lineWidth=2;const vx=360,vy=300;
  for(let x=-900;x<=1620;x+=110){c.beginPath();c.moveTo(vx+(x-vx)*((A_FLOOR-vy)/(YH-vy)),A_FLOOR);c.lineTo(x,YH);c.stroke();}
  for(let y=A_FLOOR,d=22;y<YH;y+=d,d*=1.22){c.beginPath();c.moveTo(0,y);c.lineTo(YW,y);c.stroke();}
  c.fillStyle='rgba(0,0,0,0.5)';c.fillRect(0,A_FLOOR,YW,10);
  for(let i=0;i<14;i++){const y=yLerp(A_FLOOR+30,YH-40,r());yBone(c,r()*YW,y,0.5+(y-A_FLOOR)/1000,r()*6,r()<0.2);}
  // a faint chalk ring of scratch marks in front of the lectern
  c.strokeStyle='rgba(180,255,90,0.18)';c.lineWidth=3;c.beginPath();c.ellipse(360,960,190,48,0,0,7);c.stroke();c.lineWidth=2;
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2,mx=360+Math.cos(a)*168,my=960+Math.sin(a)*40;c.beginPath();c.moveTo(mx-5,my-5);c.lineTo(mx+5,my+5);c.moveTo(mx+5,my-5);c.lineTo(mx-5,my+5);if(i%2){c.moveTo(mx,my-8);c.lineTo(mx,my+8);}c.stroke();}}
function aTorches(c,T){for(const [x,y] of [[88,300],[632,300]]){c.fillStyle='#3b2817';c.fillRect(x-6,y,12,40);c.fillStyle='#6b6070';c.fillRect(x-14,y-6,28,10);
  const f=Math.sin(T*13+x)*3,g=c.createRadialGradient(x,y-20,4,x,y-20,120);g.addColorStop(0,'rgba(255,170,60,0.35)');g.addColorStop(1,'rgba(255,120,30,0)');c.fillStyle=g;c.fillRect(x-120,y-140,240,240);
  c.fillStyle='#ff8a2a';c.beginPath();c.moveTo(x-11,y-4);c.quadraticCurveTo(x-14+f,y-30,x+f,y-46-Math.abs(f)*2);c.quadraticCurveTo(x+14+f,y-28,x+11,y-4);c.fill();
  c.fillStyle='#ffe26a';c.beginPath();c.moveTo(x-5,y-4);c.quadraticCurveTo(x-6+f,y-18,x+f*0.6,y-28);c.quadraticCurveTo(x+6,y-18,x+5,y-4);c.fill();}}
function aArchGlow(c,T){const a=0.25+Math.sin(T*1.7)*0.1,g=c.createRadialGradient(360,420,10,360,420,170);g.addColorStop(0,`rgba(150,80,255,${a})`);g.addColorStop(1,'rgba(90,30,160,0)');c.fillStyle=g;c.fillRect(190,240,340,330);}

// Madame Morgue: our own undertaker. A tall, stern lady in a high-collared black mourning gown, a wide hat with a short veil,
// a tape measure round her neck, quill in hand behind her ledger. Campy and severe, never glamorous.
function aMadame(c,T){const x=360,top=780,talk=YA.say&&YA.say.life>0.4,mo=talk?Math.abs(Math.sin(T*14))*4:0,gest=YA.act?Math.sin(Math.min(1,(T-YA.act.t0)*2)*Math.PI):0;
  c.save();c.translate(x,0);
  const sway=Math.sin(T*1.3)*2;c.translate(sway,0);
  // gown (only the top shows above the lectern)
  c.fillStyle='#16121a';c.beginPath();c.moveTo(-58,top+10);c.lineTo(-46,618);c.quadraticCurveTo(0,598,46,618);c.lineTo(58,top+10);c.closePath();c.fill();
  c.strokeStyle='#2b2333';c.lineWidth=2;for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(i*7,624);c.lineTo(i*7,top);c.stroke();}
  c.fillStyle='#8b7cab';for(let i=0;i<5;i++){c.beginPath();c.arc(0,632+i*22,3,0,7);c.fill();}   // jet buttons, catching the arch's glow
  // sleeves and arms: the left writes, the right gestures
  c.fillStyle='#16121a';c.save();c.translate(-44,630);c.rotate(0.25+Math.sin(T*6)*0.05);c.fillRect(-12,0,24,108);c.fillStyle='#bdb6c8';c.beginPath();c.arc(0,114,10,0,7);c.fill();
  c.strokeStyle='#e6dfef';c.lineWidth=2;c.beginPath();c.moveTo(4,110);c.lineTo(24,74);c.stroke();c.restore();
  c.save();c.translate(44,630);c.rotate(-0.35-(talk?0.35+Math.sin(T*5)*0.2:0)-gest*1.4);c.fillStyle='#16121a';c.fillRect(-12,0,24,100);c.fillStyle='#bdb6c8';c.beginPath();c.arc(0,106,10,0,7);c.fill();
  c.fillRect(-2,106,4,16);c.restore();
  // the tape measure round her neck
  c.strokeStyle='#d9b23a';c.lineWidth=7;c.beginPath();c.moveTo(-30,612);c.quadraticCurveTo(-36,660,-30,700);c.moveTo(30,612);c.quadraticCurveTo(36,660,32,690);c.stroke();
  c.strokeStyle='#5a4313';c.lineWidth=1;for(let i=0;i<8;i++){c.beginPath();c.moveTo(-34,626+i*9);c.lineTo(-28,626+i*9);c.moveTo(28,626+i*8);c.lineTo(34,626+i*8);c.stroke();}
  // high collar and neck
  c.fillStyle='#bdb6c8';c.fillRect(-11,586,22,18);c.fillStyle='#16121a';c.beginPath();c.moveTo(-26,618);c.lineTo(-18,584);c.lineTo(18,584);c.lineTo(26,618);c.closePath();c.fill();
  c.strokeStyle='#e9e2d0';c.lineWidth=2;c.beginPath();c.moveTo(-17,586);c.lineTo(17,586);c.stroke();
  // head: long, pale, stern
  c.fillStyle='#c9c3d6';c.beginPath();c.ellipse(0,552,27,36,0,0,7);c.fill();
  c.fillStyle='#a49cb6';c.beginPath();c.ellipse(-14,566,7,5,0,0,7);c.ellipse(14,566,7,5,0,0,7);c.fill();   // hollow cheeks
  c.fillStyle='#5d5a63';c.beginPath();c.arc(0,520,26,Math.PI*1.05,Math.PI*1.95);c.fill();   // silver hair under the hat
  const blink=(T%4.3)<0.12;c.fillStyle='#1b1620';
  if(blink){c.fillRect(-15,546,10,2);c.fillRect(5,546,10,2);}else{c.beginPath();c.ellipse(-10,547,5,3.5,0,0,7);c.ellipse(10,547,5,3.5,0,0,7);c.fill();c.fillStyle='#b4ff5a';c.fillRect(-11,546,2,2);c.fillRect(9,546,2,2);}
  c.strokeStyle='#3a3340';c.lineWidth=2.5;c.beginPath();c.moveTo(-17,538);c.lineTo(-4,540);c.moveTo(4,540);c.lineTo(17,talk?532:537);c.stroke();   // one brow up when she talks
  c.strokeStyle='#8f86a3';c.lineWidth=2;c.beginPath();c.moveTo(0,548);c.lineTo(-2,562);c.lineTo(2,563);c.stroke();
  c.fillStyle='#4a2340';c.beginPath();c.ellipse(0,574,8,2+mo*0.6,0,0,7);c.fill();
  // the hat: wide brim, tall crown, violet band, a short veil at the brim's edge
  c.fillStyle='#0d0a10';c.beginPath();c.ellipse(0,516,64,12,0,0,7);c.fill();c.fillRect(-30,478,60,38);c.beginPath();c.ellipse(0,478,30,7,0,0,7);c.fill();
  c.fillStyle='#5a2a7a';c.fillRect(-30,503,60,9);c.fillStyle='#d9d2bd';c.beginPath();c.arc(20,507,5,0,7);c.fill();
  c.strokeStyle='rgba(30,24,36,0.6)';c.lineWidth=1;for(let i=-60;i<=60;i+=6){c.beginPath();c.moveTo(i,518);c.lineTo(i*1.04,532-Math.abs(i)*0.12);c.stroke();}
  c.restore();
  // the lectern and ledger
  c.save();c.fillStyle='#4a2f1a';c.beginPath();c.moveTo(270,top);c.lineTo(450,top);c.lineTo(436,900);c.lineTo(284,900);c.closePath();c.fill();c.strokeStyle='#24150b';c.lineWidth=4;c.stroke();
  c.fillStyle='#5e3d22';c.fillRect(262,top-12,196,18);c.fillStyle='#d9d2bd';c.beginPath();c.arc(360,836,22,0,7);c.fill();c.fillRect(348,852,24,12);c.fillStyle='#4a2f1a';c.beginPath();c.arc(352,834,6,0,7);c.arc(368,834,6,0,7);c.fill();
  c.fillStyle='#efe6cc';c.beginPath();c.moveTo(282,top-12);c.lineTo(358,top-22);c.lineTo(358,top-6);c.lineTo(284,top+2);c.closePath();c.fill();c.beginPath();c.moveTo(362,top-22);c.lineTo(438,top-12);c.lineTo(436,top+2);c.lineTo(362,top-6);c.closePath();c.fill();
  c.strokeStyle='#9a8f74';c.lineWidth=1;for(let i=0;i<3;i++){c.beginPath();c.moveTo(292,top-12+i*4);c.lineTo(350,top-19+i*4);c.moveTo(370,top-19+i*4);c.lineTo(428,top-12+i*4);c.stroke();}
  // a candle
  c.fillStyle='#e9e2d0';c.fillRect(424,top-50,12,38);const f=Math.sin(T*11)*1.5;c.fillStyle='#ffcf5a';c.beginPath();c.ellipse(430+f,top-58,4,9,0,0,7);c.fill();c.restore();}
function aImp(c,m,T){c.save();c.translate(m.x,m.y);const s=aScale(m.y)*0.9;c.scale(s*m.dir,s);const b=Math.abs(Math.sin(m.walk))*4;
  c.fillStyle='rgba(0,0,0,0.3)';c.beginPath();c.ellipse(0,2,18,5,0,0,7);c.fill();
  c.strokeStyle='#6d2a1c';c.lineWidth=5;c.beginPath();c.moveTo(-5,-14);c.lineTo(-8+Math.sin(m.walk)*6,0);c.moveTo(5,-14);c.lineTo(8-Math.sin(m.walk)*6,0);c.stroke();
  c.fillStyle='#9a3b26';c.beginPath();c.ellipse(0,-26-b,13,15,0,0,7);c.fill();c.beginPath();c.arc(0,-48-b,12,0,7);c.fill();
  c.fillStyle='#e8d9b0';c.beginPath();c.moveTo(-8,-56-b);c.lineTo(-12,-68-b);c.lineTo(-3,-58-b);c.moveTo(8,-56-b);c.lineTo(12,-68-b);c.lineTo(3,-58-b);c.fill();
  c.fillStyle='#ffe14a';c.beginPath();c.arc(4,-50-b,3,0,7);c.arc(10,-50-b,2.5,0,7);c.fill();
  c.strokeStyle='#9a3b26';c.lineWidth=3;c.beginPath();c.moveTo(-10,-22-b);c.quadraticCurveTo(-26,-18,-22,-34-b);c.stroke();
  if(m.bone)yBone(c,14,-32-b,0.7,0.4,false);c.restore();}
function aLiner(c,z,i,p,T){const s=aScale(p.y),sz=130*s,sel=YA.zi===i,hov=YA.hover===i;
  if(sel||hov){c.fillStyle=sel?'rgba(180,255,90,0.35)':'rgba(255,255,255,0.18)';c.beginPath();c.ellipse(p.x,p.y+2,32*s,9*s,0,0,7);c.fill();c.strokeStyle=sel?'#b4ff5a':'#ffffff';c.lineWidth=2;c.stroke();}
  const lm={la:1,ra:1,ll:1,rl:1,head:1};if(z.hurt)for(const k of PARTS)if(z.hurt[k])lm[k]=0;
  const bob=sel?Math.abs(Math.sin(T*5))*6:0,fid=(T*0.6+i*1.7)%5<0.5;
  drawZombie(c,p.x,p.y-bob,sz,{look:z.look,team:yUniform(),body:KINDS[z.kind].body,view:fid?'side':'front',flip:i%2===0,phase:T*3+i,speed:0,limbs:lm,pose:'stand',num:z.num,t:T+i,seed:parseInt(String(z.id).replace(/\D/g,''))||1,ball:false});
  const ty=p.y-sz*1.08-bob,label=z.free?'FREE':String(zPower(z));c.font='bold 14px Arial';const w=Math.max(30,c.measureText(label).width+12);
  c.fillStyle=z.free?'rgba(90,90,90,0.9)':sel?'#2f5d1c':'rgba(20,14,10,0.85)';c.fillRect(p.x-w/2,ty-16,w,20);c.fillStyle=z.free?'#ddd':'#e8ffd0';c.textAlign='center';c.fillText(label,p.x,ty-1);}
function aStation(c,S,i,T){const k=S.k,A=YA.act&&YA.act.st===i?YA.act:null,q=A?T-A.t0-A_WALK:-1,hl=!YA.act&&(YA.stHover===i||YA.st===i);
  c.save();c.translate(S.x,S.y);c.scale(k,k);
  if(hl){c.shadowColor='#b4ff5a';c.shadowBlur=24;}
  c.fillStyle='rgba(0,0,0,0.35)';c.beginPath();c.ellipse(0,6,S.w*0.5,16,0,0,7);c.fill();
  if(S.id==='mill'){const sh=q>0.5&&q<3.1?Math.sin(T*60)*2:0;c.translate(sh,0);
    c.fillStyle='#4a2f1a';c.fillRect(-60,-150,12,150);c.fillRect(48,-150,12,150);
    c.fillStyle='#6b4527';c.beginPath();c.moveTo(-76,-210);c.lineTo(76,-210);c.lineTo(44,-140);c.lineTo(-44,-140);c.closePath();c.fill();c.strokeStyle='#2a180c';c.lineWidth=4;c.stroke();
    c.fillStyle='#5a3b22';c.fillRect(-50,-140,100,90);c.strokeRect(-50,-140,100,90);
    c.fillStyle='#3b2817';c.beginPath();c.moveTo(30,-60);c.lineTo(70,-34);c.lineTo(62,-24);c.lineTo(26,-46);c.closePath();c.fill();
    c.fillStyle='#4a2f1a';c.beginPath();c.ellipse(70,-10,30,12,0,0,7);c.fill();c.fillStyle='#d9d2bd';for(let n=0;n<4;n++){c.beginPath();c.ellipse(60+n*7,-16,6,3,n,0,7);c.fill();}
    c.save();c.translate(-66,-96);c.rotate(YA.millA);c.strokeStyle='#8a6339';c.lineWidth=6;c.beginPath();c.arc(0,0,38,0,7);c.stroke();for(let n=0;n<6;n++){c.rotate(Math.PI/3);c.beginPath();c.moveTo(0,0);c.lineTo(38,0);c.stroke();}c.fillStyle='#d9b23a';c.beginPath();c.arc(0,0,7,0,7);c.fill();c.restore();}
  if(S.id==='pot'){const fl=Math.sin(T*12);c.fillStyle='#ff7b2a';for(let n=-2;n<=2;n++){c.beginPath();c.moveTo(n*22-10,-8);c.quadraticCurveTo(n*22+fl*3,-46-Math.abs(n)*-4,n*22+10,-8);c.fill();}
    c.fillStyle='#ffd24a';for(let n=-1;n<=1;n++){c.beginPath();c.moveTo(n*24-6,-8);c.quadraticCurveTo(n*24-fl*2,-28,n*24+6,-8);c.fill();}
    c.fillStyle='#141016';c.beginPath();c.ellipse(0,-90,84,70,0,0,Math.PI);c.lineTo(-84,-90);c.fill();c.beginPath();c.ellipse(0,-92,88,20,0,0,7);c.fill();
    const boil=q>0.6&&q<3.4?1:0.35;c.fillStyle='#4fbf3a';c.beginPath();c.ellipse(0,-92,76,15,0,0,7);c.fill();
    for(let n=0;n<6;n++){const ph=(T*(1+boil)+n*0.37)%1,bx=Math.sin(n*2.3)*50;c.fillStyle=`rgba(190,255,140,${(1-ph)*0.8})`;c.beginPath();c.arc(bx,-94-ph*18*boil,4+ph*8*boil,0,7);c.fill();}
    c.strokeStyle='#2a2230';c.lineWidth=6;c.beginPath();c.moveTo(40,-96);c.lineTo(70,-170);c.stroke();}
  if(S.id==='loom'){c.strokeStyle='#4a3a2a';c.lineWidth=10;c.beginPath();c.moveTo(-80,0);c.lineTo(-80,-250);c.lineTo(80,-250);c.lineTo(80,0);c.stroke();
    c.strokeStyle='rgba(235,235,245,0.55)';c.lineWidth=1.5;for(let n=0;n<7;n++){c.beginPath();c.moveTo(-80,-250+n*36);c.lineTo(80,-250+((n+3)%7)*36);c.stroke();}
    for(let r=20;r<80;r+=18){c.beginPath();for(let a=0;a<=8;a++){const ang=a/8*Math.PI;c.lineTo(Math.cos(ang)*r*1.4-0,-250+Math.sin(ang)*r);}c.stroke();}
    if(!A||q<0)aSpider(c,0,-262,T,1);}
  if(S.id==='door'){const open=q<0?0:q<0.4?0:q<3.3?yEase((q-0.4)/0.25):1-yEase((q-3.3)/0.3);
    c.fillStyle='#0a0608';c.beginPath();c.moveTo(-70,-36);c.lineTo(70,-36);c.lineTo(80,10);c.lineTo(-80,10);c.closePath();c.fill();
    if(open<1){c.save();c.fillStyle='#5a3b22';c.strokeStyle='#2a180c';c.lineWidth=4;const dy=open*44;c.beginPath();c.moveTo(-70,-36);c.lineTo(70,-36);c.lineTo(80-open*6,10+dy);c.lineTo(-80+open*6,10+dy);c.closePath();c.fill();c.stroke();
      c.strokeStyle='#3b2817';c.lineWidth=2;for(let n=-2;n<=2;n++){c.beginPath();c.moveTo(n*28,-34);c.lineTo(n*31,8+dy);c.stroke();}c.strokeStyle='#8a8590';c.lineWidth=3;c.beginPath();c.arc(0,-12+dy*0.5,8,0,7);c.stroke();c.restore();}
    const lv=q<0.3?0:Math.min(1,(q-0.3)*6)*(q>3.2?yClamp(1-(q-3.2)*3,0,1):1);const la=0.6-lv*1.2,lx=-106+Math.sin(la)*70,ly=-6-Math.cos(la)*70;c.fillStyle='#4a4450';c.fillRect(-114,-12,16,14);c.strokeStyle='#8a6339';c.lineWidth=7;c.beginPath();c.moveTo(-106,-6);c.lineTo(lx,ly);c.stroke();
    c.fillStyle='#a8261a';c.beginPath();c.arc(lx,ly,9,0,7);c.fill();}
  c.shadowBlur=0;
  // the name plaque
  c.font='bold 17px Arial';const w=c.measureText(S.name).width+20;c.fillStyle=hl?'#2f5d1c':'rgba(20,14,10,0.85)';c.fillRect(-w/2,18,w,26);c.strokeStyle=hl?'#b4ff5a':'#6b5a3a';c.lineWidth=2;c.strokeRect(-w/2,18,w,26);
  c.fillStyle='#f2e6c8';c.textAlign='center';c.fillText(S.name,0,37);c.restore();}
// things drawn over a station while it works (the cauldron's rim over the sinking zombie, the spider coming down, the burp)
function aOverStation(c,T){const A=YA.act;if(!A)return;const S=A_ST[A.st],q=T-A.t0-A_WALK;if(q<0)return;
  if(S.id==='pot'&&q>1.4&&q<2.3){const w=Math.sin((q-1.4)*14)*0.5,x=S.x+10,y=S.y-96*S.k-Math.sin((q-1.4)/0.9*Math.PI)*36;c.save();c.translate(x,y);c.rotate(w);c.fillStyle='#8dab78';c.fillRect(-5,0,10,30);c.beginPath();c.arc(0,-2,10,0,7);c.fill();for(let n=-2;n<=2;n++)c.fillRect(n*4-1.5,-16,3,10);c.restore();}
  if(S.id==='loom'){const hy=S.y-118*S.k,sy=q<0.8?yLerp(-60,hy,yEase(q/0.8)):q<2.0?hy:yLerp(hy,-120,yEase((q-2.0)/0.9));const sx=S.x+(q>0.8&&q<2.0?Math.sin((q-0.8)*9)*46:0);
    c.strokeStyle='rgba(235,235,245,0.8)';c.lineWidth=1.5;c.beginPath();c.moveTo(sx,0);c.lineTo(sx,sy);c.stroke();aSpider(c,sx,sy,T,1.1);}
  if(S.id==='door'&&YA.burp&&T-YA.burp<1.2){const a=T-YA.burp;c.save();c.globalAlpha=yClamp(1.2-a,0,1);c.font=`${Math.round(40+a*30)}px Bangers, Arial`;c.textAlign='center';c.lineWidth=6;c.strokeStyle='#14200c';c.fillStyle='#b4ff5a';
    c.strokeText('BURP!',S.x,S.y-80-a*60);c.fillText('BURP!',S.x,S.y-80-a*60);c.restore();}}
// Gertrude: a big, round, fuzzy purple spider with eight shiny eyes. She means well.
function aSpider(c,x,y,T,k){c.save();c.translate(x,y);c.scale(k,k);c.strokeStyle='#2a1238';c.lineWidth=5;
  for(let n=0;n<4;n++)for(const d of [-1,1]){const w=Math.sin(T*8+n)*4;c.beginPath();c.moveTo(d*10,0);c.quadraticCurveTo(d*(30+n*6),-20+n*8+w,d*(40+n*4),14+n*8);c.stroke();}
  c.fillStyle='#5a2a7a';c.beginPath();c.ellipse(0,-6,28,24,0,0,7);c.fill();c.fillStyle='#7a3ea0';c.beginPath();c.ellipse(0,14,18,15,0,0,7);c.fill();
  c.fillStyle='#ffe14a';for(const [ex,ey,r] of [[-7,10,4],[7,10,4],[-15,6,3],[15,6,3],[-4,3,2.5],[4,3,2.5],[-11,16,2.5],[11,16,2.5]]){c.beginPath();c.arc(ex,ey,r,0,7);c.fill();}
  c.fillStyle='#1b0d24';for(const [ex,ey] of [[-7,11],[7,11]]){c.beginPath();c.arc(ex,ey,1.8,0,7);c.fill();}c.restore();}
// the zombie being sent off: walks to the station, then the station takes over
function aActY(){const A=YA.act,S=A_ST[A.st],q=YD.t-A.t0;return q<A_WALK?yLerp(A.from.y,S.y+(S.id==='mill'||S.id==='pot'?20:4),yEase(q/A_WALK)):S.y+(S.id==='door'?2:1);}
function aActor(c,T){const A=YA.act,S=A_ST[A.st],q=T-A.t0,k=q-A_WALK,z=A.z;
  const tx=S.id==='mill'?S.x+100:S.id==='pot'?S.x-84*S.k:S.x,ty=S.id==='mill'?S.y+12:S.id==='pot'?S.y+20:S.y-4;
  let x,y,view='front',flip=false,pose='stand',speed=0,dj=null,clip=null,cocoon=0,air=0;
  if(q<A_WALK){const e=yEase(q/A_WALK);x=yLerp(A.from.x,tx,e);y=yLerp(A.from.y,ty,e);pose='zombie';speed=0.7;view=Math.abs(tx-A.from.x)>Math.abs(ty-A.from.y)*0.6?'side':'back';flip=tx<A.from.x;}
  else{x=tx;y=ty;
    if(S.id==='mill'){const top=S.y-206*S.k;if(k<0.55){const e=yEase(k/0.55);x=yLerp(tx,S.x,e);y=yLerp(ty,top,e)-Math.sin(e*Math.PI)*60;pose='dance';dj={la:[2.9,0.2],ra:[2.9,0.2],sq:0.1};}
      else if(k<1.2){x=S.x;y=top+yEase((k-0.55)/0.65)*150*S.k*1.1;clip=top-4;pose='dance';dj={la:[2.9,0.15],ra:[2.9,0.15]};}else return;}
    if(S.id==='pot'){const top=S.y-92*S.k;if(k<0.6){const e=yEase(k/0.6);x=yLerp(tx,S.x,e);y=yLerp(ty,top,e)-Math.sin(e*Math.PI)*90;pose='dance';dj={la:[2.9,0.2],ra:[2.9,0.2],sq:0.15};}
      else if(k<1.3){x=S.x;y=top+yEase((k-0.6)/0.7)*130*S.k;clip=top;pose='dance';dj={la:[2.9,0.2],ra:[2.9,0.2]};}else return;}
    if(S.id==='loom'){if(k<2.0){cocoon=yClamp((k-0.8)/1.1,0,1);if(cocoon<0.3){pose='dance';dj={la:[1.2,0.4],ra:[1.2,0.4],sq:0.05};}}else if(k<2.9){cocoon=1;y=yLerp(ty,-120,yEase((k-2.0)/0.9));}else return;}
    if(S.id==='door'){if(k<0.5){pose='dance';dj={la:[0.6,0.3],ra:[0.6,0.3]};}else if(k<1.1){y=ty+yEase((k-0.5)/0.6)*200;clip=S.y-30;pose='dance';dj={la:[2.9,0.1],ra:[2.9,0.1]};}else return;}}
  const s=aScale(q<A_WALK?y:ty),sz=130*s,lm={la:1,ra:1,ll:1,rl:1,head:1};for(const p of PARTS)if(z.hurt[p])lm[p]=0;
  c.save();if(clip!=null){c.beginPath();c.rect(-YW,-200,YW*3,clip+200);c.clip();}
  if(cocoon<1)drawZombie(c,x,y,sz,{look:z.look,team:yUniform(),body:KINDS[z.kind].body,view,flip,phase:T*8,speed,limbs:lm,pose,dj,num:z.num,t:T,seed:z.seed,ball:false,noShadow:clip!=null});
  if(cocoon>0){c.globalAlpha=Math.min(1,cocoon*1.4);c.fillStyle='#ecebf2';c.beginPath();c.ellipse(x,y-sz*0.52,sz*0.28,sz*0.56*Math.min(1,0.4+cocoon),0,0,7);c.fill();
    c.strokeStyle='#c4c2d0';c.lineWidth=2;for(let n=0;n<Math.round(cocoon*9);n++){const yy=y-sz*0.98+n*sz*0.11;c.beginPath();c.moveTo(x-sz*0.26,yy);c.quadraticCurveTo(x,yy+10,x+sz*0.26,yy-4);c.stroke();}
    if(cocoon>0.9){c.fillStyle='#1b1620';c.beginPath();c.arc(x-5,y-sz*0.86,2.5,0,7);c.arc(x+5,y-sz*0.86,2.5,0,7);c.fill();}c.globalAlpha=1;}
  c.restore();}
function aHUD(c,T){const u=userTeam();c.save();let gr=c.createLinearGradient(0,0,0,120);gr.addColorStop(0,'rgba(0,0,0,0.85)');gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.fillRect(0,0,YW,130);
  c.textAlign='center';c.font='54px Bangers, Arial';c.lineWidth=7;c.strokeStyle='#14081c';c.fillStyle='#c99bff';c.strokeText('THE ALTAR',YW/2+70,66);c.fillText('THE ALTAR',YW/2+70,66);
  const B=Y_BACK;c.fillStyle='rgba(28,18,34,0.9)';c.fillRect(B.x,B.y,B.w,B.h);c.strokeStyle='#c99bff';c.lineWidth=2;c.strokeRect(B.x,B.y,B.w,B.h);c.fillStyle='#fff';c.font='30px Bangers, Arial';c.fillText('◀ BACK',B.x+B.w/2,B.y+42);
  const shown=CAREER.bones-(YA.act?YA.act.paid:0);c.font='bold 18px Arial';c.fillStyle='#e6eedc';c.textAlign='right';c.fillText(`${shown} Bones · Bench ${u.bench.length} of ${BENCH_MAX}`,YW-18,104);
  if(YA.plus){const a=yClamp(YA.plus.life,0,1);c.globalAlpha=a;c.font='28px Bangers, Arial';c.fillStyle='#b4ff5a';c.fillText(YA.plus.t,YW-18,140-(2.4-YA.plus.life)*12);c.globalAlpha=1;}
  c.textAlign='left';c.fillStyle='#c9bdd6';c.font='16px Arial';c.fillText('Madame Morgue pays Bones for zombies',18,104);
  gr=c.createLinearGradient(0,YH-70,0,YH);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,0.85)');c.fillStyle=gr;c.fillRect(0,YH-70,YW,70);
  c.textAlign='center';c.font='18px Arial';c.fillStyle='#ddd0ea';c.fillText(YA.act?'':(yTouch()?'Tap a zombie in the line, then a station':'Click a zombie in the line, then a station · ← for the graves'),YW/2,YH-22);c.restore();}
function aBubble(c,T){const S=YA.say;if(!S||S.life<=0)return;const a=yClamp(Math.min(S.life,S.max-S.life)*4,0,1);c.save();c.globalAlpha=a;c.font='20px Georgia, serif';
  const lines=[];let line='';for(const w of S.t.split(' ')){if(line&&c.measureText(line+w).width>400){lines.push(line.trim());line='';}line+=w+' ';}if(line.trim())lines.push(line.trim());
  const h=26+lines.length*26,x=134,y=Math.max(150,462-h),w=452;c.fillStyle='rgba(238,230,210,0.96)';c.strokeStyle='#2a1238';c.lineWidth=3;c.beginPath();c.rect(x,y,w,h);c.fill();c.stroke();
  c.beginPath();c.moveTo(330,y+h-1);c.lineTo(352,y+h+30);c.lineTo(364,y+h-1);c.closePath();c.fill();c.beginPath();c.moveTo(330,y+h);c.lineTo(352,y+h+30);c.lineTo(364,y+h);c.stroke();
  c.fillStyle='#2a1238';c.textAlign='left';lines.forEach((l,i)=>c.fillText(l,x+24,y+30+i*26));c.restore();}
