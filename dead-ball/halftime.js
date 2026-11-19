// ===== Rotball halftime show =====
// Each halftime plays ONE song, picked at random from halftime/songs.json (never the song played last time).
// The Marching Rot (a zombie marching band) and the Cadaver Cheer Squad perform on a set: a giant tombstone,
// two pennant poles and two coffin cannons. Zombie voices groan the lyrics; subtitles show what they are singing.
// Fireworks close the song unless it was skipped. Then the band and squad leave the field, bats carry the set away,
// the players run back on, and the second half starts once every halftime piece is gone.
// A tap (or any key) skips the song; a second tap skips the exit too.
// Runs after index.html's main script and uses its globals (ctx, W, H, HUD, G, time, AC, master, settings, ...).

const HT={data:null,song:null,raw:null,buf:null,dec:false};
fetch('halftime/songs.json').then(r=>r.ok?r.json():null).then(j=>{if(j){HT.data=j;htPick();}}).catch(()=>{});
function htPick(){if(!HT.data||HT.song)return;const L=HT.data.songs,last=store.get('rotball_lastsong',null),pool=L.filter(s=>s.id!==last);
  const P=pool.length?pool:L;HT.song=P[Math.floor(Math.random()*P.length)];HT.raw=null;HT.buf=null;HT.dec=false;const id=HT.song.id;
  fetch('halftime/'+id+'.mp3').then(r=>r.ok?r.arrayBuffer():null).then(b=>{if(b&&HT.song&&HT.song.id===id){HT.raw=b;htDecode();}}).catch(()=>{});}
function htDecode(){if(!AC||!HT.raw||HT.dec)return;HT.dec=true;const id=HT.song.id;
  try{AC.decodeAudioData(HT.raw,b=>{if(HT.song&&HT.song.id===id){HT.buf=b;if(HS.on&&HS.ph==='show'&&!HS.src)hsAudioStart();}},()=>{});}catch(e){}}
function htTimes(s){const D=HT.data,bt=60/s.bpm,a0=s.intro,brk=a0+s.A.len,b0=brk+D.break.len,bEnd=b0+s.B.len,end=bEnd+D.fermata;
  const lastB=Math.max(...s.B.notes.map(n=>n[0]));
  return {bt,a0:a0*bt,brk:brk*bt,b0:b0*bt,bEnd:bEnd*bt,end:end*bt,fw0:end*bt+0.3,fwEnd:end*bt+0.3+D.fwLen,final:(b0+lastB)*bt,
    pyr:(b0+Math.max(0,s.B.len-12))*bt,a0b:a0,brkb:brk,b0b:b0};}
// subtitles: lines of words; a word lights up when its first syllable is sung
function htLines(s,T){const out=[];let line=null,word=null;const bt=T.bt;
  const push=(t,txt,len)=>{let join=false,end=false;txt=txt.replace(/\|$/,()=>{end=true;return '';}).replace(/~$/,()=>{join=true;return '';});
    if(!line){line={t,words:[],end:t};out.push(line);}
    if(word)word.text+=txt;else{word={t,text:txt};line.words.push(word);}
    line.end=Math.max(line.end,t+len);if(!join)word=null;if(end){line=null;word=null;}};
  for(const n of s.A.notes)push((T.a0b+n[0])*bt,n[3],n[1]*bt);
  for(const c of HT.data.break.caps)push((T.brkb+c[0])*bt,c[3],c[1]*bt);
  for(const n of s.B.notes)push((T.b0b+n[0])*bt,n[3],n[1]*bt);
  return out;}

// ----- show state -----
const HS={on:false,t:0,ph:'show',ex:0,s:null,T:null,lines:[],band:[],cheer:[],set:[],fx:[],rk:[],conf:[],bats:[],plyr:[],cues:{},src:null,gain:null,skipped:false,signs:[]};
const HS_EXIT=6.2,HS_CARD=2.8;   // the HALFTIME title card holds this long before the band marches on
const ease=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
function hsStart(){
  const s=HT.data&&HT.song?HT.song:null;
  Object.assign(HS,{on:true,card:HS_CARD,t:0,ex:0,s,T:s?htTimes(s):null,ph:s?'show':'exit',fx:[],rk:[],conf:[],bats:[],cues:{},src:null,skipped:false});
  HS.lines=s?htLines(s,HS.T):[];
  HS.band=[];for(let r=0;r<3;r++)for(let c=0;c<5;c++)HS.band.push({r,c,inst:r===0?'tuba':r===1?(c%2?'bone':'tpt'):(c===2?'bass':'snare'),
    team:(r+c)%2,limbs:{la:1,ra:1,ll:1,rl:1,head:1},seed:r*5+c,hx:360+(c-2)*92,hy:[792,882,972][r]});
  HS.cheer=[0,1,2,3,4,5].map(i=>({i,team:i%2,num:[11,21,31,41,51,61][i],routine:null,danceT:0,limbs:{la:1,ra:1,ll:1,rl:1,head:1},
    hx:360+(i-2.5)*74,hy:628,side:i<3?-1:1}));
  const r=makeRoutine(true);for(const m of HS.cheer)m.routine=r;
  HS.set=[{k:'stone',x:360,y:452,lift:0,rot:0},{k:'pole',x:136,y:600,team:0,lift:0,rot:0},{k:'pole',x:584,y:600,team:1,lift:0,rot:0},
    {k:'coffin',x:128,y:700,lift:0,rot:0},{k:'coffin',x:592,y:700,lift:0,rot:0}];
  const SG=['BRAINS!','ROT ON!','EAT LOCAL','HI MOM','RIP','GO GHOULS','#1 FAN (DEAD)','NO PULSE?','MORE BRAINS'];
  HS.signs=[];for(let i=0;i<12;i++)HS.signs.push({side:i%2,row:2+Math.floor(Math.random()*26),col:Math.floor(Math.random()*3),txt:SG[i%SG.length],ph:Math.random()*6});
  HS.gags=s?hsPickGags(HS.T):[];HS.junk=[];HS.goo=[];
  if(s)hsAudioStart();else hsExitStart();
}
// ===== band gags: one or two per show, at random, while the song keeps going =====
//  arm   - a horn player's arm falls off; the horn droops and they stare at the stump, then jam the arm back on
//  fight - two band members drop their instruments and brawl in a dust cloud; the rest keep playing
//  throw - the crowd pelts the band with junk; the band ducks and holds their instruments up as shields
function hsPickGags(T){let kinds=['arm','fight','throw'].sort(()=>Math.random()-0.5),n=Math.random()<0.55?2:1;
  try{const q=new URLSearchParams(location.search).get('gags');if(q){kinds=q.split(',').filter(k=>['arm','fight','throw'].includes(k));n=kinds.length;}}catch(e){}
  const win=[[T.a0+2*T.bt,T.brk-5.8],[T.b0+2*T.bt,Math.min(T.pyr,T.final)-5.8]].filter(w=>w[1]>w[0]+0.5);
  if(Math.random()<0.5)win.reverse();const out=[];
  for(let i=0;i<Math.min(n,win.length);i++){const w=win[i],k=kinds[i],at=w[0]+Math.random()*(w[1]-w[0]),c=[0,1,3,4][Math.floor(Math.random()*4)];
    out.push({k,at,len:k==='throw'?4.6:k==='fight'?4.2:5.2,r:k==='arm'?1:(Math.random()<0.5?1:2),c,c2:c+(c<2?1:-1)});}
  return out;}
function hsGag(k){const t=HS.t;return (HS.gags||[]).find(g=>g.k===k&&t>=g.at&&t<g.at+g.len)||null;}
function hsAudioStart(){if(HS.card>0||!HT.buf||!AC||!sfx.ok()||HS.src||HS.ph!=='show'||!HS.T||HS.t>HS.T.fwEnd-0.5)return;htDecode();
  try{const s=AC.createBufferSource(),g=AC.createGain();s.buffer=HT.buf;g.gain.value=0.7;s.connect(g);g.connect(master);s.start(0,Math.max(0,HS.t));HS.src=s;HS.gain=g;}catch(e){}}
