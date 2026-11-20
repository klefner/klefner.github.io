// ===== THE ROTTIES: the end-of-game awards show =====
// After the final whistle (and after Dead Time, when it happens) the winners take the stage. Three glamorous Medusas
// (sunglasses on, for everyone's safety) hand out awards; one forgets the sunglasses and her winner turns to stone.
// Then the big trophy, confetti and fireworks, to our own closing anthem, while joke credits and the real credits roll.
// A tie skips the show. Holding the skip box skips it. Runs inside index.html (uses its globals: ctx, W, H, G, TEAMS, playS...).
const CER_LEN=32.5;
const CER_AWARDS=[
  ['MOST LIMBS STILL ATTACHED','Counted twice. Still surprising.'],
  ['BEST SUPPORTING CORPSE','Supported nobody. Decayed beautifully.'],
  ['LIFETIME DECOMPOSITION ACHIEVEMENT','Rotting since before rotting was cool.'],
  ['OUTSTANDING ACHIEVEMENT IN SHAMBLING','Two steps forward. One step sideways. Art.'],
  ['MOST IMPROVED SMELL','From unbearable to merely tragic.'],
  ['BEST HAIR (REMAINING)','All four strands, flawless.'],
  ['FEWEST BRAINS EATEN THIS SEASON','A true vegetarian, for a zombie.']];
const CER_STONE=['BEST EYE CONTACT','He looked right at her. Brave. Stupid. Granite.'];
const MEDUSAS=[{sash:'MISS PETRIFIED',gown:'#1f8a5a',gownDk:'#105c3a',skin:'#9fd08f',lips:'#c2185b'},
  {sash:'MISS STONE COLD',gown:'#7b2a8c',gownDk:'#4e165c',skin:'#a8d79a',lips:'#d81b60'},
  {sash:'MISS HISSY FIT',gown:'#c9a227',gownDk:'#8a6d12',skin:'#94c985',lips:'#ad1457'}];
// the credits: jokes first, then the real ones
const CER_CREDITS=[
  ['h','ROTBALL'],['s','Undead Football'],['g'],
  ['h','THE ROTTIES'],['s','Awards for Excellence in Decomposition'],['g'],
  ['r','Director of Decomposition','Rigor Mortez'],['r','Executive Producer of Rot','Phil T. Corpse'],
  ['r','Limb Reattachment Coordinator','Dr. Stitches McGee'],['r','Head Groundskeeper','Moss Graves'],
  ['r','Brain Catering','Cerebella Munch'],['r','Snake Wrangler, Medusa Unit','Hiss Terry'],
  ['r','Stone Removal','Rocky Gravel & Sons'],['r','Bat Handlers','The Flapjacks'],
  ['r','Halftime Band Director','Tubby Bonejangles'],['r','Cheer Captain','Peppy Rotsworth'],
  ['r','Referee (Mostly Alive)','Whistle Pete'],['r','Ghost Wrangler','Wispy McFloat'],
  ['r','Announcer\'s Vocal Cords','Gravelle Throat'],['r','Continuity','Lost in the third quarter'],
  ['r','Craft Services','Brains, mostly'],['r','Fan Who Ate All the Nachos','Name withheld'],
  ['r','Undead Rights Counsel','Mort & Mortimer, LLP'],['g'],
  ['n','No zombies were harmed in the making of this game.'],['n','They were already dead.'],['g'],
  ['n','The Medusas appear courtesy of the Gorgon Talent Agency.'],['n','Eye contact at your own risk.'],['g'],
  ['n','Any resemblance to persons living is purely coincidental.'],['n','Persons dead, we can\'t speak for.'],['g'],
  ['h','REAL CREDITS'],['g'],
  ['r','A game by','Beta Arcade'],
  ['r','Music, songs, anthems','Original, made for Rotball'],
  ['r','Halftime melodies','Public-domain tunes, new lyrics'],
  ['r','Crowd cheering','Gregor Quendel (CC BY 4.0)'],
  ['r','Zombie sounds','colodical (CC BY 3.0)'],
  ['r','"Zombies\' March"','yd (CC0)'],['r','"Halloween Hullabaloo"','Winter Frost (CC0)'],
  ['r','Sound effects (CC0)','artisticdude, Ogrebane, Independent.nu,'],['r','','EZduzziteh, Zane Little Music,'],['r','','starninjas, eXpl0it3r'],
  ['r','Fonts (SIL Open Font License)','Creepster, Bangers, Roboto Condensed'],['g'],
  ['h','THANKS FOR PLAYING'],['s','Now go wash your hands.']];
