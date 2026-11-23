// yard.js: THE GRAVEYARD, seen in first person (Season mode). Loaded after season.js; it uses that file's career, roster and
// signing rules (yardFresh, sign, zPower, zValue, KINDS...) and draws with models.js. Each week gets its own graveyard, from
// pristine and fun-spooky to gnarly and frightening, with things happening in the background. Three rows of headstones carry
// the corpses' names: hover (or tap) a stone to see the zombie, double-click (or double-tap) the dirt mound to dig one up.
// The zombie claws out (a different way each time), celebrates, a frenzied cloud of bats dresses it in the team uniform,
// and it cheers and stands there in uniform until you leave.
const YW=720,YH=1280,Y_HZ=540;
const Y_ROWS=[{y:700,s:0.5},{y:880,s:0.72},{y:1110,s:1}];
const Y_SLOTS=[[0,178],[0,362],[0,546],[1,122],[1,362],[1,600],[2,205],[2,518]];
const Y_STONES=['round','pointed','cross','obelisk','slab','celtic','round','slab'];
const Y_METHODS=['claw','burst','topple','rise','gopher','coffin','corkscrew'];
const Y_TREE={x:58,base:790,top:330};
const YD={on:false,t:0,graves:[],hover:-1,sel:-1,ev:[],evNext:1.2,parts:[],msg:null,ask:null,tap:{i:-1,t:-9},bag:[],sc:null,bg:null,mood:0};
// burial clothes: a dark, frayed funeral suit and no helmet (its own helmet colour keeps the skin cache apart from the uniform)
const Y_BURIAL=Object.assign({},ZSTYLE.zombie,{jersey:'#403d47',jerseyDk:'#28262d',trim:'#d4cdb9',stripe:'#d4cdb9',pants:'#35323b',pantsDk:'#211f25',sock:'#1d1c21',helmet:'#5a2389'});
function yRng(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const yLerp=(a,b,k)=>a+(b-a)*k,yClamp=(v,a,b)=>Math.max(a,Math.min(b,v)),yEase=k=>k<0?0:k>1?1:k*k*(3-2*k);
function yMix(a,b,k){const p=h=>[1,3,5].map(i=>parseInt(h.substr(i,2),16)),A=p(a),B=p(b);return '#'+A.map((v,i)=>Math.round(yLerp(v,B[i],k)).toString(16).padStart(2,'0')).join('');}
function yUniform(){return typeof STYLE_OF==='function'?STYLE_OF(0):ZSTYLE.zombie;}
function yGnarlOverride(){if(typeof window!=='undefined'&&window.__YARD_G!=null)return window.__YARD_G;try{const q=new URLSearchParams(location.search).get('yard');return q==null?null:yClamp(+q,0,1);}catch(e){return null;}}

// ----- the scene: one per week, the same every time you visit that week
function yardScene(){const c=CAREER,seed=c.season*1009+c.week*31+7,r=yRng(seed),ov=yGnarlOverride();
  const g=ov!=null?ov:yClamp(r()*0.8+c.week/12*0.3,0,1);
  const S={seed,g,stars:[],trees:[],clouds:[],tufts:[],bones:[],flowers:[],cracks:[],lanterns:[],fog:[],stones:[]};
  for(let i=0;i<Math.round(110*(1-g)+15);i++)S.stars.push([r()*YW,r()*Y_HZ*0.85,r()*1.6+0.4,r()*6]);
  S.moon={x:yLerp(470,600,r()),y:yLerp(150,230,r()),r:yLerp(62,84,r())};
  for(let i=0;i<Math.round(3+g*7);i++)S.clouds.push({x:r()*YW,y:yLerp(60,380,r()),w:yLerp(140,300,r()),v:yLerp(4,14,r())*(r()<0.5?-1:1)});
  const nT=3+Math.floor(r()*3);for(let i=0;i<nT;i++)S.trees.push({x:yLerp(150,700,(i+r()*0.6)/nT),h:yLerp(90,170,r()),bare:r()<0.25+g*0.75,lean:yLerp(-0.15,0.15,r()),seed:Math.floor(r()*1e6)});
  for(let i=0;i<Math.round(160*(1-g)+20);i++){const y=yLerp(Y_HZ+10,YH,Math.pow(r(),0.8));S.tufts.push([r()*YW,y,(y-Y_HZ)/700]);}
  for(let i=0;i<Math.round(g*16);i++){const y=yLerp(Y_HZ+40,YH-60,r());S.bones.push([r()*YW,y,(y-Y_HZ)/650,r()*6,r()<0.25]);}
  for(let i=0;i<Math.round(g*12);i++){const y=yLerp(Y_HZ+20,YH,r());S.cracks.push([r()*YW,y,(y-Y_HZ)/600,Math.floor(r()*1e6)]);}
  for(let i=0;i<Math.round((1-g)*5);i++)S.lanterns.push({x:[118,600,360,40,680][i],y:[640,640,612,1000,1000][i],ph:r()*6});
  for(let i=0;i<9;i++)S.fog.push({x:r()*YW,y:yLerp(Y_HZ-20,YH-100,r()),w:yLerp(260,520,r()),v:yLerp(6,18,r())*(r()<0.5?-1:1)});
  S.chapelLit=g<0.55;S.owl=g<0.8;S.fenceGaps=Math.round(g*5);S.pumpkins=g<0.7?2+Math.floor(r()*3):0;
  const pal=['#b8bcc6','#a9adb4','#c3bfb6','#9ea3a8','#b4aea3'],dk=['#7d7b77','#6e6c68','#82796d','#696d6a','#77736b'];
  for(let i=0;i<Y_SLOTS.length;i++)S.stones.push({type:Y_STONES[Math.floor(r()*Y_STONES.length)],tilt:(r()-0.5)*0.05+(r()-0.5)*0.26*g,
    col:yMix(pal[i%5],dk[i%5],g*0.85),moss:r()<0.2+g*0.7?Math.floor(r()*1e6):0,crack:r()<g*0.9?Math.floor(r()*1e6):0,chip:r()<g*0.6,
    years:`${1790+Math.floor(r()*130)} – ${1890+Math.floor(r()*120)}`,flowers:r()<(1-g)*0.7,wscale:yLerp(0.92,1.1,r())});
  return S;}
// which grave each corpse lies in: fixed the first time the yard is seen this week
function yardSlots(list){const used=new Set(list.filter(z=>z.ys!=null).map(z=>z.ys)),free=[];
  for(let i=0;i<Y_SLOTS.length;i++)if(!used.has(i))free.push(i);
  const r=yRng(CAREER.season*77+CAREER.week*13+list.length);for(let i=free.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[free[i],free[j]]=[free[j],free[i]];}
  let ch=false;for(const z of list)if(z.ys==null||z.ys>=Y_SLOTS.length){z.ys=free.shift();ch=true;}if(ch)careerSave();}

function yardOpen(){const Y=yardFresh();yardDOM();YD.sc=yardScene();YD.bg=null;yardSlots(Y.list);
  YD.t=0;YD.hover=-1;YD.sel=-1;YD.ev=[];YD.evNext=1.2;YD.parts=[];YD.msg=null;YD.ask=null;YD.tap={i:-1,t:-9};
  YD.graves=Y_SLOTS.map(([row,x],i)=>{const R=Y_ROWS[row];return {i,row,x,y:R.y,s:R.s,st:YD.sc.stones[i],z:null,state:'empty'};});
  for(const z of Y.list){const g=YD.graves[z.ys];if(g){g.z=z;g.state='buried';}}
  for(const g of YD.graves)if(!g.z)g.state='old';
  YD.sel=YD.graves.findIndex(g=>g.state==='buried');
  YD.mood=YD.sc.g<0.25?'A lovely night for a dig.':YD.sc.g<0.5?'Quiet out here. Mostly.':YD.sc.g<0.75?'Something is watching from the trees.':'Nobody comes here after dark. Except you.';
  YD.on=true;mode='yard';if(typeof activeMenu!=='undefined')activeMenu=null;showOverlay('yardScr');
  if(sfx&&sfx.ok&&sfx.ok())yNight();}
function yardClose(){YD.on=false;YD.ask=null;seasonOpen();}
function yardDOM(){if(document.getElementById('yardScr'))return;const root=document.getElementById('title').parentNode,o=document.createElement('div');
  o.id='yardScr';o.className='overlay';o.innerHTML='<canvas id="yardCv" width="720" height="1280" style="position:absolute;left:0;top:0;touch-action:none;cursor:default"></canvas>';root.appendChild(o);
  const cv=document.getElementById('yardCv'),pt=e=>typeof toGame==='function'?toGame(e.clientX,e.clientY):{x:e.offsetX,y:e.offsetY};
  cv.addEventListener('pointermove',e=>{const p=pt(e);yardPointer('move',p.x,p.y,e.pointerType);});
  cv.addEventListener('pointerdown',e=>{e.preventDefault();if(typeof audioInit==='function')audioInit();const p=pt(e);yardPointer('down',p.x,p.y,e.pointerType);});}

// ----- geometry and hit tests
const yFoot=g=>g.y+30*g.s;
function yHitStone(g,x,y){const w=72*g.s*g.st.wscale;return x>g.x-w&&x<g.x+w&&y>g.y-215*g.s&&y<g.y+6*g.s;}
function yHitMound(g,x,y){const dx=(x-g.x)/(92*g.s),dy=(y-yFoot(g))/(34*g.s);return dx*dx+dy*dy<1;}
function yHitZombie(g,x,y){const sz=250*g.s;return g.state==='risen'&&Math.abs(x-g.x)<sz*0.28&&y<yFoot(g)&&y>yFoot(g)-sz*1.05;}
function yGraveAt(x,y){for(let k=YD.graves.length-1;k>=0;k--){const g=YD.graves[k];if(!g.z)continue;
  if(yHitMound(g,x,y))return {i:k,part:'mound'};if(yHitStone(g,x,y)||yHitZombie(g,x,y))return {i:k,part:'stone'};}return null;}
const Y_BACK={x:14,y:20,w:150,h:62};
function yardPointer(kind,x,y,ptype){if(!YD.on)return;
  if(kind==='move'){if(ptype&&ptype!=='mouse')return;const h=yGraveAt(x,y);YD.hover=h?h.i:-1;
    const cv=document.getElementById('yardCv');if(cv&&cv.style)cv.style.cursor=(h&&h.part==='mound'&&YD.graves[h.i].state==='buried')||yIn(Y_BACK,x,y)||(YD.ask&&YD.ask.btns.some(b=>yIn(b,x,y)))?'pointer':'default';return;}
  if(YD.ask){for(const b of YD.ask.btns)if(yIn(b,x,y)){const fn=b.fn;YD.ask=null;fn();return;}return;}
  if(yIn(Y_BACK,x,y)){sfx.select&&sfx.select();yardClose();return;}
  const h=yGraveAt(x,y);if(!h){YD.sel=-1;return;}YD.sel=h.i;if(!ptype||ptype!=='mouse')YD.hover=h.i;
  const again=YD.tap.i===h.i&&YD.tap.part===h.part&&YD.t-YD.tap.t<0.45;
  if(h.part==='mound'&&again){YD.tap={i:-1,t:-9};yardDig(h.i);return;}
  if(h.part==='stone'&&again&&YD.graves[h.i].state==='buried')yMsg('Double-click the dirt in front of the stone to dig.',2.4);
  YD.tap={i:h.i,t:YD.t,part:h.part};}
const yIn=(b,x,y)=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h;
function yardKey(c){if(YD.ask){if(c==='Escape'||c==='Backspace'){YD.ask=null;return;}if(c==='Enter'||c==='Space'||c==='NumpadEnter'){const b=YD.ask.btns[0];YD.ask=null;b.fn();}return;}
  if(c==='Escape'||c==='Backspace'){yardClose();return;}
  const list=YD.graves.filter(g=>g.z).map(g=>g.i);if(!list.length)return;
  if(c==='ArrowLeft'||c==='KeyA'||c==='ArrowUp'||c==='KeyW'||c==='ArrowRight'||c==='KeyD'||c==='ArrowDown'||c==='KeyS'){
    const ord=list.slice().sort((a,b)=>YD.graves[b].row-YD.graves[a].row||YD.graves[a].x-YD.graves[b].x),k=ord.indexOf(YD.sel),d=c==='ArrowLeft'||c==='KeyA'||c==='ArrowUp'||c==='KeyW'?-1:1;
    YD.sel=ord[(k<0?0:k+d+ord.length)%ord.length];YD.hover=YD.sel;sfx.blip&&sfx.blip();return;}
  if((c==='Enter'||c==='Space'||c==='NumpadEnter')&&YD.sel>=0)yardDig(YD.sel);}
function yMsg(t,d){YD.msg={t,life:d||3.5,max:d||3.5};}

// ----- signing: where a new zombie goes. Starts over the weakest starter of its kind when it's better and the bench has room
// for the one it replaces; otherwise it joins the bench. A full bench asks before anyone is let go.
function yardPlan(z){const u=userTeam(),slots=[];SLOT_KIND.forEach((k,i)=>{if(k===z.kind)slots.push(i);});
  let w=slots[0];for(const i of slots)if(zPower(u.squad[i])<zPower(u.squad[w]))w=i;
  const better=zPower(z)>zPower(u.squad[w]),room=u.bench.length<BENCH_MAX;
  if(better&&room)return {slot:w,over:u.squad[w]};if(room)return {slot:'bench'};if(better)return {slot:w,over:u.squad[w],letGo:true};return {full:true};}
function yardPlanLine(z){const p=yardPlan(z);if(p.full)return 'Bench full: let someone go first';
  return p.slot==='bench'?'Joins the bench':`Starts at ${POS[p.slot].split(' ')[0]} over ${p.over.name}`;}
function yardDig(i){const g=YD.graves[i];if(!g||g.state!=='buried'||!g.z)return;const z=g.z,price=zValue(z);
  if(CAREER.bones<price){g.shake=0.6;sfx.groan&&sfx.groan();yMsg(`${z.name} costs ${price} Bones. You have ${CAREER.bones}.`);return;}
  const p=yardPlan(z);
  if(p.full){g.shake=0.6;sfx.groan&&sfx.groan();yMsg(`Your bench is full (${BENCH_MAX}). Let someone go in Roster & Training first.`,4);return;}
  if(p.letGo){const r=refundOf(p.over);YD.ask={text:`The bench is full. ${z.name} would start at ${POS[p.slot].split(' ')[0]} and ${p.over.name} would be let go for ${r} Bones.`,
    btns:[{label:`Dig up ${z.name}`,fn:()=>yDigNow(g,p)},{label:'Leave them buried',fn:()=>{}}]};yAskLayout();return;}
  yDigNow(g,p);}
function yDigNow(g,p){const z=g.z,r=sign(z,p.slot);if(!r){sfx.groan&&sfx.groan();return;}delete z.ys;careerSave();
  if(!YD.bag.length){YD.bag=Y_METHODS.filter(m=>m!==YD.lastMethod);for(let k=YD.bag.length-1;k>0;k--){const j=Math.floor(Math.random()*(k+1));[YD.bag[k],YD.bag[j]]=[YD.bag[j],YD.bag[k]];}}
  g.method=YD.bag.pop();YD.lastMethod=g.method;g.state='dig';g.t0=YD.t;g.uni=false;g.bats=null;g.cheered=false;g.boom=false;
  g.dance={routine:typeof makeRoutine==='function'?makeRoutine(false):null,danceT:0};
  const f=zFind(z.id),where=f&&f.where==='squad'?`starts at ${POS[f.i].split(' ')[0]}`:'joins the bench';
  g.line=`${z.name} ${where}.`+(r.gone?` ${r.gone.name} is let go for ${r.refund} Bones.`:p.over&&f&&f.where==='squad'?` ${p.over.name} moves to the bench.`:'');
  sfx.select&&sfx.select();if(sfx.noise)sfx.noise(0.5,'lowpass',300,0.35,1);}
function yAskLayout(){const A=YD.ask;A.y=520;A.btns.forEach((b,k)=>{b.x=90+k*290;b.y=A.y+150;b.w=250;b.h=70;});}
const Y_TIMES={claw:2.6,burst:1.7,topple:2.5,rise:3.0,gopher:2.9,coffin:2.9,corkscrew:2.2};

// ----- each frame (called from the main loop while the Graveyard is open)
function yardFrame(dt){if(!YD.on||mode!=='yard')return;YD.t+=dt;const cv=document.getElementById('yardCv');
  yTick(dt);if(cv){const c=cv.getContext('2d');try{yDraw(c);}catch(e){console.error(e);}}}
function yTick(dt){const T=YD.t,S=YD.sc;
  if(YD.msg&&(YD.msg.life-=dt)<=0)YD.msg=null;
  for(const g of YD.graves){if(g.shake>0)g.shake-=dt;if(g.state!=='dig'&&g.state!=='risen')continue;const k=T-g.t0,D=Y_TIMES[g.method];
    if(g.state==='dig'){yDigFx(g,k,dt);if(k>=D){g.state='risen';g.rt=T;}}
    if(g.state==='risen'){const q=T-g.rt;
      if(q<1.6&&g.dance)g.dance.danceT=q;
      if(q>=1.6&&!g.bats){g.bats=yBatsMake(g);sfx.batFlutter&&sfx.batFlutter();}
      if(q>=2.5&&!g.uni){g.uni=true;for(let n=0;n<26;n++)yPart(g.x,yFoot(g)-150*g.s,(Math.random()-0.5)*300,-Math.random()*260,0.6,'spark');}
      if(q>=3.3&&!g.cheered){g.cheered=true;sfx.cheer&&sfx.cheer();yMsg(g.line,4.5);}}
    if(g.bats)yBatsTick(g,dt);}
  for(const p of YD.parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.k==='spark'?200:900)*dt;p.life-=dt;}YD.parts=YD.parts.filter(p=>p.life>0&&p.y<YH+40);
  YD.evNext-=dt;if(YD.evNext<=0){yEvent();YD.evNext=yLerp(1.4,3.6,Math.random())*(1.1-S.g*0.3);}
  for(const e of YD.ev)e.k=(T-e.t0)/e.d;YD.ev=YD.ev.filter(e=>e.k<1);}