function hsAudioStop(){if(HS.src){try{HS.gain.gain.setTargetAtTime(0,AC.currentTime,0.06);HS.src.stop(AC.currentTime+0.3);}catch(e){}HS.src=null;}}
function hsCue(k,at,f){if(HS.t>=at&&!HS.cues[k]){HS.cues[k]=1;if(HS.t-at<0.5)f();}}
function hsSay(g,v,pan,d){playS(g,v,0.95+Math.random()*0.1,d||0,{pan});}
function hsSkip(){if(!HS.on)return;if(HS.card>0){HS.card=Math.min(HS.card,0.25);return;}if(HS.ph==='show'){HS.skipped=true;hsAudioStop();hsExitStart();}else if(HS.ex>0.4)hsDone();}
function hsExitStart(){HS.ph='exit';HS.ex=0;HS.rk=[];
  if(settings.ann!==false&&!ANN.cur)setTimeout(()=>{if(HS.on&&HS.ph==='exit')playS('halfq',1.15);},700);
  // bats: a swarm, some assigned to each set piece
  const spots={stone:[[-150,-260],[-95,-292],[-40,-306],[15,-306],[70,-292],[125,-262],[-120,-150],[120,-150]],pole:[[-26,-362],[26,-362],[0,-392]],coffin:[[-14,-82],[14,-82],[0,-96]]};
  HS.bats=[];HS.set.forEach((p,pi)=>{for(const [ox,oy] of spots[p.k])HS.bats.push({pi,ox,oy,x:Math.random()*W,y:HUD-60-Math.random()*240,ph:Math.random()*6,d:0.3+Math.random()*0.7,s:22+Math.random()*8});});
  for(let i=0;i<18;i++)HS.bats.push({pi:-1,ox:0,oy:0,x:Math.random()*W,y:HUD-40-Math.random()*300,ph:Math.random()*6,d:Math.random()*1.2,s:14+Math.random()*10,wx:Math.random()*W,wy:HUD+80+Math.random()*500});
  HS.plyr=[];for(const t of [0,1])for(let i=0;i<7;i++)HS.plyr.push({team:t,idx:i,d:2.4+i*0.13+Math.random()*0.2,tx:t?400+(i%4)*50+(i>3?25:0):320-(i%4)*50-(i>3?25:0),ty:640+(i>3?150:0)+(i%2)*40,ph:Math.random()*6});
  for(const b of HS.band)b.exitD=Math.random()*0.5;for(const c of HS.cheer){c.exitD=Math.random()*0.3;c.ex0=null;}}
function hsDone(){if(!HS.on)return;hsAudioStop();HS.on=false;if(HS.s)store.set('rotball_lastsong',HS.s.id);HT.song=null;htPick();secondHalf();}

// ----- update -----
function hsUpdate(dt){
  if(!HS.on)return;if(HT.raw&&AC&&!HT.dec)htDecode();
  if(HS.card>0){HS.card-=dt;if(HS.card<=0){HS.card=0;if(HS.ph==='show'&&!HS.src&&HT.buf)hsAudioStart();}return;}
  if(HS.ph==='show'){HS.t+=dt;const T=HS.T,t=HS.t;
    if(!HS.src&&HT.buf)hsAudioStart();
    hsCue('in',0.2,()=>{hsSay('cheer_small',0.5,-0.6);hsSay('cheer_small',0.5,0.6,0.2);});
    hsCue('a0',T.a0,()=>{hsSay('cheer_td',0.4,-0.7);hsSay('cheer_td',0.4,0.7,0.12);});
    hsCue('brains',T.brk+4*T.bt,()=>{hsSay('chant_brains',0.5,-0.6);hsSay('chant_brains',0.5,0.6,0.15);});
    hsCue('burp',T.brk,()=>hsSay('eww',0.45,0,0.5));
    hsCue('b0',T.b0,()=>{hsSay('yeah',0.55,-0.5);hsSay('yeah',0.55,0.5,0.2);});
    hsCue('fin',T.final,()=>{hsSay('cheer_td',0.75,-0.5);hsSay('cheer_td',0.75,0.5,0.1);});
    hsCue('head',T.final+0.6,()=>hsSay('ooh',0.6,0));
    hsCue('fwo',T.fw0+0.6,()=>{hsSay('ooh',0.5,-0.4);hsSay('applause',0.6,0,0.4);});
    hsCue('fwe',T.fwEnd-1.2,()=>{hsSay('cheer_td',0.6,-0.6);hsSay('cheer_td',0.6,0.6,0.15);});
    for(let i=0;i<HT.data.fw.length;i++){const at=T.fw0+HT.data.fw[i];hsCue('rk'+i,at-0.7,()=>hsRocket(i,at));}
    if(t>=T.final)for(let k=0;k<3;k++)if(t<T.final+2.4)HS.conf.push({x:110+Math.random()*500,y:HUD-10,vx:(Math.random()-0.5)*60,vy:60+Math.random()*90,r:Math.random()*6,vr:(Math.random()-0.5)*9,c:['#ffe14a','#9dff57','#ff6ad5','#6ad5ff','#ff9a3a','#ffffff'][Math.floor(Math.random()*6)]});
    for(const g of HS.gags||[]){
      if(g.k==='arm'){hsCue('ga0',g.at,()=>{hsSay('bone',0.6,0);hsSay('ooh',0.5,0,0.25);});hsCue('ga1',g.at+1.4,()=>hsSay('laughc',0.5,0));hsCue('ga2',g.at+g.len-0.5,()=>hsSay('splat',0.5,0));}
      if(g.k==='fight'){hsCue('gf0',g.at,()=>{hsSay('snarl',0.6,0);hsSay('ooh',0.5,0,0.2);});for(let i=0;i<6;i++)hsCue('gf'+(i+1),g.at+0.5+i*0.55,()=>hsSay('hit',0.45,(Math.random()-0.5)*0.6));hsCue('gf9',g.at+1.5,()=>hsSay('cheer_small',0.4,0));}
      if(g.k==='throw'){hsCue('gt0',g.at-0.2,()=>{hsSay('boo',0.6,-0.5);hsSay('boo',0.55,0.5,0.15);});
        if(t>=g.at&&t<g.at+g.len-1.2&&Math.random()<dt*3.2)hsThrow();}}
    for(const j of HS.junk){j.t+=dt;if(!j.hit&&j.t>=j.T){j.hit=true;j.vx*=-0.25;j.vy=-180-Math.random()*120;j.vr*=-1.5;hsSay(j.shield?'bone':'splat',0.25,(j.tx-360)/400);
        if(j.shield)for(let i=0;i<6;i++)HS.fx.push({x:j.tx,y:j.ty,vx:(Math.random()-0.5)*260,vy:-Math.random()*200,l:0.35,L:0.35,c:'#fff3b0',g:200,drag:0.9});
        else HS.goo.push({x:j.tx,y:j.ty+30,r:10+Math.random()*10,c:j.goo,l:4});}
      if(j.hit){j.x+=j.vx*dt;j.vy+=900*dt;j.y+=j.vy*dt;j.rot+=j.vr*dt;}}
    HS.junk=HS.junk.filter(j=>!(j.hit&&j.y>H+40));for(const g2 of HS.goo)g2.l-=dt;HS.goo=HS.goo.filter(g2=>g2.l>0);
    if(t>=T.fwEnd)hsExitStart();
    // crowd energy follows the show
    const hype=t<T.a0?0.35+0.3*t/T.a0:t<T.final?0.6+0.25*Math.sin(t*0.7)**2:1;CROWD.hype[0]=Math.max(CROWD.hype[0],hype*0.8);CROWD.hype[1]=Math.max(CROWD.hype[1],hype*0.8);
    for(const m of HS.cheer){m.danceT+=dt;if(m.danceT>3.8){m.danceT=0;}}
    if(HS.cheer[0].danceT===0){const r=makeRoutine(true);for(const m of HS.cheer)m.routine=r;}
  }else{HS.ex+=dt;
    if(HS.ex>2.5&&!HS.cues.back){HS.cues.back=1;hsSay('cheer_td',0.55,-0.5);hsSay('yeah',0.6,0.5,0.3);}
    if(HS.ex>=HS_EXIT)hsDone();}
  // particles
  for(const r of HS.rk){r.t+=dt;if(!r.burst&&r.t>=0.7){r.burst=true;hsBurst(r);}}
  HS.rk=HS.rk.filter(r=>!r.burst);
  for(const p of HS.fx){p.vx*=Math.pow(p.drag||0.9,dt*4);p.vy=p.vy*Math.pow(p.drag||0.9,dt*4)+(p.g||70)*dt;p.px=p.x;p.py=p.y;p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt;}
  HS.fx=HS.fx.filter(p=>p.l>0);
  for(const c of HS.conf){c.x+=c.vx*dt+Math.sin(time*3+c.r)*0.6;c.y+=c.vy*dt;c.r+=c.vr*dt;}HS.conf=HS.conf.filter(c=>c.y<H+20);
}
const FWCOL=[['#ff3b5c','#ffd0d8'],['#9dff57','#eaffd8'],['#ffd23a','#fff3c4'],['#b06aff','#efdcff'],['#3ad6ff','#d8f8ff'],['#ff8a2a','#ffe0c8']];
function hsRocket(i,at){const left=i%2===0,from=HS.set[left?3:4];const tx=170+Math.random()*380,ty=HUD+90+Math.random()*230;
  HS.rk.push({i,x0:from.x,y0:from.y-96,tx,ty,t:0,burst:false,big:i===HT.data.fw.length-1,shape:i%4===3?'skull':i%3===1?'ring':'ball'});}