const CR={on:false};

function endCeremony(){            // the final whistle: a winner gets the show, a tie goes straight to the result
  if(!G||G.score[0]===G.score[1])return gameOver();cerStart(G.score[0]>G.score[1]?0:1);}
function cerStart(win){
  const team=G.teams[win],xs=[];for(let i=0;i<7;i++)xs.push(84+i*92);
  const order=[3,1,5,0,6,2,4];   // the QB stands in the middle
  const cast=team.map((p,i)=>({p,i,x:xs[order.indexOf(i)],stone:false,trophy:null,cheer:Math.random()*6}));
  const byX=cast.slice().sort((a,b)=>a.x-b.x);
  const most=cast.slice().sort((a,b)=>cerLimbs(b.p)-cerLimbs(a.p))[0];
  const pool=CER_AWARDS.slice(1).sort(()=>Math.random()-0.5);
  const picks=[most,byX[1],byX[5]];
  const awards=[{at:2.5,who:most,med:0,name:CER_AWARDS[0],from:-1},
    {at:8.5,who:picks[1]===most?byX[0]:picks[1],med:1,name:CER_STONE,from:-1,stone:true},
    {at:14.5,who:picks[2]===most?byX[6]:picks[2],med:2,name:pool[0],from:1}];
  const capt=cast.find(c=>c.i===0);
  Object.assign(CR,{on:true,t:0,win,cast,awards,capt,conf:[],fw:[],cues:{},src:null,meds:MEDUSAS.map((m,k)=>({k,x:k===2?820:-100,vis:false,glasses:1,hiss:0}))});
  mode='ceremony';showOverlay(null);annStop&&annStop();djClear&&djClear();
  CR.src=playS('finale',0.95,1);playS('applause',0.7,1);playS('cheer_td',0.6,1,0.4,{pan:-0.5});playS('cheer_td',0.6,0.95,0.6,{pan:0.5});}
function cerLimbs(p){const L=p.limbs||{};return (L.la?1:0)+(L.ra?1:0)+(L.ll?1:0)+(L.rl?1:0)+(L.head?1:0);}
function cerSkip(){if(CR.on&&CR.t>0.6)cerEnd(true);}
function cerEnd(skip){if(!CR.on)return;CR.on=false;if(skip&&CR.src)try{CR.src.stop(AC.currentTime+0.08);}catch(e){}CR.src=null;gameOver();}
function cerCue(k,at,f){if(CR.t>=at&&!CR.cues[k]){CR.cues[k]=1;if(CR.t-at<0.5)f();}}
const cerEase=u=>u<=0?0:u>=1?1:u*u*(3-2*u);

