// ===== SEASON: Rotball's career mode in the Zombie League (build round 1) =====
// 12 teams in two divisions, a 12-game schedule, standings, rival General Managers who earn and spend their own Bones,
// your Bones from every game, and a career that saves itself. Design: "Rotball Coach Mode" doc.
// Round 2 added your roster's stats (Speed, Hands, Bite, Grit, and Arm for the quarterback), training them with Bones, and Team Power from them.
// Round 3: stats are skulls (0 to 5) with hidden Crypt Rank caps, Player Power, the Graveyard market (corpses fit to positions, with looks,
// idle animations and quips), women zombies across the league, the bench that fills in when a starter goes down, and letting zombies go.
// Round 4: deaths that leave a lasting mark, injuries the Stitch Shop sews back on, the Witch Doctor, lifespan, and Keep, the Mausoleum or the Sacrifice.
// Later rounds add the draft, twists and the Scrapbook.

const CAREER_KEY='rotball_career',CAREER_V=1;
const DIVS=['Crypt Division','Bog Division'];
// Team 0 is always yours. Moldy Mummies keep their old colors and sit in your division, so the old rivalry carries on.
// Colors stay clear of the turf green and of the Shift's purple, so every opponent stands out on the field.
const LEAGUE=[
  {name:'Graveyard Shift',div:0,sp:'zombie',jersey:'#6a2c9c',trim:'#f3c34b'},
  {name:'Moldy Mummies',div:0,sp:'mummy',jersey:'#c25a26',trim:'#efe6cf',gm:'hoarder'},
  {name:'Casket Crushers',div:0,sp:'zombie',jersey:'#2b3a8c',trim:'#c9d0de',gm:'spender'},
  {name:'Wailing Banshees',div:0,sp:'zombie',jersey:'#1f7a7a',trim:'#e6f2ef',gm:'trainer'},
  {name:'Tombstone Tumblers',div:0,sp:'zombie',jersey:'#555b63',trim:'#f2d14a',gm:'tinkerer'},
  {name:'Crypt Creepers',div:0,sp:'mummy',jersey:'#7a1424',trim:'#e8d6a0',gm:'gambler'},
  {name:'Swamp Stinkers',div:1,sp:'zombie',jersey:'#6e5a24',trim:'#c8e04a',gm:'patcher'},
  {name:'Marrow Munchers',div:1,sp:'zombie',jersey:'#8a1f5c',trim:'#f2e6ea',gm:'spender'},
  {name:'Night Shamblers',div:1,sp:'zombie',jersey:'#1b2048',trim:'#9fc2ff',gm:'trainer'},
  {name:'Pumpkin Rotters',div:1,sp:'zombie',jersey:'#d4731a',trim:'#2a1a10',gm:'gambler'},
  {name:'Ghoul Patrol',div:1,sp:'mummy',jersey:'#26262c',trim:'#9dff57',gm:'hoarder'},
  {name:'Coffin Dodgers',div:1,sp:'mummy',jersey:'#6b4426',trim:'#f0c896',gm:'patcher'}];
// What each General Manager does with his Bones every week: share spent, Power per Bone, and a quirk.
const GMS={
  spender:{name:'The Spender',share:0.9,eff:1.0,bench:1},   // buys stars, even with an empty bench
  hoarder:{name:'The Hoarder',share:0,eff:1.2,save:1200,bench:2},   // saves up, then splurges all at once
  trainer:{name:'The Trainer',share:0.6,eff:1.1,bench:2},
  gambler:{name:'The Gambler',share:0.8,eff:1.0,swing:true,bench:2},
  tinkerer:{name:'The Tinkerer',share:0.7,eff:1.0,bench:2},
  patcher:{name:'The Patcher',share:0.5,eff:0.9,tough:true,bench:3}};   // patches his zombies up, so losses wear his team down less
const BONES={win:100,loss:30,td:10};
// Your zombies' stats are skulls, 0 to 5 in each. Each skull costs more than the last. How deep you can train is capped by the Crypt,
// which grows with the Bones you've spent over your career. Players are never told the rule; a new shelf just appears.
const STATS=[{k:'spd',name:'Speed',ab:'SPD',does:'runs faster'},{k:'hands',name:'Hands',ab:'HND',does:'catches and picks off more'},
  {k:'bite',name:'Bite',ab:'BIT',does:'tackles stick'},{k:'grit',name:'Grit',ab:'GRT',does:'keeps limbs on'},
  {k:'arm',name:'Arm',ab:'ARM',does:'throws land on target',qb:true}];
const TRAIN_COST=[50,100,200,400,800],SK_MAX=5,BENCH_MAX=3;
const POS=['QB / S','RB / LB','WR / CB','WR / CB','LINE','LINE','LINE'];
const SLOT_KIND=['brain','fresh','fresh','fresh','line','line','line'];
const KINDS={brain:{name:'Brainiac',tag:'BRAINIAC',plays:'plays QB and Safety',body:'qb'},fresh:{name:'Fresh',tag:'FRESH',plays:'plays RB, WR, LB and CB',body:'wr'},
  line:{name:'Shambler',tag:'SHAMBLER',plays:'plays the lines',body:'line'}};
const KIND_NUMS={brain:[[1,19]],fresh:[[20,49],[80,89]],line:[[50,79]]};
const CRYPT=[[1,0],[2,1000],[3,3000],[4,6000],[6,15000],[8,30000],[10,50000],[13,80000],[16,115000],[20,150000]];   // hidden: rank by Bones spent
function cryptRank(sp){let r=1;for(let i=0;i<CRYPT.length;i++){const [a,b]=CRYPT[i],nx=CRYPT[i+1];if(sp<b)break;r=a;if(nx&&sp<nx[1])r=Math.floor(a+(nx[0]-a)*(sp-b)/(nx[1]-b));}return r;}
function skullCap(sp){sp=sp==null?(CAREER?CAREER.spent:0):sp;return sp>=80000?5:sp>=30000?4:sp>=6000?3:2;}
const skFactor=s=>Math.max(0.86,Math.min(1.34,1+(s-0.3)*0.06));   // 0 skulls plays about like a Quick Game player; 5 skulls is about a third better
const zKeys=z=>STATS.filter(S=>z.st[S.k]!=null);
function zAvg(z){const ks=zKeys(z);return ks.reduce((a,S)=>a+z.st[S.k],0)/ks.length;}
// Player Power 1 to 100: 30 with no skulls, 95 with every skull; bench bodies (Z-team) are frail and play 12 points lower.
// Deaths, missing parts and being kept past the end all cost Power (tuned so a starter who dies about five times a season loses about 10).
const DEATH_POW=2,LIMB_POW=3,HEAD_POW=10,KEEP_POW=15,PARTS=['la','ra','ll','rl','head'];
const PART_NAME={la:'left arm',ra:'right arm',ll:'left leg',rl:'right leg',head:'head'};
const zDmg=z=>(z.dmg||[]).reduce((a,b)=>a+b,0);
const hurtKeys=z=>PARTS.filter(k=>z.hurt&&z.hurt[k]);
const zInjPow=z=>hurtKeys(z).reduce((a,k)=>a+(k==='head'?HEAD_POW:LIMB_POW),0);
const zPenalty=z=>zDmg(z)+zInjPow(z)+(z.kept?KEEP_POW:0);
function zPower(z){return Math.max(1,Math.min(100,Math.round(30+13*zAvg(z)-(z.frail?12:0)-zPenalty(z))));}
function zEff(z,k){const s=z.st[k];return (s==null?-1.5:s)-(z.frail?0.9:0)-zPenalty(z)/13;}   // a non-Brainiac forced to throw is a bad passer
// Team Power: the average Player Power of your seven starters, with the quarterback counting one and a half times.
function teamPower(t){let n=0,sum=0;t.squad.forEach((z,i)=>{const w=i===0?1.5:1;sum+=zPower(z)*w;n+=w;});return Math.round(sum/n);}
const yourPower=teamPower;
function zValue(z){let v=z.frail?25:40;for(const S of zKeys(z))for(let i=0;i<z.st[S.k];i++)v+=TRAIN_COST[i];return v;}
const refundOf=z=>Math.round(zValue(z)*0.2);
function trainCost(s){return s>=SK_MAX?null:TRAIN_COST[s];}

// ----- small helpers (no DOM) -----
function lgRand(a,b){return a+Math.random()*(b-a);}
function lgPick(a){return a[Math.floor(Math.random()*a.length)];}
function lgShade(hex,k){const n=parseInt(hex.slice(1),16),f=c=>Math.max(0,Math.min(255,Math.round(k<0?c*(1+k):c+(255-c)*k)));
  return '#'+[n>>16,(n>>8)&255,n&255].map(f).map(c=>c.toString(16).padStart(2,'0')).join('');}
const NAMEBITS={
  zombie:{first:['Lefty','Two-Toe','Big','Mumbles','Crusty','Pale','Stinky','Hollow','Crooked','Grim','Slack-Jaw','Wormy','Drooly','Cold','Lumpy','Gnarly','Rusty','Patches'],
          last:['Grubb','McRot','Bonesworth','Mudd','Graves','Stiff','Marrow','Digger','Wormwood','Gristle','Coffin','Shroud','Maggot','Ashby','Rattles','Moldoon','Sludge','Cadaver']},
  mummy:{first:['Pharaoh','Old','Dusty','Sandy','Tut','Scarab','Ankh','Musty','Linty','Crumbly'],
         last:['Wraps','Bandages','Linen','Dunes','Sphinx','Natron','Gauze','Tomb','Papyrus','Sarcophagus']}};
NAMEBITS.zombie.wfirst=['Gertie','Mabel','Bertha','Agnes','Hattie','Maude','Edna','Opal','Nell','Ida','Greta','Ethel','Mildred','Winnie','Dot','Lottie'];
NAMEBITS.mummy.wfirst=['Nefer','Cleo','Merit','Tiye','Hettie','Dusty','Sandy','Ankha'];
// Every zombie rolls a look (skin and maybe hair), an idle animation and a quip. About a third are women, just as good as the men.
const SKINS={zombie:['#9fbf86','#8fb79a','#a9b98a','#93a98c','#b3c08a','#87a77a','#a7b4a0'],mummy:['#d8ccaa','#cfc29b','#e0d6bd','#c9bc98','#d6c7a0']};
const HAIRC=['#2b1d14','#3a2a1c','#5a3a1e','#7a2a1a','#8a8a80','#c9b27a','#4a5a2a','#d9d4c4'],HAIRS=['long','braids','pony','shag'];
const IDLES=['shuffle','twitch','chew','scratch','groove','drool'];
const QUIPS=['I came back for the brains. I stayed for the snacks.','Coach, I left my left arm in the car.','Point me at the end zone. Or the buffet.',
  "I've been dead three years. I'm still faster than you.","Don't mind the smell. That's my game face.",'I tackle first and ask questions never.',
  'Every day is game day when you never sleep.','I only drop the brain when I get hungry.',"I can catch anything. Except a cold. I'm already cold.",
  "Put me in, Coach. I'm dying to play. Again.",'Six feet under, ready to go.','I dug myself out for this. With my face.','Grrrrains. Sorry. BRAINS.',
  "I've got two good arms. For now.",'Just here to run and rot.','Best hands in the cemetery. Both still attached.',"I don't block. I lean.",
  "Tell them I'm coming. Slowly. But I'm coming.",'My last team buried me. Your turn.','Rest in peace? Never heard of it.','I bite. It says so in my contract.',
  'Who needs knees anyway?','I smell victory. Or that might be me.','Coffin naps. That is my secret.','Brains first, questions later.',
  'I was a kicker in my first life. Please forgive me.','Sign me and I will haunt the other team. Professionally.','My tombstone says MVP. I wrote it myself.',
  'I fall apart under pressure. Literally. Bring tape.','Moooooan. That means hello.'];