function yPart(x,y,vx,vy,life,k,col){YD.parts.push({x,y,vx,vy,life,max:life,k:k||'dirt',col:col||['#4a3220','#5e4128','#3a2616','#6d4c2f'][Math.floor(Math.random()*4)],r:2+Math.random()*4});}
function yDigFx(g,k,dt){const s=g.s,fx=g.x,fy=yFoot(g),M=g.method,sp=(n,v)=>{for(let i=0;i<n;i++)yPart(fx+(Math.random()-0.5)*90*s,fy-6*s,(Math.random()-0.5)*v*s,-(Math.random()*0.8+0.4)*v*s,0.9);};
  if(Math.random()<dt*14)sp(1,260);
  if(M==='burst'&&k>0.8&&!g.boom){g.boom=true;sp(40,900);sfx.fwump&&sfx.fwump();}
  if(M==='claw'&&[0.55,0.95,1.35].some(a=>k>=a&&k-dt<a))sp(10,420);
  if(M==='topple'&&k>=1.05&&k-dt<1.05){sp(18,380);sfx.hit&&sfx.hit();}
  if(M==='coffin'&&k>=0.65&&k-dt<0.65){sp(16,420);sfx.noise&&sfx.noise(0.4,'bandpass',220,0.4,2);}
  if(M==='gopher'&&[0.05,1.25,1.85].some(a=>k>=a&&k-dt<a))sp(8,360);
  if(M==='rise')for(let i=0;i<2;i++)if(Math.random()<dt*6)yPart(fx+(Math.random()-0.5)*50*s,fy-yRiseOf(g,k).up*230*s,(Math.random()-0.5)*40,10,0.8);
  if(M==='corkscrew'&&Math.random()<dt*30)yPart(fx+Math.cos(k*20)*70*s,fy-4*s,Math.cos(k*20)*200*s,-200*s,0.7);}