function cerUpdate(dt){
  if(!CR.on)return;CR.t+=dt;const t=CR.t;
  for(const A of CR.awards){const k=t-A.at,M=CR.meds[A.med],tx=A.who.x+(A.from<0?-78:78),sx=A.from<0?-110:830;
    if(k<0||k>6.2)continue;M.vis=true;
    M.x=k<1.6?sx+(tx-sx)*cerEase(k/1.6):k<4.6?tx:tx+(sx-tx)*cerEase((k-4.6)/1.6);
    M.hiss=k>1.4&&k<2.4?1:0;
    if(A.stone){M.glasses=k<1.9?1:k<2.3?1-(k-1.9)/0.4:k<3.6?0:Math.min(1,(k-3.6)/0.4);}
    M.carry=k<2.0?'small':null;
    cerCue('give'+A.med,A.at+2.0,()=>{A.who.trophy=A.stone?'feet':'hold';playS('cheer_small',0.7,1,0,{pan:(A.who.x-W/2)/W});
      if(A.stone){A.who.stone=true;playS('bone',0.7,0.55);playS('ooh',0.7,1,0.3);}else playS('yeah',0.6,1,0.2,{pan:(A.who.x-W/2)/W});});
    if(k>6.1)M.vis=false;}
  // the big one: all three Medusas bring the championship trophy to the captain
  const k=t-21;if(k>=0){const C=CR.capt;
    CR.meds.forEach((M,i)=>{const tx=C.x+[-200,-100,125][i],sx=i===2?830:-110;M.vis=true;M.glasses=1;M.hiss=k>1.5&&k<2.5?1:0;
      M.x=k<1.8?sx+(tx-sx)*cerEase(k/1.8):tx;M.carry=i===1&&t<23?'big':null;});
    cerCue('champ',23,()=>{C.trophy='big';playS('cheer_td',0.9,1,0,{pan:-0.6});playS('cheer_td',0.9,0.96,0.2,{pan:0.6});playS('applause',0.8,1);});}
  cerCue('fw',26,()=>{for(let i=0;i<9;i++)CR.fw.push({at:26+i*0.55,done:false,x:120+Math.random()*480,y:150+Math.random()*220,i});});
  for(const f of CR.fw)if(!f.done&&t>=f.at){f.done=true;const C=FWCOL[f.i%FWCOL.length];playS('burst',0.35,1.4);
    for(let j=0;j<70;j++){const a=Math.random()*7,s=60+Math.random()*190;CR.conf.push({fw:1,x:f.x,y:f.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1.4+Math.random()*0.6,c:C[j%2],r:2.4});}}
  if(t>23&&t<31&&Math.random()<dt*40){const cols=['#ffd23a','#ff3b5c','#9dff57','#b06aff','#3ad6ff','#ffffff'];
    CR.conf.push({x:Math.random()*W,y:-10,vx:(Math.random()-0.5)*40,vy:120+Math.random()*90,life:6,c:cols[Math.floor(Math.random()*cols.length)],rot:Math.random()*6,vr:(Math.random()-0.5)*8});}
  for(const c of CR.conf){c.x+=c.vx*dt;c.y+=c.vy*dt;c.life-=dt;if(c.fw){c.vy+=60*dt;c.vx*=1-dt*1.2;}else c.rot+=c.vr*dt;}
  CR.conf=CR.conf.filter(c=>c.life>0&&c.y<760);
  if(t>=CER_LEN)cerEnd(false);}