function lgLook(sp,w){const L={skin:lgPick(SKINS[sp]),idle:lgPick(IDLES),quip:lgPick(QUIPS)};
  if(w){L.w=1;L.hair={c:lgPick(HAIRC),s:lgPick(HAIRS)};}else if(Math.random()<0.15)L.hair={c:lgPick(HAIRC),s:'shag'};return L;}
function lgName(sp,w,used){let n,k=0;const B=NAMEBITS[sp];
  do{n=(w&&Math.random()<0.7?lgPick(B.wfirst):lgPick(B.first))+' '+lgPick(B.last);}while(used&&used.has(n)&&k++<50);if(used)used.add(n);return n;}
const NUM_RANGE=[[1,19],[20,49],[80,89],[80,89],[60,79],[60,79],[60,79]];   // QB, RB, two WRs, three linemen
function lgRoster(sp){const used=new Set(),nums=new Set();return NUM_RANGE.map(([a,b])=>{const w=Math.random()<0.3,n=lgName(sp,w,used);
  let num;do{num=a+Math.floor(Math.random()*(b-a+1));}while(nums.has(num));nums.add(num);return [n,num,lgLook(sp,w)];});}
// A rival's bench: cheap fill-ins with numbers in the 90s.
function lgBench(sp,n,roster){const used=new Set((roster||[]).map(p=>p[0]));return Array.from({length:n},(_,i)=>{const w=Math.random()<0.3;return [lgName(sp,w,used),90+i,lgLook(sp,w)];});}
// ----- your zombies: {id, name, num, kind, st:{skulls}, look, frail} -----
function zNew(kind,o){o=o||{};const w=o.w!=null?o.w:Math.random()<0.35,z={id:'z'+(CAREER?(CAREER.zid=(CAREER.zid||0)+1):Math.floor(Math.random()*1e9)),
  name:o.name||lgName('zombie',w,o.used),num:o.num||0,kind,st:{},look:o.look||lgLook('zombie',w)};
  if(o.frail)z.frail=1;const cap=o.cap||0,q=o.frail?0:lgRand(0,cap*0.7);
  for(const S of STATS)if(!S.qb||kind==='brain')z.st[S.k]=o.frail?0:Math.max(0,Math.min(cap,Math.round(q+lgRand(-0.9,0.9))));
  if(o.st)Object.assign(z.st,o.st);return z;}
function freeNum(u,kind){const used=new Set([...u.squad,...u.bench].map(z=>z.num)),R=KIND_NUMS[kind],all=[];
  for(const [a,b] of R)for(let n=a;n<=b;n++)if(!used.has(n))all.push(n);return all.length?lgPick(all):99;}

// ----- the schedule: each division rival twice (10 weeks) plus two games against the other division -----
function lgRoundRobin(ids){const t=ids.slice(),n=t.length,rounds=[];
  for(let r=0;r<n-1;r++){const wk=[];for(let i=0;i<n/2;i++){const a=t[i],b=t[n-1-i];wk.push((r+i)%2?[a,b]:[b,a]);}rounds.push(wk);t.splice(1,0,t.pop());}
  return rounds;}
function lgSchedule(){const A=[0,1,2,3,4,5].sort(()=>Math.random()-0.5),B=[6,7,8,9,10,11].sort(()=>Math.random()-0.5);
  const ra=lgRoundRobin(A),rb=lgRoundRobin(B),weeks=[];
  for(let r=0;r<5;r++)weeks.push([...ra[r],...rb[r]].map(([h,a])=>({h,a})));
  weeks.push(A.map((a,i)=>({h:a,a:B[i]})));                                            // week 6: across the league
  for(let r=0;r<5;r++)weeks.push([...ra[r],...rb[r]].map(([h,a])=>({h:a,a:h})));       // the return games, home and away swapped
  weeks.push(A.map((a,i)=>({h:B[(i+1)%6],a})));                                        // week 12: across the league again
  return weeks;}

// ----- the career -----
let CAREER=null;
// Your opening squad is the classic Graveyard Shift with no skulls yet, plus one Z-team body on the bench.
function squadFrom(roster,levels){const used=new Set(roster.map(p=>p[0]));
  return roster.map((p,i)=>{const L=levels&&levels[i],st={};if(L)for(const k in L)st[k]=Math.max(0,Math.min(SK_MAX,(L[k]|0)-1));
    return zNew(SLOT_KIND[i],{name:p[0],num:p[1],w:!!(p[2]&&p[2].w),look:Object.assign({idle:lgPick(IDLES),quip:lgPick(QUIPS)},p[2]||{}),cap:0,st,used});});}
function careerNew(){CAREER=null;
  const teams=LEAGUE.map((d,id)=>{const G0=GMS[d.gm]||GMS.tinkerer,roster=id===0?null:id===1?TEAMS_AWAY.players.map(p=>p.slice()):lgRoster(d.sp);
    return {id,power:id===0?30:Math.round(lgRand(26,40)),bones:0,spent:0,w:0,l:0,pf:0,pa:0,gm:d.gm||null,roster,bench:id===0?[]:lgBench(d.sp,G0.bench,roster)};});
  const c={v:CAREER_V,season:1,week:0,bones:0,spent:0,zid:0,teams,schedule:lgSchedule(),results:[],history:[],started:Date.now()};
  CAREER=c;const u=teams[0];u.squad=squadFrom(TEAMS_HOME.players);u.bench=[zNew(lgPick(['fresh','line']),{frail:1,num:90})];u.power=teamPower(u);c.capSeen=skullCap(0);
  CAREER=null;return c;}
// Older careers: round 1 had no stats, round 2 had levels 1 to 6 on a separate sheet. Both move to the zombie roster with skulls.
function careerMigrate(c){const u=c.teams[0];
  if(!u.squad){const prev=CAREER;CAREER=c;u.squad=squadFrom(u.roster||TEAMS_HOME.players,u.stats);u.bench=[zNew(lgPick(['fresh','line']),{frail:1,num:90})];CAREER=prev;delete u.roster;delete u.stats;}
  // Older saves lost the classic women's looks (Moanin' Mo, Mothball); give them back by name.
  for(const z of u.squad.concat(u.bench||[])){const h=TEAMS_HOME.players.find(p=>p[0]===z.name&&p[2]);if(h&&z.look&&!z.look.hair)Object.assign(z.look,h[2]);}
  for(const t of c.teams){if(t.id===0)continue;const sp=LEAGUE[t.id].sp;
    if(t.roster)t.roster.forEach(p=>{const h=t.id===1&&TEAMS_AWAY.players.find(q=>q[0]===p[0]&&q[2]);
      if(!p[2])p[2]=h?Object.assign(lgLook(sp,true),h[2]):lgLook(sp,Math.random()<0.3);else if(h&&!p[2].hair)Object.assign(p[2],h[2]);});
    if(!t.bench)t.bench=lgBench(sp,(GMS[t.gm]||GMS.tinkerer).bench,t.roster);}
  if(c.capSeen==null)c.capSeen=skullCap(c.spent);u.power=teamPower(u);}
function careerLoad(){if(CAREER)return CAREER;const c=store.get(CAREER_KEY,null);if(c&&c.v===CAREER_V&&c.teams&&c.teams.length===12){careerMigrate(c);CAREER=c;}return CAREER;}
function careerSave(){if(CAREER)store.set(CAREER_KEY,CAREER);}
function careerReset(){CAREER=null;try{localStorage.removeItem(CAREER_KEY);}catch(e){}}
function userTeam(){return CAREER.teams[0];}
function userGame(c,w){const wk=c.schedule[w];return wk&&wk.find(g=>g.h===0||g.a===0);}
function nextOpp(){const g=userGame(CAREER,CAREER.week);return g?(g.h===0?g.a:g.h):null;}
function favored(a,b){const d=a-b;return Math.abs(d)<3?'Dead even.':d>0?'You\'re favored.':'They\'re favored.';}

// A simulated game between two rivals: Team Power with a big helping of luck, plus a small home edge.
function lgSim(h,a){const T=CAREER.teams,ph=T[h].power+2,pa=T[a].power,p=1/(1+Math.exp(-(ph-pa)/7)),hw=Math.random()<p;
  const wt=2+Math.floor(Math.random()*4),lt=Math.floor(Math.random()*wt);const W=wt*7,L=lt*7;
  return {h,a,hs:hw?W:L,as:hw?L:W};}
function lgPay(t,won,tds){const b=(won?BONES.win:BONES.loss)+tds*BONES.td;t.bones+=b;return b;}
function lgApply(r){const T=CAREER.teams,H=T[r.h],A=T[r.a],hw=r.hs>r.as;
  H.pf+=r.hs;H.pa+=r.as;A.pf+=r.as;A.pa+=r.hs;if(hw){H.w++;A.l++;}else{A.w++;H.l++;}
  const bh=lgPay(H,hw,Math.floor(r.hs/7)),ba=lgPay(A,!hw,Math.floor(r.as/7));if(r.h===0)CAREER.bones+=bh;if(r.a===0)CAREER.bones+=ba;}
// Each rival General Manager spends by his own personality, with diminishing returns near the top, and every team wears down a little.
function lgGM(t){if(t.id===0)return;const G0=GMS[t.gm]||GMS.tinkerer;let spend=0,eff=G0.eff;
  if(G0.save){if(t.bones>=G0.save)spend=t.bones;}else spend=Math.floor(t.bones*G0.share);
  if(G0.swing)eff=Math.random()<0.3?1.6:0.6;
  if(spend>0){t.bones-=spend;t.spent+=spend;t.power+=spend/120*eff*Math.max(0.05,1-t.power/110);}
  t.power-=lgRand(0,G0.tough?0.3:0.6);t.power=Math.max(5,Math.min(99,t.power));}
function lgWeek(userResult){const c=CAREER,w=c.week,res=[];
  for(const g of c.schedule[w]){if(g.h===0||g.a===0){res.push(userResult);continue;}res.push(lgSim(g.h,g.a));}
  res.forEach(lgApply);c.teams.forEach(lgGM);c.results.push(res);c.week++;careerSave();return res;}
