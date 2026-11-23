// ROTBALL Season: the Playbook (trick plays) and Auto-coach.
// Trick plays open at Crypt rank 2. Auto-coach spends your Bones for you after every game, for coaches who'd rather just play.
'use strict';
const trickOpen=()=>cryptRank(CAREER.spent||0)>=TRICK_RANK;
const ownsTrick=id=>(userTeam().plays||[]).includes(id);
function buyTrick(id){const k=TRICK_SHOP.find(x=>x.id===id),u=userTeam();if(!k||!trickOpen()||ownsTrick(id)||CAREER.bones<k.price)return false;
  spend(k.price);(u.plays||(u.plays=[])).push(id);u.power=teamPower(u);careerSave();return true;}
function pbNews(){if(!trickOpen()||CAREER.pbSeen)return '';CAREER.pbSeen=1;careerSave();
  return '<div class="sn-crypt">The Crypt grows... A shady playbook dealer has set up shop. Trick plays are for sale.</div>';}

// ----- Auto-coach -----
// What it does, in order: retires anyone whose time is up, sews every part back on, buys trick plays it can afford,
// signs one clear upgrade from the Graveyard when the bench has room, pays the Witch Doctor when Bones are plentiful,
// then trains the weakest starters. It keeps a few Bones back for next week's stitching.
const AUTO_KEEP=30;
function autoCoach(){const c=CAREER,u=userTeam(),did=[];if(!c||!c.auto)return did;
  for(const z of pendingEnd()){const r=retireZ(z.id);if(r)did.push(`retired ${z.name} to the Mausoleum`);}
  const parts=yourZombies().reduce((n,z)=>n+hurtKeys(z).length,0);
  if(parts){if(stitchAll())did.push(`sewed ${parts} part${parts>1?'s':''} back on`);
    else{let n=0;for(const z of u.squad.concat(u.bench)){const k=hurtKeys(z).length;if(k&&stitch(z,true)){n+=k;}}if(n)did.push(`sewed ${n} part${n>1?'s':''} back on`);}}
  if(trickOpen())for(const k of TRICK_SHOP)if(!ownsTrick(k.id)&&c.bones>=k.price+AUTO_KEEP*5&&buyTrick(k.id))did.push(`bought ${TRICK_PLAYS[k.id].name} for the playbook`);
  if(typeof yardFresh==='function'&&typeof yardPlan==='function'){const Y=yardFresh();let best=null,bg=0;
    for(const z of Y.list){const p=yardPlan(z);if(p.full||p.letGo||p.slot==='bench'||!p.over)continue;const g=zPower(z)-zPower(p.over);
      if(g>=8&&zValue(z)<=c.bones-AUTO_KEEP&&g>bg){bg=g;best={z,p};}}
    if(best){const r=sign(best.z,best.p.slot);if(r){delete best.z.ys;did.push(`signed ${best.z.name} from the Graveyard to start over ${best.p.over.name}`);}}}
  if(wdOpen())for(const z of u.squad)if(z.dmg&&z.dmg.length&&c.bones>=wdCost(z)*3&&witch(z))did.push(`paid the Witch Doctor to erase a death for ${z.name}`);
  const trained={};let guard=0;
  while(guard++<60){const cap=skullCap();let pick=null;
    for(const z of u.squad){if(z.kept)continue;const ks=zKeys(z).filter(S=>z.st[S.k]<cap&&trainCost(z.st[S.k])!=null&&trainCost(z.st[S.k])<=c.bones-AUTO_KEEP);if(!ks.length)continue;
      const S=ks.reduce((a,b)=>z.st[b.k]<z.st[a.k]?b:a);const sc=zPower(z)+z.st[S.k]*2;if(!pick||sc<pick.sc)pick={z,S,sc};}
    if(!pick||!train(pick.z,pick.S.k))break;trained[pick.z.name]=(trained[pick.z.name]||0)+1;}
  const tn=Object.keys(trained);if(tn.length)did.push('trained '+tn.map(n=>`${n} (+${trained[n]} skull${trained[n]>1?'s':''})`).join(', '));
  for(const z of pendingEnd()){const r=retireZ(z.id);if(r)did.push(`retired ${z.name} to the Mausoleum`);}   // stitching wears zombies too
  u.power=teamPower(u);careerSave();return did;}