// the body's place while it digs out: up 0 = all under, 1 = standing on the mound
function yRiseOf(g,k){const M=g.method,R={up:0,dx:0,air:0,view:'front',flip:false,arms:null,stone:0,hole:0,lid:-1};
  if(M==='claw'){R.up=k<0.5?0.08+Math.sin(k*40)*0.015:k<1.6?yLerp(0.08,0.5,yEase((k-0.5)/1.1))+(k%0.4<0.12?0.03:0):yLerp(0.5,1,yEase((k-1.6)/1));R.arms='climb';R.hole=yEase(k/1.6);}
  else if(M==='burst'){R.up=k<0.8?0:yEase((k-0.8)/0.35);R.air=k>0.8&&k<1.5?Math.sin((k-0.8)/0.7*Math.PI)*0.42:0;R.arms=k>0.8?'up':null;R.hole=k>0.8?1:0;}
  else if(M==='topple'){R.stone=k<0.7?Math.sin(k*30)*0.05*(k/0.7):yEase((k-0.7)/0.45)*1.42;R.up=k<1.0?0:yEase((k-1.0)/1.5);R.arms='climb';R.hole=yEase((k-0.6)/0.8);}
  else if(M==='rise'){R.up=yEase(k/3.0);R.dx=Math.sin(k*2.2)*6;R.arms='zombie';R.hole=yEase(k/1.2);}
  else if(M==='gopher'){R.up=k<0.3?yEase(k/0.3)*0.3:k<0.9?0.3:k<1.1?yLerp(0.3,0,yEase((k-0.9)/0.2)):k<1.25?0:k<1.45?yEase((k-1.25)/0.2)*0.34:k<1.85?0.34:yEase((k-1.85)/0.5);
    R.air=k>1.85&&k<2.6?Math.sin((k-1.85)/0.75*Math.PI)*0.3:0;R.view=k>0.35&&k<0.85?(Math.floor(k*5)%2?'side':'front'):'front';R.flip=Math.floor(k*5)%4<2;R.hole=yEase(k/0.3);R.arms=k>1.85?'up':null;}
  else if(M==='coffin'){R.hole=yEase(k/0.6);R.lid=k<0.6?-1:yClamp((k-0.6)/0.5,0,1);R.up=k<1.1?0:yEase((k-1.1)/1.6);R.arms='zombie';}
  else if(M==='corkscrew'){R.up=yEase(k/2.0);const a=k*Math.PI*2*2.2*(1-yEase(k/2.2)*0.6),ca=Math.cos(a);R.view=ca>0.5?'front':ca<-0.5?'back':'side';R.flip=Math.sin(a)<0;R.hole=yEase(k/0.5);R.arms='up';}
  return R;}

// ----- bats: a frenzied cloud swirls round the zombie, dresses it, then scatters into the sky
function yBatsMake(g){const B=[];for(let i=0;i<30;i++){const a=Math.random()*7;B.push({a,r:300+Math.random()*300,ar:(Math.random()<0.5?-1:1)*(5+Math.random()*5),h:Math.random(),ph:Math.random()*6,x:g.x+Math.cos(a)*500,y:yFoot(g)-200*g.s+Math.sin(a)*400,vx:0,vy:0});}return {t:0,list:B};}
function yBatsTick(g,dt){const Bt=g.bats;Bt.t+=dt;const t=Bt.t,s=g.s,cx=g.x,cy=yFoot(g)-125*s;
  for(const b of Bt.list){b.ph+=dt*(26+b.h*10);
    if(t<1.7){b.a+=b.ar*dt;const R=yLerp(b.r,58*s+b.h*40*s,yEase(t/0.6)),tx=cx+Math.cos(b.a)*R,ty=cy+(b.h-0.5)*170*s+Math.sin(b.a*1.7)*R*0.35;b.x=yLerp(b.x,tx,Math.min(1,dt*12));b.y=yLerp(b.y,ty,Math.min(1,dt*12));b.vx=(b.x-cx)*1.2+(Math.random()-0.5)*60;b.vy=-160-Math.random()*220;}
    else{b.vy-=120*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;}}
  if(t>4.5)g.bats=Object.assign(g.bats,{done:true});}
function yBat(c,x,y,ph,sz){const f=Math.sin(ph);c.save();c.translate(x,y);c.scale(sz/20,sz/20);c.fillStyle='#120b14';c.beginPath();c.ellipse(0,0,4,5,0,0,7);c.fill();
  for(const d of [-1,1]){c.beginPath();c.moveTo(0,-1);c.quadraticCurveTo(d*9,-10*f-3,d*20,-6*f);c.lineTo(d*16,-1*f+2);c.lineTo(d*12,1);c.lineTo(d*7,0+2*f);c.lineTo(d*3,3);c.closePath();c.fill();}
  c.beginPath();c.moveTo(-3,-4);c.lineTo(-2,-8);c.lineTo(-0.5,-4.5);c.moveTo(3,-4);c.lineTo(2,-8);c.lineTo(0.5,-4.5);c.fill();c.fillStyle='#ff4b3a';c.fillRect(-2,-2.5,1.3,1.3);c.fillRect(0.8,-2.5,1.3,1.3);c.restore();}

// ----- background events: fun-spooky ones on a pristine night, frightening ones as the yard gets gnarly
const Y_FUN=['batsMoon','ghost','peek','owl','cat','wisps','wave','star','skelDance','pumpkin'];
const Y_SCARY=['lightning','eyes','reaper','crows','hands','treeFace','fog','window'];
function yEvent(f){const S=YD.sc;let name=f;
  if(!name){const scary=Math.random()<0.12+S.g*0.78,pool=(scary?Y_SCARY:Y_FUN).filter(n=>!YD.ev.some(e=>e.n===n)&&(n!=='owl'||S.owl)&&(n!=='pumpkin'||S.pumpkins));if(!pool.length)return;name=pool[Math.floor(Math.random()*pool.length)];}
  const D={batsMoon:5,ghost:4.2,peek:2.6,owl:2.4,cat:7,wisps:6,wave:2.8,star:1.2,skelDance:5,pumpkin:2.4,lightning:1.1,eyes:3.2,reaper:7.5,crows:3.4,hands:3.2,treeFace:3,fog:8,window:3.4};
  const e={n:name,t0:YD.t,d:D[name],k:0,x:Math.random(),y:Math.random(),dir:Math.random()<0.5?-1:1};YD.ev.push(e);
  if(name==='lightning'&&sfx.noise){sfx.noise(0.15,'highpass',2000,0.3,1);sfx.noise(2.2,'lowpass',160,0.55,1,0.25);}
  if(name==='owl'&&sfx.tone){sfx.tone('sine',430,380,0.28,0.1);sfx.tone('sine',420,360,0.4,0.1,0.42);}
  if(name==='crows'&&sfx.noise)for(let i=0;i<4;i++)sfx.noise(0.12,'bandpass',900+Math.random()*500,0.16,4,i*0.22);
  if(name==='ghost'&&sfx.tone)sfx.tone('sine',300,520,1.2,0.07,0.6);
  return e;}
function yNight(){if(!sfx.tone)return;sfx.tone('sine',220,180,1.4,0.04);}