function standings(div){return CAREER.teams.filter(t=>LEAGUE[t.id].div===div).sort((a,b)=>(b.w-a.w)||((b.pf-b.pa)-(a.pf-a.pa))||(b.power-a.power));}
function seasonOver(){return CAREER.week>=CAREER.schedule.length;}
// ----- the playoffs: the top four in each division go on. Wild Card (1st hosts 4th, 2nd hosts 3rd), the Graveyard Championship
// (the division final, the higher seed hosts), then the Rot Bowl between the two division champions (the better record hosts). -----
const PO_NAME=['Wild Card','Graveyard Championship','Rot Bowl'],PO_BONES=[150,250,500];
const poWin=g=>g.hs>g.as?g.h:g.a,poLose=g=>g.hs>g.as?g.a:g.h,poPlayed=g=>g.hs!=null;
function poStart(){const c=CAREER;if(c.po)return c.po;
  c.po={round:0,seeds:[0,1].map(d=>standings(d).slice(0,4).map(t=>t.id)),games:[]};c.po.games.push(poPairs(c.po,0));careerSave();return c.po;}
function poSeed(po,id){for(const s of po.seeds){const i=s.indexOf(id);if(i>=0)return i+1;}return 0;}
function poBetter(a,b){const T=CAREER.teams,x=T[a],y=T[b];return ((y.w-x.w)||((y.pf-y.pa)-(x.pf-x.pa))||(y.power-x.power))<=0;}
function poPairs(po,r){if(r===0)return [0,1].flatMap(d=>{const s=po.seeds[d];return [{h:s[0],a:s[3],d},{h:s[1],a:s[2],d}];});
  if(r===1)return [0,1].map(d=>{const w=po.games[0].filter(g=>g.d===d).map(poWin).sort((a,b)=>poSeed(po,a)-poSeed(po,b));return {h:w[0],a:w[1],d};});
  const [x,y]=po.games[1].map(poWin);return [poBetter(x,y)?{h:x,a:y,d:-1}:{h:y,a:x,d:-1}];}
const poLive=()=>!!(CAREER.po&&CAREER.po.round<3);
function poUserGame(){const po=CAREER.po;return po&&po.round<3?po.games[po.round].find(g=>g.h===0||g.a===0)||null:null;}
// How far the Shift got: -1 missed the playoffs, 0 to 2 lost in that round, 3 won the Rot Bowl, null still alive.
function poFate(){const po=CAREER.po;if(!po||!po.seeds.some(s=>s.includes(0)))return -1;
  for(let r=0;r<3;r++){const g=po.games[r]&&po.games[r].find(g=>g.h===0||g.a===0);if(!g||!poPlayed(g))return null;if(poWin(g)!==0)return r;}return 3;}
function poPay(g,r){const T=CAREER.teams,w=poWin(g),l=poLose(g),ws=Math.max(g.hs,g.as),ls=Math.min(g.hs,g.as);
  const bw=PO_BONES[r]+Math.floor(ws/7)*BONES.td,bl=BONES.loss+Math.floor(ls/7)*BONES.td;T[w].bones+=bw;T[l].bones+=bl;
  if(w===0)CAREER.bones+=bw;if(l===0)CAREER.bones+=bl;}
// Play out the current round: your game's result if you're in it, simulated games for everyone else.
function poWeek(userResult){const c=CAREER,po=c.po;if(!po||po.round>2)return null;const r=po.round,games=po.games[r];
  for(const g of games){if(poPlayed(g))continue;const s=(g.h===0||g.a===0)&&userResult?userResult:lgSim(g.h,g.a);g.hs=s.hs;g.as=s.as;poPay(g,r);}
  c.teams.forEach(lgGM);po.round++;if(po.round<3)po.games.push(poPairs(po,po.round));else{po.champ=poWin(games[0]);po.divChamps=po.games[1].map(poWin);}
  careerSave();return games;}
function careerNextSeason(){const c=CAREER;
  const po=c.po,fate=po?poFate():-1;
  c.history.push({season:c.season,champs:po&&po.divChamps?po.divChamps:[0,1].map(d=>standings(d)[0].id),bowl:po&&po.champ!=null?po.champ:null,you:[userTeam().w,userTeam().l],po:fate});
  if(fate===3)c.bowls=(c.bowls||0)+1;
  c.season++;c.week=0;c.results=[];c.schedule=lgSchedule();delete c.po;
  for(const t of c.teams){t.w=t.l=t.pf=t.pa=0;if(t.id!==0)t.power=Math.min(99,t.power+1);}   // the whole league gets a little stronger
  for(const z of yourZombies())z.wear=(z.wear||0)+WEAR.season;lifeCheck();userTeam().power=teamPower(userTeam());   // a season of wear on your own zombies
  careerSave();}

// ----- putting a league team on the field: name, roster, colors and species for the engine's team slot 1 -----
const TEAMS_HOME=JSON.parse(JSON.stringify(TEAMS[0])),TEAMS_AWAY=JSON.parse(JSON.stringify(TEAMS[1]));
function lgStyle(id){const d=LEAGUE[id],B=ZSTYLE[d.sp];
  return Object.assign({},B,{jersey:d.jersey,jerseyDk:lgShade(d.jersey,-0.3),sock:d.jersey,helmet:lgShade(d.jersey,-0.12),helmetHi:lgShade(d.jersey,0.35),trim:d.trim,stripe:d.trim});}
function leagueApply(id){const d=LEAGUE[id],t=careerLoad()&&CAREER.teams[id];
  if(CAREER)TEAMS[0]=Object.assign({},TEAMS_HOME,{players:userTeam().squad.map(z=>[z.name,z.num,z.look])});
  TEAMS[1]=Object.assign({},TEAMS_AWAY,{name:d.name,jersey:d.jersey,trim:d.trim,skin:(d.sp==='zombie'?TEAMS_HOME:TEAMS_AWAY).skin,ez:lgShade(d.jersey,-0.45),players:t?t.roster.map(p=>p.slice()):lgRoster(d.sp)});
  TEAM_STYLE[1]=id===1?null:lgStyle(id);if(typeof PITCH!=='undefined')PITCH.seed=null;}
function leagueReset(){TEAMS[0]=JSON.parse(JSON.stringify(TEAMS_HOME));TEAMS[1]=JSON.parse(JSON.stringify(TEAMS_AWAY));TEAM_STYLE[0]=TEAM_STYLE[1]=null;if(typeof PITCH!=='undefined')PITCH.seed=null;}

// ----- the game itself: start your week's game, and book the result when it ends -----
const PO_CALL=["It's the Wild Card round! Win or go back in the ground!","The Graveyard Championship! The winner plays in the Rot Bowl!","Welcome to the ROT BOWL! One game for the whole graveyard!"];
function seasonPlay(){careerLoad();if(!CAREER)return;
  if(seasonOver()){const g=poUserGame();if(!g||poPlayed(g))return;const opp=g.h===0?g.a:g.h,r=CAREER.po.round;
    leagueApply(opp);startGame();G.season={season:CAREER.season,week:CAREER.week,opp,home:g.h===0,po:r};seasonStats();annStop();announce(PO_CALL[r],3);return;}
  const opp=nextOpp(),g=userGame(CAREER,CAREER.week);
  leagueApply(opp);startGame();G.season={season:CAREER.season,week:CAREER.week,opp,home:g.h===0};seasonStats();}
// Season stats on the field: your zombies from their skulls, the opponent's from its Team Power (with a little spread).
// Each side also brings its bench: when a starter is knocked out, the next bench zombie takes his slot at the next possession.
function skOf(z){const o={};for(const S of STATS)o[S.k]=skFactor(zEff(z,S.k));return o;}
function oppSk(power,frail){const L=Math.max(-2,Math.min(6,(power-30)/13))-(frail?0.9:0),o={};for(const S of STATS)o[S.k]=skFactor(L+lgRand(-0.3,0.3));return o;}
function seasonStats(){if(!G||!G.season||!careerLoad())return;const u=userTeam(),op=CAREER.teams[G.season.opp];
  G.teams[0].forEach((p,i)=>{const z=u.squad[i];if(z){p.sk=skOf(z);p.zid=z.id;}});
  G.teams[1].forEach(p=>{p.sk=oppSk(op.power);});
  G.season.benchList=[u.bench.map(z=>({name:z.name,num:z.num,look:z.look,sk:skOf(z),zid:z.id})),
    (op.bench||[]).map(b=>({name:b[0],num:b[1],look:b[2]||null,sk:oppSk(op.power,true)}))];
  if(!G.season.used)G.season.used=[0,0];if(!G.season.cas)G.season.cas={died:{},inj:{}};
  if(CAREER.fired){const nm=CAREER.fired,g=G;G.season.fired=nm;const up=o=>{for(const k in o)o[k]*=FIRED_UP;};G.teams[0].forEach(p=>p.sk&&up(p.sk));G.season.benchList[0].forEach(b=>up(b.sk));
    setTimeout(()=>{if(G===g&&G.season)announce(`The ${TEAMS[0].name} are fired up! They play this one for ${nm}.`,3);},5200);}}
function subApply(p,b,k){p.name=b.name;p.num=b.num;p.look=b.look;p.sk=b.sk;p.zid=b.zid;p.sub=k;}
// Called by the engine for each knocked-out zombie at the start of a possession. True means "handled": a sub came in, or the slot plays empty.
function seasonSubIn(p){const S=G.season;if(!S||!S.benchList)return false;const L=S.benchList[p.team];
  if(p.team===0&&p.zid){   // your side: the zombie who went down goes to the bench (out cold), the first fit zombie on the bench comes in
    benchOut(p);const on=new Set(G.teams[0].map(q=>q.zid)),k=L.findIndex(e=>!on.has(e.zid)&&!e.ko);
    if(k>=0){S.used[0]++;benchIn(p,k);announce(`${p.name} comes off the bench for the ${TEAMS[0].name}!`,2);return true;}}
  else{const k=S.used[p.team];
  if(k<L.length){S.used[p.team]++;subApply(p,L[k],k);p.out=false;p.ko=false;p.limbs={la:1,ra:1,ll:1,rl:1,head:1};
    announce(`${p.name} comes off the bench for the ${TEAMS[p.team].name}!`,2);return true;}}
  const n=G.teams[p.team].filter(q=>!q.out).length;
  if(!(S.short||(S.short={}))[p.team+':'+n]){S.short[p.team+':'+n]=1;announce(`No bench left! The ${TEAMS[p.team].name} play with ${n} until halftime.`,2);}
  return true;}
// Short-handed, down to a single zombie, never zero: if a whole side is out, the first one crawls back on.
function seasonFloor(){for(const t of [0,1]){const tm=G.teams[t];if(tm.some(p=>!p.out))continue;const p=tm[0];p.out=false;p.ko=false;p.limbs={la:1,ra:1,ll:1,rl:1,head:1};
  announce(`${p.name} crawls back on. Somebody has to play!`,2);}}
function seasonRestore(Snap){const S=G.season;if(!S)return;if(Snap.season&&Snap.season.used)S.used=Snap.season.used.slice();
  if(Snap.season&&Snap.season.bx){const L=S.benchList[0];Snap.season.bx.forEach((x,k)=>{   // starters the coach sat down, and who is hurt or out cold on the bench
    if(k>=L.length){const f=zFind(x.zid);if(!f)return;const sk=skOf(f.z);if(S.fired)for(const q in sk)sk[q]*=FIRED_UP;L.push({name:f.z.name,num:f.z.num,look:f.z.look,sk,zid:f.z.id,started:1});}
    const e=L[k];if(e&&e.zid===x.zid){e.limbs=x.limbs||null;e.ko=x.ko?1:0;e.played=x.played?1:0;}});}
  Snap.players.forEach((tm,t)=>tm.forEach((q,i)=>{const b=S.benchList&&q.sub>=0&&S.benchList[t][q.sub];if(b)subApply(G.teams[t][i],b,q.sub);}));}
