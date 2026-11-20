// ===== SEASON: Rotball's career mode in the Zombie League (build round 1) =====
// 12 teams in two divisions, a 12-game schedule, standings, rival General Managers who earn and spend their own Bones,
// your Bones from every game, and a career that saves itself. Design: "Rotball Coach Mode" doc.
// Round 2 adds your roster's stats (Speed, Hands, Bite, Grit, and Arm for the quarterback), training them with Bones, and Team Power from them.
// Later rounds add the Graveyard, lifespan, send-offs, playoffs, the draft, twists and the Scrapbook.

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
  spender:{name:'The Spender',share:0.9,eff:1.0},
  hoarder:{name:'The Hoarder',share:0,eff:1.2,save:1200},   // saves up, then splurges all at once
  trainer:{name:'The Trainer',share:0.6,eff:1.1},
  gambler:{name:'The Gambler',share:0.8,eff:1.0,swing:true},
  tinkerer:{name:'The Tinkerer',share:0.7,eff:1.0},
  patcher:{name:'The Patcher',share:0.5,eff:0.9,tough:true}};   // patches his zombies up, so losses wear his team down less
const BONES={win:100,loss:30,td:10};
// Your players' stats. Every stat starts at level 1; each training step costs more than the last. Team Power = 20 + 10 x the average level.
const STATS=[{k:'spd',name:'Speed',ab:'SPD',does:'runs faster'},{k:'hands',name:'Hands',ab:'HND',does:'catches more, and picks off more throws'},
  {k:'bite',name:'Bite',ab:'BIT',does:'tackles stick'},{k:'grit',name:'Grit',ab:'GRT',does:'keeps his arms, legs and head on'},
  {k:'arm',name:'Arm',ab:'ARM',does:'throws land on target',qb:true}];
const TRAIN_COST=[50,100,200,400,800],MAX_LV=TRAIN_COST.length+1;
const POS=['QB / S','RB / LB','WR / CB','WR / CB','LINE','LINE','LINE'];
const skFactor=L=>Math.max(0.9,Math.min(1.3,1+(L-1.5)*0.045));   // level 1.5 plays exactly like a Quick Game player
function statsNew(){return POS.map((_,i)=>{const o={};for(const S of STATS)if(!S.qb||i===0)o[S.k]=1;return o;});}
function yourPower(t){let n=0,sum=0;for(const o of t.stats)for(const k in o){sum+=o[k];n++;}return Math.round(20+10*sum/n);}
function trainCost(L){return L>=MAX_LV?null:TRAIN_COST[L-1];}

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
const NUM_RANGE=[[1,19],[20,49],[80,89],[80,89],[60,79],[60,79],[60,79]];   // QB, RB, two WRs, three linemen
function lgRoster(sp){const used=new Set(),nums=new Set();return NUM_RANGE.map(([a,b])=>{let n,k=0;
  do{n=lgPick(NAMEBITS[sp].first)+' '+lgPick(NAMEBITS[sp].last);}while(used.has(n)&&k++<50);used.add(n);
  let num;do{num=a+Math.floor(Math.random()*(b-a+1));}while(nums.has(num));nums.add(num);return [n,num];});}

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
function careerNew(){
  const teams=LEAGUE.map((d,id)=>({id,power:id===0?30:Math.round(lgRand(26,40)),bones:0,spent:0,w:0,l:0,pf:0,pa:0,
    gm:d.gm||null,stats:id===0?statsNew():undefined,roster:id===0?TEAMS_HOME.players.map(p=>p.slice()):id===1?TEAMS_AWAY.players.map(p=>p.slice()):lgRoster(d.sp)}));
  return {v:CAREER_V,season:1,week:0,bones:0,spent:0,teams,schedule:lgSchedule(),results:[],history:[],started:Date.now()};}
function careerLoad(){if(CAREER)return CAREER;const c=store.get(CAREER_KEY,null);if(c&&c.v===CAREER_V&&c.teams&&c.teams.length===12){CAREER=c;const u=c.teams[0];if(!u.stats){u.stats=statsNew();u.power=yourPower(u);}}return CAREER;}   // round-1 careers get a fresh roster sheet
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
  TEAMS[1]=Object.assign({},TEAMS_AWAY,{name:d.name,jersey:d.jersey,trim:d.trim,skin:(d.sp==='zombie'?TEAMS_HOME:TEAMS_AWAY).skin,ez:lgShade(d.jersey,-0.45),players:t?t.roster.map(p=>p.slice()):lgRoster(d.sp)});
  TEAM_STYLE[1]=id===1?null:lgStyle(id);if(typeof PITCH!=='undefined')PITCH.seed=null;}