function cerDraw(){
  const t=CR.t,S=760;   // the stage takes the top 760 px, the credits roll below
  // the hall: dark backdrop, a velvet curtain on each side, a sign over the stage
  let g=ctx.createLinearGradient(0,0,0,S);g.addColorStop(0,'#12081c');g.addColorStop(1,'#2a1035');ctx.fillStyle=g;ctx.fillRect(0,0,W,S);
  for(let i=0;i<14;i++){ctx.fillStyle=i%2?'rgba(255,215,90,0.05)':'rgba(255,255,255,0.025)';ctx.fillRect(i*W/14,0,W/14,S);}
  cerSpots(t,S);
  for(const s of [-1,1]){ctx.save();if(s>0){ctx.translate(W,0);ctx.scale(-1,1);}
    g=ctx.createLinearGradient(0,0,110,0);g.addColorStop(0,'#5a0712');g.addColorStop(1,'#9e1426');ctx.fillStyle=g;
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(118,0);ctx.quadraticCurveTo(70,300,96,S-120);ctx.lineTo(0,S-120);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.3)';ctx.lineWidth=3;for(let i=1;i<5;i++){ctx.beginPath();ctx.moveTo(i*22,0);ctx.quadraticCurveTo(i*14,300,i*18,S-120);ctx.stroke();}
    ctx.fillStyle='#e8b83a';ctx.beginPath();ctx.arc(84,330,9,0,7);ctx.fill();ctx.restore();}
  ctx.fillStyle='#7a0d1c';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(W,0);ctx.lineTo(W,58);for(let i=8;i>=0;i--){ctx.quadraticCurveTo(i*W/8+W/16,96,i*W/8,58);}ctx.closePath();ctx.fill();
  ctx.fillStyle='#e8b83a';ctx.fillRect(0,54,W,5);
  // the sign
  ctx.save();ctx.textAlign='center';ctx.font='64px Creepster, Bangers, Arial';ctx.fillStyle='#000';ctx.fillText('THE ROTTIES',W/2+3,173);
  ctx.fillStyle='#ffd23a';ctx.fillText('THE ROTTIES',W/2,170);
  ctx.font='20px Bangers, Arial';ctx.fillStyle='#f5e9ff';ctx.fillText('AWARDS FOR EXCELLENCE IN DECOMPOSITION',W/2,202);
  for(let i=0;i<18;i++){const on=Math.floor(t*6+i)%3===0;ctx.fillStyle=on?'#fff6c2':'#8a6d12';ctx.beginPath();ctx.arc(120+i*28,110,4,0,7);ctx.fill();ctx.beginPath();ctx.arc(120+i*28,220,4,0,7);ctx.fill();}
  ctx.restore();
  // the stage: a riser with gold trim and steps
  const top=560,front=690;g=ctx.createLinearGradient(0,top,0,front);g.addColorStop(0,'#3b2414');g.addColorStop(1,'#5e3a1e');ctx.fillStyle=g;
  ctx.beginPath();ctx.moveTo(60,top);ctx.lineTo(W-60,top);ctx.lineTo(W,front);ctx.lineTo(0,front);ctx.closePath();ctx.fill();
  ctx.fillStyle='#e8b83a';ctx.fillRect(0,front,W,8);ctx.fillStyle='#2a170b';ctx.fillRect(0,front+8,W,S-front-8);
  ctx.fillStyle='#e8b83a';for(let i=0;i<10;i++){ctx.fillRect(18+i*76,front+24,40,6);}
  // the caption for the award being given
  const A=CR.awards.find(a=>t>=a.at+0.3&&t<a.at+5.8);
  if(A)cerCaption(A.name[0],A.stone&&t>A.at+2.2?'PETRIFIED WITH GRATITUDE':A.who.p.name+' #'+A.who.p.num,t-A.at-0.3,A.stone&&t>A.at+2.2?A.name[1]:'');
  else if(t>=22.5)cerCaption('ROTBALL CHAMPIONS',TEAMS[CR.win].name.toUpperCase(),t-22.5,'');
  // the winners, back row first, then the Medusas in front
  const items=CR.cast.map(c=>({y:top+70,draw:()=>cerZombie(c,t)}));
  for(const M of CR.meds)if(M.vis)items.push({y:top+90,draw:()=>cerMedusa(M,t)});
  items.sort((a,b)=>a.y-b.y);for(const it of items)it.draw();
  // confetti and fireworks
  for(const c of CR.conf){ctx.save();ctx.translate(c.x,c.y);if(c.fw){ctx.globalAlpha=Math.max(0,Math.min(1,c.life));ctx.fillStyle=c.c;ctx.beginPath();ctx.arc(0,0,c.r,0,7);ctx.fill();}
    else{ctx.rotate(c.rot);ctx.fillStyle=c.c;ctx.fillRect(-4,-2,8,4);}ctx.restore();}
  cerCredits(t,S);
  if(t<0.6){ctx.fillStyle=`rgba(0,0,0,${1-t/0.6})`;ctx.fillRect(0,0,W,H);}
  if(t>CER_LEN-1.2){ctx.fillStyle=`rgba(0,0,0,${Math.min(1,(t-(CER_LEN-1.2))/1.2)})`;ctx.fillRect(0,0,W,H);}}