// ----- timeouts: in a Season game the coach calls a timeout (Esc) and swaps zombies between the field and the bench, between plays.
// A zombie taken off keeps what it lost (fewer parts to stitch after the game if you pull it early); one that went down stays out cold.
// Starters who sit are added to the bench list, so they can go back in later. Halftime still heals only the zombies on the field.
function benchOut(p){const S=G.season,L=S.benchList[0];let k=L.findIndex(e=>e.zid===p.zid);
  if(k<0){L.push({name:p.name,num:p.num,look:p.look,sk:p.sk,zid:p.zid,started:1});k=L.length-1;}
  L[k].limbs=Object.assign({},p.limbs);L[k].ko=p.out?1:0;L[k].played=1;return k;}
function benchIn(p,k){const e=G.season.benchList[0][k];subApply(p,e,k);p.out=false;p.ko=false;e.played=1;
  p.limbs=e.limbs?Object.assign({},e.limbs):{la:1,ra:1,ll:1,rl:1,head:1};if(!p.limbs.head)p.limbs.head=1;}
function benchFree(){const on=new Set(G.teams[0].map(p=>p.zid));return G.season.benchList[0].map((e,k)=>({e,k})).filter(x=>!on.has(x.e.zid));}
function benchSwap(i,k){const S=G.season,p=G.teams[0][i],e=S&&S.benchList[0][k];if(!p||!e||G.teams[0].some(q=>q.zid===e.zid)||e.ko)return null;
  const out=p.name;benchOut(p);benchIn(p,k);S.swaps=(S.swaps||0)+1;return {out,in:p.name};}
function benchLost(limbs){return limbs?['la','ra','ll','rl'].filter(k=>!limbs[k]).length:0;}
function benchState(p){if(p.out)return 'out cold';const n=benchLost(p.limbs);return n?`${n} part${n>1?'s':''} missing`:'fit';}
function benchEntryState(e){if(e.ko)return 'out cold';const n=benchLost(e.limbs);return n?`${n} part${n>1?'s':''} missing`:(e.played?'rested':'fresh');}
function benchPower(zid){const f=zid&&zFind(zid);return f?zPower(f.z):null;}
// ----- spending: training, signing from the Graveyard, letting zombies go, and moving them between the bench and the lineup -----
function spend(c){CAREER.bones-=c;CAREER.spent+=c;}
function train(z,k){const s=z.st[k],c=trainCost(s);if(z.kept||c==null||s>=skullCap()||CAREER.bones<c)return false;
  spend(c);z.st[k]++;userTeam().power=teamPower(userTeam());careerSave();return true;}
function zFind(id){const u=userTeam();let i=u.squad.findIndex(z=>z.id===id);if(i>=0)return {z:u.squad[i],where:'squad',i};i=u.bench.findIndex(z=>z.id===id);return i>=0?{z:u.bench[i],where:'bench',i}:null;}
// Sign a corpse into a starting slot (the starter moves to the bench, or is let go if it's full) or straight onto the bench.
function sign(cz,slot){const u=userTeam(),price=zValue(cz),Y=CAREER.yard;if(CAREER.bones<price)return null;
  if(slot==='bench'){if(u.bench.length>=BENCH_MAX)return null;}else if(SLOT_KIND[slot]!==cz.kind)return null;
  spend(price);cz.num=freeNum(u,cz.kind);if(Y)Y.list=Y.list.filter(x=>x.id!==cz.id);let gone=null,refund=0;
  if(slot==='bench')u.bench.push(cz);
  else{const old=u.squad[slot];u.squad[slot]=cz;if(u.bench.length<BENCH_MAX)u.bench.push(old);else{gone=old;refund=refundOf(old);CAREER.bones+=refund;}}
  u.power=teamPower(u);careerSave();return {gone,refund};}
// Let a zombie go for 20% of his value. A starter can only go when a bench zombie of the same kind can take his spot.
function benchFor(i){const u=userTeam();return u.bench.findIndex(b=>b.kind===SLOT_KIND[i]);}
function release(id){const u=userTeam(),f=zFind(id);if(!f)return null;
  if(f.where==='bench')u.bench.splice(f.i,1);else{const j=benchFor(f.i);if(j<0)return null;u.squad[f.i]=u.bench.splice(j,1)[0];}
  const r=refundOf(f.z);CAREER.bones+=r;u.power=teamPower(u);careerSave();return r;}
function swapIn(benchId,slot){const u=userTeam(),j=u.bench.findIndex(z=>z.id===benchId);if(j<0||u.bench[j].kind!==SLOT_KIND[slot])return false;
  const b=u.bench[j];u.bench[j]=u.squad[slot];u.squad[slot]=b;u.power=teamPower(u);careerSave();return true;}
// The Graveyard's shelf: three to six corpses each week, from the shelves the Crypt has opened, plus one Z-team bench body.
function yardFresh(){const c=CAREER,at=c.season*100+c.week+(c.po?c.po.round+1:0);   // a new shelf every week, and every playoff round
  if(c.yard&&c.yard.at===at)return c.yard;
  const cap=skullCap(),n=3+Math.floor(Math.random()*4),kinds=['brain','fresh','fresh','line','line'],list=[];
  for(let i=0;i<n;i++)list.push(zNew(i===0?'brain':i===1?'fresh':i===2?'line':lgPick(kinds),{cap}));
  list.push(zNew(lgPick(['fresh','line','brain']),{frail:1}));
  c.yard={at,list:list.sort(()=>Math.random()-0.5)};careerSave();return c.yard;}
// ----- round 4: deaths, injuries, the Stitch Shop, the Witch Doctor and lifespan -----
// A zombie knocked out in a game has "died": he plays next week, but each death takes a lasting bite of Power and some lifespan.
// Parts lost in a game stay lost (halftime's quick patch-up only lasts the game) until the Stitch Shop sews them on, which also costs lifespan.
const STITCH={limb:5,head:25},WEAR={death:2,limb:1,head:5,season:6},WD_BASE=75,ACCIDENT=0.04,FIRED_UP=1.05;
const yourZombies=()=>{const u=userTeam();return u.squad.concat(u.bench);};
function lifeMax(z){return Math.round((z.frail?20:50)+zValue(z)/25);}   // better zombies, and pricier ones, last longer
const zLife=z=>Math.max(0,lifeMax(z)-(z.wear||0));
function lifeWord(z){if(z.kept)return 'kept, running on spite';const f=zLife(z)/lifeMax(z);return f<=0?"time's up":f<0.3?'fading':f<0.65?'worn':'spry';}
function lifeCheck(){const out=[];for(const z of yourZombies())if(!z.kept&&!z.end&&zLife(z)<=0){z.end=1;out.push(z);}return out;}
const pendingEnd=()=>yourZombies().filter(z=>z.end&&!z.kept);
function casLive(){return !!(G&&G.season)&&!['finale','ceremony','over','entrance','title','season','half'].includes(mode);}
function careerAfterGame(S){const u=userTeam(),cas=S.cas||{died:{},inj:{}},rep=[];
  const played=new Set(u.squad.map(z=>z.id).concat(S.benchList?S.benchList[0].filter((b,j)=>b.played||j<(S.used?S.used[0]:0)).map(b=>b.zid):[]));
  for(const z of yourZombies()){if(!played.has(z.id))continue;z.games=(z.games||0)+1;z.best=Math.max(z.best||0,zPower(z));
    const d=cas.died[z.id],inj=cas.inj[z.id],lost=inj?PARTS.filter(k=>inj[k]):[];let accident=false;
    if(d){(z.dmg||(z.dmg=[])).push(DEATH_POW);z.deaths=(z.deaths||0)+1;z.wear=(z.wear||0)+WEAR.death;
      if(lost.includes('head')&&Math.random()<ACCIDENT){z.wear=Math.max(z.wear,lifeMax(z));accident=true;}}
    if(lost.length){z.hurt=z.hurt||{};lost.forEach(k=>z.hurt[k]=1);}
    if(d||lost.length)rep.push({id:z.id,name:z.name,died:!!d,lost,accident});}
  const ended=lifeCheck();ended.forEach(z=>{const r=rep.find(x=>x.id===z.id);if(r)r.ended=true;else rep.push({id:z.id,name:z.name,died:false,lost:[],ended:true});});
  if(CAREER.fired)CAREER.fired=null;u.power=teamPower(u);return rep;}
function stitchCost(z){return hurtKeys(z).reduce((a,k)=>a+(k==='head'?STITCH.head:STITCH.limb),0);}
function stitchWear(z){return hurtKeys(z).reduce((a,k)=>a+(k==='head'?WEAR.head:WEAR.limb),0);}
const stitchTotal=()=>yourZombies().reduce((a,z)=>a+stitchCost(z),0);
function stitch(z,quiet){const c=stitchCost(z);if(!c||CAREER.bones<c)return false;spend(c);z.wear=(z.wear||0)+stitchWear(z);z.hurt={};lifeCheck();
  if(!quiet){userTeam().power=teamPower(userTeam());careerSave();}return true;}
function stitchAll(){const t=stitchTotal();if(!t||CAREER.bones<t)return false;for(const z of yourZombies())stitch(z,true);userTeam().power=teamPower(userTeam());careerSave();return true;}
const wdOpen=()=>cryptRank(CAREER.spent||0)>=3;   // the Witch Doctor sets up once the Crypt reaches rank 3
const wdCost=z=>WD_BASE*Math.pow(2,z.wd||0);
function witch(z){if(!wdOpen()||!(z.dmg&&z.dmg.length))return false;const c=wdCost(z);if(CAREER.bones<c)return false;
  spend(c);z.dmg.pop();z.wd=(z.wd||0)+1;userTeam().power=teamPower(userTeam());careerSave();return true;}
// When a lifespan runs out the coach decides: keep him (much weaker, no more training), retire him to the Mausoleum, or the Sacrifice.
function keepZ(z){z.kept=1;z.end=0;userTeam().power=teamPower(userTeam());careerSave();}
function plaqueOf(z,how){return {name:z.name,num:z.num,kind:z.kind,look:z.look,best:Math.max(z.best||0,zPower(z)),st:Object.assign({},z.st),games:z.games||0,deaths:z.deaths||0,season:CAREER.season,week:CAREER.week+1,how};}
// Take a zombie off the team. A starter's spot goes to a bench zombie of the same kind, or to a free Z-team walk-on.
function removeZ(id){const u=userTeam(),f=zFind(id);if(!f)return null;let walkOn=null;
  if(f.where==='bench')u.bench.splice(f.i,1);
  else{const j=benchFor(f.i);if(j>=0)u.squad[f.i]=u.bench.splice(j,1)[0];else{u.squad[f.i]=null;walkOn=zNew(SLOT_KIND[f.i],{frail:1});walkOn.free=1;walkOn.num=freeNum({squad:u.squad.filter(Boolean),bench:u.bench},walkOn.kind);u.squad[f.i]=walkOn;}}
  u.power=teamPower(u);return {z:f.z,walkOn,slot:f.where==='squad'?f.i:-1};}