function leagueReset(){TEAMS[0]=JSON.parse(JSON.stringify(TEAMS_HOME));TEAMS[1]=JSON.parse(JSON.stringify(TEAMS_AWAY));TEAM_STYLE[0]=TEAM_STYLE[1]=null;if(typeof PITCH!=='undefined')PITCH.seed=null;}

// ----- the game itself: start your week's game, and book the result when it ends -----
function seasonPlay(){careerLoad();if(!CAREER||seasonOver())return;const opp=nextOpp(),g=userGame(CAREER,CAREER.week);
  leagueApply(opp);startGame();G.season={season:CAREER.season,week:CAREER.week,opp,home:g.h===0};seasonStats();}
// Season stats on the field: your players from their trained levels, the opponent's from its Team Power (with a little spread).
function seasonStats(){if(!G||!G.season||!careerLoad())return;const u=userTeam(),op=CAREER.teams[G.season.opp],Lo=Math.max(0.5,Math.min(9,(op.power-20)/10));
  G.teams[0].forEach((p,i)=>{const o=u.stats[i]||{};p.sk={};for(const S of STATS)p.sk[S.k]=skFactor(o[S.k]||1);});
  G.teams[1].forEach(p=>{p.sk={};for(const S of STATS)p.sk[S.k]=skFactor(Lo+lgRand(-0.4,0.4));});}
function train(i,k){const u=userTeam(),o=u.stats[i],c=trainCost(o[k]);if(c==null||CAREER.bones<c)return false;
  CAREER.bones-=c;CAREER.spent+=c;o[k]++;u.power=yourPower(u);careerSave();return true;}
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
    $('seasonBody').innerHTML=`<div class="sn-line">Coach the <b style="color:#f3c34b">Graveyard Shift</b> through a 12-team zombie league. Win games, earn <b style="color:#efe6cf">Bones</b>, and build a team that's all yours, against rivals who grow every week too.<br><br>Your career saves itself after every game.</div><br>`;
    SN.menu=snMenu('menu','seasonMenu',[{label:'Start My Career',act:()=>{CAREER=careerNew();careerSave();seasonOpen();}},{label:'Main Menu',act:()=>toTitle()}]);}
  else if(seasonOver()){seasonEndScreen();return;}
  else{const u=userTeam(),opp=nextOpp(),g=userGame(CAREER,CAREER.week),o=CAREER.teams[opp],D=LEAGUE[opp];
    $('seasonH').textContent=`SEASON ${CAREER.season}`;
    $('seasonBody').innerHTML=`<div class="sn-head">Week ${CAREER.week+1} of ${CAREER.schedule.length} &nbsp;·&nbsp; ${recStr(u)} &nbsp;·&nbsp; <span class="sn-bones">Bones <b>${CAREER.bones.toLocaleString()}</b></span></div>
      <div class="sn-card"><div class="sn-team" style="background:${LEAGUE[0].jersey};color:#fff"><div class="nm">${LEAGUE[0].name}</div><div class="pw">${Math.round(u.power)}</div><div class="lb">Team Power · ${recStr(u)}</div></div>
      <div class="sn-vs">${g.h===0?'VS':'AT'}</div>
      <div class="sn-team" style="background:${D.jersey};color:${D.trim}"><div class="nm">${D.name}</div><div class="pw">${Math.round(o.power)}</div><div class="lb">Team Power · ${recStr(o)}</div></div></div>
      <div class="sn-verdict">${favored(u.power,o.power)} ${g.h===0?'Home game.':'Road game.'}</div>`;
    SN.menu=snMenu('menu','seasonMenu',[{label:`Play Week ${CAREER.week+1}`,act:()=>seasonPlay()},{label:'Roster & Training',get sub(){return `Team Power ${Math.round(userTeam().power)} · ${CAREER.bones.toLocaleString()} Bones to spend`;},act:()=>seasonRoster()},{label:'League Standings',act:()=>seasonStandings()},
      {label:'Last Week\'s Scores',hidden:!CAREER.results.length,act:()=>seasonScores(CAREER.results.length-1)},{label:'Main Menu',act:()=>toTitle()}]);}
  activeMenu=SN.menu;showOverlay('season');}