// ----- drawing
function yDraw(c){const S=YD.sc,T=YD.t;c.save();c.setTransform(1,0,0,1,0,0);
  if(!YD.bg){YD.bg=yBackground();}
  if(YD.bg&&YD.bg.getContext)c.drawImage(YD.bg,0,0);else yBackDraw(c);
  yMoonGlow(c,T);
  for(const e of YD.ev)if(['batsMoon','star','reaper','skelDance','crows','window','eyes'].includes(e.n))yEv(c,e,T);
  for(const L of S.lanterns)yLantern(c,L,T);
  for(const e of YD.ev)if(['ghost','peek','owl','cat','wisps','wave','pumpkin','hands','treeFace'].includes(e.n))yEv(c,e,T);
  if(S.owl)yOwl(c,T,YD.ev.find(e=>e.n==='owl'));
  for(let row=0;row<3;row++){yFogRow(c,row,T);for(const g of YD.graves)if(g.row===row)yGrave(c,g,T);}
  yFogRow(c,3,T);
  for(const p of YD.parts){c.globalAlpha=yClamp(p.life/p.max*1.5,0,1);c.fillStyle=p.k==='spark'?['#b4ff5a','#ffe14a','#ffffff'][Math.floor(p.r)%3]:p.col;c.beginPath();c.arc(p.x,p.y,p.r,0,7);c.fill();}c.globalAlpha=1;
  for(const g of YD.graves)if(g.bats&&!g.bats.done)for(const b of g.bats.list)yBat(c,b.x,b.y,b.ph,(20+b.h*10)*Math.max(0.6,g.s));
  for(const e of YD.ev)if(e.n==='lightning'||e.n==='fog')yEv(c,e,T);
  yVignette(c);yHUD(c,T);
  const hv=YD.hover>=0?YD.hover:YD.sel;if(hv>=0&&!YD.ask){const g=YD.graves[hv];if(g&&g.z)yCard(c,g);}
  if(YD.ask)yAsk(c);c.restore();}
function yBackground(){let cv=null;try{cv=document.createElement('canvas');cv.width=YW;cv.height=YH;}catch(e){}
  const c=cv&&cv.getContext&&cv.getContext('2d');if(!c||!c.fillRect)return null;yBackDraw(c);return cv;}
function yBackDraw(c){const S=YD.sc,g=S.g,r=yRng(S.seed+5);
  let gr=c.createLinearGradient(0,0,0,Y_HZ);gr.addColorStop(0,yMix('#141a44','#1a0505',g));gr.addColorStop(0.65,yMix('#3b2f6e','#4a0f0c',g));gr.addColorStop(1,yMix('#7b5e96','#7a2412',g));
  c.fillStyle=gr;c.fillRect(0,0,YW,Y_HZ+40);
  for(const [x,y,rr] of S.stars){c.fillStyle=`rgba(255,250,230,${0.5+rr*0.25})`;c.fillRect(x,y,rr,rr);}
  const M=S.moon;c.fillStyle=yMix('#f7f1cf','#c4372a',g);c.beginPath();c.arc(M.x,M.y,M.r,0,7);c.fill();
  c.fillStyle=yMix('#e2dbb4','#9a2a1f',g);for(let i=0;i<5;i++){c.beginPath();c.arc(M.x+(r()-0.5)*M.r*1.2,M.y+(r()-0.5)*M.r*1.2,M.r*(0.08+r()*0.12),0,7);c.fill();}
  // far hills, the chapel, trees and the iron fence
  c.fillStyle=yMix('#22203d','#1f0907',g);c.beginPath();c.moveTo(0,Y_HZ);for(let x=0;x<=YW;x+=40)c.lineTo(x,Y_HZ-38-Math.sin(x/110+S.seed)*22-Math.sin(x/47)*8);c.lineTo(YW,Y_HZ+10);c.lineTo(0,Y_HZ+10);c.fill();
  yChapel(c,150,Y_HZ-46,S);
  for(const t of S.trees)yTree(c,t.x,Y_HZ-8,t.h,t.bare,t.lean,t.seed,yMix('#16152a','#0d0505',g));
  c.fillStyle=yMix('#1b1a30','#140705',g);c.beginPath();c.moveTo(0,Y_HZ-4);for(let x=0;x<=YW;x+=30)c.lineTo(x,Y_HZ-8-Math.sin(x/70+3)*7);c.lineTo(YW,Y_HZ+20);c.lineTo(0,Y_HZ+20);c.fill();
  yFence(c,S);
  gr=c.createLinearGradient(0,Y_HZ,0,YH);gr.addColorStop(0,yMix('#2c3f2a','#2a1f15',g));gr.addColorStop(1,yMix('#16261a','#0f0905',g));c.fillStyle=gr;c.fillRect(0,Y_HZ+4,YW,YH-Y_HZ);
  c.strokeStyle=yMix('#3f2f22','#24170e',g);c.lineWidth=3;   // a worn path between the rows
  c.fillStyle=yMix('#3a3226','#231910',g);c.beginPath();c.moveTo(340,Y_HZ+6);c.lineTo(380,Y_HZ+6);c.bezierCurveTo(470,760,250,960,470,YH);c.lineTo(250,YH);c.bezierCurveTo(140,960,380,760,340,Y_HZ+6);c.fill();
  for(const [x,y,k] of S.tufts){c.strokeStyle=yMix('#4f7a3c','#3c3a22',g);c.lineWidth=1+k*1.6;c.beginPath();for(let i=-1;i<=1;i++){c.moveTo(x+i*4*k,y);c.lineTo(x+i*7*k,y-(9+Math.abs(i)*-3)*(0.4+k*1.6));}c.stroke();}
  for(const [x,y,k,sd] of S.cracks){const rr=yRng(sd);c.strokeStyle='rgba(0,0,0,0.55)';c.lineWidth=1+k*2;c.beginPath();c.moveTo(x,y);let px=x,py=y;for(let i=0;i<5;i++){px+=(rr()-0.5)*60*k;py+=(rr()-0.3)*14*k;c.lineTo(px,py);}c.stroke();}
  for(const [x,y,k,a,skull] of S.bones)yBone(c,x,y,(0.5+k*1.2),a,skull);
  for(let i=0;i<S.pumpkins;i++)yPumpkinBody(c,[300,452,96,640][i]||300,[600,612,1020,1030][i]||600,[0.55,0.5,1.0,0.95][i]||0.6);
  yTree(c,Y_TREE.x,Y_TREE.base,Y_TREE.base-Y_TREE.top,g>0.3,0.05,S.seed+1,yMix('#121224','#0a0404',g),true);}
function yTree(c,x,y,h,bare,lean,seed,col,big){const r=yRng(seed);c.save();c.translate(x,y);c.rotate(lean);c.fillStyle=col;c.strokeStyle=col;c.lineCap='round';
  const tw=big?34:h*0.09;c.beginPath();c.moveTo(-tw,0);c.quadraticCurveTo(-tw*0.4,-h*0.5,-tw*0.35,-h*0.75);c.lineTo(tw*0.35,-h*0.75);c.quadraticCurveTo(tw*0.4,-h*0.5,tw,0);c.fill();
  const br=(x0,y0,a,len,w,d)=>{if(d<=0||w<0.6)return;const x1=x0+Math.cos(a)*len,y1=y0+Math.sin(a)*len;c.lineWidth=w;c.beginPath();c.moveTo(x0,y0);c.quadraticCurveTo((x0+x1)/2+(r()-0.5)*len*0.4,(y0+y1)/2+(r()-0.5)*len*0.3,x1,y1);c.stroke();
    const n=bare?2+Math.floor(r()*2):2;for(let i=0;i<n;i++)br(x1,y1,a+(r()-0.5)*(bare?1.6:1.1),len*(0.62+r()*0.18),w*0.62,d-1);};
  for(let i=0;i<(big?4:3);i++)br(0,-h*0.72,-Math.PI/2+(i-(big?1.5:1))*0.55+(r()-0.5)*0.3,h*(big?0.3:0.28),tw*0.55,bare?5:3);
  if(!bare){c.globalAlpha=0.92;for(let i=0;i<9;i++){c.beginPath();c.arc((r()-0.5)*h*0.7,-h*0.8-r()*h*0.45,h*(0.16+r()*0.12),0,7);c.fill();}c.globalAlpha=1;}
  c.restore();}
function yChapel(c,x,y,S){const g=S.g;c.fillStyle=yMix('#1a1830','#120605',g);c.fillRect(x-48,y-60,96,64);c.beginPath();c.moveTo(x-56,y-58);c.lineTo(x,y-110);c.lineTo(x+56,y-58);c.fill();
  c.fillRect(x+24,y-140,22,90);c.beginPath();c.moveTo(x+20,y-138);c.lineTo(x+35,y-176);c.lineTo(x+50,y-138);c.fill();c.fillRect(x+33,y-196,4,22);c.fillRect(x+27,y-188,16,4);
  c.fillStyle=S.chapelLit?'#ffcf6a':'#2a1410';c.beginPath();c.arc(x,y-30,11,Math.PI,0);c.lineTo(x+11,y-8);c.lineTo(x-11,y-8);c.fill();}
function yFence(c,S){const y=Y_HZ+16,g=S.g,rr=yRng(S.seed+9);c.strokeStyle=yMix('#0f0f1c','#080303',g);c.fillStyle=c.strokeStyle;c.lineWidth=3;
  const gaps=new Set();for(let i=0;i<S.fenceGaps;i++)gaps.add(Math.floor(rr()*16));
  c.beginPath();c.moveTo(0,y-26);c.lineTo(YW,y-26);c.moveTo(0,y-8);c.lineTo(YW,y-8);c.stroke();
  for(let i=0;i<48;i++){if(gaps.has(Math.floor(i/3)))continue;const x=i*15+4,bend=(rr()-0.5)*g*0.5;c.save();c.translate(x,y);c.rotate(bend);c.fillRect(-1.5,-38,3,38);c.beginPath();c.moveTo(-4,-38);c.lineTo(0,-47);c.lineTo(4,-38);c.fill();c.restore();}}