function retireZ(id){const f=zFind(id);if(!f)return null;(CAREER.maus||(CAREER.maus=[])).push(plaqueOf(f.z,'retired'));const r=removeZ(id);careerSave();return r;}
// The Sacrifice pays Bones back: 20% to 60% of what the zombie is worth, more for a spry, healthy one, less for a worn-out has-been.
// A free Z-team walk-on pays nothing (or you could farm them). The team plays fired up next game either way.
function sacBones(z){if(!z||z.free)return 0;const lf=z.kept?0:Math.max(0,Math.min(1,zLife(z)/lifeMax(z))),pen=Math.min(1,zPenalty(z)/30);
  return Math.max(5,Math.round(zValue(z)*(0.2+0.28*lf+0.12*(1-pen))));}
function sacrificeZ(id){const f=zFind(id);if(!f||f.z.free)return null;const b=sacBones(f.z),pl=plaqueOf(f.z,'sacrificed');pl.bones=b;(CAREER.fallen||(CAREER.fallen=[])).push(pl);
  const r=removeZ(id);CAREER.bones+=b;r.bones=b;CAREER.fired=f.z.name;careerSave();return r;}
function seasonBook(){if(!G||!G.season||G.season.booked||!careerLoad())return null;const S=G.season;S.booked=true;
  if(CAREER.season!==S.season||CAREER.week!==S.week)return null;   // this week was already played some other way
  if(S.po!=null&&!(CAREER.po&&CAREER.po.round===S.po))return null;
  const [a,b]=G.score,r=S.home?{h:0,a:S.opp,hs:a,as:b}:{h:S.opp,a:0,hs:b,as:a};
  const before=CAREER.bones;S.report=careerAfterGame(S);const res=S.po!=null?poWeek(r):lgWeek(r);S.bones=CAREER.bones-before;S.tds=Math.floor(a/7);S.won=a>b;S.res=res;return S;}

// ----- screens -----
function seasonCSS(){if(document.getElementById('seasonCSS'))return;const s=document.createElement('style');s.id='seasonCSS';s.textContent=`
.sn-head{font-family:'Bangers';letter-spacing:1.5px;color:#f3c34b;font-size:28px;text-align:center;margin:-2px 0 10px}
.sn-bones{color:#efe6cf}.sn-bones b{color:#fff;font-weight:normal}
.sn-card{display:flex;align-items:stretch;gap:10px;margin:6px 0 10px}
.sn-team{flex:1;border-radius:10px;padding:8px 10px;text-align:center;border:2px solid rgba(0,0,0,.35)}
.sn-team .nm{font-family:'Bangers';font-size:28px;letter-spacing:1px;line-height:1.05}
.sn-team .pw{font-family:'Bangers';font-size:52px;line-height:1}
.sn-team .lb{font-size:18px;opacity:.85}
.sn-vs{align-self:center;font-family:'Creepster';font-size:34px;color:#9dff57}
.sn-verdict{text-align:center;font-size:24px;color:#dbe6cf;margin-bottom:12px}
.sn-tbl{width:100%;border-collapse:collapse;font-size:21px;margin-bottom:8px;table-layout:fixed}
.sn-tbl th:nth-child(2),.sn-tbl th:nth-child(3){width:46px}.sn-tbl th:nth-child(4){width:72px}.sn-tbl th:nth-child(5){width:92px}
.sn-tbl th{font-family:'Bangers';letter-spacing:1px;color:#f3c34b;font-weight:normal;text-align:right;padding:2px 6px;font-size:22px}
.sn-tbl th:first-child,.sn-tbl td:first-child{text-align:left}
.sn-tbl td{padding:3px 6px;text-align:right;border-top:1px solid #2a3a20;color:#dbe6cf}
.sn-tbl tr.you td{color:#fff;background:rgba(157,255,87,.12)}
.sn-dot{display:inline-block;width:14px;height:14px;border-radius:3px;margin-right:8px;vertical-align:-1px;border:1px solid rgba(0,0,0,.5)}
.sn-line{font-size:22px;color:#dbe6cf;text-align:center;line-height:1.45}
.sn-scores{font-size:20px;color:#cbd8bd;line-height:1.5;margin:6px 0 12px}
.sn-scores b{color:#fff;font-weight:normal}
.sn-pos{display:inline-block;min-width:96px;color:#f3c34b;font-size:22px;text-align:left}
#snSubMenu .mi .sub b{color:#fff;font-weight:normal}
#seasonMenu .mi,#snSubMenu .mi{font-size:30px}
#snSubMenu .mi.dis{opacity:.45}
.sn-kind{display:inline-block;min-width:124px;color:#9dff57;font-size:20px;text-align:left}
.sn-who{display:flex;gap:14px;align-items:center;margin:0 0 10px}
.sn-who canvas{width:200px;height:230px;flex:none;border-radius:10px;background:radial-gradient(ellipse at 50% 85%,#2c3d22 0%,#121a0e 70%);border:2px solid #2a3a20}
.sn-bio{flex:1;font-size:21px;color:#cbd8bd;line-height:1.4}
.sn-bio .pw{font-family:'Bangers';font-size:40px;color:#f3c34b;letter-spacing:1px;line-height:1}
.sn-bio .q{color:#efe6cf;font-style:italic;margin-top:6px}
.sn-sk{letter-spacing:1px;color:#efe6cf}.sn-sk i{font-style:normal;opacity:.22}
.sn-seed{display:inline-block;min-width:22px;color:#f3c34b;font-family:'Bangers';font-size:20px;text-align:left}
.sn-crypt{text-align:center;font-family:'Creepster';color:#9dff57;font-size:30px;margin:-4px 0 8px;letter-spacing:1px}
`;document.head.appendChild(s);}
function seasonDOM(){if(document.getElementById('season'))return;seasonCSS();
  const root=document.getElementById('title').parentNode;
  for(const id of ['season','snSub']){const o=document.createElement('div');o.id=id;o.className='overlay dim';
    o.innerHTML=`<div class="panel"><h1 id="${id}H"></h1><div id="${id}Body"></div><div id="${id==='season'?'seasonMenu':'snSubMenu'}" class="menu" style="margin:0 auto"></div></div>`;root.appendChild(o);}}
const teamDot=id=>`<span class="sn-dot" style="background:${LEAGUE[id].jersey}"></span>`;
const recStr=t=>`${t.w}–${t.l}`;
function seasonEsc(){if(SN.sub){(SN.back||seasonOpen)();return;}toTitle();}
const SN={sub:null,menu:null,sub2:null};
// One Menu per screen element, reused: a menu re-renders itself after its button runs, so a second Menu on the same element would paint over the new one.
function snMenu(k,id,items,keep){const m=SN[k];if(!m)return new Menu($(id),items);m.items=items;if(!keep||!items[m.i]||items[m.i].disabled)m.i=Math.max(0,items.findIndex(x=>!x.disabled&&!x.hidden));m.render();return m;}
function seasonOpen(){careerLoad();seasonDOM();leagueReset();annStop&&annStop();G=null;SN.sub=null;mode='season';
  if(!CAREER){$('seasonH').textContent='SEASON';
    $('seasonBody').innerHTML=`<div class="sn-line">Coach the <b style="color:#f3c34b">Graveyard Shift</b> through a 12-team zombie league. Win games, earn <b style="color:#efe6cf">Bones</b>, train your zombies and sign fresh corpses from the Graveyard to build a team that's all yours, against rivals who grow every week too.<br><br>Your career saves itself after every game.</div><br>`;
    SN.menu=snMenu('menu','seasonMenu',[{label:'Start My Career',act:()=>{CAREER=careerNew();careerSave();seasonOpen();}},{label:'Main Menu',act:()=>toTitle()}]);}
  else if(seasonOver()){poStart();if(poLive()){seasonPlayoffs();return;}seasonEndScreen();return;}
  else{const u=userTeam(),opp=nextOpp(),g=userGame(CAREER,CAREER.week),o=CAREER.teams[opp];
    $('seasonH').textContent=`SEASON ${CAREER.season}`;
    $('seasonBody').innerHTML=`<div class="sn-head">Week ${CAREER.week+1} of ${CAREER.schedule.length} &nbsp;·&nbsp; ${recStr(u)} &nbsp;·&nbsp; <span class="sn-bones">Bones <b>${CAREER.bones.toLocaleString()}</b></span></div>
      ${matchCard(opp,g.h===0)}
      <div class="sn-verdict">${favored(u.power,o.power)} ${g.h===0?'Home game.':'Road game.'}</div>${wdNews()}`;
    const due=pendingEnd()[0];
    SN.menu=snMenu('menu','seasonMenu',[
      {label:`Play Week ${CAREER.week+1}`,disabled:!!due,sub:due?`decide about ${due.name} first`:'',act:()=>seasonPlay()},
      ...snShops(),
      {label:'League Standings',act:()=>seasonStandings()},
      {label:'Last Week\'s Scores',hidden:!CAREER.results.length,act:()=>seasonScores(CAREER.results.length-1)},
      {label:'The Mausoleum',hidden:!((CAREER.maus||[]).length+(CAREER.fallen||[]).length),sub:'your hall of fame',act:()=>seasonMaus()},{label:'Main Menu',act:()=>toTitle()}]);}
  activeMenu=SN.menu;showOverlay('season');}
// The places you spend Bones, the same on the week screen and in the playoffs.
function snShops(){const due=pendingEnd()[0],parts=yourZombies().reduce((n,z)=>n+hurtKeys(z).length,0),wdz=yourZombies().filter(z=>z.dmg&&z.dmg.length).length;
  return [{label:`Time's up for ${due?due.name:''}`,hidden:!due,sub:'keep, retire to the Mausoleum, or the Sacrifice',act:()=>seasonEndOf(due.id)},{label:'Roster & Training',get sub(){return `Team Power ${Math.round(userTeam().power)} · ${CAREER.bones.toLocaleString()} Bones to spend`;},act:()=>seasonRoster()},
      {label:'The Graveyard',get sub(){const n=yardFresh().list.length;return `${n} fresh corpse${n===1?'':'s'} ${seasonOver()?'this round':'this week'}`;},act:()=>yardOpen()},
      {label:'The Stitch Shop',sub:parts?`${parts} part${parts===1?'':'s'} to sew back on · ${stitchTotal()} Bones`:'everyone is in one piece',act:()=>seasonStitch()},
      {label:'The Witch Doctor',hidden:!wdOpen(),sub:wdz?`${wdz} zombie${wdz===1?'':'s'} carry deaths she can erase`:'no deaths to erase right now',act:()=>seasonWitch()}];}
function matchCard(opp,home){const u=userTeam(),o=CAREER.teams[opp],D=LEAGUE[opp];
  return `<div class="sn-card"><div class="sn-team" style="background:${LEAGUE[0].jersey};color:#fff"><div class="nm">${LEAGUE[0].name}</div><div class="pw">${Math.round(u.power)}</div><div class="lb">Team Power · ${recStr(u)}</div></div>
      <div class="sn-vs">${home?'VS':'AT'}</div>
      <div class="sn-team" style="background:${D.jersey};color:${D.trim}"><div class="nm">${D.name}</div><div class="pw">${Math.round(o.power)}</div><div class="lb">Team Power · ${recStr(o)}</div></div></div>`;}