function cerSpots(t,S){ctx.save();ctx.globalCompositeOperation='lighter';
  for(let i=0;i<3;i++){const sx=[90,W/2,W-90][i],aim=W/2+Math.sin(t*0.7+i*2.1)*230;
    const g=ctx.createLinearGradient(sx,0,aim,S-150);g.addColorStop(0,'rgba(255,240,190,0.28)');g.addColorStop(1,'rgba(255,240,190,0.03)');ctx.fillStyle=g;
    ctx.beginPath();ctx.moveTo(sx-14,0);ctx.lineTo(sx+14,0);ctx.lineTo(aim+110,S-150);ctx.lineTo(aim-110,S-150);ctx.closePath();ctx.fill();}
  ctx.restore();}

function cerCaption(title,sub,k,joke){if(k<0)return;const a=Math.min(1,k/0.3);ctx.save();ctx.globalAlpha=a;ctx.textAlign='center';
  ctx.fillStyle='rgba(10,4,16,0.82)';ctx.strokeStyle='#e8b83a';ctx.lineWidth=3;const y=250,h=joke?112:86;ctx.beginPath();ctx.rect(40,y,W-80,h);ctx.fill();ctx.stroke();
  ctx.font=(title.length>26?'26':'32')+'px Bangers, Arial';ctx.fillStyle='#ffd23a';ctx.fillText(title,W/2,y+38);
  ctx.font='bold 22px Roboto Condensed, Arial';ctx.fillStyle='#ffffff';ctx.fillText(sub,W/2,y+70);
  if(joke){ctx.font='italic 18px Roboto Condensed, Arial';ctx.fillStyle='#c9b8e0';ctx.fillText(joke,W/2,y+98);}ctx.restore();}

function cerStoneStyle(S){const o={};for(const k in S){const v=S[k];if(typeof v!=='string'||v[0]!=='#'){o[k]=v;continue;}
  const n=parseInt(v.slice(1),16),l=Math.round(((n>>16&255)*0.3+(n>>8&255)*0.59+(n&255)*0.11)*0.55+70),h=Math.min(255,l).toString(16).padStart(2,'0');o[k]='#'+h+h+h;}return o;}