function hsBurst(r){const C=FWCOL[r.i%FWCOL.length],n=r.big?150:r.shape==='skull'?110:80,sp=r.big?260:190;
  if(r.shape==='skull'){             // a grinning skull made of sparks
    const pts=[];for(let k=0;k<44;k++){const a=k/44*Math.PI*2;pts.push([Math.cos(a),Math.sin(a)*0.92-0.08]);}
    for(let k=0;k<14;k++){const a=k/14*Math.PI*2;pts.push([-0.38+Math.cos(a)*0.2,-0.12+Math.sin(a)*0.2],[0.38+Math.cos(a)*0.2,-0.12+Math.sin(a)*0.2]);}
    for(let k=0;k<5;k++)pts.push([-0.3+k*0.15,0.5]);pts.push([0,0.16],[-0.06,0.26],[0.06,0.26]);
    for(const [ux,uy] of pts)HS.fx.push({x:r.tx,y:r.ty,vx:ux*sp*1.05,vy:uy*sp*1.05,l:1.7,L:1.7,c:C[0],c2:C[1],g:18,drag:0.55,s:3.2});}
  else for(let k=0;k<n;k++){const a=Math.random()*Math.PI*2,v=r.shape==='ring'?sp:sp*(0.35+Math.random()*0.65);
    HS.fx.push({x:r.tx,y:r.ty,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:r.big?2.4:1.5+Math.random()*0.4,L:r.big?2.4:1.8,c:r.big?'#ffd23a':C[0],c2:C[1],g:r.big?55:75,drag:r.big?0.7:0.6,s:r.big?3.4:2.8});}
  HS.fx.push({flash:true,r:r.big?70:46,x:r.tx,y:r.ty,vx:0,vy:0,l:0.25,L:0.25,g:0,c:C[1]});}