function standingsHTML(){return [0,1].map(d=>`<h2>${DIVS[d]}</h2><table class="sn-tbl"><tr><th>Team</th><th>W</th><th>L</th><th>+/-</th><th>Power</th></tr>${
  standings(d).map(t=>`<tr class="${t.id===0?'you':''}"><td>${teamDot(t.id)}${LEAGUE[t.id].name}</td><td>${t.w}</td><td>${t.l}</td><td>${t.pf-t.pa>0?'+':''}${t.pf-t.pa}</td><td>${Math.round(t.power)}</td></tr>`).join('')}</table>`).join('');}
function seasonSub(title,html,items,back,keep){seasonDOM();SN.sub=title;SN.back=back||null;$('snSubH').textContent=title;$('snSubBody').innerHTML=html;
  SN.sub2=snMenu('sub2','snSubMenu',items||[{label:'Back',act:()=>seasonOpen()}],keep);activeMenu=SN.sub2;mode='season';showOverlay('snSub');}
function statLine(z){return zKeys(z).map(S=>`${S.ab} <b>${z.st[S.k]}</b>`).join(' &nbsp;')+zTags(z);}
function zTags(z){const t=[],h=hurtKeys(z).length;if(z.end&&!z.kept)t.push('<b style="color:#ff7a5a">time\'s up</b>');else if(z.kept)t.push('kept');
  if(h)t.push(`<b style="color:#ff9a6a">${h} missing</b>`);if(z.deaths)t.push(`${z.deaths} death${z.deaths===1?'':'s'}`);return t.length?' · '+t.join(' · '):'';}
const skulls=n=>`<span class="sn-sk">${'☠'.repeat(n)}<i>${'☠'.repeat(SK_MAX-n)}</i></span>`;
const bonesHead=()=>`<span class="sn-bones">Bones <b>${CAREER.bones.toLocaleString()}</b></span>`;
// "The Crypt grows...": the only hint that spending opened a deeper shelf.
function wdNews(){if(!wdOpen()||CAREER.wdSeen)return '';CAREER.wdSeen=1;careerSave();return '<div class="sn-crypt">The Crypt grows... The Witch Doctor has opened her hut.</div>';}
function cryptLine(){const c=skullCap();if(c>(CAREER.capSeen||2)){CAREER.capSeen=c;careerSave();return '<div class="sn-crypt">The Crypt grows...</div>';}return '';}
function seasonRoster(keep){const u=userTeam();
  seasonSub('ROSTER & TRAINING',`${cryptLine()}<div class="sn-head">Team Power ${teamPower(u)} &nbsp;·&nbsp; ${bonesHead()}</div>
    <div class="sn-line" style="margin-bottom:10px">Pick a zombie to train or move. Every starter plays both ways; the bench fills in when one goes down.</div>`,
    [...u.squad.map((z,i)=>({label:`<span class="sn-pos">${POS[i]}</span>${z.name} #${z.num}`,sub:`Power <b>${zPower(z)}</b> · ${statLine(z)}`,act:()=>seasonPlayer(z.id)})),
     ...u.bench.map(z=>({label:`<span class="sn-pos">BENCH</span>${z.name} #${z.num}`,sub:`${KINDS[z.kind].name}${z.frail?' Z-team':''} · Power <b>${zPower(z)}</b> · ${statLine(z)}`,act:()=>seasonPlayer(z.id)})),
     {label:'The Graveyard',sub:`sign fresh corpses · bench ${u.bench.length} of ${BENCH_MAX}`,act:()=>yardOpen()},{label:'Back',act:()=>seasonOpen()}],null,keep);}
function bioHTML(z,extra){return `<div class="sn-who"><canvas id="snPort" width="400" height="460"></canvas><div class="sn-bio"><div class="pw">Power ${zPower(z)}</div>
  <div>${KINDS[z.kind].name}${z.frail?' (Z-team bench body)':''} · ${KINDS[z.kind].plays}</div>${extra||''}<div class="q">"${z.look.quip||'Brains.'}"</div></div></div>`;}
function healthHTML(z){const h=hurtKeys(z),lm=lifeMax(z);
  return `<div style="margin-top:4px">Lifespan <b>${zLife(z)}</b> of ${lm} · ${lifeWord(z)}</div>
    <div>${z.deaths?`Died ${z.deaths} time${z.deaths===1?'':'s'}${zDmg(z)?` (−${zDmg(z)} Power)`:''}`:'Never died (yet)'}${z.games?` · ${z.games} game${z.games===1?'':'s'}`:''}</div>
    ${h.length?`<div style="color:#ff9a6a">Missing: ${h.map(k=>PART_NAME[k]).join(', ')} (−${zInjPow(z)} Power)</div>`:''}${z.kept?`<div>Kept past the end: −${KEEP_POW} Power, no more training</div>`:''}`;}
function seasonPlayer(id,keep,armed){const f=zFind(id);if(!f){seasonRoster(true);return;}const u=userTeam(),z=f.z,cap=skullCap(),onBench=f.where==='bench';
  const where=onBench?'On the bench':POS[f.i];
  const items=zKeys(z).map(S=>{const s=z.st[S.k],c=trainCost(s);
    return {label:`${S.name} ${skulls(s)}`,disabled:!!z.kept,sub:z.kept?`${S.does} · kept zombies can't train`:c==null?`${S.does} · fully trained`:s>=cap?`${S.does} · can't go higher yet`:`${S.does} · next skull ${c} Bones${CAREER.bones<c?' (not enough)':''}`,
      act:()=>{if(train(z,S.k))sfx.cheer&&sfx.cheer();else sfx.groan&&sfx.groan();seasonPlayer(id,true);}};});
  if(onBench)u.squad.forEach((s0,i)=>{if(SLOT_KIND[i]===z.kind)items.push({label:`Start at ${POS[i]}`,sub:`swap with ${s0.name} (Power ${zPower(s0)})`,act:()=>{swapIn(z.id,i);sfx.select&&sfx.select();seasonPlayer(id,true);}});});
  else u.bench.forEach(b=>{if(b.kind===z.kind)items.push({label:`Swap with ${b.name}`,sub:`from the bench (Power ${zPower(b)})`,act:()=>{swapIn(b.id,f.i);seasonPlayer(id,true);}});});
  if(z.end&&!z.kept)items.unshift({label:`<b>Time's up</b>: decide`,sub:'keep, retire to the Mausoleum, or the Sacrifice',act:()=>seasonEndOf(z.id)});
  else if(z.kept)items.push({label:'Retire or Sacrifice',sub:'send this old-timer off',act:()=>seasonEndOf(z.id)});
  if(hurtKeys(z).length)items.push({label:`Stitch back on (${stitchCost(z)} Bones)`,disabled:CAREER.bones<stitchCost(z),sub:`${hurtKeys(z).map(k=>PART_NAME[k]).join(', ')} · costs ${stitchWear(z)} lifespan`,act:()=>{if(stitch(z))sfx.chomp&&sfx.chomp(0.5);seasonPlayer(id,true);}});
  const r=refundOf(z),canGo=onBench||benchFor(f.i)>=0;
  items.push({label:armed?`<b>Let ${z.name} go?</b> Press again`:`Let Go (+${r} Bones)`,disabled:!canGo,
    sub:!canGo?`a ${KINDS[z.kind].name} on the bench has to take this spot first`:armed?'this zombie is gone for good':'20% of this zombie\'s value back',
    act:()=>{if(!armed){seasonPlayer(id,true,true);return;}if(release(z.id)!=null){sfx.groan&&sfx.groan();seasonRoster(true);}}});
  items.push({label:'Back to Roster',act:()=>seasonRoster(true)});
  seasonSub(`${z.name.toUpperCase()} #${z.num}`,`<div class="sn-head">${where} &nbsp;·&nbsp; ${bonesHead()}</div>${bioHTML(z,healthHTML(z))}`,items,()=>seasonRoster(true),keep);
  snPortrait(z,onBench?KINDS[z.kind].body:BODY_OF[f.i]);}
// ----- round 4 screens: the Stitch Shop, the Witch Doctor, the end of a lifespan, and the Mausoleum -----
function bodyFor(z){const f=zFind(z.id);return f&&f.where==='squad'?BODY_OF[f.i]:KINDS[z.kind].body;}
function seasonStitch(keep){const hurt=yourZombies().filter(z=>hurtKeys(z).length),t=stitchTotal();
  seasonSub('THE STITCH SHOP',`<div class="sn-head">${bonesHead()}</div>
    <div class="sn-line" style="margin-bottom:10px">${hurt.length?'Needle, thread and a staple gun. Missing parts cost Power until they\'re sewn back on, and every stitch costs a little lifespan.':'Nobody is missing anything. Come back after the next game.'}</div>`,
    [...(hurt.length>1?[{label:`Sew everyone (${t} Bones)`,disabled:CAREER.bones<t,sub:CAREER.bones<t?'not enough Bones for everyone':`${hurt.length} zombies, all in one go`,act:()=>{if(stitchAll())sfx.chomp&&sfx.chomp(0.5);seasonStitch(true);}}]:[]),
     ...hurt.map(z=>({label:`${z.name} #${z.num}`,disabled:CAREER.bones<stitchCost(z),sub:`${hurtKeys(z).map(k=>PART_NAME[k]).join(', ')} · ${stitchCost(z)} Bones · ${stitchWear(z)} lifespan`,
       act:()=>{if(stitch(z))sfx.chomp&&sfx.chomp(0.5);seasonStitch(true);}})),{label:'Back',act:()=>seasonOpen()}],()=>seasonOpen(),keep);}
function seasonWitch(keep){const list=yourZombies().filter(z=>z.dmg&&z.dmg.length);
  seasonSub('THE WITCH DOCTOR',`<div class="sn-head">${bonesHead()}</div>
    <div class="sn-line" style="margin-bottom:10px">She rattles her bones and erases the Power a zombie lost in the most recent death. Each visit for the same zombie costs double.</div>`,
    [...list.map(z=>({label:`${z.name} #${z.num}`,disabled:CAREER.bones<wdCost(z),sub:`erase the last death · +${z.dmg[z.dmg.length-1]} Power · ${wdCost(z)} Bones${CAREER.bones<wdCost(z)?' (not enough)':''}`,
       act:()=>{if(witch(z))sfx.cheer&&sfx.cheer();seasonWitch(true);}})),...(list.length?[]:[{label:'Nobody to fix',disabled:true,sub:'no deaths to erase right now'}]),{label:'Back',act:()=>seasonOpen()}],()=>seasonOpen(),keep);}
