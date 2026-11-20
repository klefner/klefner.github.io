// ===== SEASON: Rotball's career mode in the Zombie League (build round 1) =====
// 12 teams in two divisions, a 12-game schedule, standings, rival General Managers who earn and spend their own Bones,
// your Bones from every game, and a career that saves itself. Design: "Rotball Coach Mode" doc.
// Round 2 added your roster's stats (Speed, Hands, Bite, Grit, and Arm for the quarterback), training them with Bones, and Team Power from them.
// Round 3: stats are skulls (0 to 5) with hidden Crypt Rank caps, Player Power, the Graveyard market (corpses fit to positions, with looks,
// idle animations and quips), women zombies across the league, the bench that fills in when a starter goes down, and letting zombies go.
// Later rounds add deaths and lifespan, send-offs, playoffs, the draft, twists and the Scrapbook.

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
function zPower(z){return Math.max(1,Math.min(100,Math.round(30+13*zAvg(z)-(z.frail?12:0))));}
function zEff(z,k){const s=z.st[k];return (s==null?-1.5:s)-(z.frail?0.9:0);}   // a non-Brainiac forced to throw is a bad passer
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
  for(const t of c.teams){if(t.id===0)continue;const sp=LEAGUE[t.id].sp;
    if(t.roster)t.roster.forEach(p=>{if(!p[2])p[2]=lgLook(sp,Math.random()<0.3);});
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
function careerNextSeason(){const c=CAREER;
  c.history.push({season:c.season,champs:[0,1].map(d=>standings(d)[0].id),you:[userTeam().w,userTeam().l]});
  c.season++;c.week=0;c.results=[];c.schedule=lgSchedule();
  for(const t of c.teams){t.w=t.l=t.pf=t.pa=0;if(t.id!==0)t.power=Math.min(99,t.power+1);}   // the whole league gets a little stronger
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
function seasonPlay(){careerLoad();if(!CAREER||seasonOver())return;const opp=nextOpp(),g=userGame(CAREER,CAREER.week);
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
  if(!G.season.used)G.season.used=[0,0];}
function subApply(p,b,k){p.name=b.name;p.num=b.num;p.look=b.look;p.sk=b.sk;p.zid=b.zid;p.sub=k;}
// Called by the engine for each knocked-out zombie at the start of a possession. True means "handled": a sub came in, or the slot plays empty.
function seasonSubIn(p){const S=G.season;if(!S||!S.benchList)return false;const L=S.benchList[p.team],k=S.used[p.team];
  if(k<L.length){S.used[p.team]++;subApply(p,L[k],k);p.out=false;p.ko=false;p.limbs={la:1,ra:1,ll:1,rl:1,head:1};
    announce(`${p.name} comes off the bench for the ${TEAMS[p.team].name}!`,2);return true;}
  const n=G.teams[p.team].filter(q=>!q.out).length;
  if(!(S.short||(S.short={}))[p.team+':'+n]){S.short[p.team+':'+n]=1;announce(`No bench left! The ${TEAMS[p.team].name} play with ${n} until halftime.`,2);}
  return true;}
// Short-handed, down to a single zombie, never zero: if a whole side is out, the first one crawls back on.
function seasonFloor(){for(const t of [0,1]){const tm=G.teams[t];if(tm.some(p=>!p.out))continue;const p=tm[0];p.out=false;p.ko=false;p.limbs={la:1,ra:1,ll:1,rl:1,head:1};
  announce(`${p.name} crawls back on. Somebody has to play!`,2);}}
function seasonRestore(Snap){const S=G.season;if(!S)return;if(Snap.season&&Snap.season.used)S.used=Snap.season.used.slice();
  Snap.players.forEach((tm,t)=>tm.forEach((q,i)=>{const b=S.benchList&&q.sub>=0&&S.benchList[t][q.sub];if(b)subApply(G.teams[t][i],b,q.sub);}));}
// ----- spending: training, signing from the Graveyard, letting zombies go, and moving them between the bench and the lineup -----
function spend(c){CAREER.bones-=c;CAREER.spent+=c;}
function train(z,k){const s=z.st[k],c=trainCost(s);if(c==null||s>=skullCap()||CAREER.bones<c)return false;
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
function yardFresh(){const c=CAREER,at=c.season*100+c.week;if(c.yard&&c.yard.at===at)return c.yard;
  const cap=skullCap(),n=3+Math.floor(Math.random()*4),kinds=['brain','fresh','fresh','line','line'],list=[];
  for(let i=0;i<n;i++)list.push(zNew(i===0?'brain':i===1?'fresh':i===2?'line':lgPick(kinds),{cap}));
  list.push(zNew(lgPick(['fresh','line','brain']),{frail:1}));
  c.yard={at,list:list.sort(()=>Math.random()-0.5)};careerSave();return c.yard;}
function seasonBook(){if(!G||!G.season||G.season.booked||!careerLoad())return null;const S=G.season;S.booked=true;
  if(CAREER.season!==S.season||CAREER.week!==S.week)return null;   // this week was already played some other way
  const [a,b]=G.score,r=S.home?{h:0,a:S.opp,hs:a,as:b}:{h:S.opp,a:0,hs:b,as:a};
  const before=CAREER.bones;const res=lgWeek(r);S.bones=CAREER.bones-before;S.tds=Math.floor(a/7);S.won=a>b;S.res=res;return S;}

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
  else if(seasonOver()){seasonEndScreen();return;}
  else{const u=userTeam(),opp=nextOpp(),g=userGame(CAREER,CAREER.week),o=CAREER.teams[opp],D=LEAGUE[opp];
    $('seasonH').textContent=`SEASON ${CAREER.season}`;
    $('seasonBody').innerHTML=`<div class="sn-head">Week ${CAREER.week+1} of ${CAREER.schedule.length} &nbsp;·&nbsp; ${recStr(u)} &nbsp;·&nbsp; <span class="sn-bones">Bones <b>${CAREER.bones.toLocaleString()}</b></span></div>
      <div class="sn-card"><div class="sn-team" style="background:${LEAGUE[0].jersey};color:#fff"><div class="nm">${LEAGUE[0].name}</div><div class="pw">${Math.round(u.power)}</div><div class="lb">Team Power · ${recStr(u)}</div></div>
      <div class="sn-vs">${g.h===0?'VS':'AT'}</div>
      <div class="sn-team" style="background:${D.jersey};color:${D.trim}"><div class="nm">${D.name}</div><div class="pw">${Math.round(o.power)}</div><div class="lb">Team Power · ${recStr(o)}</div></div></div>
      <div class="sn-verdict">${favored(u.power,o.power)} ${g.h===0?'Home game.':'Road game.'}</div>`;
    SN.menu=snMenu('menu','seasonMenu',[{label:`Play Week ${CAREER.week+1}`,act:()=>seasonPlay()},{label:'Roster & Training',get sub(){return `Team Power ${Math.round(userTeam().power)} · ${CAREER.bones.toLocaleString()} Bones to spend`;},act:()=>seasonRoster()},
      {label:'The Graveyard',get sub(){const n=yardFresh().list.length;return `${n} fresh corpse${n===1?'':'s'} this week`;},act:()=>seasonYard()},{label:'League Standings',act:()=>seasonStandings()},
      {label:'Last Week\'s Scores',hidden:!CAREER.results.length,act:()=>seasonScores(CAREER.results.length-1)},{label:'Main Menu',act:()=>toTitle()}]);}
  activeMenu=SN.menu;showOverlay('season');}
function standingsHTML(){return [0,1].map(d=>`<h2>${DIVS[d]}</h2><table class="sn-tbl"><tr><th>Team</th><th>W</th><th>L</th><th>+/-</th><th>Power</th></tr>${
  standings(d).map(t=>`<tr class="${t.id===0?'you':''}"><td>${teamDot(t.id)}${LEAGUE[t.id].name}</td><td>${t.w}</td><td>${t.l}</td><td>${t.pf-t.pa>0?'+':''}${t.pf-t.pa}</td><td>${Math.round(t.power)}</td></tr>`).join('')}</table>`).join('');}
function seasonSub(title,html,items,back,keep){seasonDOM();SN.sub=title;SN.back=back||null;$('snSubH').textContent=title;$('snSubBody').innerHTML=html;
  SN.sub2=snMenu('sub2','snSubMenu',items||[{label:'Back',act:()=>seasonOpen()}],keep);activeMenu=SN.sub2;mode='season';showOverlay('snSub');}
function statLine(z){return zKeys(z).map(S=>`${S.ab} <b>${z.st[S.k]}</b>`).join(' &nbsp;');}
const skulls=n=>`<span class="sn-sk">${'☠'.repeat(n)}<i>${'☠'.repeat(SK_MAX-n)}</i></span>`;
const bonesHead=()=>`<span class="sn-bones">Bones <b>${CAREER.bones.toLocaleString()}</b></span>`;
// "The Crypt grows...": the only hint that spending opened a deeper shelf.
function cryptLine(){const c=skullCap();if(c>(CAREER.capSeen||2)){CAREER.capSeen=c;careerSave();return '<div class="sn-crypt">The Crypt grows...</div>';}return '';}
function seasonRoster(keep){const u=userTeam();
  seasonSub('ROSTER & TRAINING',`${cryptLine()}<div class="sn-head">Team Power ${teamPower(u)} &nbsp;·&nbsp; ${bonesHead()}</div>
    <div class="sn-line" style="margin-bottom:10px">Pick a zombie to train or move. Every starter plays both ways; the bench fills in when one goes down.</div>`,
    [...u.squad.map((z,i)=>({label:`<span class="sn-pos">${POS[i]}</span>${z.name} #${z.num}`,sub:`Power <b>${zPower(z)}</b> · ${statLine(z)}`,act:()=>seasonPlayer(z.id)})),
     ...u.bench.map(z=>({label:`<span class="sn-pos">BENCH</span>${z.name} #${z.num}`,sub:`${KINDS[z.kind].name}${z.frail?' Z-team':''} · Power <b>${zPower(z)}</b> · ${statLine(z)}`,act:()=>seasonPlayer(z.id)})),
     {label:'The Graveyard',sub:`sign fresh corpses · bench ${u.bench.length} of ${BENCH_MAX}`,act:()=>seasonYard()},{label:'Back',act:()=>seasonOpen()}],null,keep);}
function bioHTML(z,extra){return `<div class="sn-who"><canvas id="snPort" width="400" height="460"></canvas><div class="sn-bio"><div class="pw">Power ${zPower(z)}</div>
  <div>${KINDS[z.kind].name}${z.frail?' (Z-team bench body)':''} · ${KINDS[z.kind].plays}</div>${extra||''}<div class="q">"${z.look.quip||'Brains.'}"</div></div></div>`;}
function seasonPlayer(id,keep,armed){const f=zFind(id);if(!f){seasonRoster(true);return;}const u=userTeam(),z=f.z,cap=skullCap(),onBench=f.where==='bench';
  const where=onBench?'On the bench':POS[f.i];
  const items=zKeys(z).map(S=>{const s=z.st[S.k],c=trainCost(s);
    return {label:`${S.name} ${skulls(s)}`,sub:c==null?`${S.does} · fully trained`:s>=cap?`${S.does} · can't go higher yet`:`${S.does} · next skull ${c} Bones${CAREER.bones<c?' (not enough)':''}`,
      act:()=>{if(train(z,S.k))sfx.cheer&&sfx.cheer();else sfx.groan&&sfx.groan();seasonPlayer(id,true);}};});
  if(onBench)u.squad.forEach((s0,i)=>{if(SLOT_KIND[i]===z.kind)items.push({label:`Start at ${POS[i]}`,sub:`swap with ${s0.name} (Power ${zPower(s0)})`,act:()=>{swapIn(z.id,i);sfx.select&&sfx.select();seasonPlayer(id,true);}});});
  else u.bench.forEach(b=>{if(b.kind===z.kind)items.push({label:`Swap with ${b.name}`,sub:`from the bench (Power ${zPower(b)})`,act:()=>{swapIn(b.id,f.i);seasonPlayer(id,true);}});});
  const r=refundOf(z),canGo=onBench||benchFor(f.i)>=0;
  items.push({label:armed?`<b>Let ${z.name} go?</b> Press again`:`Let Go (+${r} Bones)`,disabled:!canGo,
    sub:!canGo?`a ${KINDS[z.kind].name} on the bench has to take this spot first`:armed?'this zombie is gone for good':'20% of this zombie\'s value back',
    act:()=>{if(!armed){seasonPlayer(id,true,true);return;}if(release(z.id)!=null){sfx.groan&&sfx.groan();seasonRoster(true);}}});
  items.push({label:'Back to Roster',act:()=>seasonRoster(true)});
  seasonSub(`${z.name.toUpperCase()} #${z.num}`,`<div class="sn-head">${where} &nbsp;·&nbsp; ${bonesHead()}</div>${bioHTML(z)}`,items,()=>seasonRoster(true),keep);
  snPortrait(z,onBench?KINDS[z.kind].body:BODY_OF[f.i]);}
function seasonYard(keep){const Y=yardFresh(),u=userTeam();
  seasonSub('THE GRAVEYARD',`${cryptLine()}<div class="sn-head">${bonesHead()} &nbsp;·&nbsp; Bench ${u.bench.length} of ${BENCH_MAX}</div>
    <div class="sn-line" style="margin-bottom:10px">Fresh corpses, dug up this week. New ones claw their way out after every game.</div>`,
    [...Y.list.map(z=>({label:`<span class="sn-kind">${z.frail?'Z-TEAM':KINDS[z.kind].tag}</span>${z.name}`,sub:`Power <b>${zPower(z)}</b> · ${zValue(z)} Bones · ${statLine(z)}`,act:()=>seasonCorpse(z.id)})),
     {label:'Back',act:()=>seasonOpen()}],()=>seasonOpen(),keep);}
function seasonCorpse(id){const Y=yardFresh(),z=Y.list.find(x=>x.id===id);if(!z){seasonYard(true);return;}const u=userTeam(),price=zValue(z),broke=CAREER.bones<price,full=u.bench.length>=BENCH_MAX;
  const items=[];
  u.squad.forEach((s0,i)=>{if(SLOT_KIND[i]!==z.kind)return;
    items.push({label:`Sign to start at ${POS[i]}`,sub:broke?`costs ${price} Bones (not enough)`:`replaces ${s0.name} (Power ${zPower(s0)}), who ${full?`is let go for ${refundOf(s0)} Bones, since the bench is full`:'moves to the bench'}`,
      act:()=>{const r=sign(z,i);if(!r){sfx.groan&&sfx.groan();return;}sfx.cheer&&sfx.cheer();seasonSigned(z,r);}});});
  items.push({label:'Sign to the Bench',disabled:full,sub:full?`the bench is full (${BENCH_MAX})`:broke?`costs ${price} Bones (not enough)`:`a fill-in for when a starter goes down`,
    act:()=>{const r=sign(z,'bench');if(!r){sfx.groan&&sfx.groan();return;}sfx.cheer&&sfx.cheer();seasonSigned(z,r);}});
  items.push({label:'Back to the Graveyard',act:()=>seasonYard(true)});
  const sk=zKeys(z).map(S=>`<div>${S.name} ${skulls(z.st[S.k])}</div>`).join('');
  seasonSub(z.name.toUpperCase(),`<div class="sn-head">${price} Bones &nbsp;·&nbsp; ${bonesHead()}</div>${bioHTML(z,`<div style="margin-top:4px">${sk}</div>`)}`,items,()=>seasonYard(true));
  snPortrait(z,KINDS[z.kind].body);}
function seasonSigned(z,r){const f=zFind(z.id);
  seasonSub('SIGNED!',`${bioHTML(z)}<div class="sn-line">${z.name} joins the Graveyard Shift as #${z.num}, ${f&&f.where==='squad'?`starting at ${POS[f.i]}`:'on the bench'}.${r.gone?`<br>${r.gone.name} is let go for ${r.refund} Bones.`:''}<br>Team Power is now ${teamPower(userTeam())}.</div>`,
    [{label:'Back to the Graveyard',act:()=>seasonYard()},{label:'Roster & Training',act:()=>seasonRoster()},{label:'Season Home',act:()=>seasonOpen()}],()=>seasonYard());
  snPortrait(z,f&&f.where==='squad'?BODY_OF[f.i]:KINDS[z.kind].body);}
// ----- the portrait: the zombie standing on his grave, doing his idle (shuffling, twitching, chewing a bone, scratching, grooving, drooling) -----
const PORT={tok:0};
function snPortrait(z,body){const tok=++PORT.tok,t0=performance.now();PORT.z=z;PORT.body=body||'qb';
  const step=()=>{if(tok!==PORT.tok)return;const cv=document.getElementById('snPort');if(!cv||!cv.isConnected||mode!=='season')return;
    try{drawPort(cv,(performance.now()-t0)/1000);}catch(e){}requestAnimationFrame(step);};requestAnimationFrame(step);}
function drawPort(cv,t){const c=cv.getContext('2d'),z=PORT.z,W=cv.width,H=cv.height,B=ZBODY[PORT.body]||ZBODY.qb;c.clearRect(0,0,W,H);
  c.fillStyle='#55585e';c.strokeStyle='#1b1a17';c.lineWidth=4;c.beginPath();c.moveTo(W*0.62,H*0.84);c.lineTo(W*0.62,H*0.38);c.arc(W*0.77,H*0.38,W*0.15,Math.PI,0);c.lineTo(W*0.92,H*0.84);c.closePath();c.fill();c.stroke();
  c.fillStyle='#2b2d31';c.font='bold 30px Arial';c.textAlign='center';c.fillText('RIP',W*0.77,H*0.46);
  c.fillStyle='#3b2a1a';c.beginPath();c.ellipse(W*0.5,H*0.9,W*0.46,H*0.07,0,0,7);c.fill();
  const size=H*0.62,x=W*0.42,y=H*0.88,idle=z.look.idle||'shuffle',seed=parseInt(String(z.id).replace(/\D/g,''))||1;
  const o={look:z.look,team:ZSTYLE.zombie,body:PORT.body,view:'front',flip:false,phase:0,speed:0,limbs:{la:1,ra:1,ll:1,rl:1,head:1},pose:'stand',num:z.num||'',t,seed,ball:false};
  c.save();
  if(idle==='shuffle'){o.pose='zombie';o.speed=0.3;o.phase=t*3.2;c.translate(Math.sin(t*1.6)*W*0.04,0);}
  else if(idle==='twitch'){const k=(t+seed*0.3)%1.6;if(k<0.18){c.translate(x,y);c.rotate(Math.sin(k*70)*0.1);c.translate(-x,-y);}}
  else if(idle==='chew'){o.pose='dance';o.prop='bone';o.dj={la:[0.2,0.3],ra:[0.6+Math.sin(t*6)*0.08,2.5]};}
  else if(idle==='scratch'){o.pose='dance';o.dj={la:[2.75,1.3+Math.sin(t*16)*0.25],ra:[0.2,0.3]};}
  else if(idle==='groove'){const b=Math.sin(t*4);o.pose='dance';o.dj={la:[1.2+b*0.4,1.0],ra:[1.2-b*0.4,1.0],tilt:Math.sin(t*2)*0.12,hx:Math.sin(t*2)*5,sq:0.1+0.1*Math.abs(b),air:Math.abs(Math.sin(t*4))*4};}
  drawZombie(c,x,y,size,o);
  if(idle==='drool'){const k=size/100,my=y-k*(B.leg+B.torso+19*B.head-21*B.head*0.75),mx=x+k*2,d=(t*0.6)%1;
    c.fillStyle='rgba(200,230,150,0.85)';c.beginPath();c.ellipse(mx,my+d*k*30,k*1.6,k*(2+d*2),0,0,7);c.fill();}
  c.restore();}
function seasonStandings(){seasonSub('STANDINGS',standingsHTML());}
function scoresHTML(res,skipYou){return res.filter(r=>!(skipYou&&(r.h===0||r.a===0))).map(r=>{const hw=r.hs>r.as,w=hw?r.h:r.a,l=hw?r.a:r.h,ws=Math.max(r.hs,r.as),ls=Math.min(r.hs,r.as);
  return `${teamDot(w)}<b>${LEAGUE[w].name} ${ws}</b>, ${LEAGUE[l].name} ${ls}`;}).join('<br>');}
function seasonScores(w){seasonSub(`WEEK ${w+1} SCORES`,`<div class="sn-scores">${scoresHTML(CAREER.results[w],false)}</div>`);}
function seasonWeekScreen(S){const pay=S.won?BONES.win:BONES.loss;
  seasonSub(S.won?'A WIN FOR THE SHIFT!':'BACK TO THE GRAVE',
    `<div class="sn-line">+${S.bones} Bones: ${pay} for the ${S.won?'win':'game'}${S.tds?` and ${S.tds*BONES.td} for ${S.tds} touchdown${S.tds>1?'s':''}`:''}.<br>Record ${recStr(userTeam())} &nbsp;·&nbsp; Bones ${CAREER.bones.toLocaleString()}${CAREER.bones>=50?'<br><i style="color:#aab79c">Spend them on training, or on fresh corpses in the Graveyard.</i>':''}</div>
     <h2>Around the league</h2><div class="sn-scores">${scoresHTML(S.res,true)}</div>`,
    [{label:seasonOver()?'See Final Standings':'Continue',act:()=>seasonOpen()},{label:'Main Menu',act:()=>toTitle()}]);}
function seasonEndScreen(){const u=userTeam(),st=standings(0),place=st.findIndex(t=>t.id===0)+1,ord=['','1st','2nd','3rd','4th','5th','6th'][place];
  const champs=[0,1].map(d=>standings(d)[0]);
  seasonSub(`SEASON ${CAREER.season} IS OVER`,
    `<div class="sn-line">You finished <b style="color:#f3c34b">${ord}</b> in the ${DIVS[0]} at ${recStr(u)}.<br>${champs.map(t=>`${teamDot(t.id)}${LEAGUE[t.id].name} win the ${DIVS[LEAGUE[t.id].div]}`).join('<br>')}<br><i style="color:#aab79c">Playoffs and the Rot Bowl are on their way.</i></div>${standingsHTML()}`,
    [{label:`Start Season ${CAREER.season+1}`,act:()=>{careerNextSeason();seasonOpen();}},{label:'Main Menu',act:()=>toTitle()}]);}
function seasonLabel(){const c=careerLoad();if(!c)return 'start a career in the Zombie League';const u=c.teams[0];
  return seasonOver()?`Season ${c.season} is over · ${recStr(u)}`:`Season ${c.season} · Week ${c.week+1} · ${recStr(u)}`;}

// ----- hooks into the game: the end-of-game screen, and the career reset in Settings -----
const OVER_ITEMS=overMenu.items;
{const base=gameOver;gameOver=function(){base();
  if(G&&G.season){const S=seasonBook();overMenu.items=[{label:'Season Results',act:()=>{if(S)seasonWeekScreen(S);else seasonOpen();}},{label:'Main Menu',act:()=>toTitle()}];
    if(S)$('overStats').innerHTML+=`<br>Season record: ${recStr(userTeam())} &nbsp;·&nbsp; +${S.bones} Bones`;}
  else overMenu.items=OVER_ITEMS;
  overMenu.i=0;overMenu.render();};}
{let armed=0;const it={label:()=>armed>performance.now()?'<b>Bury this career?</b> Press again':'Reset Season Career',get hidden(){return !careerLoad();},
  sub:()=>armed>performance.now()?'your whole Season career will be gone':'start your Season career over',
  act:()=>{if(armed>performance.now()){careerReset();armed=0;sfx.groan&&sfx.groan();}else armed=performance.now()+4000;}};
  settingsMenu.items.splice(settingsMenu.items.length-1,0,it);settingsMenu.render();}