// ----- drawing -----
function hsDraw(){
  const t=HS.t,T=HS.T,ex=HS.ph==='exit'?HS.ex:0,bt=T?T.bt:0.5,beat=T?Math.max(0,t-T.a0)/bt:t*2;
  const hype=HS.ph==='exit'?0.7:!T?0.5:t<T.a0?0.4:t>=T.final?1.2:0.75;
  // night sky glow behind the set
  ctx.save();const sky=ctx.createLinearGradient(0,HUD,0,HUD+520);sky.addColorStop(0,'rgba(10,4,24,0.92)');sky.addColorStop(1,'rgba(10,4,24,0)');ctx.fillStyle=sky;ctx.fillRect(0,HUD,W,520);ctx.restore();
  hsSpots(t,hype);
  hsStands(hype,t);
  // set pieces (they lift away with the bats)
  for(const p of HS.set)hsPiece(p,t);
  // fireworks behind the performers
  hsDrawFx();
  // cheer squad, then the band in front
  hsDrawCheer(t,ex,beat);
  hsDrawBand(t,ex,beat);
  if(HS.ph==='show')hsDrawJunk();
  if(HS.ph==='exit')hsDrawPlayers(ex);
  if(HS.ph==='exit')hsDrawBats(ex);
  hsDrawConf();
  if(HS.ph==='show'&&T&&settings.subs!==false)hsCaption(t);
  // skip hint
  ctx.save();ctx.font='28px Bangers, Arial';ctx.textAlign='right';ctx.fillStyle='rgba(255,255,255,0.75)';
  if(!(HS.card>0))ctx.fillText(HS.ph==='show'?'TAP TO SKIP':'TAP TO START THE 2ND HALF',W-16,H-14);ctx.restore();
  if(HS.card>0)hsDrawCard();
}
// the HALFTIME title card: slams in, shows the score and the act, then fades as the band marches on
function hsDrawCard(){
  const k=HS_CARD-HS.card,inn=ease(Math.min(1,k/0.35)),out=HS.card<0.45?HS.card/0.45:1,a=Math.min(inn,out);
  ctx.save();ctx.globalAlpha=a;ctx.fillStyle='rgba(6,4,10,0.86)';ctx.fillRect(0,HUD,W,H-HUD);
  const cy=HUD+(H-HUD)*0.4,sc=k<0.35?2.2-1.2*inn:1+0.03*Math.sin(k*9);
  ctx.save();ctx.translate(W/2,cy);ctx.scale(sc,sc);ctx.rotate(-0.04);ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='120px Creepster, Bangers, Arial';ctx.lineWidth=12;ctx.strokeStyle='#120a04';ctx.strokeText('HALFTIME',0,0);
  const gr=ctx.createLinearGradient(0,-60,0,60);gr.addColorStop(0,'#d6ff8a');gr.addColorStop(1,'#5fbf2a');ctx.fillStyle=gr;ctx.fillText('HALFTIME',0,0);
  ctx.fillStyle='#5fbf2a';for(let i=0;i<7;i++){const dx=-230+i*76+((i*37)%19),len=18+((i*53)%40)*(0.4+0.6*Math.min(1,k/1.5));
    ctx.beginPath();ctx.moveTo(dx-5,44);ctx.lineTo(dx+5,44);ctx.lineTo(dx+3,44+len);ctx.arc(dx,44+len,4,0,Math.PI);ctx.closePath();ctx.fill();}
  ctx.restore();
  ctx.textAlign='center';ctx.textBaseline='middle';
  if(typeof G!=='undefined'&&G&&G.score){ctx.font='36px Bangers, Arial';const s0=`${TEAMS[0].name.toUpperCase()} ${G.score[0]}`,s1=`${G.score[1]} ${TEAMS[1].name.toUpperCase()}`,gap=40;
    const w0=ctx.measureText(s0).width,w1=ctx.measureText(s1).width,x0=W/2-(w0+w1+gap)/2;
    ctx.lineWidth=6;ctx.strokeStyle='#120a04';ctx.textAlign='left';
    ctx.strokeText(s0,x0,cy+130);ctx.fillStyle=TEAMS[0].trim||'#ffe14a';ctx.fillText(s0,x0,cy+130);
    ctx.strokeText(s1,x0+w0+gap,cy+130);ctx.fillStyle='#ff9a6a';ctx.fillText(s1,x0+w0+gap,cy+130);
    ctx.fillStyle='rgba(255,255,255,0.7)';ctx.textAlign='center';ctx.fillText('-',x0+w0+gap/2,cy+130);}
  ctx.font='30px Bangers, Arial';ctx.fillStyle='rgba(255,255,255,0.85)';ctx.textAlign='center';
  ctx.fillText(HS.s?'THE MARCHING ROT PRESENTS':'THE BAND IS STILL DIGGING ITSELF OUT',W/2,cy+200);
  if(HS.s){ctx.font='40px Bangers, Arial';ctx.lineWidth=6;ctx.strokeStyle='#120a04';ctx.strokeText(`"${HS.s.title.toUpperCase()}"`,W/2,cy+246);ctx.fillStyle='#ffe14a';ctx.fillText(`"${HS.s.title.toUpperCase()}"`,W/2,cy+246);}
  ctx.font='28px Bangers, Arial';ctx.textAlign='right';ctx.fillStyle='rgba(255,255,255,0.75)';ctx.fillText('TAP TO START THE SHOW',W-16,H-14);
  ctx.restore();
}
function hsSpots(t,h){ctx.save();ctx.globalCompositeOperation='lighter';
  for(let i=0;i<4;i++){const ox=i<2?20:W-20,a=Math.PI/2+Math.sin(t*0.6+i*1.7)*0.45+(i<2?-0.42:0.42),len=1000,wd=0.13;
    const g=ctx.createLinearGradient(ox,HUD,ox+Math.cos(a)*len,HUD+Math.sin(a)*len);const col=['255,225,120','190,120,255','255,150,90','120,255,140'][i];
    g.addColorStop(0,`rgba(${col},${0.22+0.12*h})`);g.addColorStop(1,`rgba(${col},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(ox,HUD);
    ctx.lineTo(ox+Math.cos(a-wd)*len,HUD+Math.sin(a-wd)*len);ctx.lineTo(ox+Math.cos(a+wd)*len,HUD+Math.sin(a+wd)*len);ctx.closePath();ctx.fill();}
  ctx.restore();}
function hsStands(h,t){
  const waveY=HS.ph==='show'&&HS.T&&t>HS.T.b0?HUD+((t-HS.T.b0)*420)%1500-200:-999;
  for(const side of [0,1]){const T=STYLE_OF(side),x0=side?W-104:0,w=104;
    const g=ctx.createLinearGradient(x0,0,x0+w,0);g.addColorStop(side?1:0,'#120b18');g.addColorStop(side?0:1,'#24182c');ctx.fillStyle=g;ctx.fillRect(x0,HUD,w,H-HUD);
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(side?x0:x0+w-5,HUD,5,H-HUD);
    for(let r=0;r<31;r++)for(let c=0;c<3;c++){const fx=x0+20+c*30+(r%2)*9,fy=HUD+26+r*36,ph=r*1.3+c*2.1+side;
      const wv=Math.exp(-(((fy-waveY)/46)**2));const jump=Math.max(0,Math.sin(t*(6+3*h)+ph))*7*(0.4+h)+wv*20;const up=h>0.9||wv>0.4;
      ctx.fillStyle=(r+c)%3?T.jersey:T.trim;ctx.fillRect(fx-8,fy-jump+6,16,14);
      ctx.strokeStyle=T.skin;ctx.lineWidth=3;ctx.beginPath();const wave=Math.sin(t*9+ph)*5;
      if(up){ctx.moveTo(fx-7,fy-jump+7);ctx.lineTo(fx-9+wave,fy-jump-12);ctx.moveTo(fx+7,fy-jump+7);ctx.lineTo(fx+9+wave,fy-jump-12);}
      else{ctx.moveTo(fx-7,fy-jump+7);ctx.lineTo(fx-12,fy-jump+16);ctx.moveTo(fx+7,fy-jump+7);ctx.lineTo(fx+12,fy-jump+16);}ctx.stroke();
      ctx.fillStyle=T.skin;ctx.beginPath();ctx.arc(fx,fy-jump,7,0,7);ctx.fill();
      if(T.species==='mummy'){ctx.strokeStyle=T.skinDk;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(fx-6,fy-jump-2);ctx.lineTo(fx+6,fy-jump);ctx.stroke();ctx.fillStyle='#ffd23a';ctx.fillRect(fx-4,fy-jump-1,2,2);ctx.fillRect(fx+2,fy-jump-1,2,2);}
      else{ctx.fillStyle='#fff';ctx.fillRect(fx-4,fy-jump-2,3,3);ctx.fillRect(fx+1,fy-jump-1,2,2);}}
    if(Math.random()<0.12+0.2*h){HS.fx.push({flash:true,r:9,x:x0+10+Math.random()*(w-20),y:HUD+Math.random()*(H-HUD-40),vx:0,vy:0,l:0.12,L:0.12,g:0,c:'#ffffff'});}}
  if(HS.ph==='show'&&HS.T&&t>HS.T.a0)for(const s of HS.signs){const side=s.side,x0=side?W-104:0,fx=x0+52+(s.col-1)*14,fy=HUD+26+s.row*36-24+Math.sin(t*5+s.ph)*5;
    ctx.save();ctx.translate(fx,fy);ctx.rotate(Math.sin(t*3+s.ph)*0.12);ctx.font='bold 16px Roboto Condensed, Arial';const w=ctx.measureText(s.txt).width+12;
    ctx.fillStyle='#f4efe2';ctx.fillRect(-w/2,-11,w,22);ctx.strokeStyle='#1b1a17';ctx.lineWidth=2;ctx.strokeRect(-w/2,-11,w,22);
    ctx.fillStyle=side?'#c25a26':'#6a2c9c';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s.txt,0,1);ctx.restore();}
}
function hsLift(p){                 // how far the bats have carried a piece (exit phase)
  if(HS.ph!=='exit')return 0;const k=Math.max(0,HS.ex-1.6-(p.k==='stone'?0.25:p.k==='pole'?0:0.4));return k*k*120+k*40;}
function hsPiece(p,t){const L=hsLift(p);if(p.y-L<HUD-420)return;
  ctx.save();ctx.translate(p.x,p.y-L);if(L>0)ctx.rotate(Math.sin(HS.ex*4+p.x)*0.05);
  if(p.k==='stone')hsStone(t);else if(p.k==='pole')hsPole(p,t);else hsCoffin(p,t);ctx.restore();}
function hsStone(t){const w=384,h=300,r=w/2;const T=HS.s;
  ctx.fillStyle='rgba(0,0,0,0.35)';ctx.beginPath();ctx.ellipse(0,6,w*0.6,18,0,0,7);ctx.fill();
  // base slab
  ctx.fillStyle='#3d3a44';ctx.fillRect(-w/2-24,-28,w+48,32);ctx.strokeStyle='#14121a';ctx.lineWidth=5;ctx.strokeRect(-w/2-24,-28,w+48,32);
  ctx.fillStyle='#57536a';ctx.fillRect(-w/2-20,-26,w+40,6);
  // headstone with an arched top
  const g=ctx.createLinearGradient(-w/2,-h,w/2,0);g.addColorStop(0,'#8f8ba3');g.addColorStop(0.5,'#6c6882');g.addColorStop(1,'#4b475d');
  ctx.beginPath();ctx.moveTo(-w/2,-24);ctx.lineTo(-w/2,-h+r*0.55);ctx.ellipse(0,-h+r*0.55,w/2,r*0.55,0,Math.PI,0);ctx.lineTo(w/2,-24);ctx.closePath();
  ctx.fillStyle=g;ctx.fill();ctx.lineWidth=7;ctx.strokeStyle='#14121a';ctx.stroke();
  // engraved border
  ctx.beginPath();ctx.moveTo(-w/2+18,-34);ctx.lineTo(-w/2+18,-h+r*0.6);ctx.ellipse(0,-h+r*0.6,w/2-18,r*0.55-16,0,Math.PI,0);ctx.lineTo(w/2-18,-34);
  ctx.strokeStyle='rgba(20,18,26,0.55)';ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle='rgba(255,255,255,0.12)';ctx.lineWidth=2;ctx.translate(1.5,1.5);ctx.stroke();ctx.translate(-1.5,-1.5);
  // cracks and moss
  ctx.strokeStyle='#2a2734';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(w/2-40,-h+70);ctx.lineTo(w/2-62,-h+104);ctx.lineTo(w/2-52,-h+128);ctx.lineTo(w/2-78,-h+160);ctx.moveTo(-w/2+30,-60);ctx.lineTo(-w/2+58,-82);ctx.lineTo(-w/2+52,-104);ctx.stroke();
  for(const [mx,my,mr] of [[-w/2+14,-30,22],[-w/2+40,-26,16],[w/2-20,-30,18],[w/2-44,-28,12],[-60,-h+12,12],[-40,-h+6,9]]){ctx.fillStyle='#3f6b2a';ctx.beginPath();ctx.arc(mx,my,mr,0,7);ctx.fill();ctx.fillStyle='#5f8f3a';ctx.beginPath();ctx.arc(mx-3,my-3,mr*0.6,0,7);ctx.fill();}
  // lettering: HALFTIME SHOW, the song, the performers
  ctx.textAlign='center';ctx.textBaseline='alphabetic';
  ctx.font='26px Bangers, Arial';ctx.fillStyle='rgba(18,16,24,0.85)';ctx.fillText('R.I.P.  HALFTIME  SHOW',0,-h+78);ctx.fillStyle='rgba(255,255,255,0.18)';ctx.fillText('R.I.P.  HALFTIME  SHOW',1,-h+76);
  const title=T?T.title.toUpperCase():'HALFTIME';const words=title.split(' ');const lines=[];let cur='';ctx.font='40px Bangers, Arial';
  for(const wd of words){const tr=cur?cur+' '+wd:wd;if(ctx.measureText(tr).width>w-70&&cur){lines.push(cur);cur=wd;}else cur=tr;}lines.push(cur);
  const glow=0.6+0.4*Math.sin(t*4);
  lines.forEach((ln,i)=>{const y=-h+128+i*44-(lines.length-1)*10;ctx.lineWidth=7;ctx.strokeStyle='#1b0d05';ctx.strokeText(ln,0,y);
    ctx.shadowColor=`rgba(255,200,60,${glow})`;ctx.shadowBlur=18;ctx.fillStyle='#ffd23a';ctx.fillText(ln,0,y);ctx.shadowBlur=0;});
  ctx.font='20px Bangers, Arial';ctx.fillStyle='rgba(18,16,24,0.85)';ctx.fillText('THE MARCHING ROT',0,-68);ctx.fillText('+ THE CADAVER CHEER SQUAD',0,-46);
  // two candles on the slab
  for(const cx of [-w/2+6,w/2-6]){ctx.fillStyle='#e9e2c8';ctx.fillRect(cx-7,-62,14,36);ctx.strokeStyle='#1b1a17';ctx.lineWidth=2;ctx.strokeRect(cx-7,-62,14,36);
    const fl=Math.sin(t*20+cx)*2;ctx.fillStyle='#ffb02a';ctx.beginPath();ctx.ellipse(cx+fl*0.3,-72,5,10+fl,0,0,7);ctx.fill();ctx.fillStyle='#fff3a0';ctx.beginPath();ctx.ellipse(cx,-69,2.5,5,0,0,7);ctx.fill();
    ctx.save();ctx.globalCompositeOperation='lighter';const gg=ctx.createRadialGradient(cx,-70,2,cx,-70,40);gg.addColorStop(0,'rgba(255,190,80,0.35)');gg.addColorStop(1,'rgba(255,190,80,0)');ctx.fillStyle=gg;ctx.beginPath();ctx.arc(cx,-70,40,0,7);ctx.fill();ctx.restore();}
}
function hsPole(p,t){const S=STYLE_OF(p.team),hgt=372;
  ctx.fillStyle='rgba(0,0,0,0.3)';ctx.beginPath();ctx.ellipse(0,2,22,7,0,0,7);ctx.fill();
  ctx.fillStyle='#4a2f1c';ctx.fillRect(-6,-hgt,12,hgt);ctx.strokeStyle='#1b1a17';ctx.lineWidth=3;ctx.strokeRect(-6,-hgt,12,hgt);ctx.fillStyle='#6b4630';ctx.fillRect(-3,-hgt,3,hgt);
  // skull finial
  ctx.fillStyle='#efe6cf';ctx.beginPath();ctx.arc(0,-hgt-12,13,0,7);ctx.fill();ctx.fillRect(-8,-hgt-4,16,9);ctx.strokeStyle='#1b1a17';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,-hgt-12,13,0,7);ctx.stroke();
  ctx.fillStyle='#1b1a17';ctx.beginPath();ctx.arc(-5,-hgt-13,3.5,0,7);ctx.arc(5,-hgt-13,3.5,0,7);ctx.fill();
  // a tall tattered banner hanging from a crossbar, swaying in the night wind
  const top=-hgt+18,bw=46,bh=200,sw=Math.sin(t*2.2+p.x)*0.05;
  ctx.fillStyle='#4a2f1c';ctx.fillRect(-bw/2-6,top-6,bw+12,8);ctx.strokeStyle='#1b1a17';ctx.lineWidth=2.5;ctx.strokeRect(-bw/2-6,top-6,bw+12,8);
  ctx.save();ctx.translate(0,top);ctx.rotate(sw);ctx.beginPath();ctx.moveTo(-bw/2,0);ctx.lineTo(bw/2,0);
  const N=6;for(let k=0;k<=N;k++){const u=k/N,x=bw/2-u*bw,y=bh+(k%2?-22:0)+Math.sin(t*5+u*6)*4;ctx.lineTo(x+Math.sin(t*3+u*4)*3,y);}
  ctx.closePath();ctx.fillStyle=S.jersey;ctx.fill();ctx.strokeStyle='#1b1a17';ctx.lineWidth=3;ctx.stroke();
  ctx.save();ctx.clip();ctx.fillStyle=S.trim;ctx.fillRect(-bw/2,28,bw,7);ctx.fillRect(-bw/2,bh-62,bw,7);ctx.restore();
  ctx.fillStyle='#efe6cf';ctx.beginPath();ctx.arc(0,bh*0.42,14,0,7);ctx.fill();ctx.fillRect(-8,bh*0.42+8,16,9);ctx.strokeStyle='#1b1a17';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,bh*0.42,14,0,7);ctx.stroke();
  ctx.fillStyle='#1b1a17';ctx.beginPath();ctx.arc(-5,bh*0.42-1,3.6,0,7);ctx.arc(5,bh*0.42-1,3.6,0,7);ctx.fill();ctx.fillRect(-1,bh*0.42+5,2,4);
  ctx.font='16px Bangers, Arial';ctx.textAlign='center';ctx.fillStyle=S.trim;ctx.fillText(p.team?'MUMMIES':'SHIFT',0,bh*0.42+42);
  ctx.restore();
}
function hsCoffin(p,t){const w=52,h=96;
  ctx.fillStyle='rgba(0,0,0,0.3)';ctx.beginPath();ctx.ellipse(0,2,32,8,0,0,7);ctx.fill();
  ctx.beginPath();ctx.moveTo(-w*0.3,0);ctx.lineTo(w*0.3,0);ctx.lineTo(w*0.5,-h*0.7);ctx.lineTo(w*0.32,-h);ctx.lineTo(-w*0.32,-h);ctx.lineTo(-w*0.5,-h*0.7);ctx.closePath();
  const g=ctx.createLinearGradient(-w/2,0,w/2,0);g.addColorStop(0,'#3a1d12');g.addColorStop(0.5,'#5e3220');g.addColorStop(1,'#2a140c');ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#120806';ctx.lineWidth=4;ctx.stroke();
  // crossed bones on the lid
  ctx.strokeStyle='#efe6cf';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-12,-60);ctx.lineTo(12,-36);ctx.moveTo(12,-60);ctx.lineTo(-12,-36);ctx.stroke();
  ctx.fillStyle='#efe6cf';for(const [bx,by] of [[-12,-60],[12,-60],[-12,-36],[12,-36]]){ctx.beginPath();ctx.arc(bx,by,4,0,7);ctx.fill();}
  // the cannon mouth glows and spits sparks during the song
  const T=HS.T,live=HS.ph==='show'&&T&&HS.t>T.a0;ctx.fillStyle='#1a0d08';ctx.beginPath();ctx.ellipse(0,-h,w*0.3,6,0,0,7);ctx.fill();
  if(live){ctx.save();ctx.globalCompositeOperation='lighter';const gg=ctx.createRadialGradient(0,-h,1,0,-h,30);gg.addColorStop(0,'rgba(255,170,60,0.7)');gg.addColorStop(1,'rgba(255,120,30,0)');ctx.fillStyle=gg;ctx.beginPath();ctx.arc(0,-h,30,0,7);ctx.fill();ctx.restore();
    const fin=HS.t>=T.final&&HS.t<T.fw0;if(Math.random()<(fin?1:0.35))for(let k=0;k<(fin?4:1);k++)HS.fx.push({x:p.x+(Math.random()-0.5)*10,y:p.y-h-hsLift(p),vx:(Math.random()-0.5)*90,vy:-(fin?380:180)-Math.random()*160,l:0.7+Math.random()*0.4,L:1.1,c:'#ffd27a',c2:'#ffffff',g:420,drag:0.95,s:2.2});}
}
function hsDrawFx(){ctx.save();ctx.globalCompositeOperation='lighter';
  for(const r of HS.rk){const u=Math.min(1,r.t/0.7),x=r.x0+(r.tx-r.x0)*u,y=r.y0+(r.ty-r.y0)*(1-(1-u)*(1-u));
    ctx.strokeStyle='rgba(255,220,150,0.8)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-(r.tx-r.x0)*0.06,y+40);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,3.5,0,7);ctx.fill();}
  for(const p of HS.fx){const a=Math.max(0,p.l/p.L);
    if(p.note)continue;
    if(p.flash){ctx.fillStyle=`rgba(255,255,255,${Math.min(1,a*1.6)})`;ctx.beginPath();ctx.arc(p.x,p.y,(p.r||8)*(0.4+(1-a)*0.8),0,7);ctx.fill();continue;}
    ctx.strokeStyle=p.c;ctx.globalAlpha=Math.min(1,a*1.4);ctx.lineWidth=p.s||2.5;ctx.beginPath();ctx.moveTo(p.px==null?p.x:p.px-(p.x-p.px)*2,p.py==null?p.y:p.py-(p.y-p.py)*2);ctx.lineTo(p.x,p.y);ctx.stroke();
    if(a>0.3&&(Math.random()<0.7)){ctx.fillStyle=p.c2||'#fff';ctx.beginPath();ctx.arc(p.x,p.y,(p.s||2.5)*0.8,0,7);ctx.fill();}}
  ctx.globalAlpha=1;ctx.restore();}
function hsDrawConf(){for(const c of HS.conf){ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.r);ctx.fillStyle=c.c;ctx.fillRect(-5,-3*Math.abs(Math.cos(c.r*1.7)),10,6*Math.abs(Math.cos(c.r*1.7))+1);ctx.restore();}}
// band: tubas at the back, horns in the middle, drums in front; they march in, play, stumble through the break, march off
function hsDrawBand(t,ex,beat){const T=HS.T,size=78;
  for(const m of HS.band){let x=m.hx,y=m.hy,view='front',pose='stand',spd=0.3,ph=beat*Math.PI;
    if(T&&t<T.a0*0.9&&HS.ph==='show'){const u=ease(t/(T.a0*0.9));y+=(1-u)*560+m.c*8;view='back';pose='run';spd=0.45;ph=t*9+m.seed;}
    if(HS.ph==='exit'){const k=Math.max(0,ex-m.exitD);y+=k*k*90+k*60;view='front';pose='run';spd=0.45;ph=ex*9+m.seed;if(y>H+150)continue;}
    // the break gags
    let lurch=0,slump=0;
    if(T&&HS.ph==='show'&&t>=T.brk&&t<T.b0){const bb=(t-T.brk)/T.bt;
      if(bb>=4&&bb<7){lurch=Math.max(0,1-((bb-4)%1)*2.2);pose='zombie';}
      if(bb>=2&&bb<4&&m.r===1)slump=1;
      if(m.r===2&&m.c===2&&bb>=1.9)m.limbs.ra=0;}
    if(T&&t>=T.b0)m.limbs.ra=1;
    let hide=false,duck=0,armOff=0;
    if(HS.ph==='show'){const ga=hsGag('arm'),gf=hsGag('fight'),gt=hsGag('throw');
      if(ga&&m.r===ga.r&&m.c===ga.c){const k=t-ga.at;armOff=k;m.limbs.la=k<ga.len-0.6?0:1;slump=1;view='front';pose='stand';}
      else if(m.limbs.la===0&&!(ga&&m.r===ga.r&&m.c===ga.c))m.limbs.la=1;
      if(gf&&m.r===gf.r&&(m.c===gf.c||m.c===gf.c2))hide=t-gf.at>0.45;
      if(gt){const k=t-gt.at;duck=Math.min(1,k/0.3,(gt.len-k)/0.4);}}
    if(hide)continue;
    if(duck>0)slump=0;
    const sway=Math.sin(beat*Math.PI+m.c*0.4)*3,bob=-Math.abs(Math.sin(beat*Math.PI))*3;
    const S=STYLE_OF(m.team);ctx.save();ctx.translate(x+sway,y+bob+slump*6);
    if(lurch){ctx.scale(1+lurch*0.08,1+lurch*0.08);}
    if(duck>0){ctx.translate(0,duck*10);ctx.scale(1,1-duck*0.12);}
    drawZombie(ctx,0,0,size,{team:S,body:'rb',view,phase:ph,speed:spd,limbs:m.limbs,pose,num:'',t:time,seed:m.seed,ball:false});
    if(duck>0){ctx.save();ctx.translate(Math.sin(t*7+m.seed)*2*duck,-size*0.62*duck);ctx.rotate(Math.sin(t*5+m.seed)*0.15*duck);}   // instrument held up over the head
    hsInstrument(m,size,view,beat,slump,lurch);
    if(duck>0)ctx.restore();
    if(armOff>0)hsArmGag(m,size,armOff,S);
    // shako: the tall band hat with a plume
    const hy=-size*0.98;ctx.fillStyle='#14121a';ctx.fillRect(-11,hy-24,22,26);ctx.fillStyle=S.trim;ctx.fillRect(-11,hy-2,22,4);ctx.fillRect(-11,hy-24,22,3);
    ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.strokeRect(-11,hy-24,22,26);
    ctx.fillStyle=m.team?'#ff8a3a':'#b06aff';ctx.beginPath();ctx.ellipse(Math.sin(t*6+m.seed)*2,hy-34,5,11,Math.sin(t*6+m.seed)*0.2,0,7);ctx.fill();
    ctx.restore();
    // music notes float up from the horns while the song plays
    if(HS.ph==='show'&&T&&t>T.a0&&t<T.end&&m.r<2&&Math.random()<0.012)HS.fx.push({note:true,x:x,y:y-size*1.1,vx:(Math.random()-0.5)*20,vy:-50,l:1.4,L:1.4,g:0,drag:1,c:'#ffe14a'});
  }
  {const gf=HS.ph==='show'?hsGag('fight'):null;if(gf&&t-gf.at>0.3){const a=HS.band.find(b=>b.r===gf.r&&b.c===gf.c),b2=HS.band.find(b=>b.r===gf.r&&b.c===gf.c2);hsFightCloud((a.hx+b2.hx)/2,a.hy-size*0.5,t-gf.at,gf.len,a,b2,size);}}
  // falling arm with its drumstick after the drummer's arm drops off
  if(T&&HS.ph==='show'&&t>=T.brk+1.9*T.bt&&t<T.b0){const m=HS.band.find(b=>b.r===2&&b.c===2),k=Math.min(1,(t-T.brk-1.9*T.bt)/0.35);
    ctx.save();ctx.translate(m.hx+30+k*16,m.hy-size*0.55+k*size*0.5);ctx.rotate(k*2.2);ctx.strokeStyle='#1b1a17';ctx.lineWidth=11;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,24);ctx.stroke();
    ctx.strokeStyle=STYLE_OF(m.team).skin;ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle='#d8c18a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,24);ctx.lineTo(10,46);ctx.stroke();ctx.restore();}
  // burp cloud from the middle tuba
  if(T&&HS.ph==='show'&&t>=T.brk&&t<T.brk+2.5*T.bt){const m=HS.band.find(b=>b.r===0&&b.c===2),k=(t-T.brk)/(2.5*T.bt);
    ctx.save();ctx.globalAlpha=Math.max(0,1-k);for(let i=0;i<6;i++){ctx.fillStyle=i%2?'#8fd14f':'#6aa83a';ctx.beginPath();ctx.arc(m.hx-14+Math.sin(i*2.1)*22*k,m.hy-size*1.25-k*90-i*10,10+k*26+i*2,0,7);ctx.fill();}ctx.restore();}
  // notes drawn on top
  ctx.save();ctx.font='26px Arial';ctx.textAlign='center';for(const p of HS.fx)if(p.note){ctx.globalAlpha=Math.max(0,p.l/p.L);ctx.fillStyle=p.c;ctx.fillText(p.l%0.7>0.35?'♪':'♫',p.x,p.y);}ctx.restore();
}
// the arm gag: the arm drops and bounces, the player stares at the stump ("?!"), then jams it back on
function hsArmGag(m,size,k,S){const g=hsGag('arm');if(!g)return;const end=g.len-0.6;
  if(k<end){const fall=Math.min(1,k/0.45),bx=-30-fall*10,by=-size*0.55+fall*size*0.55-Math.abs(Math.sin(Math.min(k,1.2)*9))*12*(1-Math.min(1,k/1.2));
    let ax=bx,ay=by,rot=fall*1.9;
    if(k>end-1.2){const u=(k-(end-1.2))/1.2;ax=bx+u*20;ay=by-u*size*0.45;rot=1.9*(1-u);}       // picks it up and shoves it back on
    ctx.save();ctx.translate(ax,ay);ctx.rotate(rot);ctx.lineCap='round';ctx.strokeStyle='#1b1a17';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,28);ctx.stroke();
    ctx.strokeStyle=S.jersey;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,12);ctx.stroke();ctx.strokeStyle=S.skin;ctx.beginPath();ctx.moveTo(0,12);ctx.lineTo(0,28);ctx.stroke();
    ctx.fillStyle=S.skin;ctx.beginPath();ctx.arc(0,31,5.5,0,7);ctx.fill();ctx.fillStyle='#7a1414';ctx.beginPath();ctx.arc(0,0,4,0,7);ctx.fill();ctx.restore();
    if(k<1.2)for(let i=0;i<2;i++)if(Math.random()<0.5)HS.fx.push({x:m.hx-18,y:m.hy-size*0.62,vx:-40-Math.random()*60,vy:-60-Math.random()*80,l:0.5,L:0.5,c:'#5c8f2a',g:400,drag:0.95});
    if(k>0.6&&k<end-1.3){ctx.save();ctx.font='34px Bangers, Arial';ctx.textAlign='center';ctx.lineWidth=5;ctx.strokeStyle='#000';const q=k<1.6?'?!':'...';
      ctx.strokeText(q,6,-size*1.45-6);ctx.fillStyle='#ffe14a';ctx.fillText(q,6,-size*1.45-6);ctx.restore();}}}
// the fight: a dust cloud with fists, feet, a flying head and comic swears; the rest of the band plays on
function hsFightCloud(x,y,k,len,a,b,size){const R=62,u=Math.min(1,k/0.3,(len-k)/0.3);if(u<=0)return;ctx.save();ctx.translate(x+Math.sin(k*23)*4,y+Math.cos(k*19)*3);ctx.scale(u,u);
  for(let i=0;i<10;i++){const an=i/10*6.28+k*3,r=R*(0.6+0.22*Math.sin(k*9+i*2));ctx.fillStyle=i%2?'#d9d4c5':'#bfb8a6';ctx.strokeStyle='#4a4436';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(Math.cos(an)*r,Math.sin(an)*r*0.62,R*0.42,0,7);ctx.fill();ctx.stroke();}
  ctx.fillStyle='#e9e4d5';ctx.beginPath();ctx.arc(0,0,R*0.62,0,7);ctx.fill();
  const SA=STYLE_OF(a.team),SB=STYLE_OF(b.team);
  for(let i=0;i<4;i++){const an=k*7+i*1.7,px=Math.cos(an)*R*0.95,py=Math.sin(an)*R*0.6;ctx.strokeStyle='#1b1a17';ctx.lineWidth=11;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(px*0.6,py*0.6);ctx.lineTo(px,py);ctx.stroke();ctx.strokeStyle=i%2?SA.skin:SB.skin;ctx.lineWidth=7;ctx.stroke();
    ctx.fillStyle=i%2?SA.skin:SB.skin;ctx.beginPath();ctx.arc(px,py,7,0,7);ctx.fill();}
  // a head pops out and gets pulled back in
  const hk=(k*0.8)%1.6;if(hk<0.7){const hx=Math.sin(hk*4.5)*20,hy=-R*0.7-Math.sin(hk/0.7*Math.PI)*46;ctx.fillStyle=SA.skin;ctx.strokeStyle='#1b1a17';ctx.lineWidth=3;ctx.beginPath();ctx.arc(hx,hy,13,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle='#111';ctx.beginPath();ctx.arc(hx-5,hy-2,3,0,7);ctx.arc(hx+5,hy-1,2,0,7);ctx.fill();}
  // a dropped instrument skids out
  ctx.fillStyle='#e8b83a';ctx.beginPath();ctx.ellipse(-R*0.9-k*6,R*0.5,13,9,k*2,0,7);ctx.fill();ctx.strokeStyle='#1b1a17';ctx.lineWidth=2;ctx.stroke();
  ctx.font='30px Bangers, Arial';ctx.textAlign='center';ctx.lineWidth=5;ctx.strokeStyle='#000';const w=['POW!','#@%!','BONK!','RIP!','*&$#!'][Math.floor(k*2.2)%5];
  ctx.strokeText(w,R*0.9,-R*0.75);ctx.fillStyle='#ff5a3a';ctx.fillText(w,R*0.9,-R*0.75);
  for(let i=0;i<3;i++){const an=k*4+i*2.1;ctx.fillStyle='#ffe14a';ctx.font='22px Arial';ctx.fillText('✶',Math.cos(an)*R*0.5,-R*0.95+Math.sin(an)*8);}
  ctx.restore();}
// crowd throws junk from the stands at the band; it bounces off the raised instruments
const JUNK=[['bone','#e9e0c8'],['brain','#e58fa5'],['tomato','#7a9a2a'],['fish','#8fa5a8'],['shoe','#5a3a22'],['can','#b8c0c8'],['hand','#86a070']];
function hsThrow(){const left=Math.random()<0.5,m=HS.band[Math.floor(Math.random()*HS.band.length)],J=JUNK[Math.floor(Math.random()*JUNK.length)];
  const x0=left?-20:W+20,y0=380+Math.random()*260,tx=m.hx+(Math.random()-0.5)*40,ty=m.hy-78*1.15,Tt=0.75+Math.random()*0.35;
  HS.junk.push({k:J[0],c:J[1],goo:J[0]==='brain'?'#c06a80':J[0]==='tomato'?'#9a3020':'#6a8a3a',x:x0,y:y0,x0,y0,tx,ty,T:Tt,t:0,rot:0,vr:(Math.random()-0.5)*14,
    vx:(tx-x0)/Tt*0.3,vy:0,hit:false,shield:Math.random()<0.75});}
function hsDrawJunk(){
  for(const g of HS.goo){ctx.globalAlpha=Math.min(1,g.l);ctx.fillStyle=g.c;ctx.beginPath();ctx.ellipse(g.x,g.y,g.r*1.4,g.r*0.5,0,0,7);ctx.fill();}ctx.globalAlpha=1;
  for(const j of HS.junk){let x=j.x,y=j.y;if(!j.hit){const u=Math.min(1,j.t/j.T);x=j.x0+(j.tx-j.x0)*u;y=j.y0+(j.ty-j.y0)*u-Math.sin(u*Math.PI)*170;j.x=x;j.y=y;j.rot+=j.vr/60;}
    ctx.save();ctx.translate(x,y);ctx.rotate(j.rot);ctx.fillStyle=j.c;ctx.strokeStyle='#1b1a17';ctx.lineWidth=2.5;ctx.beginPath();
    if(j.k==='bone'){ctx.lineCap='round';ctx.lineWidth=7;ctx.strokeStyle=j.c;ctx.moveTo(-12,0);ctx.lineTo(12,0);ctx.stroke();ctx.fillStyle=j.c;for(const sx of [-13,13])for(const sy of [-4,4]){ctx.beginPath();ctx.arc(sx,sy,4.5,0,7);ctx.fill();}}
    else if(j.k==='brain'){ctx.ellipse(0,0,14,10,0,0,7);ctx.fill();ctx.stroke();ctx.strokeStyle='#a14a62';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-9,-2);ctx.quadraticCurveTo(-3,4,0,-3);ctx.quadraticCurveTo(4,4,9,-2);ctx.stroke();}
    else if(j.k==='tomato'){ctx.arc(0,0,10,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#3a2a12';ctx.beginPath();ctx.arc(-3,-2,3,0,7);ctx.arc(4,3,2,0,7);ctx.fill();}
    else if(j.k==='fish'){ctx.ellipse(0,0,15,6,0,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(22,-7);ctx.lineTo(22,7);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#111';ctx.beginPath();ctx.arc(-9,-1,1.8,0,7);ctx.fill();}
    else if(j.k==='shoe'){ctx.moveTo(-12,4);ctx.lineTo(12,4);ctx.lineTo(12,-1);ctx.lineTo(0,-3);ctx.lineTo(-4,-9);ctx.lineTo(-12,-9);ctx.closePath();ctx.fill();ctx.stroke();}
    else if(j.k==='can'){ctx.rect(-6,-10,12,20);ctx.fill();ctx.stroke();ctx.fillStyle='#c0392b';ctx.fillRect(-6,-3,12,6);}
    else{groundHandHalf(j);}
    ctx.restore();}}
function groundHandHalf(j){ctx.fillStyle=j.c;ctx.beginPath();ctx.ellipse(0,0,7,6,0,0,7);ctx.fill();ctx.stroke();ctx.lineCap='round';ctx.lineWidth=3.5;ctx.strokeStyle=j.c;
  for(let i=0;i<4;i++){const an=-Math.PI/2+(i-1.5)*0.38;ctx.beginPath();ctx.moveTo(Math.cos(an)*5,Math.sin(an)*5);ctx.lineTo(Math.cos(an)*14,Math.sin(an)*14);ctx.stroke();}
  ctx.beginPath();ctx.moveTo(6,2);ctx.lineTo(13,0);ctx.stroke();ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(0,5);ctx.lineTo(0,14);ctx.stroke();}
function hsInstrument(m,size,view,beat,slump,lurch){const gold='#e8b83a',goldDk='#9a6d12',k=size/100;
  const hit=Math.abs(Math.sin(beat*Math.PI*2));ctx.lineCap='round';
  if(m.inst==='tuba'){const bx=-22*k,by=-112*k;ctx.strokeStyle=goldDk;ctx.lineWidth=9*k;ctx.beginPath();ctx.ellipse(0,-46*k,22*k,18*k,0,0,7);ctx.stroke();
    ctx.strokeStyle=gold;ctx.lineWidth=6*k;ctx.stroke();ctx.lineWidth=10*k;ctx.strokeStyle=gold;ctx.beginPath();ctx.moveTo(14*k,-50*k);ctx.lineTo(bx+6*k,by+18*k);ctx.stroke();
    ctx.fillStyle=gold;ctx.beginPath();ctx.ellipse(bx,by,28*k,24*k,-0.3,0,7);ctx.fill();ctx.strokeStyle='#1b1a17';ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle=goldDk;ctx.beginPath();ctx.ellipse(bx,by,18*k,15*k,-0.3,0,7);ctx.fill();ctx.fillStyle='rgba(255,255,255,0.5)';ctx.beginPath();ctx.ellipse(bx-10*k,by-8*k,6*k,3*k,-0.6,0,7);ctx.fill();return;}
  if(view==='back')return;
  if(m.inst==='tpt'){const up=slump?18:-hit*4;ctx.strokeStyle=gold;ctx.lineWidth=5*k;ctx.beginPath();ctx.moveTo(0,-70*k);ctx.lineTo(0,(-58+up)*k);ctx.stroke();
    ctx.fillStyle=gold;ctx.beginPath();ctx.arc(0,(-50+up)*k,12*k,0,7);ctx.fill();ctx.strokeStyle='#1b1a17';ctx.lineWidth=2.5;ctx.stroke();ctx.fillStyle=goldDk;ctx.beginPath();ctx.arc(0,(-50+up)*k,7*k,0,7);ctx.fill();return;}
  if(m.inst==='bone'){const sl=(Math.sin(beat*Math.PI*0.5+m.c)*0.5+0.5)*20+(slump?24:0);ctx.strokeStyle=gold;ctx.lineWidth=4.5*k;ctx.beginPath();ctx.moveTo(-5*k,-72*k);ctx.lineTo(-5*k,(-28+sl)*k);ctx.moveTo(5*k,-72*k);ctx.lineTo(5*k,(-28+sl)*k);ctx.stroke();
    ctx.lineWidth=5*k;ctx.beginPath();ctx.moveTo(-5*k,(-28+sl)*k);ctx.lineTo(5*k,(-28+sl)*k);ctx.stroke();
    ctx.fillStyle=gold;ctx.beginPath();ctx.ellipse(16*k,-76*k,10*k,13*k,0,0,7);ctx.fill();ctx.strokeStyle='#1b1a17';ctx.lineWidth=2;ctx.stroke();return;}
  if(m.inst==='snare'||m.inst==='bass'){const S=STYLE_OF(m.team),big=m.inst==='bass';
    if(big){const r=28*k,y=-40*k;ctx.fillStyle='#f4efe2';ctx.beginPath();ctx.arc(0,y,r,0,7);ctx.fill();ctx.lineWidth=6*k;ctx.strokeStyle=S.jersey;ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#1b1a17';ctx.beginPath();ctx.arc(0,y,r+3*k,0,7);ctx.stroke();
      ctx.font=`${Math.round(18*k)}px Bangers, Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=S.jersey;ctx.fillText('ROT',0,y+1);
      const mx=Math.sin(beat*Math.PI)*10*k;ctx.strokeStyle='#d8c18a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-r-6*k,y-10*k+mx);ctx.lineTo(-r+6*k,y+mx);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-r+6*k,y+mx,4*k,0,7);ctx.fill();return;}
    const y=-36*k,w=26*k;ctx.fillStyle=S.jersey;ctx.fillRect(-w,y,w*2,16*k);ctx.fillStyle=S.trim;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-w+i*w/2,y);ctx.lineTo(-w+i*w/2+w/4,y+16*k);ctx.lineTo(-w+i*w/2+w/2,y);ctx.fill();}
    ctx.strokeStyle='#1b1a17';ctx.lineWidth=2;ctx.strokeRect(-w,y,w*2,16*k);ctx.fillStyle='#f4efe2';ctx.beginPath();ctx.ellipse(0,y,w,6*k,0,0,7);ctx.fill();ctx.stroke();
    const sub=HS.s?HS.s.sub:4,h1=Math.abs(Math.sin(beat*Math.PI*sub/2)),h2=Math.abs(Math.cos(beat*Math.PI*sub/2));ctx.strokeStyle='#d8c18a';ctx.lineWidth=3;
    if(m.limbs.ra||lurch){ctx.beginPath();ctx.moveTo(14*k,(-52-h1*10)*k);ctx.lineTo(6*k,y-1-h1*6*k);ctx.stroke();}
    ctx.beginPath();ctx.moveTo(-14*k,(-52-h2*10)*k);ctx.lineTo(-6*k,y-1-h2*6*k);ctx.stroke();}
}
// cheer squad: cartwheel in, dance, zombie lurch in the break, build a pyramid, toss the top cheerleader (her head comes off), then run off
function hsCheerPos(m,t){const T=HS.T;if(!T)return {x:m.hx,y:m.hy};
  if(t<T.pyr)return {x:m.hx,y:m.hy};
  const slots=[[290,628],[360,628],[430,628],[325,628-58],[395,628-58],[360,628-116]],order=[0,3,1,5,4,2];const sl=slots[order.indexOf(m.i)];
  const u=ease((t-T.pyr)/(3*T.bt));return {x:m.hx+(sl[0]-m.hx)*u,y:m.hy+(sl[1]-m.hy)*u,pyr:u};}