function cerZombie(c,t){const p=c.p,size=128,x=c.x,y=664,ph=t*7+c.cheer;
  const up=c.trophy==='hold'||c.trophy==='big',stone=c.stone;
  ctx.fillStyle='rgba(0,0,0,0.35)';ctx.beginPath();ctx.ellipse(x,y+4,size*0.32,size*0.08,0,0,7);ctx.fill();
  const S=stone?cerStoneStyle(STYLE_OF(CR.win)):STYLE_OF(CR.win),bounce=stone?0:Math.abs(Math.sin(ph*0.5))*(up?7:4);
  const arm=stone?[0.5,0.3]:up?[2.8,0.1]:[2.2+Math.sin(ph)*0.5,0.5];
  drawZombie(ctx,x,y,size,{team:S,body:BODY_OF[c.i]||'line',view:'front',flip:false,phase:0,speed:0,limbs:p.limbs,pose:'dance',num:p.num,t:stone?0:t,seed:c.i*7,ball:false,
    dj:{sq:stone?0:0.1+0.1*Math.abs(Math.sin(ph*0.5)),air:bounce,la:arm,ra:stone?[0.5,0.3]:up?arm:[2.2+Math.sin(ph+1.5)*0.5,0.5],tilt:stone?0:Math.sin(ph*0.25)*0.05}});
  if(stone){ctx.save();ctx.strokeStyle='rgba(40,40,40,0.6)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-8,y-70);ctx.lineTo(x+2,y-55);ctx.lineTo(x-4,y-40);ctx.moveTo(x+12,y-30);ctx.lineTo(x+4,y-18);ctx.stroke();ctx.restore();}
  if(c.trophy==='feet')cerTrophy(x+28,y+2,0.55,false);
  else if(c.trophy==='hold')cerTrophy(x,y-size*0.8-bounce,0.7,false);
  else if(c.trophy==='big')cerTrophy(x,y-size*0.8-bounce,1.25,true);}

function cerTrophy(x,y,s,big){ctx.save();ctx.translate(x,y);ctx.scale(s,s);   // the Golden Brain: a gold cup with a brain on top; y is the bottom of the base
  const gold='#e8b83a',dk='#9a6d12',hi='#fff2b0';
  ctx.fillStyle=dk;ctx.fillRect(-26,-14,52,14);ctx.fillStyle=gold;ctx.fillRect(-22,-26,44,12);
  ctx.fillRect(-6,-46,12,20);ctx.beginPath();ctx.moveTo(-34,-96);ctx.lineTo(34,-96);ctx.quadraticCurveTo(30,-50,0,-46);ctx.quadraticCurveTo(-30,-50,-34,-96);ctx.closePath();ctx.fill();
  ctx.strokeStyle=gold;ctx.lineWidth=6;for(const s2 of [-1,1]){ctx.beginPath();ctx.ellipse(s2*36,-80,10,14,0,0,7);ctx.stroke();}
  ctx.fillStyle=hi;ctx.fillRect(-24,-90,6,30);
  if(big){ctx.fillStyle='#2a170b';ctx.fillRect(-20,-12,40,8);ctx.font='bold 7px Arial';ctx.fillStyle=hi;ctx.textAlign='center';ctx.fillText('CHAMPS',0,-6);}
  ctx.fillStyle='#f4a6b4';ctx.strokeStyle='#b0485a';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-106,30,18,0,0,7);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,-122);ctx.lineTo(0,-90);ctx.moveTo(-20,-112);ctx.quadraticCurveTo(-12,-104,-20,-96);ctx.moveTo(14,-116);ctx.quadraticCurveTo(22,-106,12,-96);ctx.stroke();
  ctx.restore();
  if(big){ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(x,y-80*s,4,x,y-80*s,90*s);g.addColorStop(0,'rgba(255,230,140,0.45)');g.addColorStop(1,'rgba(255,230,140,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y-80*s,90*s,0,7);ctx.fill();ctx.restore();}}

function cerMedusa(M,t){   // a glamorous gorgon: evening gown, sash, sunglasses, and a head of snakes that react to everything
  const D=MEDUSAS[M.k],x=M.x,y=700,sway=Math.sin(t*2.2+M.k)*3,s=1;
  ctx.save();ctx.translate(x+sway,y);
  ctx.fillStyle='rgba(0,0,0,0.35)';ctx.beginPath();ctx.ellipse(0,0,40,9,0,0,7);ctx.fill();
  // the gown: fitted, then a mermaid flare to the floor
  let g=ctx.createLinearGradient(-40,0,40,0);g.addColorStop(0,D.gownDk);g.addColorStop(0.5,D.gown);g.addColorStop(1,D.gownDk);ctx.fillStyle=g;
  ctx.beginPath();ctx.moveTo(-22,-150);ctx.lineTo(22,-150);ctx.quadraticCurveTo(26,-110,16,-60);ctx.quadraticCurveTo(30,-20,44,0);ctx.lineTo(-44,0);ctx.quadraticCurveTo(-30,-20,-16,-60);ctx.quadraticCurveTo(-26,-110,-22,-150);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.8)';for(let i=0;i<9;i++){const a=(i*2.399+M.k)%6.28,r=(i*13)%30;if(Math.sin(t*5+i*1.7)>0.3){ctx.beginPath();ctx.arc(Math.cos(a)*r*0.5,-30-r*3.5+Math.sin(a)*6,1.6,0,7);ctx.fill();}}
  // shoulders, arms, neck (skin)
  ctx.fillStyle=D.skin;ctx.beginPath();ctx.ellipse(0,-156,24,10,0,0,7);ctx.fill();ctx.fillRect(-7,-176,14,20);
  ctx.strokeStyle=D.skin;ctx.lineCap='round';ctx.lineWidth=8;
  const give=M.give||0;
  ctx.beginPath();ctx.moveTo(-22,-152);ctx.quadraticCurveTo(-34,-120,-22,-96);ctx.stroke();   // the far arm rests on her hip
  const hy=M.carry?-128:-110+Math.sin(t*3+M.k)*4;   // the near arm: holds the trophy up while she brings it, then waves
  ctx.beginPath();ctx.moveTo(22,-152);ctx.quadraticCurveTo(36,-140,30,hy);ctx.stroke();ctx.lineCap='butt';
  // the bodice and the sash
  ctx.fillStyle=D.gownDk;ctx.beginPath();ctx.moveTo(-20,-152);ctx.quadraticCurveTo(0,-140,20,-152);ctx.lineTo(18,-120);ctx.lineTo(-18,-120);ctx.closePath();ctx.fill();
  ctx.save();ctx.translate(0,-120);ctx.rotate(-0.55);ctx.fillStyle='#fff7e0';ctx.fillRect(-46,-8,92,15);ctx.strokeStyle='#e8b83a';ctx.lineWidth=1.5;ctx.strokeRect(-46,-8,92,15);
  ctx.fillStyle='#7a0d1c';ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.fillText(D.sash,0,3);ctx.restore();
  // the head
  ctx.fillStyle=D.skin;ctx.beginPath();ctx.ellipse(0,-196,17,21,0,0,7);ctx.fill();
  cerSnakes(M,t,D);
  ctx.fillStyle=D.lips;ctx.beginPath();ctx.ellipse(0,-184,6,3,0,0,7);ctx.fill();
  ctx.fillStyle='#1f2a1c';ctx.beginPath();ctx.moveTo(-6,-197);ctx.lineTo(6,-197);ctx.lineTo(0,-189);ctx.closePath();ctx.globalAlpha=0.25;ctx.fill();ctx.globalAlpha=1;
  // the eyes: hidden behind sunglasses, unless she lifts them
  const gl=M.glasses;
  if(gl<0.9){ctx.fillStyle='#fffbe0';for(const sx of [-7,7]){ctx.beginPath();ctx.ellipse(sx,-201,4.5,3,0,0,7);ctx.fill();}
    ctx.fillStyle='#ff2b2b';for(const sx of [-7,7]){ctx.beginPath();ctx.arc(sx,-201,2,0,7);ctx.fill();}
    if(gl<0.3){ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(255,60,60,0.35)';ctx.beginPath();ctx.arc(-7,-201,8,0,7);ctx.arc(7,-201,8,0,7);ctx.fill();ctx.restore();}
    ctx.strokeStyle='#111';ctx.lineWidth=1.2;for(const sx of [-7,7]){ctx.beginPath();ctx.moveTo(sx-5,-204);ctx.lineTo(sx-6,-207);ctx.moveTo(sx,-204.5);ctx.lineTo(sx,-208);ctx.moveTo(sx+5,-204);ctx.lineTo(sx+6,-207);ctx.stroke();}}
  const gy=-201-(1-gl)*14;   // lifted sunglasses ride up onto her forehead
  ctx.fillStyle='#0b0b0b';for(const sx of [-7,7]){ctx.beginPath();ctx.ellipse(sx,gy,7,5,0,0,7);ctx.fill();}
  ctx.strokeStyle='#e8b83a';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-14,gy);ctx.lineTo(-17,gy-1);ctx.moveTo(14,gy);ctx.lineTo(17,gy-1);ctx.moveTo(-1,gy-1);ctx.lineTo(1,gy-1);ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,0.35)';ctx.beginPath();ctx.ellipse(-9,gy-2,2,1.2,0,0,7);ctx.fill();
  if(M.carry)cerTrophy(30,hy+6,M.carry==='big'?0.95:0.5,M.carry==='big');
  ctx.restore();}

