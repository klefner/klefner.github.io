// Rotball playfield: a monster football field that is never the same twice.
// Each game gets a seed. The seed picks the ground (dead grass, mud, asphalt, quarry rock, graveyard or a mix),
// the weather (clear, fog, rain, storm) and where the junk lies (barrels, tires, cones, crates, corpses, bones,
// tombstones, hands reaching out of the ground). The same seed always builds the same field, so a field can be
// reproduced for a bug report: open the game with ?field=123456 in the address.
// The still parts are painted once into a texture; only the twitching limbs, flames, fog, rain and lightning
// are drawn each frame. Everything sits under the players and stays darker than they are, and the yard lines,
// hash marks and numbers stay readable.

const PITCH={seed:null,P:null,cv:null,R:16,intro:0,shown:null};
const PX0=-8,PX1=128,PY0=-4,PY1=FW+4;      // the texture covers these field coordinates (x along the field, y across)

function prng(seed){let a=(seed>>>0)||1;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function fieldSeedNew(){try{const q=/[?&]field=(\d+)/.exec(location.search||'');if(q)return(+q[1])%1000000;}catch(e){}return Math.floor(Math.random()*1000000);}
const TITLE_FIELD=fieldSeedNew();

const SURF={
  grass:    {name:'Dead Grass Field',base:'#26331a',alt:'#2b391d',lite:'rgba(150,170,90,0.10)',dark:'rgba(5,10,2,0.22)',
             patch:[['#3b391f',3],['#2f2416',3],['#38291a',2],['#1b2312',2]],props:['barrel','tires','crate','corpse','corpse','bones','tomb','hand','hand','burn'],line:'#dfe3cf'},
  dirt:     {name:'Mud Pit',base:'#33261a',alt:'#38291c',lite:'rgba(170,130,90,0.10)',dark:'rgba(10,5,0,0.25)',
             patch:[['#261b12',3],['#1c2124',3],['#43331f',2],['#2d2a1d',1]],props:['barrel','tires','corpse','corpse','bones','crate','hand','hand','burn','burn'],line:'#e3dccb'},
  asphalt:  {name:'Parking Lot',base:'#24262a',alt:'#27292d',lite:'rgba(190,190,200,0.08)',dark:'rgba(0,0,0,0.28)',
             patch:[['#15161a',3],['#1d1e21',3],['#2e2f33',2],['#2a2418',1]],props:['cone','cone','tires','barrel','burn','burn','corpse','crate','hand'],line:'#e6e1b8'},
  rocks:    {name:'Quarry',base:'#36342e',alt:'#3a3832',lite:'rgba(210,200,180,0.12)',dark:'rgba(0,0,0,0.26)',
             patch:[['#4a4539',3],['#2a2824',3],['#3f3a2f',2],['#2f2a20',1]],props:['bones','bones','barrel','crate','corpse','hand','hand','burn','tires'],line:'#e5e2d6'},
  graveyard:{name:'Graveyard',base:'#212c1e',alt:'#253120',lite:'rgba(140,170,120,0.10)',dark:'rgba(0,5,0,0.25)',
             patch:[['#2f2416',4],['#1a2316',2],['#34301f',2]],props:['tomb','tomb','tomb','cross','cross','corpse','hand','hand','hand','bones'],line:'#dde3d2'},
  mixed:    {name:'Junkyard',base:'#2a2c22',alt:'#2e3025',lite:'rgba(170,170,140,0.10)',dark:'rgba(0,0,0,0.25)',
             patch:[['#24262a',3],['#33261a',3],['#26331a',3],['#15161a',1],['#4a4539',1]],props:['barrel','tires','cone','crate','corpse','bones','tomb','hand','burn','burn'],line:'#e2e0cc'}};
const WX={clear:{adj:'Moonlit',w:35},fog:{adj:'Foggy',w:30},rain:{adj:'Rainy',w:20},storm:{adj:'Stormy',w:15}};
function wpick(rnd,pairs){let tot=0;for(const p of pairs)tot+=p[1];let r=rnd()*tot;for(const p of pairs){if((r-=p[1])<0)return p[0];}return pairs[pairs.length-1][0];}

// ----- the plan: everything a seed decides -----
function pitchPlan(seed){
  const rnd=prng(seed*2654435761+7),surf=wpick(rnd,[['grass',22],['dirt',18],['asphalt',18],['rocks',14],['graveyard',14],['mixed',14]]);
  const wx=wpick(rnd,Object.entries(WX).map(([k,v])=>[k,v.w])),S=SURF[surf];
  const P={seed,surf,wx,S,name:`${WX[wx].adj} ${S.name}`,patches:[],decals:[],props:[],live:[],cracks:[]};
  const wet=wx==='rain'||wx==='storm';
  // ground patches: mud, oil, bare dirt, gravel; puddles when it rains
  const np=26+Math.floor(rnd()*16);
  for(let i=0;i<np;i++)P.patches.push({x:PX0+rnd()*(PX1-PX0),y:PY0+rnd()*(PY1-PY0),r:1.2+rnd()*rnd()*5,c:wpick(rnd,S.patch),a:0.35+rnd()*0.4,n:9+Math.floor(rnd()*6),s:rnd()*1e6|0});
  const npud=wet?12+Math.floor(rnd()*8):surf==='dirt'?4:0;
  for(let i=0;i<npud;i++)P.patches.push({x:2+rnd()*116,y:rnd()*FW,r:0.8+rnd()*2.4,c:'#141a20',a:0.7,n:11,s:rnd()*1e6|0,puddle:true});
  if(surf==='graveyard')for(let i=0;i<10;i++){const side=rnd()<0.5,y=side?0.6+rnd()*2.4:FW-0.6-rnd()*2.4;P.patches.push({x:4+rnd()*112,y,r:0,grave:true,a:0.85,c:'#2f2416',s:rnd()*1e6|0});}
  if(surf==='asphalt'||surf==='mixed')for(let i=0;i<22;i++){const pts=[[rnd()*120,rnd()*FW]];for(let k=0;k<6;k++){const [x,y]=pts[pts.length-1];pts.push([x+(rnd()-0.5)*3,y+(rnd()-0.5)*3]);}P.cracks.push(pts);}
  // flat stains on the field itself: old blood, bones, scorch marks (faint, under everything)
  for(let i=0;i<20;i++)P.decals.push({k:wpick(rnd,[['blood',5],['bone',3],['scorch',2],['skull',1]]),x:rnd()*120,y:1+rnd()*(FW-2),r:rnd()*6.28,s:0.6+rnd()*0.8});
  // props: along the two sidelines (outside the numbers) and behind each end line
  // upright junk (barrels, tires, cones, crates, tombstones) stays out wide, between the numbers and the hashes, or behind
  // the end lines; things lying on the ground (corpses, bones, hands reaching up) can be anywhere, since players run over them
  const FLAT={corpse:1,bones:1,hand:1},n=16+Math.floor(rnd()*8),nflat=6+Math.floor(rnd()*5);
  for(let i=0;i<n+nflat;i++){let k=S.props[Math.floor(rnd()*S.props.length)],x,y;
    if(i>=n){k=['corpse','bones','hand'][Math.floor(rnd()*3)];x=12+rnd()*96;y=12+rnd()*(FW-24);}
    else if(rnd()<0.62){x=3+rnd()*114;y=rnd()<0.5?3.6+rnd()*6.8:FW-3.6-rnd()*6.8;if(FLAT[k]==null&&Math.abs(((x+2.5)%5)-2.5)<0.6)x+=1.2;}
    else{x=rnd()<0.5?-0.8-rnd()*5:120.8+rnd()*5;y=1+rnd()*(FW-2);}
    const pr={k,x,y,r:rnd()*6.28,v:rnd(),flip:rnd()<0.5};P.props.push(pr);
    if(k==='hand')P.live.push({k:'hand',x,y,ph:rnd()*20,sp:0.7+rnd()*0.8,tw:0.25+rnd()*0.35});
    if(k==='burn')P.live.push({k:'flame',x,y,ph:rnd()*20});
    if(k==='corpse'&&rnd()<0.6)P.live.push({k:'arm',x,y,r:pr.r,ph:rnd()*20,sp:0.5+rnd()*0.9});}
  P.props.sort((a,b)=>b.x-a.x);   // far end first, so nearer props overlap farther ones
  // fog banks that drift along the field; rain and lightning timings
  P.fog=wx==='fog'?Array.from({length:7},()=>({x:rnd()*136-8,y:rnd()*FW,r:7+rnd()*9,sp:0.3+rnd()*0.5,a:0.16+rnd()*0.1})):wx==='storm'?Array.from({length:3},()=>({x:rnd()*136-8,y:rnd()*FW,r:6+rnd()*6,sp:0.6+rnd()*0.6,a:0.08})):[];
  P.rain=wx==='rain'?70:wx==='storm'?110:0;
  P.bolt=wx==='storm'?{every:7+rnd()*6,ph:rnd()*10}:null;
  return P;
}

// ----- painting the still texture (or straight onto the screen in the test harness) -----
function pitchPaint(c,P){
  const R=PITCH.R,U=y=>(y-PY0)*R,V=x=>(PX1-x)*R,S=P.S,rnd=prng(P.seed*97+13),Wt=(PY1-PY0)*R,Ht=(PX1-PX0)*R;
  const blob=(cx,cy,r,n,j,rr)=>{c.beginPath();for(let i=0;i<n;i++){const a=i/n*6.283,q=r*(1-j/2+j*rr());const px=cx+Math.cos(a)*q,py=cy+Math.sin(a)*q*0.82;i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();};
  // ground: darker outside the playing field
  c.fillStyle=S.base;c.fillRect(0,0,Wt,Ht);
  for(let x=10;x<110;x+=5)if(((x/5)%2)===1){c.fillStyle=S.alt;c.fillRect(U(0),V(x+5),FW*R,5*R+1);}
  for(const p of P.patches){const pr=prng(p.s);c.globalAlpha=p.a;c.fillStyle=p.c;
    if(p.grave){c.save();c.translate(U(p.y),V(p.x));c.rotate((pr()-0.5)*0.3);c.fillRect(-0.55*R,-1.1*R,1.1*R,2.2*R);c.fillStyle='rgba(0,0,0,0.25)';c.fillRect(-0.55*R,-1.1*R,1.1*R,0.25*R);c.restore();continue;}
    blob(U(p.y),V(p.x),p.r*R,p.n,0.45,pr);c.fill();
    if(p.puddle){c.globalAlpha=0.35;c.strokeStyle='#5d6e7a';c.lineWidth=1.2;blob(U(p.y),V(p.x),p.r*R*0.85,p.n,0.3,prng(p.s));c.stroke();
      c.globalAlpha=0.18;c.fillStyle='#9fb6c6';c.beginPath();c.ellipse(U(p.y)-p.r*R*0.25,V(p.x)-p.r*R*0.2,p.r*R*0.35,p.r*R*0.12,-0.3,0,7);c.fill();}}
  c.globalAlpha=1;
  // grain: specks, tufts, pebbles
  const nsp=Math.floor(Wt*Ht/700);
  for(let i=0;i<nsp;i++){c.fillStyle=i%2?S.lite:S.dark;const s=1+rnd()*2.2;c.fillRect(rnd()*Wt,rnd()*Ht,s,s);}
  if(P.surf==='grass'||P.surf==='graveyard'||P.surf==='mixed'){c.lineWidth=1.3;for(let i=0;i<nsp/3;i++){const u=rnd()*Wt,v=rnd()*Ht;c.strokeStyle=i%3?'rgba(120,140,70,0.25)':'rgba(160,150,80,0.22)';c.beginPath();c.moveTo(u,v);c.lineTo(u+(rnd()-0.5)*4,v-3-rnd()*5);c.stroke();}}
  if(P.surf==='rocks'||P.surf==='mixed'){for(let i=0;i<nsp/6;i++){const u=rnd()*Wt,v=rnd()*Ht,r=1.5+rnd()*rnd()*6;c.fillStyle=`rgba(${110+rnd()*60|0},${105+rnd()*50|0},${90+rnd()*40|0},0.55)`;c.beginPath();c.ellipse(u,v,r,r*0.7,rnd()*3,0,7);c.fill();c.fillStyle='rgba(0,0,0,0.3)';c.beginPath();c.ellipse(u+r*0.3,v+r*0.35,r*0.8,r*0.4,0,0,7);c.fill();}}
  c.strokeStyle='rgba(0,0,0,0.55)';c.lineWidth=1.6;for(const pts of P.cracks){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(U(y),V(x)):c.moveTo(U(y),V(x)));c.stroke();}
  if(P.surf==='asphalt'){c.strokeStyle='rgba(225,200,90,0.22)';c.lineWidth=0.18*R;for(let x=-6;x<127;x+=2.6){for(const [y0,y1] of [[-3.8,-0.6],[FW+0.6,FW+3.8]]){c.beginPath();c.moveTo(U(y0),V(x));c.lineTo(U(y1),V(x));c.stroke();}}}
  // end zones: team colours, dirtied up, with the team names
  for(let t=0;t<2;t++){const x0=t===0?0:110;c.globalAlpha=0.5;c.fillStyle=TEAMS[t].ez;c.fillRect(U(0),V(x0+10),FW*R,10*R);c.globalAlpha=1;
    for(let i=0;i<9;i++){c.globalAlpha=0.25+rnd()*0.25;c.fillStyle=S.base;blob(U(rnd()*FW),V(x0+rnd()*10),(0.8+rnd()*2.2)*R,10,0.5,rnd);c.fill();}c.globalAlpha=1;
    c.save();c.translate(U(MID),V(x0+5));c.rotate((rnd()-0.5)*0.06);c.fillStyle='rgba(255,255,255,0.2)';c.font=`${Math.round(R*3.4)}px Creepster, Bangers, sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(TEAMS[t].name.toUpperCase(),0,0);c.restore();}
  // decals
  for(const d of P.decals){c.save();c.translate(U(d.y),V(d.x));c.rotate(d.r);const s=d.s*R;
    if(d.k==='blood'){c.globalAlpha=0.32;c.fillStyle='#4a0d0d';blob(0,0,s*0.9,10,0.6,rnd);c.fill();c.globalAlpha=0.25;c.beginPath();c.arc(s*1.1,s*0.2,s*0.18,0,7);c.arc(-s*0.9,-s*0.5,s*0.12,0,7);c.fill();}
    else if(d.k==='scorch'){c.globalAlpha=0.3;c.fillStyle='#0b0b0a';blob(0,0,s*1.2,12,0.5,rnd);c.fill();}
    else if(d.k==='bone'){c.globalAlpha=0.4;c.strokeStyle='#cfc6b0';c.lineWidth=s*0.12;c.lineCap='round';c.beginPath();c.moveTo(-s*0.4,0);c.lineTo(s*0.4,0);c.stroke();c.fillStyle='#cfc6b0';for(const e of [-0.45,0.45])for(const o of [-0.07,0.07]){c.beginPath();c.arc(s*e,s*o,s*0.09,0,7);c.fill();}}
    else{c.globalAlpha=0.4;pSkull(c,0,0,s*0.5);}
    c.restore();}
  c.globalAlpha=1;
  // lines: chalk that's been trampled, but always readable
  const L=S.line;c.strokeStyle=L;c.lineCap='round';
  for(let x=10;x<=110;x+=5){const major=x%10===0,goal=x===10||x===110;c.lineWidth=(goal?0.3:major?0.22:0.15)*R;
    let y=0,w=0;while(y<FW){const y2=Math.min(FW,y+1.2+rnd()*1.6),w2=(rnd()-0.5)*0.18;
      if(goal||rnd()>0.07){c.globalAlpha=goal?0.85:(major?0.68:0.55)+rnd()*0.17;c.beginPath();c.moveTo(U(y),V(x+w));c.lineTo(U(y2),V(x+w2));c.stroke();}
      y=y2;w=w2;}}
  c.globalAlpha=0.7;c.lineWidth=0.25*R;c.strokeRect(U(0),V(120),FW*R,120*R);
  c.lineWidth=0.11*R;c.globalAlpha=0.5;
  for(let x=11;x<110;x++){if(x%5===0)continue;for(const hy of [0.6,FW*0.38,FW*0.62,FW-0.6]){if(rnd()<0.1)continue;const j=(rnd()-0.5)*0.12;c.beginPath();c.moveTo(U(hy-0.35),V(x+j));c.lineTo(U(hy+0.35),V(x-j));c.stroke();}}
  c.globalAlpha=1;c.fillStyle=L;c.font=`bold ${Math.round(R*1.7)}px Roboto Condensed, Arial`;c.textAlign='center';c.textBaseline='middle';
  for(let x=20;x<=100;x+=10){const n=x<=60?x-10:110-x;
    for(const [yy,rot] of [[5,Math.PI/2],[FW-5,-Math.PI/2]]){c.save();c.globalAlpha=0.55+rnd()*0.2;c.translate(U(yy),V(x));c.rotate(rot+(rnd()-0.5)*0.12);c.fillText(String(n),0,0);c.restore();}}
  // midfield logo, cracked
  c.save();c.translate(U(MID),V(60));const cr=R*4.2;c.fillStyle='rgba(12,20,10,0.6)';c.beginPath();c.arc(0,0,cr,0,7);c.fill();c.strokeStyle='#b8ff7a';c.globalAlpha=0.8;c.lineWidth=2;c.stroke();
  c.fillStyle='rgba(184,255,122,0.8)';c.textAlign='center';c.textBaseline='middle';c.font=`${Math.round(cr*0.62)}px Creepster, Bangers`;c.fillText('RB',0,-cr*0.12);c.font=`bold ${Math.round(cr*0.17)}px Roboto Condensed`;c.fillText('ROTBALL',0,cr*0.4);
  c.globalAlpha=0.7;c.strokeStyle='#0b0f08';c.lineWidth=2.2;for(let i=0;i<3;i++){let a=rnd()*6.28,px=Math.cos(a)*cr*1.05,py=Math.sin(a)*cr*1.05;c.beginPath();c.moveTo(px,py);for(let k=0;k<5;k++){a+=(rnd()-0.5)*0.9;px-=Math.cos(a)*cr*0.22;py-=Math.sin(a)*cr*0.22;c.lineTo(px,py);}c.stroke();}
  c.restore();c.globalAlpha=1;
  // props
  for(const p of P.props)pProp(c,p,U(p.y),V(p.x),R,P);
}

function pSkull(c,x,y,r){c.fillStyle='#d8d0bb';c.beginPath();c.arc(x,y-r*0.15,r,0,7);c.fill();c.fillRect(x-r*0.55,y+r*0.5,r*1.1,r*0.5);
  c.fillStyle='#1a1410';c.beginPath();c.arc(x-r*0.38,y-r*0.05,r*0.27,0,7);c.arc(x+r*0.38,y-r*0.05,r*0.27,0,7);c.fill();c.fillRect(x-r*0.08,y+r*0.3,r*0.16,r*0.2);}
// one prop, standing on its foot point (u,v) in texture pixels; R = pixels per yard
const PROP_K=1.3; // props a bit bigger than a yard, so they read on a phone without crowding the players
function pProp(c,p,u,v,R,P){c.save();c.translate(u,v);if(p.flip)c.scale(-1,1);const s=R*PROP_K;
  c.fillStyle='rgba(0,0,0,0.35)';c.beginPath();c.ellipse(0,0,s*0.6,s*0.2,0,0,7);c.fill();
  switch(p.k){
    case 'barrel':case 'burn':{const tox=p.k==='barrel'&&p.v<0.4,body=tox?'#3d5527':p.v<0.7?'#6a3a1e':'#3a4652',w=s*0.42,h=s*1.05;
      c.fillStyle=body;c.fillRect(-w,-h,w*2,h);c.fillStyle='rgba(0,0,0,0.3)';c.fillRect(w*0.35,-h,w*0.65,h);
      c.strokeStyle='rgba(0,0,0,0.45)';c.lineWidth=s*0.06;for(const k of [0.3,0.7]){c.beginPath();c.moveTo(-w,-h*k);c.lineTo(w,-h*k);c.stroke();}
      c.fillStyle=p.k==='burn'?'#120c08':'#2a2a22';c.beginPath();c.ellipse(0,-h,w,w*0.32,0,0,7);c.fill();
      c.fillStyle='rgba(120,60,30,0.6)';c.beginPath();c.arc(-w*0.4,-h*0.45,s*0.09,0,7);c.arc(w*0.1,-h*0.8,s*0.06,0,7);c.fill();
      if(tox){c.fillStyle='#9dff57';c.globalAlpha=0.8;c.beginPath();c.ellipse(0,-h,w*0.8,w*0.24,0,0,7);c.fill();c.fillRect(-w*0.2,-h,s*0.08,h*0.55);c.beginPath();c.arc(-w*0.16,-h*0.45,s*0.07,0,7);c.fill();
        c.globalAlpha=0.5;c.beginPath();c.ellipse(w*0.6,-s*0.02,s*0.5,s*0.14,0,0,7);c.fill();c.globalAlpha=1;}
      if(p.k==='barrel'&&p.v>0.85){c.fillStyle='#e8d74a';c.beginPath();c.moveTo(0,-h*0.75);c.lineTo(w*0.45,-h*0.3);c.lineTo(-w*0.45,-h*0.3);c.closePath();c.fill();}
      break;}
    case 'tires':{const n=2+(p.v*2|0);for(let i=0;i<n;i++){const y=-i*s*0.26-s*0.1;c.fillStyle='#141414';c.beginPath();c.ellipse(0,y,s*0.55,s*0.2,0,0,7);c.fill();c.strokeStyle='#2c2c2c';c.lineWidth=s*0.05;c.stroke();
      c.fillStyle='#070707';c.beginPath();c.ellipse(0,y-s*0.02,s*0.22,s*0.07,0,0,7);c.fill();}
      if(p.v>0.6){c.save();c.translate(s*0.75,-s*0.1);c.rotate(0.3);c.fillStyle='#141414';c.beginPath();c.ellipse(0,0,s*0.2,s*0.45,0,0,7);c.fill();c.fillStyle='#070707';c.beginPath();c.ellipse(0,0,s*0.08,s*0.2,0,0,7);c.fill();c.restore();}
      break;}
    case 'cone':{if(p.v<0.3){c.rotate(1.4);c.translate(0,-s*0.2);}c.fillStyle='#c4521c';c.beginPath();c.moveTo(-s*0.3,0);c.lineTo(-s*0.07,-s*0.8);c.lineTo(s*0.07,-s*0.8);c.lineTo(s*0.3,0);c.closePath();c.fill();
      c.fillStyle='#d8d4c4';c.beginPath();c.moveTo(-s*0.2,-s*0.28);c.lineTo(-s*0.13,-s*0.5);c.lineTo(s*0.13,-s*0.5);c.lineTo(s*0.2,-s*0.28);c.closePath();c.fill();
      c.fillStyle='#8a3612';c.fillRect(-s*0.38,-s*0.06,s*0.76,s*0.08);break;}
    case 'crate':{const w=s*0.5;c.rotate((p.v-0.5)*0.3);c.fillStyle='#5a4126';c.fillRect(-w,-w*2,w*2,w*2);c.strokeStyle='#2c1f12';c.lineWidth=s*0.06;c.strokeRect(-w,-w*2,w*2,w*2);
      c.beginPath();c.moveTo(-w,-w*2);c.lineTo(w,0);c.moveTo(-w,-w);c.lineTo(w,-w);c.stroke();
      if(p.v>0.5){c.fillStyle='#120c08';c.beginPath();c.moveTo(w,-w*2);c.lineTo(w*0.2,-w*2);c.lineTo(w*0.6,-w*1.3);c.lineTo(w,-w*1.5);c.closePath();c.fill();}break;}
    case 'tomb':{const w=s*0.4,h=s*0.9;c.rotate((p.v-0.5)*0.35);c.fillStyle=p.v<0.5?'#6f756a':'#585d55';c.strokeStyle='#2f332d';c.lineWidth=s*0.06;
      c.beginPath();c.moveTo(-w,0);c.lineTo(-w,-h+w);c.arc(0,-h+w,w,Math.PI,0);c.lineTo(w,0);c.closePath();c.fill();c.stroke();
      c.fillStyle='#2f332d';c.font=`bold ${Math.round(s*0.24)}px Roboto Condensed, Arial`;c.textAlign='center';c.textBaseline='middle';c.fillText('RIP',0,-h*0.55);
      c.strokeStyle='rgba(20,20,20,0.6)';c.lineWidth=s*0.03;c.beginPath();c.moveTo(w*0.3,-h);c.lineTo(w*0.05,-h*0.75);c.lineTo(w*0.25,-h*0.6);c.stroke();
      c.fillStyle='rgba(60,90,40,0.6)';c.beginPath();c.ellipse(-w*0.5,-s*0.05,s*0.25,s*0.1,0,0,7);c.fill();break;}
    case 'cross':{c.rotate((p.v-0.5)*0.5);c.fillStyle='#4a3520';c.fillRect(-s*0.06,-s*1.0,s*0.12,s*1.0);c.fillRect(-s*0.3,-s*0.78,s*0.6,s*0.11);break;}
    case 'corpse':{c.rotate(p.r);c.fillStyle='rgba(60,8,8,0.45)';c.beginPath();c.ellipse(s*0.1,s*0.05,s*0.9,s*0.5,0.2,0,7);c.fill();
      const cloth=['#3d3a4a','#4a3a2a','#2e3d33','#4a2a2a'][p.v*4|0],skin=p.v<0.5?'#7d9a6c':'#9a9a80';
      c.strokeStyle=cloth;c.lineCap='round';c.lineWidth=s*0.17;c.beginPath();c.moveTo(-s*0.15,s*0.1);c.lineTo(-s*0.75,s*0.35);c.moveTo(-s*0.15,-s*0.08);c.lineTo(-s*0.8,-s*0.2);c.stroke();
      c.fillStyle=cloth;c.beginPath();c.ellipse(s*0.15,0,s*0.38,s*0.24,0,0,7);c.fill();
      c.strokeStyle=skin;c.lineWidth=s*0.11;c.beginPath();c.moveTo(s*0.35,-s*0.18);c.lineTo(s*0.5,-s*0.55);c.stroke();
      c.fillStyle=skin;c.beginPath();c.arc(s*0.68,s*0.03,s*0.17,0,7);c.fill();c.fillStyle='#1a1410';c.beginPath();c.arc(s*0.73,-s*0.03,s*0.04,0,7);c.fill();
      c.fillStyle='#d8d0bb';c.beginPath();c.arc(-s*0.82,-s*0.2,s*0.05,0,7);c.fill();break;}
    case 'bones':{c.strokeStyle='#cfc6b0';c.lineCap='round';c.lineWidth=s*0.08;for(let i=0;i<3;i++){const a=p.r+i*1.9,l=s*0.35;c.beginPath();c.moveTo(Math.cos(a)*-l,Math.sin(a)*-l*0.5-s*0.05);c.lineTo(Math.cos(a)*l,Math.sin(a)*l*0.5-s*0.05);c.stroke();}
      pSkull(c,s*0.2,-s*0.22,s*0.2);break;}
    case 'hand':{ // a dug-up mound of dirt; the zombie hand itself is drawn live, reaching out of it
      c.fillStyle='#2a1d12';c.beginPath();c.ellipse(0,s*0.02,s*0.5,s*0.2,0,0,7);c.fill();
      c.fillStyle='#4a3622';for(const [dx,dy,r] of [[-0.3,0,0.11],[0.28,0.03,0.1],[-0.1,0.1,0.09],[0.14,-0.08,0.08],[0.38,-0.05,0.06]]){c.beginPath();c.arc(s*dx,s*dy,s*r,0,7);c.fill();}
      c.fillStyle='#0e0905';c.beginPath();c.ellipse(0,-s*0.01,s*0.2,s*0.07,0,0,7);c.fill();break;}
  }
  c.restore();}

// ----- build or reuse the texture for a seed -----
function pitchGet(seed){
  if(PITCH.seed===seed&&PITCH.P)return PITCH;
  PITCH.seed=seed;PITCH.P=pitchPlan(seed);PITCH.cv=null;
  if(!window.__PITCH_DIRECT){try{const cv=document.createElement('canvas'),R=PITCH.R;cv.width=Math.ceil((PY1-PY0)*R);cv.height=Math.ceil((PX1-PX0)*R);
    const c=cv.getContext('2d');if(c&&typeof c.fillRect==='function'){pitchPaint(c,PITCH.P);PITCH.cv=cv;}}catch(e){PITCH.cv=null;}}
  return PITCH;}
// fonts arrive after the first paint: repaint once they are in so the numbers and names use the right type
try{if(document.fonts&&document.fonts.load)Promise.all(['40px Creepster','bold 20px "Roboto Condensed"','20px Bangers'].map(f=>document.fonts.load(f))).then(()=>{PITCH.seed=null;}).catch(()=>{});}catch(e){}

function pitchSeed(){if(G){if(G.field==null)G.field=fieldSeedNew();return G.field;}return TITLE_FIELD;}
function pitchBg(){const P=pitchGet(pitchSeed()).P;return P.S.base;}
function pitchName(){const P=pitchGet(pitchSeed()).P;return `${P.name} · field #${P.seed}`;}

// called by drawField: the ground, then the live bits that sit on it
// How dead things move: almost still most of the time, then every 9 to 16 seconds a short, stiff clutch that
// updates in stop-motion steps (5 a second) instead of smoothly. Each limb has its own period and offset, so
// they never move together. Returns 0 (at rest) to 1 (full clutch).
function deadTwitch(t,L){const period=9+((L.ph*7.3)%7),tq=Math.floor(t*5)/5,u=((tq+L.ph*3.1)%period)/period,win=1.6/period;
  if(u>win)return 0;const k=u/win;return k<0.35?Math.round(k/0.35*3)/3:k<0.7?1:Math.round((1-(k-0.7)/0.3)*3)/3;}
// A zombie hand reaching up (toward -y) from the wrist at (0,0). curl 0 = fingers spread wide, 1 = clenched claw.
// Drawn with a dark outline under the rotted skin so it reads as a hand even at phone size.
function groundHand(c,s,curl,skin,arm){skin=skin||'#86a070';const ink='#18220f',o=s*0.05;
  const seg=(pts,w)=>{c.lineCap='round';c.lineJoin='round';for(const [col,lw] of [[ink,w+o*2],[skin,w]]){c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.stroke();}};
  const fing=(bx,by,ang,l1,l2,w)=>{const a2=ang+curl*1.3*(bx<0?1:-1),x1=bx+Math.cos(ang)*l1,y1=by+Math.sin(ang)*l1,x2=x1+Math.cos(a2)*l2*(1-curl*0.25),y2=y1+Math.sin(a2)*l2*(1-curl*0.25);
    seg([[bx,by],[x1,y1],[x2,y2]],w);c.fillStyle='#d8cfa8';c.beginPath();c.arc(x2,y2,w*0.38,0,7);c.fill();};
  if(arm!==false){ // forearm with a torn sleeve and rot spots
    c.fillStyle=ink;c.beginPath();c.moveTo(-s*0.14,o);c.lineTo(-s*0.12,-s*0.5);c.lineTo(s*0.12,-s*0.5);c.lineTo(s*0.15,o);c.closePath();c.fill();
    c.fillStyle=skin;c.beginPath();c.moveTo(-s*0.1,0);c.lineTo(-s*0.08,-s*0.48);c.lineTo(s*0.08,-s*0.48);c.lineTo(s*0.11,0);c.closePath();c.fill();
    c.fillStyle='#3b3346';c.beginPath();c.moveTo(-s*0.16,s*0.02);c.lineTo(-s*0.15,-s*0.17);c.lineTo(-s*0.07,-s*0.12);c.lineTo(-s*0.01,-s*0.2);c.lineTo(s*0.06,-s*0.11);c.lineTo(s*0.17,-s*0.18);c.lineTo(s*0.17,s*0.02);c.closePath();c.fill();
    c.fillStyle='rgba(70,30,30,0.75)';c.beginPath();c.arc(s*0.03,-s*0.3,s*0.035,0,7);c.arc(-s*0.04,-s*0.4,s*0.025,0,7);c.fill();}
  const py=-s*0.6; // palm
  c.fillStyle=ink;c.beginPath();c.ellipse(0,py,s*0.17+o,s*0.14+o,0,0,7);c.fill();
  fing(-s*0.12,py-s*0.04,-Math.PI/2-0.45-0.25*(1-curl),s*0.14,s*0.13,s*0.07);   // little finger
  fing(-s*0.05,py-s*0.09,-Math.PI/2-0.15*(1-curl),s*0.18,s*0.16,s*0.075);
  fing(s*0.04,py-s*0.1,-Math.PI/2+0.08*(1-curl),s*0.2,s*0.17,s*0.075);         // middle finger, the longest
  fing(s*0.12,py-s*0.06,-Math.PI/2+0.35*(1-curl),s*0.17,s*0.15,s*0.072);
  c.fillStyle=skin;c.beginPath();c.ellipse(0,py,s*0.17,s*0.14,0,0,7);c.fill();
  fing(s*0.15,py+s*0.06,-0.35-curl*0.6,s*0.12,s*0.1,s*0.08);                     // thumb sticks out sideways
  c.fillStyle='rgba(24,34,15,0.45)';c.beginPath();c.arc(-s*0.06,py+s*0.03,s*0.03,0,7);c.fill();}  // end of groundHand
function pitchDraw(){
  const PT=pitchGet(pitchSeed()),P=PT.P,k=SS/PT.R;
  ctx.fillStyle=P.S.base;ctx.fillRect(-W,HUD-H,W*3,H*3);
  if(PT.cv)ctx.drawImage(PT.cv,SX(PY0),SY(PX1),(PY1-PY0)*SS,(PX1-PX0)*SS);
  else{ctx.save();ctx.translate(SX(PY0),SY(PX1));ctx.scale(k,k);pitchPaint(ctx,P);ctx.restore();}
  const t=typeof time==='number'?time:0;
  for(const L of P.live){const x=SX(L.y),y=SY(L.x),s=SS*PROP_K;if(y<HUD-3*s||y>H+3*s||x<-3*s||x>W+3*s)continue;
    if(L.k==='hand'){ // a zombie hand pushing up out of its mound: still, then now and then a slow, stiff clutch
      const e=deadTwitch(t,L),dir=L.ph%2<1?1:-1,a=e*0.16*dir+Math.sin(t*0.25+L.ph)*0.025,sink=s*(0.1+0.04*Math.sin(t*0.15+L.ph)),curl=0.12+0.8*e;
      ctx.save();ctx.translate(x,y);ctx.save();ctx.translate(0,sink);ctx.rotate(a);groundHand(ctx,s*1.3,curl);ctx.restore();
      ctx.fillStyle='#4a3622';ctx.beginPath();ctx.ellipse(0,s*0.04,s*0.28,s*0.08,0,0,Math.PI);ctx.fill();   // front lip of the mound hides the base of the arm
      ctx.restore();}
    else if(L.k==='arm'){ // a corpse's loose arm that now and then jerks stiffly, ending in a clawing hand
      const e=deadTwitch(t,L),tw=e*0.45*(L.ph%2<1?1:-1)+0.02*Math.sin(t*0.3+L.ph),skin='#86a070',ink='#18220f';
      ctx.save();ctx.translate(x,y);ctx.rotate(L.r);ctx.translate(s*0.35,s*0.12);ctx.rotate(0.9+tw);ctx.lineCap='round';ctx.lineJoin='round';
      const ex=s*0.62,ey=-s*0.1-tw*s*0.2;
      for(const [col,lw] of [[ink,s*0.16],[skin,s*0.1]]){ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(s*0.4,0);ctx.lineTo(ex,ey);ctx.stroke();}
      ctx.translate(ex,ey);ctx.rotate(Math.atan2(ey,ex-s*0.4)+Math.PI/2);ctx.scale(0.75,0.75);ctx.translate(0,s*0.45);groundHand(ctx,s,0.3+0.6*e,skin,false);ctx.restore();}
    else if(L.k==='flame'){const h=s*1.05;ctx.save();ctx.translate(x,y-h);ctx.globalCompositeOperation='lighter';
      ctx.fillStyle='rgba(255,120,30,0.16)';ctx.beginPath();ctx.arc(0,-s*0.2,s*(1.1+0.08*Math.sin(t*9+L.ph)),0,7);ctx.fill();
      for(let i=0;i<3;i++){const fl=Math.sin(t*(11+i*3)+L.ph+i)*0.5+0.5,hh=s*(0.55+0.35*fl),ww=s*(0.32-i*0.07);ctx.fillStyle=['rgba(255,90,20,0.75)','rgba(255,170,40,0.7)','rgba(255,240,150,0.7)'][i];
        ctx.beginPath();ctx.moveTo(-ww,0);ctx.quadraticCurveTo(-ww*0.6,-hh*0.6,Math.sin(t*7+i+L.ph)*ww*0.4,-hh);ctx.quadraticCurveTo(ww*0.6,-hh*0.6,ww,0);ctx.closePath();ctx.fill();}
      ctx.restore();}}
  // ground fog: soft banks drifting down the field, under the players
  for(const f of P.fog){const fx=((f.x+t*f.sp+8)%144+144)%144-8,x=SX(f.y),y=SY(fx),r=f.r*SS;if(y<HUD-r||y>H+r)continue;
    const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(165,178,170,${f.a})`);g.addColorStop(1,'rgba(165,178,170,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
}

// called after the players: rain, lightning, a fog veil, a darker rim, and the "tonight's field" banner
function pitchOver(){
  const PT=pitchGet(pitchSeed()),P=PT.P,t=typeof time==='number'?time:0;
  ctx.save();
  if(P.wx==='fog'){ctx.fillStyle='rgba(150,160,155,0.07)';ctx.fillRect(0,HUD,W,FH);}
  if(P.rain){ctx.strokeStyle='rgba(170,190,215,0.33)';ctx.lineWidth=1.4;ctx.beginPath();
    for(let i=0;i<P.rain;i++){const h1=((i*7919)%1000)/1000,h2=((i*104729)%1000)/1000,sp=900+h2*500,y=HUD+((h1*FH+t*sp)%(FH+40))-20,x=(h2*W+(y-HUD)*0.18)%W;ctx.moveTo(x,y);ctx.lineTo(x-4,y-18);}
    ctx.stroke();ctx.strokeStyle='rgba(190,205,225,0.35)';ctx.lineWidth=1;
    for(let i=0;i<14;i++){const ph=(t*1.7+i*0.37)%1,h1=((i*3571)%997)/997,h2=((i*6151)%991)/991;ctx.globalAlpha=1-ph;ctx.beginPath();ctx.ellipse(h2*W,HUD+h1*FH,2+ph*9,1+ph*3.5,0,0,7);ctx.stroke();}
    ctx.globalAlpha=1;}
  if(P.bolt){const k=((t+P.bolt.ph)%P.bolt.every);if(k<0.32){const a=(k<0.08?0.22:k<0.14?0.04:k<0.22?0.16:0.16*(0.32-k)/0.1);ctx.fillStyle=`rgba(225,232,255,${a})`;ctx.fillRect(0,HUD,W,FH);}}
  const g=ctx.createRadialGradient(W/2,HUD+FH/2,FH*0.32,W/2,HUD+FH/2,FH*0.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,0.32)');ctx.fillStyle=g;ctx.fillRect(0,HUD,W,FH);
  // the banner when a new field first appears in a game
  if(G&&PITCH.shown!==P.seed){PITCH.shown=P.seed;PITCH.intro=4.5;}
  if(G&&PITCH.intro>0){PITCH.intro-=1/60;const a=Math.min(1,PITCH.intro/0.6,(4.5-PITCH.intro)/0.4);ctx.globalAlpha=Math.max(0,a);
    ctx.fillStyle='rgba(6,4,10,0.75)';ctx.fillRect(SW,HUD+10,W-2*SW,74);ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='22px Bangers, Arial';ctx.fillStyle='rgba(255,255,255,0.8)';ctx.fillText("TONIGHT'S FIELD",W/2,HUD+30);
    ctx.font='34px Creepster, Bangers, Arial';ctx.fillStyle='#b8ff7a';ctx.fillText(P.name.toUpperCase(),W/2,HUD+62);}
  ctx.restore();
}