function hsDrawCheer(t,ex,beat){const T=HS.T,size=96;
  const list=HS.cheer.map(m=>({m,p:hsCheerPos(m,t)})).sort((a,b)=>a.p.y-b.p.y);
  for(const {m,p} of list){let x=p.x,y=p.y,view='front',pose='stand',spd=0.3,flip=false,rot=0,airborne=0;
    if(T&&HS.ph==='show'&&t<T.a0){const u=ease(Math.min(1,Math.max(0,(t-0.3-m.i*0.12)/(T.a0*0.75))));x=m.hx+m.side*(1-u)*420;rot=u<1?(1-u)*Math.PI*4*m.side:0;}
    if(HS.ph==='exit'){if(m.ex0==null)m.ex0={x,y};const k=Math.max(0,ex-m.exitD);x=m.ex0.x+m.side*(k*k*160+k*120);y=m.ex0.y+(m.i===5&&k<0.6?k*120:m.i===5?72:0);view='side';flip=m.side<0;pose='run';spd=0.7;
      if(x<-80||x>W+80)continue;}
    const S=STYLE_OF(m.team);ctx.save();
    // the toss: on the last note the top cheerleader flies up, her head pops off and comes back down
    let headOff=false,hx=0,hy=0;
    if(T&&HS.ph==='show'&&m.i===5&&t>=T.final&&p.pyr>=1){const k=t-T.final;if(k<1.3){airborne=Math.sin(Math.min(1,k/1.3)*Math.PI)*170;rot=k*Math.PI*2/1.3;}
      if(k>0.35&&k<2.3){headOff=true;const hk=(k-0.35)/1.95;hx=Math.sin(hk*Math.PI*2)*30;hy=-airborne-size*0.86-Math.sin(hk*Math.PI)*230;}}
    ctx.translate(x,y-airborne);if(rot){ctx.translate(0,-size*0.5);ctx.rotate(rot);ctx.translate(0,size*0.5);}
    let st='wave',D=null;
    if(HS.ph==='show'&&T&&t>=T.a0&&(!p.pyr||p.pyr<0.05)){
      if(t>=T.brk&&t<T.b0){const bb=(t-T.brk)/T.bt;pose='zombie';spd=0.35;view='front';ctx.translate(Math.sin(bb*Math.PI)*8,0);}
      else{m.danceT=m.danceT||0;D=danceRig(m,size*0.4);ctx.translate(Math.max(-30,Math.min(30,D.dx||0)),0);pose=D.pose;view=D.view;flip=D.flip;st=D.dj&&D.dj.la&&D.dj.la[0]>2?'up':'wave';}}
    const lim=headOff?{la:1,ra:1,ll:1,rl:1,head:0}:m.limbs;
    drawZombie(ctx,0,0,size,{team:S,body:'wr',view,flip,phase:HS.ph==='exit'?ex*10+m.i:t*8+m.i,speed:spd,limbs:lim,pose,num:m.num,t:time,seed:m.i+11,ball:false,dj:D&&D.dj});
    // pompoms
    if(D&&D.pose==='dance'){const T2=STYLE_OF(m.team);for(const s2 of [-1,1]){const hp=danceHand(D,s2,size,'wr');if(!hp)continue;   // pompoms stay in their hands through every move
      for(let k=0;k<10;k++){const a=k/10*6.28;ctx.fillStyle=k%2?T2.trim:T2.jersey;ctx.beginPath();ctx.arc(hp[0]+Math.cos(a)*8,hp[1]+Math.sin(a)*8,6.5,0,7);ctx.fill();}}}
    else if(view==='front'){const T2=STYLE_OF(m.team),up=p.pyr>=1||t>=(T?T.final:1e9)||st==='up'?1:0,b=Math.sin(time*10+m.i)*6;
      for(const s2 of [-1,1]){const px=s2*size*(up?0.3:0.42),py=(up?-size*1.08:-size*0.5)+b*(s2>0?1:-1);
        for(let k=0;k<10;k++){const a=k/10*6.28;ctx.fillStyle=k%2?T2.trim:T2.jersey;ctx.beginPath();ctx.arc(px+Math.cos(a)*8,py+Math.sin(a)*8,6.5,0,7);ctx.fill();}}}
    ctx.restore();
    if(headOff){ctx.save();ctx.translate(x+hx,y+hy);ctx.rotate(t*9);ctx.fillStyle=S.skin;ctx.beginPath();ctx.arc(0,0,17,0,7);ctx.fill();ctx.strokeStyle='#1b1a17';ctx.lineWidth=3;ctx.stroke();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-6,-3,5,0,7);ctx.arc(6,-2,4,0,7);ctx.fill();ctx.fillStyle='#1b1a17';ctx.beginPath();ctx.arc(-6,-3,2,0,7);ctx.arc(6,-2,2,0,7);ctx.fill();
      ctx.beginPath();ctx.arc(0,6,6,0,Math.PI);ctx.fill();ctx.restore();
      if(t-T.final>0.6&&t-T.final<1.4){ctx.save();ctx.font='34px Bangers, Arial';ctx.textAlign='center';ctx.lineWidth=6;ctx.strokeStyle='#1b0d05';ctx.fillStyle='#9dff57';ctx.strokeText('HEADS UP!',x,y-size*2.6);ctx.fillText('HEADS UP!',x,y-size*2.6);ctx.restore();}}
  }
}
function hsDrawPlayers(ex){for(const p of HS.plyr){const k=Math.max(0,Math.min(1,(ex-p.d)/2.2));if(ex<p.d)continue;
  const fromX=p.team?W+60:-60,x=fromX+(p.tx-fromX)*ease(k),y=p.ty;const S=STYLE_OF(p.team);
  drawZombie(ctx,x,y,74,{team:S,body:BODY_OF[p.idx]||'qb',view:k<1?'side':'front',flip:p.team===1,phase:ex*11+p.ph,speed:k<1?0.9:0.2,limbs:{la:1,ra:1,ll:1,rl:1,head:1},pose:k<1?'run':'stand',num:G&&G.teams?'':'',t:time,seed:p.idx+p.team*7,ball:false});}}