function cerSnakes(M,t,D){   // eight snakes; they hiss toward the winner at the hand-off and recoil at the stone gag
  const hiss=M.hiss,shock=M.glasses<0.3?1:0;
  for(let i=0;i<8;i++){const base=-2.7+i*0.77/1.4,bx=Math.cos(base)*14,by=-204+Math.sin(base)*16;
    const len=(30+(i%3)*6)*(hiss?1.25:1),w=t*(hiss?6:3.2)+i*1.3+M.k;let ang=base+Math.sin(w)*(hiss?0.08:0.25);   // hissing: they stretch out, stiff and tongues out
    if(shock)ang+=Math.sin(t*40+i)*0.15;   // the stone gag: they recoil and shiver
    const pts=[];for(let j=0;j<=8;j++){const u=j/8,a=ang+Math.sin(w*1.6+u*5)*0.35*(1-shock*0.5);
      const r=u*len*(shock?0.75:1);pts.push([bx+Math.cos(a)*r+Math.sin(w+u*6)*3*u,by+Math.sin(a)*r*0.9]);}
    ctx.strokeStyle='#2f6d2a';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(const q of pts)ctx.lineTo(q[0],q[1]);ctx.stroke();
    ctx.strokeStyle='#5fa84d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(const q of pts)ctx.lineTo(q[0],q[1]);ctx.stroke();ctx.lineCap='butt';
    const [hx,hy]=pts[8],[px,py]=pts[7],ha=Math.atan2(hy-py,hx-px);
    ctx.save();ctx.translate(hx,hy);ctx.rotate(ha);ctx.fillStyle='#3f8a36';ctx.beginPath();ctx.ellipse(2,0,6,4,0,0,7);ctx.fill();
    ctx.fillStyle='#ffe14a';ctx.beginPath();ctx.arc(4,-2,1.3,0,7);ctx.fill();
    if(hiss||Math.sin(t*6+i*2.3)>0.85){ctx.strokeStyle='#d81b30';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(14,0);ctx.lineTo(17,-2);ctx.moveTo(14,0);ctx.lineTo(17,2);ctx.stroke();}
    ctx.restore();}}