function yBone(c,x,y,k,a,skull){c.save();c.translate(x,y);c.rotate(a);c.scale(k,k);c.fillStyle='#d9d2bd';
  if(skull){c.beginPath();c.arc(0,-6,8,0,7);c.fill();c.fillRect(-5,-1,10,6);c.fillStyle='#1d1612';c.beginPath();c.arc(-3,-6,2.2,0,7);c.arc(3,-6,2.2,0,7);c.fill();}
  else{c.fillRect(-9,-1.5,18,3);for(const d of [-1,1])for(const e of [-1,1]){c.beginPath();c.arc(d*9,e*1.8,2.4,0,7);c.fill();}}c.restore();}
function yPumpkinBody(c,x,y,k){c.save();c.translate(x,y);c.scale(k,k);c.fillStyle='#d9701c';for(const dx of [-10,0,10]){c.beginPath();c.ellipse(dx,-14,13,15,0,0,7);c.fill();}
  c.fillStyle='#3d5a1f';c.fillRect(-2,-34,5,8);c.restore();}
function yPumpkinFace(c,x,y,k,glow,grin){c.save();c.translate(x,y);c.scale(k,k);c.fillStyle=`rgba(255,${180+glow*60|0},60,${0.55+glow*0.45})`;
  c.beginPath();c.moveTo(-12,-20);c.lineTo(-5,-20);c.lineTo(-8,-25);c.fill();c.beginPath();c.moveTo(12,-20);c.lineTo(5,-20);c.lineTo(8,-25);c.fill();
  c.beginPath();c.moveTo(-13,-11);c.lineTo(13,-11);c.lineTo(9,-6+grin*5);c.lineTo(3,-9);c.lineTo(-3,-6+grin*5);c.lineTo(-9,-9);c.fill();c.restore();}
function yMoonGlow(c,T){const S=YD.sc,M=S.moon,gr=c.createRadialGradient(M.x,M.y,M.r,M.x,M.y,M.r*2.6);gr.addColorStop(0,S.g>0.5?'rgba(200,50,30,0.35)':'rgba(255,245,200,0.28)');gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.fillRect(M.x-M.r*3,M.y-M.r*3,M.r*6,M.r*6);
  c.fillStyle=S.g>0.5?'rgba(25,8,8,0.72)':'rgba(40,36,70,0.55)';for(const cl of S.clouds){const x=((cl.x+cl.v*T)%(YW+cl.w*2)+YW+cl.w*2)%(YW+cl.w*2)-cl.w;c.beginPath();c.ellipse(x,cl.y,cl.w*0.5,cl.w*0.12,0,0,7);c.ellipse(x+cl.w*0.18,cl.y-cl.w*0.07,cl.w*0.24,cl.w*0.1,0,0,7);c.fill();}
  for(const P of [[300,600,0.55],[452,612,0.5],[96,1020,1],[640,1030,0.95]].slice(0,S.pumpkins)){const pe=YD.ev.find(e=>e.n==='pumpkin');yPumpkinFace(c,P[0],P[1],P[2],0.5+0.5*Math.sin(T*9+P[0]),pe?Math.abs(Math.sin(pe.k*Math.PI*6)):0);}}
function yLantern(c,L,T){const f=0.75+0.25*Math.sin(T*11+L.ph)*Math.sin(T*3.3+L.ph*2),k=L.y>900?1:0.6;c.save();c.translate(L.x,L.y);c.scale(k,k);
  const gr=c.createRadialGradient(0,-80,4,0,-80,90);gr.addColorStop(0,`rgba(255,200,90,${0.45*f})`);gr.addColorStop(1,'rgba(255,170,60,0)');c.fillStyle=gr;c.fillRect(-90,-170,180,180);
  c.fillStyle='#16141c';c.fillRect(-3,-70,6,70);c.fillRect(-12,-100,24,30);c.fillStyle=`rgba(255,${200+f*40|0},110,${0.8*f+0.2})`;c.fillRect(-8,-95,16,22);c.restore();}
function yOwl(c,T,e){const x=Y_TREE.x+86,y=Y_TREE.top+96,turn=e?Math.sin(e.k*Math.PI):0,blink=(T%4.3)<0.15;c.save();c.translate(x,y);
  c.fillStyle='#3a2d22';c.beginPath();c.ellipse(0,0,15,20,0,0,7);c.fill();c.save();c.scale(1-turn*1.6>0?1-turn*1.6:turn*1.6-1,1);c.beginPath();c.arc(0,-20,13,0,7);c.fill();
  if(Math.abs(1-turn*1.6)>0.25&&!blink){c.fillStyle='#ffd23a';c.beginPath();c.arc(-5,-21,4.5,0,7);c.arc(5,-21,4.5,0,7);c.fill();c.fillStyle='#000';c.beginPath();c.arc(-5,-21,2,0,7);c.arc(5,-21,2,0,7);c.fill();}
  c.restore();c.fillStyle='#2a1f16';c.beginPath();c.moveTo(-9,-31);c.lineTo(-6,-40);c.lineTo(-2,-32);c.moveTo(9,-31);c.lineTo(6,-40);c.lineTo(2,-32);c.fill();c.restore();}
function yFogRow(c,row,T){const S=YD.sc,ys=[Y_HZ+40,770,980,1210][row];c.save();
  for(const f of S.fog){if(Math.abs(f.y-ys)>140)continue;const x=((f.x+f.v*T)%(YW+f.w)+YW+f.w)%(YW+f.w)-f.w/2,a=0.05+S.g*0.07;
    const gr=c.createRadialGradient(x,ys,10,x,ys,f.w*0.5);gr.addColorStop(0,S.g>0.6?`rgba(170,210,150,${a})`:`rgba(210,210,235,${a})`);gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.fillRect(x-f.w*0.5,ys-f.w*0.25,f.w,f.w*0.5);}c.restore();}
function yVignette(c){const gr=c.createRadialGradient(YW/2,YH*0.55,YH*0.35,YW/2,YH*0.55,YH*0.75);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,`rgba(0,0,0,${0.45+YD.sc.g*0.3})`);c.fillStyle=gr;c.fillRect(0,0,YW,YH);}

// one grave: headstone, mound or hole, and whoever is coming out of it
function yGrave(c,g,T){const S=g.st,s=g.s,fy=yFoot(g),R=g.state==='dig'?yRiseOf(g,T-g.t0):g.state==='risen'?{up:1,dx:0,air:0,view:'front',hole:1,stone:g.method==='topple'?1.42:0,lid:g.method==='coffin'?1:-1}:{up:0,hole:0,stone:0,lid:-1};
  const shake=g.shake>0?Math.sin(T*70)*4*s:0,dug=g.state==='dig'||g.state==='risen',sel=g.z&&g.state==='buried'&&(YD.hover>=0?YD.hover===g.i:YD.sel===g.i);
  yStone(c,g,R.stone+(shake?shake*0.004:0),sel);
  // the mound, then the hole it becomes
  c.save();c.translate(g.x+shake,fy);
  {const h=R.hole||0;
    c.fillStyle='#2a1b10';if(h>0){c.beginPath();c.ellipse(0,0,74*s*Math.min(1,h*1.3),22*s*Math.min(1,h*1.3),0,0,7);c.fill();}
    if(h<1){c.fillStyle=g.state==='old'?'#3a3022':'#4a3320';c.beginPath();c.ellipse(0,-4*s*(1-h),88*s*(1-h*0.6),(g.state==='old'?16:30)*s*(1-h*0.7),0,Math.PI,0);c.ellipse(0,0,88*s*(1-h*0.6),10*s,0,0,Math.PI);c.fill();
      c.fillStyle='#5d4229';c.beginPath();c.ellipse(-10*s,-14*s*(1-h),50*s*(1-h),9*s*(1-h),0,0,7);c.fill();
      if(S.flowers&&g.state==='buried')for(let i=0;i<5;i++){c.fillStyle=['#ff8ab3','#ffd84a','#c99bff','#ff7b54','#ffffff'][i];c.beginPath();c.arc((i-2)*17*s,-16*s+Math.abs(i-2)*3*s,4*s,0,7);c.fill();}}
    if(dug){c.fillStyle='#55391f';for(const d of [-1,1]){c.beginPath();c.ellipse(d*96*s,-2*s,34*s,14*s,0,Math.PI,0);c.fill();}}
    if(R.lid>=0){c.save();c.translate(-70*s,-2*s);c.rotate(-yEase(R.lid)*1.15);c.fillStyle='#5a3b22';c.strokeStyle='#2a180c';c.lineWidth=3*s;
      c.beginPath();c.moveTo(0,0);c.lineTo(140*s,0);c.lineTo(130*s,-22*s);c.lineTo(10*s,-22*s);c.closePath();c.fill();c.stroke();c.strokeStyle='#c9b98f';c.beginPath();c.moveTo(60*s,-11*s);c.lineTo(80*s,-11*s);c.moveTo(70*s,-18*s);c.lineTo(70*s,-4*s);c.stroke();c.restore();}}
  c.restore();
  if(!g.z||!dug)return;
  // the zombie: clipped at the ground while it digs out
  const z=g.z,sz=250*s,lm={la:1,ra:1,ll:1,rl:1,head:1};if(z.hurt)for(const k of PARTS)if(z.hurt[k])lm[k]=0;
  const o={look:z.look,team:g.uni?yUniform():Y_BURIAL,body:KINDS[z.kind].body,view:R.view||'front',flip:!!R.flip,phase:T*6,speed:0,limbs:lm,pose:'stand',num:g.uni?z.num:'',t:T,seed:parseInt(String(z.id).replace(/\D/g,''))||1,ball:false,noHelmet:!g.uni,noShadow:g.state==='dig'};
  if(g.state==='dig'){const k=T-g.t0;if(R.arms==='climb'){const a=Math.sin(k*9);o.pose='dance';o.dj={la:[2.5+a*0.5,0.7],ra:[2.5-a*0.5,0.7],sq:0.1};}
    else if(R.arms==='up'){o.pose='dance';o.dj={la:[2.9,0.15],ra:[2.9,0.15],sq:0.1};}else if(R.arms==='zombie'){o.pose='dance';o.dj={la:[1.5,0.2],ra:[1.45,0.25],sq:0};}}
  else{const q=T-g.rt;
    if(q<1.6&&g.dance&&g.dance.routine&&typeof danceRig==='function'){const rig=danceRig(g.dance,sz*0.4);Object.assign(o,{pose:rig.pose,view:rig.view,flip:rig.flip,dj:rig.dj});if(rig.dx)o.dx=rig.dx;}
    else if(q<3.3){o.pose='dance';o.dj={la:[0.25,0.3],ra:[0.25,0.3],sq:0.05};}   // still while the bats work
    else if(q<4.8){const ph=((q-3.3)/0.55)%1,air=Math.sin(ph*Math.PI)*26;o.pose='dance';o.dj={air,sq:ph<0.2?0.35:0.08,la:[2.95,0.12],ra:[2.95,0.12],lf:[-3,air?6:0],rf:[3,air?6:0]};}
    else if((q%6)<0.9){o.pose='dance';o.dj={la:[0.3,0.3],ra:[2.9,0.3],sq:0.05};}   // a fist in the air now and then
  }
  const bx=g.x+(R.dx||0)+(o.dx||0),by=fy+(1-R.up)*sz*1.05-(R.air||0)*sz;
  c.save();if(g.state==='dig'){c.beginPath();c.rect(0,0,YW,fy+2);c.clip();}
  drawZombie(c,bx,by,sz,o);c.restore();
  if(g.state==='risen'){const q=T-g.rt;if(q>3.3&&q<6){c.save();c.globalAlpha=yClamp((6-q)*2,0,1);c.font=`${Math.round(46*s+10)}px Bangers, Arial`;c.textAlign='center';c.lineWidth=6;c.strokeStyle='#14200c';c.fillStyle='#b4ff5a';
    const ty=fy-sz*1.12-Math.min(1,(q-3.3)*3)*20;c.strokeText('SIGNED!',g.x,ty);c.fillText('SIGNED!',g.x,ty);c.restore();}}}