function hsDrawBats(ex){for(const b of HS.bats){const k=ex-b.d;if(k<0)continue;let x,y;
  if(b.pi>=0){const P=HS.set[b.pi],L=hsLift(P),tx=P.x+b.ox,ty=P.y+b.oy-L,u=ease(Math.min(1,k/1.1));x=b.x+(tx-b.x)*u+Math.sin(ex*7+b.ph)*4*(1-u);y=b.y+(ty-b.y)*u+Math.sin(ex*13+b.ph)*3;}
  else{const u=Math.min(1,k/1.6);x=b.x+(b.wx-b.x)*u+Math.sin(ex*3+b.ph)*40;y=b.y+(b.wy-b.y)*u-Math.max(0,ex-3)*240;}
  if(y<HUD-200)continue;drawBat(x,y,ex*22+b.ph,b.s);}}
// subtitles: a big panel near the bottom; words light up as the zombies sing them
function hsCaption(t){let line=null;for(const L of HS.lines){if(t>=L.t-0.35)line=L;else break;}
  if(!line||t>line.end+1.2)return;
  const words=line.words,maxW=W-80;ctx.save();ctx.font='44px Bangers, Arial';
  const rows=[[]];let rw=0;const sp=ctx.measureText(' ').width;
  for(const wd of words){const w=ctx.measureText(wd.text).width;if(rw+w>maxW&&rows[rows.length-1].length){rows.push([]);rw=0;}rows[rows.length-1].push({wd,w});rw+=w+sp;}
  const bh=28+rows.length*52,by=H-48-bh;
  ctx.fillStyle='rgba(8,10,6,0.82)';ctx.beginPath();ctx.moveTo(30,by);ctx.lineTo(W-30,by);ctx.lineTo(W-30,by+bh);ctx.lineTo(30,by+bh);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#9dff57';ctx.lineWidth=2;ctx.stroke();
  ctx.textBaseline='middle';
  rows.forEach((row,ri)=>{const tw=row.reduce((a,b)=>a+b.w,0)+sp*(row.length-1);let x=W/2-tw/2;const y=by+14+26+ri*52;
    for(const {wd,w} of row){const wi=words.indexOf(wd),sung=t>=wd.t,cur=sung&&(wi===words.length-1||t<words[wi+1].t);
      ctx.save();ctx.translate(x+w/2,y);const pop=cur?1+0.12*Math.max(0,1-(t-wd.t)*4):1;ctx.scale(pop,pop);
      ctx.lineWidth=7;ctx.strokeStyle='#120a04';ctx.textAlign='center';ctx.strokeText(wd.text,0,0);
      ctx.fillStyle=sung?(cur?'#9dff57':'#ffe14a'):'rgba(255,255,255,0.55)';ctx.fillText(wd.text,0,0);ctx.restore();x+=w+sp;}});
  ctx.restore();}