function standingsHTML(){return [0,1].map(d=>`<h2>${DIVS[d]}</h2><table class="sn-tbl"><tr><th>Team</th><th>W</th><th>L</th><th>+/-</th><th>Power</th></tr>${
  standings(d).map(t=>`<tr class="${t.id===0?'you':''}"><td>${teamDot(t.id)}${LEAGUE[t.id].name}</td><td>${t.w}</td><td>${t.l}</td><td>${t.pf-t.pa>0?'+':''}${t.pf-t.pa}</td><td>${Math.round(t.power)}</td></tr>`).join('')}</table>`).join('');}
function seasonSub(title,html,items,back,keep){seasonDOM();SN.sub=title;SN.back=back||null;$('snSubH').textContent=title;$('snSubBody').innerHTML=html;
  SN.sub2=snMenu('sub2','snSubMenu',items||[{label:'Back',act:()=>seasonOpen()}],keep);activeMenu=SN.sub2;mode='season';showOverlay('snSub');}
function statLine(o){return STATS.filter(S=>o[S.k]!=null).map(S=>`${S.ab} <b>${o[S.k]}</b>`).join(' &nbsp;');}
function seasonRoster(keep){const u=userTeam();
  seasonSub('ROSTER & TRAINING',`<div class="sn-head">Team Power ${Math.round(u.power)} &nbsp;·&nbsp; <span class="sn-bones">Bones <b>${CAREER.bones.toLocaleString()}</b></span></div>
    <div class="sn-line" style="margin-bottom:10px">Pick a player to train. Every player plays both ways.</div>`,
    [...u.roster.map(([nm,num],i)=>({label:`<span class="sn-pos">${POS[i]}</span>${nm} #${num}`,sub:statLine(u.stats[i]),act:()=>seasonPlayer(i)})),{label:'Back',act:()=>seasonOpen()}],null,keep);}
function seasonPlayer(i,keep){const u=userTeam(),o=u.stats[i],[nm,num]=u.roster[i];
  seasonSub(`${nm.toUpperCase()} #${num}`,`<div class="sn-head">${POS[i]} &nbsp;·&nbsp; <span class="sn-bones">Bones <b>${CAREER.bones.toLocaleString()}</b></span></div>`,
    [...STATS.filter(S=>o[S.k]!=null).map(S=>{const L=o[S.k],c=trainCost(L);return {label:`${S.name}: <b>Level ${L}</b>`,
      sub:c==null?`${S.does} · fully trained`:`${S.does} · train to ${L+1} for ${c} Bones${CAREER.bones<c?' (not enough yet)':''}`,
      act:()=>{if(train(i,S.k)){sfx.cheer&&sfx.cheer();}else sfx.groan&&sfx.groan();seasonPlayer(i,true);}};}),
     {label:'Back to Roster',act:()=>seasonRoster(true)}],()=>seasonRoster(true),keep);}
function seasonStandings(){seasonSub('STANDINGS',standingsHTML());}
function scoresHTML(res,skipYou){return res.filter(r=>!(skipYou&&(r.h===0||r.a===0))).map(r=>{const hw=r.hs>r.as,w=hw?r.h:r.a,l=hw?r.a:r.h,ws=Math.max(r.hs,r.as),ls=Math.min(r.hs,r.as);
  return `${teamDot(w)}<b>${LEAGUE[w].name} ${ws}</b>, ${LEAGUE[l].name} ${ls}`;}).join('<br>');}
function seasonScores(w){seasonSub(`WEEK ${w+1} SCORES`,`<div class="sn-scores">${scoresHTML(CAREER.results[w],false)}</div>`);}
function seasonWeekScreen(S){const pay=S.won?BONES.win:BONES.loss;
  seasonSub(S.won?'A WIN FOR THE SHIFT!':'BACK TO THE GRAVE',
    `<div class="sn-line">+${S.bones} Bones: ${pay} for the ${S.won?'win':'game'}${S.tds?` and ${S.tds*BONES.td} for ${S.tds} touchdown${S.tds>1?'s':''}`:''}.<br>Record ${recStr(userTeam())} &nbsp;·&nbsp; Bones ${CAREER.bones.toLocaleString()}${CAREER.bones>=50?'<br><i style="color:#aab79c">Spend them on training in Roster &amp; Training.</i>':''}</div>
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