function yStone(c,g,fall,sel){const S=g.st,s=g.s*S.wscale,frail=g.z&&g.z.frail;c.save();c.translate(g.x+(fall>0.05?fall*40*g.s:0),g.y);c.rotate(S.tilt*(1-Math.min(1,fall/1.42))+fall);c.scale(s,s);
  const col=frail?'#6b4a2c':S.col,dk=yMix(col,'#000000',0.45),hi=yMix(col,'#ffffff',0.25);c.lineJoin='round';
  const path=()=>{c.beginPath();const T=S.type;
    if(frail){c.rect(-8,-200,16,200);c.rect(-62,-158,124,34);return 'wood';}
    if(T==='round'){c.moveTo(-62,0);c.lineTo(-62,-140);c.arc(0,-140,62,Math.PI,0);c.lineTo(62,0);c.closePath();}
    else if(T==='pointed'){c.moveTo(-58,0);c.lineTo(-58,-130);c.quadraticCurveTo(-52,-178,0,-205);c.quadraticCurveTo(52,-178,58,-130);c.lineTo(58,0);c.closePath();}
    else if(T==='slab'){c.moveTo(-72,0);c.lineTo(-72,-150);c.lineTo(-60,-162);c.lineTo(60,-162);c.lineTo(72,-150);c.lineTo(72,0);c.closePath();}
    else if(T==='obelisk'){c.moveTo(-66,0);c.lineTo(-66,-62);c.lineTo(-34,-62);c.lineTo(-24,-210);c.lineTo(0,-238);c.lineTo(24,-210);c.lineTo(34,-62);c.lineTo(66,-62);c.lineTo(66,0);c.closePath();}
    else{c.moveTo(-68,0);c.lineTo(-68,-64);c.lineTo(-14,-64);c.lineTo(-14,-140);c.lineTo(-50,-140);c.lineTo(-50,-170);c.lineTo(-14,-170);c.lineTo(-14,-212);c.lineTo(14,-212);c.lineTo(14,-170);c.lineTo(50,-170);c.lineTo(50,-140);c.lineTo(14,-140);c.lineTo(14,-64);c.lineTo(68,-64);c.lineTo(68,0);c.closePath();}
    return T;};
  const T=path();c.fillStyle=col;c.fill();c.strokeStyle=sel?'#b4ff5a':dk;c.lineWidth=sel?3.5/g.s:4;c.stroke();
  if(T==='celtic'&&!frail){c.strokeStyle=col;c.lineWidth=10;c.beginPath();c.arc(0,-155,34,0,7);c.stroke();c.strokeStyle=dk;c.lineWidth=2;c.beginPath();c.arc(0,-155,39,0,7);c.arc(0,-155,29,0,7);c.stroke();}
  c.save();path();c.clip();c.fillStyle=hi;c.globalAlpha=0.35;c.fillRect(-80,-260,22,260);c.globalAlpha=1;
  if(S.moss&&!frail){const r=yRng(S.moss);c.fillStyle='rgba(70,110,40,0.7)';for(let i=0;i<9;i++){c.beginPath();c.arc((r()-0.5)*120,-r()*60-r()*120*r(),6+r()*14,0,7);c.fill();}}
  if(S.crack&&!frail){const r=yRng(S.crack);c.strokeStyle=dk;c.lineWidth=2.5;c.beginPath();let x=(r()-0.5)*60,y=-150-r()*40;c.moveTo(x,y);for(let i=0;i<6;i++){x+=(r()-0.5)*30;y+=12+r()*16;c.lineTo(x,y);}c.stroke();}
  if(frail){c.strokeStyle='rgba(0,0,0,0.35)';c.lineWidth=2;for(let i=0;i<4;i++){c.beginPath();c.moveTo(-60,-150+i*7);c.lineTo(60,-152+i*7);c.stroke();}}
  c.restore();
  // the name, etched (or painted on the Z-team's wooden cross)
  const z=g.z,name=z?z.name:['R.I.P.','HERE LIES BOB','REST IN PIECES','GONE FISHIN','BACK SOON','DO NOT DISTURB','OOPS','WENT TO GET MILK'][g.i];
  const plaque=T==='obelisk'||T==='cross'||T==='celtic';c.textAlign='center';c.textBaseline='middle';
  const ny=frail?-141:plaque?-34:-112,maxW=frail?112:plaque?120:104;
  const words=String(name).toUpperCase().split(' ');let lines=[words.join(' ')];
  const fit=(t,f)=>{c.font=`bold ${f}px Georgia, 'Times New Roman', serif`;return c.measureText(t).width;};
  let fs=frail?22:24;if(!frail&&fit(lines[0],fs)>maxW&&words.length>1){const h=Math.ceil(words.length/2);lines=[words.slice(0,h).join(' '),words.slice(h).join(' ')];}
  while(fs>11&&lines.some(l=>fit(l,fs)>maxW))fs--;
  c.font=frail?`bold ${fs}px 'Bangers', Arial`:`bold ${fs}px Georgia, 'Times New Roman', serif`;
  lines.forEach((l,k)=>{const yy=ny+(k-(lines.length-1)/2)*(fs+3);if(frail){c.fillStyle='#e9e2d0';c.fillText(l,0,yy);}else{c.fillStyle=hi;c.fillText(l,1,yy+1.5);c.fillStyle=yMix(col,'#000000',0.62);c.fillText(l,0,yy);}});
  c.font=`${frail?14:13}px Georgia, serif`;c.fillStyle=frail?'#e9e2d0':yMix(col,'#000000',0.55);
  if(frail)c.fillText('Z-TEAM',0,-112);else if(!plaque){c.fillText(z?KINDS[z.kind].tag:'',0,ny+lines.length*14+12);c.fillText(S.years,0,ny+lines.length*14+30);}
  c.restore();}

// the card that shows when you hover (or tap) a grave
function ySkull(c,x,y,r,on){c.fillStyle=on?'#24180c':'rgba(60,40,20,0.2)';c.beginPath();c.arc(x,y-r*0.15,r,0,7);c.fill();c.fillRect(x-r*0.55,y+r*0.5,r*1.1,r*0.6);
  c.fillStyle='#e9ddb9';c.beginPath();c.arc(x-r*0.38,y-r*0.15,r*0.28,0,7);c.arc(x+r*0.38,y-r*0.15,r*0.28,0,7);c.fill();c.fillRect(x-r*0.08,y+r*0.25,r*0.16,r*0.25);}