function seasonEndOf(id,armed){const f=zFind(id);if(!f){seasonOpen();return;}const z=f.z,u=userTeam(),slot=f.where==='squad'?f.i:-1;
  const fill=slot<0?'':benchFor(slot)>=0?`${u.bench[benchFor(slot)].name} moves up from the bench`:'a free Z-team walk-on takes the spot';
  const items=[];
  if(!z.kept)items.push({label:'Keep',sub:`plays on at −${KEEP_POW} Power and can't train any more`,act:()=>{keepZ(z);sfx.groan&&sfx.groan();seasonPlayer(id,true);}});
  items.push({label:armed==='r'?'<b>Into the Mausoleum?</b> Press again':'Retire to the Mausoleum',sub:armed==='r'?fill||'a plaque in your hall of fame':`a plaque in your hall of fame${fill?' · '+fill:''}`,
    act:()=>{if(armed!=='r'){seasonEndOf(id,'r');return;}const r=retireZ(id);if(r)seasonRetired(r);}});
  if(!z.free)items.push({label:'The Sacrifice',sub:`Madame Morgue pays ${sacBones(z)} Bones at the Altar, and the team plays fired up next game`,
    act:()=>{if(typeof altarGo==='function'){sfx.select&&sfx.select();yardOpen();altarGo(id);return;}const r=sacrificeZ(id);if(r)seasonSacrificed(r);}});
  items.push({label:'Back',act:()=>seasonOpen()});
  seasonSub(z.kept?`${z.name.toUpperCase()}, KEPT`:`TIME'S UP FOR ${z.name.toUpperCase()}`,`<div class="sn-head">${slot<0?'On the bench':POS[slot]} &nbsp;·&nbsp; ${bonesHead()}</div>${bioHTML(z,healthHTML(z))}
    <div class="sn-line">${z.kept?'Still shambling. When you\'re ready, send this old-timer off.':`${z.name}'s lifespan has run out. The choice is yours.`}</div>`,items,()=>seasonOpen(),!!armed);
  snPortrait(z,bodyFor(z));}
function walkOnLine(r){return r.walkOn?`<br>${r.walkOn.name}, a Z-team walk-on, takes the spot at ${POS[r.slot]} for free.`:r.slot>=0?`<br>${userTeam().squad[r.slot].name} moves up from the bench.`:'';}
function seasonRetired(r){const z=r.z;sfx.cheer&&sfx.cheer();
  seasonSub('INTO THE MAUSOLEUM',`${bioHTML(z)}<div class="sn-line">${z.name} #${z.num} retires with a plaque in your hall of fame: best Power ${Math.max(z.best||0,zPower(z))}, ${z.games||0} games, ${z.deaths||0} deaths.${walkOnLine(r)}</div>`,
    [{label:'Season Home',act:()=>seasonOpen()},{label:'The Mausoleum',act:()=>seasonMaus()}],()=>seasonOpen());
  snPortrait(z,KINDS[z.kind].body);}
function seasonSacrificed(r){const z=r.z;sfx.groan&&sfx.groan();
  seasonSub('THE SACRIFICE',`${bioHTML(z)}<div class="sn-line">Hands burst from the grave and pull ${z.name} under, proud to the last. The Graveyard Shift will play fired up next game.${walkOnLine(r)}</div>`,
    [{label:'Season Home',act:()=>seasonOpen()}],()=>seasonOpen());
  snPortrait(z,KINDS[z.kind].body,{bury:1});}
function seasonMaus(){const M=CAREER.maus||[],F=CAREER.fallen||[];
  seasonSub('THE MAUSOLEUM',`<div class="sn-line" style="margin-bottom:10px">Your hall of fame: zombies retired with honor, and the ones who gave everything for the team.</div>`,
    [...M.map((p,i)=>({label:`<span class="sn-kind">RETIRED</span>${p.name} #${p.num}`,sub:`${KINDS[p.kind].name} · best Power ${p.best} · ${p.games} games · Season ${p.season}`,act:()=>seasonPlaque(p)})),
     ...F.map(p=>({label:`<span class="sn-kind">FELL</span>${p.name} #${p.num}`,sub:`${KINDS[p.kind].name} · best Power ${p.best} · the Sacrifice, Season ${p.season}`,act:()=>seasonPlaque(p)})),
     {label:'Back',act:()=>seasonOpen()}],()=>seasonOpen());}
function seasonPlaque(p){const z={id:'p'+p.num,name:p.name,num:p.num,kind:p.kind,look:p.look,st:p.st};
  const sk=zKeys(z).map(S=>`<div>${S.name} ${skulls(z.st[S.k])}</div>`).join('');
  seasonSub(`${p.name.toUpperCase()} #${p.num}`,`<div class="sn-who"><canvas id="snPort" width="400" height="460"></canvas><div class="sn-bio"><div class="pw">Best Power ${p.best}</div>
    <div>${KINDS[p.kind].name} · ${p.games} games · ${p.deaths} deaths</div><div>${p.how==='retired'?'Retired':'The Sacrifice'}, Season ${p.season} Week ${p.week}</div><div style="margin-top:4px">${sk}</div><div class="q">"${p.look&&p.look.quip||'Brains.'}"</div></div></div>`,
    [{label:'Back to the Mausoleum',act:()=>seasonMaus()}],()=>seasonMaus());
  snPortrait(z,KINDS[p.kind].body,{still:1});}
// ----- the portrait: the zombie standing on his grave, doing his idle (shuffling, twitching, chewing a bone, scratching, grooving, drooling) -----
const PORT={tok:0};
function snPortrait(z,body,opt){const tok=++PORT.tok,t0=performance.now();PORT.z=z;PORT.body=body||'qb';PORT.opt=opt||{};
  const step=()=>{if(tok!==PORT.tok)return;const cv=document.getElementById('snPort');if(!cv||!cv.isConnected||mode!=='season')return;
    try{drawPort(cv,(performance.now()-t0)/1000);}catch(e){}requestAnimationFrame(step);};requestAnimationFrame(step);}
function drawPort(cv,t){const c=cv.getContext('2d'),z=PORT.z,W=cv.width,H=cv.height,B=ZBODY[PORT.body]||ZBODY.qb;c.clearRect(0,0,W,H);
  c.fillStyle='#55585e';c.strokeStyle='#1b1a17';c.lineWidth=4;c.beginPath();c.moveTo(W*0.62,H*0.84);c.lineTo(W*0.62,H*0.38);c.arc(W*0.77,H*0.38,W*0.15,Math.PI,0);c.lineTo(W*0.92,H*0.84);c.closePath();c.fill();c.stroke();
  c.fillStyle='#2b2d31';c.font='bold 30px Arial';c.textAlign='center';c.fillText('RIP',W*0.77,H*0.46);
  const O=PORT.opt||{},bury=O.bury?Math.min(1,Math.max(0,(t-0.8)/2.4)):0;if(O.bury){c.font='bold 22px Arial';c.fillText('#'+(z.num||''),W*0.77,H*0.53);}
  c.fillStyle='#3b2a1a';c.beginPath();c.ellipse(W*0.5,H*0.9,W*0.46,H*0.07,0,0,7);c.fill();
  const size=H*0.62,x=W*0.42,y=H*0.88,idle=z.look.idle||'shuffle',seed=parseInt(String(z.id).replace(/\D/g,''))||1;
  const lm={la:1,ra:1,ll:1,rl:1,head:1};if(z.hurt)for(const k of PARTS)if(z.hurt[k])lm[k]=0;
  const o={look:z.look,team:ZSTYLE.zombie,body:PORT.body,view:'front',flip:false,phase:0,speed:0,limbs:lm,pose:'stand',num:z.num||'',t:O.still?0:t,seed,ball:false};
  c.save();
  if(O.bury){c.beginPath();c.rect(0,0,W,y-H*0.005);c.clip();c.translate(0,bury*bury*size*1.15);if(bury>0&&bury<1)c.translate(Math.sin(t*40)*3,0);}
  if(O.still)t=0;
  if(idle==='shuffle'){o.pose='zombie';o.speed=0.3;o.phase=t*3.2;c.translate(Math.sin(t*1.6)*W*0.04,0);}
  else if(idle==='twitch'){const k=(t+seed*0.3)%1.6;if(k<0.18){c.translate(x,y);c.rotate(Math.sin(k*70)*0.1);c.translate(-x,-y);}}
  else if(idle==='chew'){o.pose='dance';o.prop='bone';o.dj={la:[0.2,0.3],ra:[0.6+Math.sin(t*6)*0.08,2.5]};}
  else if(idle==='scratch'){o.pose='dance';o.dj={la:[2.75,1.3+Math.sin(t*16)*0.25],ra:[0.2,0.3]};}
  else if(idle==='groove'){const b=Math.sin(t*4);o.pose='dance';o.dj={la:[1.2+b*0.4,1.0],ra:[1.2-b*0.4,1.0],tilt:Math.sin(t*2)*0.12,hx:Math.sin(t*2)*5,sq:0.1+0.1*Math.abs(b),air:Math.abs(Math.sin(t*4))*4};}
  drawZombie(c,x,y,size,o);
  if(idle==='drool'){const k=size/100,my=y-k*(B.leg+B.torso+19*B.head-21*B.head*0.75),mx=x+k*2,d=(t*0.6)%1;
    c.fillStyle='rgba(200,230,150,0.85)';c.beginPath();c.ellipse(mx,my+d*k*30,k*1.6,k*(2+d*2),0,0,7);c.fill();}
  c.restore();
  if(O.bury){const k=size/100;   // the grave's hands, then the dirt settling
    for(const sx of [-1,1]){const up=Math.sin(Math.min(1,t/0.8)*Math.PI/2)*(1-Math.max(0,bury-0.7)/0.3),hx=x+sx*k*22,hy=y-up*k*26;
      c.fillStyle='#7fa06a';c.strokeStyle='#1b1a17';c.lineWidth=3;c.beginPath();c.rect(hx-k*3,hy,k*6,up*k*26);c.fill();c.stroke();
      for(let f=0;f<4;f++){c.beginPath();c.ellipse(hx+(f-1.5)*k*2.4,hy-k*2,k*1.2,k*3,0,0,7);c.fill();c.stroke();}}
    if(bury>0&&bury<1)for(let i=0;i<6;i++){const a=(t*3+i)%1;c.fillStyle='#5a3f26';c.beginPath();c.arc(x+(i-2.5)*k*9,y-a*(1-a)*k*40,k*2,0,7);c.fill();}
    if(bury>=1){c.fillStyle='#4a3320';c.beginPath();c.ellipse(x,y-k*2,k*30,k*6,0,Math.PI,0);c.fill();}}}
function seasonStandings(){seasonSub('STANDINGS',standingsHTML());}
function scoresHTML(res,skipYou){return res.filter(r=>!(skipYou&&(r.h===0||r.a===0))).map(r=>{const hw=r.hs>r.as,w=hw?r.h:r.a,l=hw?r.a:r.h,ws=Math.max(r.hs,r.as),ls=Math.min(r.hs,r.as);
  return `${teamDot(w)}<b>${LEAGUE[w].name} ${ws}</b>, ${LEAGUE[l].name} ${ls}`;}).join('<br>');}
function seasonScores(w){seasonSub(`WEEK ${w+1} SCORES`,`<div class="sn-scores">${scoresHTML(CAREER.results[w],false)}</div>`);}
function casualtyHTML(rep){if(!rep||!rep.length)return '';
  const line=r=>{const b=[];if(r.died)b.push(`died (−${DEATH_POW} Power)`);if(r.lost.length)b.push('lost the '+r.lost.map(k=>PART_NAME[k]).join(' and the '));
    if(r.accident)b.push('and the fall ended a lifespan early');if(r.ended&&!r.accident)b.push(b.length?'and the lifespan has run out':'has reached the end of the lifespan');return `<b>${r.name}</b> ${b.join(', ')}.`;};
  const sew=rep.some(r=>r.lost.length),end=rep.filter(r=>r.ended);
  return `<h2>The damage</h2><div class="sn-scores">${rep.map(line).join('<br>')}${sew?'<br><i style="color:#aab79c">The Stitch Shop can sew missing parts back on.</i>':''}${end.length?`<br><i style="color:#ff9a6a">Time's up for ${end.map(r=>r.name).join(' and ')}. Decide on the Season screen.</i>`:''}</div>`;}
function seasonWeekScreen(S){const pay=S.won?BONES.win:BONES.loss;
  seasonSub(S.won?'A WIN FOR THE SHIFT!':'BACK TO THE GRAVE',
    `<div class="sn-line">+${S.bones} Bones: ${pay} for the ${S.won?'win':'game'}${S.tds?` and ${S.tds*BONES.td} for ${S.tds} touchdown${S.tds>1?'s':''}`:''}.<br>Record ${recStr(userTeam())} &nbsp;·&nbsp; Bones ${CAREER.bones.toLocaleString()}${CAREER.bones>=50?'<br><i style="color:#aab79c">Spend them on training, or on fresh corpses in the Graveyard.</i>':''}</div>
     ${casualtyHTML(S.report)}<h2>Around the league</h2><div class="sn-scores">${scoresHTML(S.res,true)}</div>`,
    [{label:seasonOver()?'On to the Playoffs':'Continue',act:()=>seasonOpen()},{label:'Main Menu',act:()=>toTitle()}]);}
// ----- playoff screens -----
const seedTag=id=>{const n=CAREER.po?poSeed(CAREER.po,id):0;return n?`<span class="sn-seed">${n}</span>`:'';};
function poGameHTML(g){if(!poPlayed(g))return `${seedTag(g.h)}${teamDot(g.h)}${LEAGUE[g.h].name} <span style="color:#9dff57">vs</span> ${seedTag(g.a)}${teamDot(g.a)}${LEAGUE[g.a].name}`;
  const w=poWin(g),l=poLose(g);return `${seedTag(w)}${teamDot(w)}<b>${LEAGUE[w].name} ${Math.max(g.hs,g.as)}</b>, ${LEAGUE[l].name} ${Math.min(g.hs,g.as)}`;}
function bracketHTML(){const po=CAREER.po;if(!po)return '';
  return po.games.map((gs,r)=>`<h2>${r<2?PO_NAME[r]:'The Rot Bowl'}</h2><div class="sn-scores">${
    r<2?[0,1].map(d=>`<span style="color:#f3c34b">${DIVS[d]}</span><br>${gs.filter(g=>g.d===d).map(poGameHTML).join('<br>')}`).join('<br>'):gs.map(poGameHTML).join('<br>')}</div>`).join('');}
const PO_NEXT=['Win and you play for the Graveyard Championship.','Win and you play in the Rot Bowl.','Win and the whole graveyard is yours.'];
function seasonPlayoffs(){const po=CAREER.po,r=po.round,g=poUserGame(),fate=poFate(),u=userTeam(),due=pendingEnd()[0];
  $('seasonH').textContent=`SEASON ${CAREER.season} PLAYOFFS`;
  const head=`<div class="sn-head">${r<2?PO_NAME[r]:'The Rot Bowl'} &nbsp;·&nbsp; ${recStr(u)} &nbsp;·&nbsp; ${bonesHead()}</div>`;
  let body,items;
  if(g){const opp=g.h===0?g.a:g.h,o=CAREER.teams[opp];
    body=`${head}${matchCard(opp,g.h===0)}<div class="sn-verdict">${favored(u.power,o.power)} ${g.h===0?'Home game.':'Road game.'}<br>${PO_NEXT[r]} A win pays ${PO_BONES[r]} Bones.</div>${wdNews()}`;
    items=[{label:`Play the ${PO_NAME[r]}`,disabled:!!due,sub:due?`decide about ${due.name} first`:'',act:()=>seasonPlay()}];}
  else{const why=fate===-1?`The ${LEAGUE[0].name} missed the playoffs this year.`:`The ${LEAGUE[0].name} went out in the ${PO_NAME[fate]}.`;
    body=`${head}<div class="sn-line">${why} Rest up, spend your Bones, and see who takes the Rot Bowl.</div>${bracketHTML()}`;
    items=[{label:`Watch the ${PO_NAME[r]}`,sub:'the other teams play it out',act:()=>poWatch()},
      {label:'Skip to the Rot Bowl winner',hidden:r>=2,act:()=>{while(poLive())poWeek(null);seasonOpen();}}];}
  $('seasonBody').innerHTML=body;
  SN.menu=snMenu('menu','seasonMenu',[...items,...snShops(),
    {label:'The Bracket',hidden:!g,act:()=>seasonSub('THE BRACKET',bracketHTML())},
    {label:'League Standings',act:()=>seasonStandings()},
    {label:'The Mausoleum',hidden:!((CAREER.maus||[]).length+(CAREER.fallen||[]).length),sub:'your hall of fame',act:()=>seasonMaus()},{label:'Main Menu',act:()=>toTitle()}]);
  activeMenu=SN.menu;showOverlay('season');}
// A round you're not in: the other teams play it, and you see the scores.
function poWatch(){const r=CAREER.po.round,res=poWeek(null);
  seasonSub(r<2?PO_NAME[r].toUpperCase():'THE ROT BOWL',`<div class="sn-scores">${res.map(poGameHTML).join('<br>')}</div>${r===2?`<div class="sn-crypt">${LEAGUE[CAREER.po.champ].name} win the Rot Bowl!</div>`:''}`,
    [{label:'Continue',act:()=>seasonOpen()},{label:'Main Menu',act:()=>toTitle()}]);}
const PO_WON=['ON TO THE CHAMPIONSHIP!','ON TO THE ROT BOWL!','ROT BOWL CHAMPIONS!'],PO_LOST=['ONE AND DONE','SO CLOSE','ROT BOWL RUNNERS-UP'];
function poResultScreen(S){const r=S.po,pay=S.won?PO_BONES[r]:BONES.loss,others=S.res.filter(g=>!(g.h===0||g.a===0));
  const line=S.won?(r===2?`The ${LEAGUE[0].name} win the Rot Bowl! Season ${S.season} belongs to you.`:`${PO_NEXT[r].replace('Win and you play','Next you play')}`):
    `The ${LEAGUE[0].name} are out. There's always next season, and your zombies keep everything they learned.`;
  seasonSub(S.won?PO_WON[r]:PO_LOST[r],
    `${S.won&&r===2?'<div class="sn-crypt">☠ ROT BOWL CHAMPIONS ☠</div>':''}<div class="sn-line">${line}<br>+${S.bones} Bones: ${pay} for the ${S.won?PO_NAME[r]+' win':'game'}${S.tds?` and ${S.tds*BONES.td} for ${S.tds} touchdown${S.tds>1?'s':''}`:''}.<br>Bones ${CAREER.bones.toLocaleString()}</div>
     ${casualtyHTML(S.report)}${others.length?`<h2>Around the playoffs</h2><div class="sn-scores">${others.map(poGameHTML).join('<br>')}</div>`:''}`,
    [{label:'Continue',act:()=>seasonOpen()},{label:'Main Menu',act:()=>toTitle()}]);}
function seasonEndScreen(){const u=userTeam(),st=standings(0),place=st.findIndex(t=>t.id===0)+1,ord=['','1st','2nd','3rd','4th','5th','6th'][place];
  const po=CAREER.po,fate=poFate(),champ=po&&po.champ!=null?po.champ:null,divs=po&&po.divChamps?po.divChamps:[0,1].map(d=>standings(d)[0].id);
  const you=fate===3?'and won the Rot Bowl!':fate===-1?'and missed the playoffs.':fate===2?'and lost in the Rot Bowl.':`and went out in the ${PO_NAME[fate]}.`;
  seasonSub(`SEASON ${CAREER.season} IS OVER`,
    `${champ!=null?`<div class="sn-crypt">${LEAGUE[champ].name} win the Rot Bowl!</div>`:''}<div class="sn-line">You finished <b style="color:#f3c34b">${ord}</b> in the ${DIVS[0]} at ${recStr(u)}, ${you}<br>${divs.map(id=>`${teamDot(id)}${LEAGUE[id].name} won the ${DIVS[LEAGUE[id].div]} title`).join('<br>')}</div>${bracketHTML()}${standingsHTML()}`,
    [{label:`Start Season ${CAREER.season+1}`,act:()=>{careerNextSeason();seasonOpen();}},{label:'Main Menu',act:()=>toTitle()}]);}
function seasonLabel(){const c=careerLoad();if(!c)return 'start a career in the Zombie League';const u=c.teams[0];
  if(seasonOver()&&c.po&&c.po.round<3)return `Season ${c.season} Playoffs · ${PO_NAME[c.po.round]}`;
  return seasonOver()?`Season ${c.season} is over · ${recStr(u)}`:`Season ${c.season} · Week ${c.week+1} · ${recStr(u)}`;}

// ----- hooks into the game: the end-of-game screen, and the career reset in Settings -----
const OVER_ITEMS=overMenu.items;
{const base=gameOver;gameOver=function(){base();
  if(G&&G.season){const S=seasonBook();overMenu.items=[{label:'Season Results',act:()=>{if(S)(S.po!=null?poResultScreen:seasonWeekScreen)(S);else seasonOpen();}},{label:'Main Menu',act:()=>toTitle()}];
    if(S)$('overStats').innerHTML+=`<br>Season record: ${recStr(userTeam())} &nbsp;·&nbsp; +${S.bones} Bones`;}
  else overMenu.items=OVER_ITEMS;
  overMenu.i=0;overMenu.render();};}
// Season casualties: who on your side died and which parts flew off. Halftime's patch-up heals the zombies on the field for the rest of the game.
{const k0=knockOut;knockOut=function(p,why){if(p&&!p.out&&p.team===0&&p.zid&&casLive())G.season.cas.died[p.zid]=1;return k0(p,why);};}
{const r0=removeLimb;removeLimb=function(p,k){if(p&&p.limbs&&p.limbs[k]&&!p.out&&p.team===0&&p.zid&&casLive()){const c=G.season.cas;(c.inj[p.zid]||(c.inj[p.zid]={}))[k]=1;if(k==='head')c.died[p.zid]=1;}return r0(p,k);};}
{const h0=secondHalf;secondHalf=function(){if(G&&G.season&&G.season.cas)for(const p of G.teams[0])if(p.zid)delete G.season.cas.inj[p.zid];
  if(G&&G.season&&G.season.benchList)for(const e of G.season.benchList[0])e.ko=0;   // the ones out cold on the bench can play again after the break
  return h0();};}
{let armed=0;const it={label:()=>armed>performance.now()?'<b>Bury this career?</b> Press again':'Reset Season Career',get hidden(){return !careerLoad();},
  sub:()=>armed>performance.now()?'your whole Season career will be gone':'start your Season career over',
  act:()=>{if(armed>performance.now()){careerReset();armed=0;sfx.groan&&sfx.groan();}else armed=performance.now()+4000;}};
  settingsMenu.items.splice(settingsMenu.items.length-1,0,it);settingsMenu.render();}