function autoHTML(did){if(!did||!did.length)return '';const s=did.join('; ');
  return `<div class="sn-line" style="margin-top:8px"><b style="color:#ffd84a">Auto-coach</b> ${s}. Bones left: ${CAREER.bones.toLocaleString()}.</div>`;}

// ----- the Playbook screen -----
function seasonPlaybook(keep){const u=userTeam(),open=trickOpen();
  const html=`<div class="sn-head">Team Power ${Math.round(u.power)} &nbsp;·&nbsp; ${bonesHead()}</div>
    <div class="sn-line">Trick plays you own show up with a gold border in your play calls during Season games. Each one also adds 1 to Team Power.${open?'':'<br><i style="color:#aab79c">The dealer hasn\'t shown up yet. Keep spending Bones around the Crypt.</i>'}</div>`;
  const items=TRICK_SHOP.map(k=>{const P=TRICK_PLAYS[k.id],has=ownsTrick(k.id);
    return {label:P.name,disabled:has||!open,sub:has?`in your playbook · ${P.d}`:`${P.d} · ${k.price} Bones${CAREER.bones<k.price?' (not enough)':''}`,
      act:()=>{if(buyTrick(k.id))sfx.cheer&&sfx.cheer();else sfx.groan&&sfx.groan();seasonPlaybook(true);}};});
  items.push({label:'Back',act:()=>seasonOpen()});
  seasonSub('THE PLAYBOOK',html,items,null,keep);}
function seasonAuto(){const on=!CAREER.auto;CAREER.auto=on;careerSave();sfx.select&&sfx.select();
  if(!on){seasonSub('AUTO-COACH IS OFF',`<div class="sn-line">You're spending your own Bones again.</div>`,[{label:'Continue',act:()=>seasonOpen()}]);return;}
  const did=autoCoach();
  seasonSub('AUTO-COACH IS ON',`<div class="sn-line">After every game, Auto-coach sews your zombies up, trains the weakest starters, buys trick plays and signs a clear upgrade from the Graveyard when there's room. When a zombie's time is up, it retires that zombie to the Mausoleum.<br>Turn it off any time from this menu.</div>${autoHTML(did)||'<div class="sn-line"><i style="color:#aab79c">Nothing worth buying right now.</i></div>'}`,
    [{label:'Continue',act:()=>seasonOpen()}]);}

// ----- wiring into the Season hub -----
{const f=snShops;snShops=function(){return f.apply(this,arguments).concat([
  {label:'The Playbook',hidden:!trickOpen(),get sub(){const n=(userTeam().plays||[]).length;return n>=TRICK_SHOP.length?'every trick play is yours':`${n} of ${TRICK_SHOP.length} trick plays · from ${Math.min(...TRICK_SHOP.filter(k=>!ownsTrick(k.id)).map(k=>k.price))} Bones`;},act:()=>seasonPlaybook()},
  {label:`Auto-coach: ${CAREER.auto?'On':'Off'}`,sub:CAREER.auto?'spending your Bones after every game':'let it spend your Bones after every game',act:()=>seasonAuto()}]);};}
{const f=careerNextSeason;careerNextSeason=function(){const r=f.apply(this,arguments);if(CAREER&&CAREER.auto)autoCoach();return r;};}   // a new season ages everyone
{const f=wdNews;wdNews=function(){return f.apply(this,arguments)+pbNews();};}
{const f=seasonBook;seasonBook=function(){const S=f.apply(this,arguments);if(S&&CAREER&&CAREER.auto)S.auto=autoCoach();return S;};}
function autoNote(S){if(!S||!S.auto||!S.auto.length)return;const b=$('snSubBody');if(!b)return;   // right under the Bones line
  const h=b.innerHTML,i=h.indexOf('class="sn-line"'),j=i<0?-1:h.indexOf('</div>',i)+6;b.innerHTML=j<6?h+autoHTML(S.auto):h.slice(0,j)+autoHTML(S.auto)+h.slice(j);}
{const f=seasonWeekScreen;seasonWeekScreen=function(S){f.apply(this,arguments);autoNote(S);};}
{const f=poResultScreen;poResultScreen=function(S){f.apply(this,arguments);autoNote(S);};}