function yCard(c,g){const z=g.z,risen=g.state!=='buried',W=300,keys=zKeys(z),H=risen?184:206+keys.length*24,s=g.s;
  let x=yClamp(g.x-W/2,10,YW-W-10),y=Math.max(150,Y_HZ-H-6);   // the card sits in the sky band, so it never hides a grave
  c.save();c.fillStyle='rgba(0,0,0,0.45)';c.fillRect(x+6,y+8,W,H);c.fillStyle='#e9ddb9';c.strokeStyle='#3a2a18';c.lineWidth=4;c.beginPath();c.rect(x,y,W,H);c.fill();c.stroke();
  c.textAlign='left';c.textBaseline='alphabetic';c.fillStyle='#24180c';yFitFont(c,z.name.toUpperCase(),x+14,y+36,W-28,30,'Bangers, Arial');
  c.font='bold 14px Arial';c.fillStyle='#5a4128';c.fillText(z.frail?'Z-team walk-on · '+KINDS[z.kind].name:`${KINDS[z.kind].name} · ${KINDS[z.kind].plays}`,x+14,y+57);
  c.fillStyle='#2f5d1c';c.fillRect(x+14,y+68,96,42);c.fillStyle='#e8ffd0';c.font='13px Bangers, Arial';c.fillText('POWER',x+22,y+84);c.font='26px Bangers, Arial';c.fillText(String(zPower(z)),x+22,y+106);
  if(risen){const f=zFind(z.id);c.fillStyle='#24180c';c.font='bold 16px Arial';c.fillText(`#${z.num} · ${f&&f.where==='squad'?'starts at '+POS[f.i].split(' ')[0]:'on the bench'}`,x+122,y+95);
    c.font='italic 15px Georgia, serif';c.fillStyle='#5a4128';yFitText(c,`"${(z.look&&z.look.quip)||'Brains.'}"`,x+14,y+140,W-28);c.font='bold 13px Arial';yFitText(c,'Signed. Set the lineup in Roster & Training.',x+14,y+166,W-28);c.restore();return;}
  const price=zValue(z),broke=CAREER.bones<price;c.font='bold 19px Arial';c.fillStyle=broke?'#a8261a':'#24180c';c.fillText(`${price} Bones`,x+122,y+88);
  c.font='bold 13px Arial';c.fillStyle='#5a4128';c.fillText(`you have ${CAREER.bones}`,x+122,y+106);
  let yy=y+138;for(const S of keys){const n=z.st[S.k];c.font='bold 16px Arial';c.fillStyle='#24180c';c.fillText(S.name,x+14,yy);for(let k=0;k<SK_MAX;k++)ySkull(c,x+102+k*22,yy-6,7,k<n);yy+=24;}
  c.font='bold 14px Arial';c.fillStyle='#2f5d1c';yFitText(c,yardPlanLine(z),x+14,yy+4,W-28);
  c.font='italic 14px Georgia, serif';c.fillStyle='#5a4128';yFitText(c,`"${(z.look&&z.look.quip)||'Brains.'}"`,x+14,yy+28,W-28);
  c.fillStyle='#3a2a18';c.fillRect(x,y+H-34,W,34);c.font='17px Bangers, Arial';c.fillStyle=broke?'#ff9a8a':'#b4ff5a';c.textAlign='center';
  yFitFont(c,broke?'NOT ENOUGH BONES YET':(yTouch()?'DOUBLE-TAP THE DIRT TO DIG UP':'DOUBLE-CLICK THE DIRT TO DIG UP'),x+W/2,y+H-11,W-20,17,'Bangers, Arial');c.restore();}
function yFitText(c,t,x,y,w){if(c.measureText(t).width<=w){c.fillText(t,x,y);return;}let s=t;while(s.length>4&&c.measureText(s+'…').width>w)s=s.slice(0,-1);c.fillText(s.replace(/[\s,.:;·]+$/,'')+'…',x,y);}
function yFitFont(c,t,x,y,w,px,fam){let n=px;c.font=n+'px '+fam;while(n>10&&c.measureText(t).width>w){n--;c.font=n+'px '+fam;}c.fillText(t,x,y);}
function yTouch(){try{return typeof touchOn!=='undefined'&&touchOn;}catch(e){return false;}}
function yAsk(c){const A=YD.ask;c.save();c.fillStyle='rgba(0,0,0,0.55)';c.fillRect(0,0,YW,YH);c.fillStyle='#1b2414';c.strokeStyle='#9dff57';c.lineWidth=4;c.fillRect(60,A.y,600,250);c.strokeRect(60,A.y,600,250);
  c.fillStyle='#e6eedc';c.font='22px Arial';c.textAlign='left';const words=A.text.split(' ');let line='',yy=A.y+46;for(const w of words){if(c.measureText(line+w).width>540){c.fillText(line,90,yy);line='';yy+=30;}line+=w+' ';}c.fillText(line,90,yy);
  c.textAlign='center';for(const b of A.btns){c.fillStyle='#2f5a24';c.fillRect(b.x,b.y,b.w,b.h);c.strokeStyle='#9dff57';c.lineWidth=2;c.strokeRect(b.x,b.y,b.w,b.h);c.fillStyle='#fff';c.font='24px Bangers, Arial';c.fillText(b.label.slice(0,22),b.x+b.w/2,b.y+b.h/2+9);}c.restore();}
function yHUD(c,T){const u=userTeam();c.save();let gr=c.createLinearGradient(0,0,0,120);gr.addColorStop(0,'rgba(0,0,0,0.85)');gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.fillRect(0,0,YW,130);
  c.textAlign='center';c.font='54px Bangers, Arial';c.lineWidth=7;c.strokeStyle='#0b1306';c.fillStyle='#9dff57';c.strokeText('THE GRAVEYARD',YW/2+70,66);c.fillText('THE GRAVEYARD',YW/2+70,66);
  const B=Y_BACK;c.fillStyle='rgba(20,30,15,0.9)';c.fillRect(B.x,B.y,B.w,B.h);c.strokeStyle='#9dff57';c.lineWidth=2;c.strokeRect(B.x,B.y,B.w,B.h);c.fillStyle='#fff';c.font='30px Bangers, Arial';c.fillText('◀ BACK',B.x+B.w/2,B.y+42);
  c.font='bold 18px Arial';c.fillStyle='#e6eedc';c.textAlign='right';c.fillText(`${CAREER.bones} Bones · Bench ${u.bench.length} of ${BENCH_MAX}`,YW-18,104);
  c.textAlign='left';c.fillStyle='#b9c7ad';c.font='16px Arial';c.fillText(YD.graves.some(g=>g.state==='buried')?`${YD.graves.filter(g=>g.state==='buried').length} fresh this week`:'Everyone here is signed. New corpses after the next game.',18,104);
  gr=c.createLinearGradient(0,YH-70,0,YH);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,0.85)');c.fillStyle=gr;c.fillRect(0,YH-70,YW,70);
  c.textAlign='center';c.font='18px Arial';c.fillStyle='#d8e4cc';c.fillText(T<4?YD.mood:yTouch()?'Tap a headstone to see the zombie · double-tap the dirt to dig':'Hover a headstone to see the zombie · double-click the dirt to dig',YW/2,YH-22);
  if(YD.msg){const m=YD.msg,a=yClamp(Math.min(m.life,m.max-m.life)*3,0,1);c.globalAlpha=a;c.fillStyle='rgba(15,22,10,0.92)';c.font='bold 21px Arial';const w=Math.min(680,c.measureText(m.t).width+40);c.fillRect(YW/2-w/2,128,w,46);c.strokeStyle='#9dff57';c.strokeRect(YW/2-w/2,128,w,46);c.fillStyle='#e8ffd0';c.fillText(m.t,YW/2,158);c.globalAlpha=1;}
  c.restore();}