function cerCredits(t,S){
  ctx.save();ctx.fillStyle='#07040b';ctx.fillRect(0,S,W,H-S);ctx.beginPath();ctx.rect(0,S,W,H-S-36);ctx.clip();
  const lh={h:52,s:30,g:22,r:30,n:28},total=CER_CREDITS.reduce((a,c)=>a+lh[c[0]],0),speed=(total+(H-S))/(CER_LEN-2.2);
  let y=H-40-t*speed+lh.h;ctx.textAlign='center';
  for(const c of CER_CREDITS){const h=lh[c[0]];
    if(y>S-60&&y<H+40){
      if(c[0]==='h'){ctx.font='40px Creepster, Bangers, Arial';ctx.fillStyle='#ffd23a';ctx.fillText(c[1],W/2,y);}
      else if(c[0]==='s'){ctx.font='20px Bangers, Arial';ctx.fillStyle='#c9b8e0';ctx.fillText(c[1],W/2,y);}
      else if(c[0]==='r'){ctx.font='18px Roboto Condensed, Arial';ctx.textAlign='right';ctx.fillStyle='#b9a7cc';ctx.fillText(c[1],W/2-14,y);
        ctx.textAlign='left';ctx.font='bold 19px Roboto Condensed, Arial';ctx.fillStyle='#ffffff';ctx.fillText(c[2],W/2+14,y);ctx.textAlign='center';}
      else if(c[0]==='n'){ctx.font='italic 19px Roboto Condensed, Arial';ctx.fillStyle='#e8dcff';ctx.fillText(c[1],W/2,y);}}
    y+=h;}
  ctx.restore();
  let g=ctx.createLinearGradient(0,S,0,S+70);g.addColorStop(0,'rgba(7,4,11,1)');g.addColorStop(1,'rgba(7,4,11,0)');ctx.fillStyle=g;ctx.fillRect(0,S,W,70);
  g=ctx.createLinearGradient(0,H-110,0,H-36);g.addColorStop(0,'rgba(7,4,11,0)');g.addColorStop(1,'rgba(7,4,11,1)');ctx.fillStyle=g;ctx.fillRect(0,H-110,W,74);}