// the background events themselves; e.k runs 0 to 1 over the event
function yEv(c,e,T){const k=e.k,S=YD.sc,a=Math.sin(Math.PI*yClamp(k,0,1));c.save();
  switch(e.n){
    case 'batsMoon':{const M=S.moon;for(let i=0;i<6;i++){const x=yLerp(e.dir>0?-60:YW+60,e.dir>0?YW+60:-60,k)+i*28*e.dir*-1,y=M.y+Math.sin(k*9+i)*22+(i-3)*12;yBat(c,x,y,T*30+i,16);}break;}
    case 'ghost':{const gx=yLerp(140,600,e.x),gy=yLerp(Y_HZ+40,Y_HZ+90,e.y)-a*70;c.globalAlpha=a*0.85;c.fillStyle='#eef3ff';c.beginPath();c.arc(gx,gy,26,Math.PI,0);
      for(let i=0;i<=4;i++)c.lineTo(gx+26-i*13,gy+34+(i%2?-7:0)+Math.sin(T*8+i)*3);c.closePath();c.fill();c.fillStyle='#1b1d2e';c.beginPath();c.arc(gx-9,gy-4,4,0,7);c.arc(gx+9,gy-4,4,0,7);c.fill();c.beginPath();c.ellipse(gx,gy+10,5,7*a,0,0,7);c.fill();
      c.fillStyle='#eef3ff';c.save();c.translate(gx+26,gy+4);c.rotate(Math.sin(T*9)*0.6-0.6);c.fillRect(0,-4,18,8);c.restore();if(k>0.35&&k<0.7){c.font='28px Bangers, Arial';c.fillStyle='#eef3ff';c.fillText('boo!',gx+30,gy-30);}break;}
    case 'peek':{const p=yEase(Math.min(1,k*4))*(k>0.75?yEase((1-k)*4):1),x=Y_TREE.x+30+p*26,y=Y_TREE.base-150;c.fillStyle='#e8e2cf';c.beginPath();c.arc(x,y,17,0,7);c.fill();c.fillRect(x-10,y+8,20,12);
      c.fillStyle='#16120f';c.beginPath();c.arc(x-6,y-1,4.5,0,7);c.arc(x+6,y-1,4.5,0,7);c.fill();c.fillRect(x-7,y+12,14,2);c.fillStyle='#e8e2cf';c.fillRect(x-24,y+24,22,6);c.fillRect(x+p*4-30,y+20,6,6);break;}
    case 'owl':break;   // drawn by yOwl: it turns its head all the way round
    case 'cat':{const x=yLerp(e.dir>0?-40:YW+40,e.dir>0?YW+40:-40,k),y=Y_HZ-14,st=Math.sin(T*10);c.fillStyle='#07060a';c.save();c.translate(x,y);c.scale(e.dir,1);
      c.beginPath();c.ellipse(0,0,18,8,0,0,7);c.fill();c.beginPath();c.arc(18,-6,7,0,7);c.fill();c.beginPath();c.moveTo(14,-11);c.lineTo(16,-18);c.lineTo(19,-12);c.moveTo(19,-12);c.lineTo(22,-18);c.lineTo(24,-10);c.fill();
      c.lineWidth=3;c.strokeStyle='#07060a';c.beginPath();c.moveTo(-16,-2);c.quadraticCurveTo(-30,-10,-26,-26+st*3);c.stroke();for(const lx of [-10,-4,8,13]){c.fillRect(lx,4,3,8+(lx%2?st:-st)*2);}c.fillStyle='#ffe14a';c.fillRect(19,-8,2,2);c.restore();break;}
    case 'wisps':{for(let i=0;i<3;i++){const x=yLerp(80,640,(e.x+i*0.27)%1)+Math.sin(T*1.3+i)*40,y=Y_HZ+70+i*40+Math.sin(T*2+i*2)*16;const gr=c.createRadialGradient(x,y,1,x,y,22);gr.addColorStop(0,`rgba(180,255,220,${0.9*a})`);gr.addColorStop(1,'rgba(120,255,200,0)');c.fillStyle=gr;c.fillRect(x-24,y-24,48,48);}break;}
    case 'wave':case 'hands':{const n=e.n==='hands'?4:1;for(let i=0;i<n;i++){const x=e.n==='hands'?yLerp(90,630,(e.x+i*0.23)%1):yLerp(250,470,e.x),y=e.n==='hands'?Y_HZ+30+i*9:796,sc=e.n==='hands'?0.55:0.8,up=a*36*sc,ww=e.n==='wave'?Math.sin(T*12)*0.4:Math.sin(T*14+i)*0.25;
      c.save();c.translate(x,y);c.fillStyle='#3a2616';c.beginPath();c.ellipse(0,0,16*sc,5*sc,0,0,7);c.fill();c.beginPath();c.rect(-30,-80,60,80);c.clip();c.translate(0,36*sc-up);c.rotate(ww);c.fillStyle=e.n==='hands'?'#7f9a6a':'#9fbf86';c.fillRect(-5*sc,-30*sc,10*sc,40*sc);
      c.beginPath();c.ellipse(0,-34*sc,9*sc,9*sc,0,0,7);c.fill();for(let f=0;f<4;f++){c.save();c.translate((-6+f*4)*sc,-40*sc);c.rotate((f-1.5)*0.18+(e.n==='hands'?Math.sin(T*10+f)*0.3:0));c.fillRect(-1.5*sc,-12*sc,3*sc,12*sc);c.restore();}c.restore();}break;}
    case 'star':{const x=yLerp(80,600,e.x)+k*160,y=yLerp(60,220,e.y)+k*60;c.strokeStyle=`rgba(255,255,230,${a})`;c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x-70,y-26);c.stroke();break;}
    case 'skelDance':{const x=yLerp(300,560,e.x),y=Y_HZ-44,b=Math.sin(T*10);c.globalAlpha=a;c.strokeStyle='#e8e2cf';c.fillStyle='#e8e2cf';c.lineWidth=2.5;c.beginPath();c.arc(x,y-34+b*2,5,0,7);c.fill();
      c.beginPath();c.moveTo(x,y-28);c.lineTo(x,y-12);c.lineTo(x-6,y+b*3);c.moveTo(x,y-12);c.lineTo(x+6,y-b*3);c.moveTo(x,y-24);c.lineTo(x-10,y-34-b*6);c.moveTo(x,y-24);c.lineTo(x+10,y-34+b*6);c.stroke();break;}
    case 'pumpkin':break;   // the jack-o'-lanterns grin and flicker (see yMoonGlow)
    case 'lightning':{const f=k<0.08?1:k<0.16?0.15:k<0.24?0.7:Math.max(0,0.3-(k-0.24));c.fillStyle=`rgba(225,230,255,${0.42*f})`;c.fillRect(0,0,YW,YH);
      if(k<0.4){const r=yRng(Math.floor(e.x*1e6));let x=yLerp(200,600,e.x),y=0;c.strokeStyle='#ffffff';c.lineWidth=4;c.beginPath();c.moveTo(x,y);while(y<Y_HZ-30){x+=(r()-0.5)*70;y+=30+r()*40;c.lineTo(x,y);}c.stroke();}break;}
    case 'eyes':{for(let i=0;i<5;i++){const x=yLerp(170,690,(e.x+i*0.19)%1),y=Y_HZ-20-((i*37)%60),bl=Math.sin(T*3+i*2)>0.92;if(bl)continue;c.fillStyle=`rgba(255,40,30,${a})`;c.beginPath();c.ellipse(x-5,y,3,2,0,0,7);c.ellipse(x+5,y,3,2,0,0,7);c.fill();}break;}
    case 'reaper':{const x=yLerp(e.dir>0?-40:YW+40,e.dir>0?YW+40:-40,k),y=Y_HZ-50+Math.sin(T*2)*3;c.fillStyle='#050405';c.beginPath();c.moveTo(x,y-46);c.quadraticCurveTo(x+18,y-40,x+16,y+10);c.lineTo(x-16,y+10);c.quadraticCurveTo(x-18,y-40,x,y-46);c.fill();
      c.strokeStyle='#050405';c.lineWidth=2.5;c.beginPath();c.moveTo(x+14*e.dir,y-30);c.lineTo(x+14*e.dir,y+12);c.stroke();c.beginPath();c.moveTo(x+14*e.dir,y-30);c.quadraticCurveTo(x-6*e.dir,y-44,x-22*e.dir,y-26);c.stroke();c.fillStyle='#ff3a2a';c.fillRect(x-4,y-36,2,2);c.fillRect(x+2,y-36,2,2);break;}
    case 'crows':{for(let i=0;i<9;i++){const t2=Math.max(0,k*1.3-i*0.03),x=Y_TREE.x+60+t2*(300+i*30),y=Y_TREE.top+80-t2*(300+i*15)+Math.sin(t2*12+i)*10,f=Math.sin(T*24+i);c.strokeStyle='#050505';c.lineWidth=3;
      c.beginPath();c.moveTo(x-10,y-6*f);c.quadraticCurveTo(x-4,y-2,x,y);c.quadraticCurveTo(x+4,y-2,x+10,y-6*f);c.stroke();}break;}
    case 'treeFace':{const x=Y_TREE.x,y=Y_TREE.base-260;c.globalAlpha=a;c.fillStyle='#000';c.beginPath();c.ellipse(x-10,y,6,4,0.3,0,7);c.ellipse(x+12,y,6,4,-0.3,0,7);c.fill();
      c.fillStyle=`rgba(255,120,40,${a})`;c.beginPath();c.arc(x-10,y,1.8,0,7);c.arc(x+12,y,1.8,0,7);c.fill();c.fillStyle='#000';c.beginPath();c.ellipse(x,y+26,10,4+a*12,0,0,7);c.fill();break;}
    case 'fog':{c.globalAlpha=a*0.5;const gr=c.createLinearGradient(0,Y_HZ,0,YH);gr.addColorStop(0,S.g>0.6?'rgba(140,190,120,0.5)':'rgba(200,200,230,0.45)');gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;
      for(let i=0;i<5;i++){const x=((i*170+T*40*e.dir)%(YW+300)+YW+300)%(YW+300)-150;c.beginPath();c.ellipse(x,Y_HZ+120+i*130,260,60,0,0,7);c.fill();}break;}
    case 'window':{c.fillStyle=`rgba(255,40,20,${a})`;c.beginPath();c.arc(150,Y_HZ-76,11,Math.PI,0);c.lineTo(161,Y_HZ-54);c.lineTo(139,Y_HZ-54);c.fill();c.fillStyle=`rgba(0,0,0,${a})`;c.beginPath();c.arc(150,Y_HZ-68,4,0,7);c.fill();c.fillRect(146,Y_HZ-64,8,10);break;}
  }c.restore();}
