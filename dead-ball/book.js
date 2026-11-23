// Rotball: the Season Scrapbook and the Library (Coach mode).
// Each season fills a scrapbook that looks like a kid made it: torn paper, tape, crayon and zombie scrawl. It holds your team's
// numbers against the teams you played, photos the game snaps of your touchdowns, head-offs, eaten brains, halftime shows and
// The Rotties, and how the season ended. When a season ends its book goes on the shelf in the Library.
// Photos are small JPEGs kept apart from the career save (a separate localStorage key), so saving a career stays quick.
// Loads after season.js, yard.js and altar.js.

const SNAP_KEY='rotball_snaps_v1',SNAP_MAX=10,SNAP_KEEP=6,SNAP_SEASONS=12,SNAP_W=320,SNAP_H=240;
const SCRAWL={
  td:['{name} SCORED!!!','TUCHDOWN {name} braaains','{name} did a dance here. it was gross','look at {name} GO','6 points 4 {name}','{name} = best zombie'],
  head:['OFF WITH THE HEAD!!','heads up lol','bye bye {name}s head','somebody find that head','we kept the head. dont ask'],
  eat:['WE ATE THERE BRAIN','nom nom nom','3 bites. delishus','brain for dinner AGAIN'],
  half:['halftime!! the band was ok','the music made my ears fall off','halftime show (sorta)','i danced. a leg came off'],
  rotties:['THE ROTTIES!!','we got prizes','medusa looked at me. i am fine','best night ever (i am dead)']};
const BOOK_SKY=['#2b2b6b','#7a1f1f','#1f5a2b','#5a2b6b'];
function snapsLoad(){const s=store.get(SNAP_KEY,null);return s&&Array.isArray(s.list)?s:{list:[]};}
function snapsSave(s){store.set(SNAP_KEY,s);}
const snapsOf=season=>snapsLoad().list.filter(p=>p.s===season);
// The season's book, started on the first game of each season.
function bookCur(){const c=CAREER;if(!c.book||c.book.season!==c.season)c.book={season:c.season,games:[],scorers:{}};return c.book;}

// ----- taking photos: a small crop of the middle of the screen, a moment after the thing happens -----
function snapTake(kind,name,mustMode){if(!G||!G.season||(mustMode&&mode!==mustMode))return;const S=G.season,n=S.snaps||(S.snaps=[]);
  if(n.length>=4||n.filter(p=>p.k===kind).length>=(kind==='td'?2:1))return;
  let img=null;try{const o=document.createElement('canvas');o.width=SNAP_W;o.height=SNAP_H;const c=o.getContext('2d'),sw=cv.width,sh=Math.round(cv.width*SNAP_H/SNAP_W),sy=Math.round((cv.height-sh)*0.52);
    c.drawImage(cv,0,sy,sw,sh,0,0,SNAP_W,SNAP_H);img=o.toDataURL('image/jpeg',0.62);}catch(e){img=null;}
  if(typeof img!=='string'||img.length<800||img.indexOf('data:image')!==0)img=null;
  n.push({k:kind,n:name||'',img});}
function snapLater(kind,name,ms,mustMode){if(!G||!G.season)return;const g=G;setTimeout(()=>{if(G===g)snapTake(kind,name,mustMode);},ms);}
// Into the photo album when the game is booked: up to SNAP_MAX a season, swapping at random once it's full so late-season photos still get in.
function snapsCommit(S,week){const ph=(S.snaps||[]).filter(p=>p.img);if(!ph.length)return 0;const st=snapsLoad();let added=0;
  for(const p of ph){const cap=lgPick(SCRAWL[p.k]||SCRAWL.td).replace('{name}',p.n||'somebody'),e={s:S.season,w:week,k:p.k,cap,img:p.img,r:Math.round(lgRand(-5,5))};
    const mine=st.list.filter(x=>x.s===S.season);
    if(mine.length<SNAP_MAX){st.list.push(e);added++;}else if(Math.random()<0.35){st.list[st.list.indexOf(lgPick(mine))]=e;added++;}}
  snapsSave(st);return added;}
// Old seasons keep their best few photos, and only the last dozen seasons keep any.
function snapsPrune(cur){const st=snapsLoad(),keep=[],by={};
  for(const p of st.list)(by[p.s]||(by[p.s]=[])).push(p);
  for(const s of Object.keys(by).map(Number).sort((a,b)=>b-a).slice(0,SNAP_SEASONS)){const L=by[s];keep.push(...(s>=cur?L:L.slice(0,SNAP_KEEP)));}
  st.list=keep;snapsSave(st);}

// ----- hooks into the game: bites, touchdowns, heads, halftime, The Rotties, and booking each game into the book -----
function bookBite(){if(G&&G.season&&G.play){const d=1-G.play.off;(G.season.bites||(G.season.bites=[0,0]))[d]++;}}
{const f=startChomp;startChomp=function(){bookBite();return f.apply(this,arguments);};}
{const f=burst;burst=function(){bookBite();if(G&&G.season&&G.play&&G.play.off===1)snapLater('eat','',650);return f.apply(this,arguments);};}
{const f=endPlay;endPlay=function(type,info){const P=G&&G.play,was=!P||P.ended,r=f.apply(this,arguments);
  if(!was&&G&&G.season&&type==='td'&&info&&info.by&&info.by.team===0){const sc=G.season.scorers||(G.season.scorers={});sc[info.by.name]=(sc[info.by.name]||0)+1;snapLater('td',info.by.name,900);}
  return r;};}
{const f=removeLimb;removeLimb=function(p,k){const live=p&&p.limbs&&p.limbs[k]&&!p.out;const r=f.apply(this,arguments);
  if(live&&k==='head'&&p.team===1&&G&&G.season)snapLater('head',p.name,350);return r;};}
{const f=halftime;halftime=function(){const r=f.apply(this,arguments);snapLater('half','',7000,'half');return r;};}
{const f=cerStart;cerStart=function(win){const r=f.apply(this,arguments);if(G&&G.season&&G.score&&G.score[0]>G.score[1])snapLater('rotties','',6500,'ceremony');return r;};}
{const f=seasonBook;seasonBook=function(){const S0=G&&G.season,fresh=!!(S0&&!S0.booked),r=f.apply(this,arguments);
  if(r&&fresh){const bk=bookCur(),st=G.stats||{yards:[0,0],limbs:[0,0]},b=r.bites||[0,0],died=r.cas?Object.keys(r.cas.died||{}).length:0;
    bk.games.push({w:r.week,po:r.po!=null?r.po:-1,opp:r.opp,us:G.score[0],them:G.score[1],yd:[st.yards[0],st.yards[1]],bites:[b[0],b[1]],limbs:[st.limbs[1],st.limbs[0]],died});
    for(const k in (r.scorers||{}))bk.scorers[k]=(bk.scorers[k]||0)+r.scorers[k];
    r.photos=snapsCommit(r,r.week);careerSave();}
  return r;};}
// A season ends: its book goes on the Library shelf with how it finished.
{const f=careerNextSeason;careerNextSeason=function(){const c=CAREER;if(c){const bk=bookCur(),u=userTeam(),po=c.po;
    (c.library||(c.library=[])).push({season:c.season,rec:[u.w,u.l],fate:po?poFate():-1,bowl:po&&po.champ!=null?po.champ:null,games:bk.games,scorers:bk.scorers,
      place:standings(0).findIndex(t=>t.id===0)+1,draft:null});}
  const r=f.apply(this,arguments);if(c){const L=c.library[c.library.length-1],h=c.history[c.history.length-1];if(L&&h)L.draft=h.draft||null;delete c.book;snapsPrune(c.season);careerSave();}
  return r;};}

// ----- the pages -----
function bookCSS(){if(document.getElementById('bookCSS'))return;const s=document.createElement('style');s.id='bookCSS';s.textContent=`
.sb-page{position:relative;margin:4px 6px 14px;padding:26px 30px 30px;min-height:600px;color:#2b2b6b;font-family:'Gochi Hand','Comic Sans MS',cursive;font-size:25px;line-height:1.3;
  background:#efe3c2 repeating-linear-gradient(0deg,transparent 0 37px,rgba(70,90,160,.18) 37px 39px);box-shadow:0 6px 18px rgba(0,0,0,.6);transform:rotate(-.5deg)}
.sb-page:before{content:'';position:absolute;left:44px;top:0;bottom:0;width:2px;background:rgba(190,60,60,.35)}
.sb-tape{position:absolute;width:118px;height:30px;background:rgba(250,236,160,.62);box-shadow:0 1px 2px rgba(0,0,0,.25);z-index:2}
.sb-title{font-family:'Creepster',cursive;color:#4b8a1c;font-size:64px;text-align:center;line-height:1;margin:10px 0 4px;transform:rotate(-2deg);text-shadow:2px 2px 0 rgba(0,0,0,.15)}
.sb-sub{text-align:center;font-size:30px;color:#7a1f1f;transform:rotate(1deg)}
.sb-big{font-size:34px;color:#7a1f1f}
.sb-row{display:flex;align-items:center;gap:10px;margin:7px 0}
.sb-row .lb{width:160px;flex:none;text-align:right}
.sb-bars{flex:1}
.sb-bar{height:17px;margin:3px 0;border:2px solid currentColor;border-radius:255px 15px 225px 15px/15px 225px 15px 255px;opacity:.85}
.sb-bar.us{color:#3e8a1a;background:repeating-linear-gradient(-55deg,#7fd04a 0 5px,#a6e37a 5px 8px)}
.sb-bar.them{color:#6b2b7a;background:repeating-linear-gradient(-55deg,#b36ad0 0 5px,#d6a6e6 5px 8px)}
.sb-n{width:58px;flex:none;font-size:22px}
.sb-key{font-size:22px;text-align:center;margin:4px 0 10px}.sb-key b{font-weight:normal;padding:0 6px;border-radius:6px}
.sb-photos{display:flex;flex-direction:column;align-items:center;gap:26px;margin-top:12px}
.sb-photo{position:relative;background:#fbfaf4;padding:10px 10px 46px;box-shadow:2px 4px 8px rgba(0,0,0,.4)}
.sb-photo img,.sb-photo .ph{width:400px;height:300px;display:block;background:#222}
.sb-photo .ph{display:flex;align-items:center;justify-content:center;color:#888;font-size:24px;background:#d9d2bd}
.sb-photo .cap{position:absolute;left:12px;right:12px;bottom:6px;text-align:center;color:#b3261e;font-size:28px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sb-list{font-size:24px;line-height:1.45}
.sb-doodle{font-size:44px;text-align:center;letter-spacing:6px;color:#4b8a1c;margin:6px 0}
.sb-shelf{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:flex-end;padding:14px 10px 10px;border-bottom:14px solid #4a3320;margin-bottom:12px;min-height:150px;background:linear-gradient(#1a130c,#24190f)}
.sb-spine{width:56px;border-radius:4px 4px 2px 2px;color:#efe3c2;font-family:'Bangers';font-size:22px;text-align:center;padding-top:10px;box-shadow:inset -6px 0 0 rgba(0,0,0,.25),0 2px 4px #000;writing-mode:vertical-rl}
`;document.head.appendChild(s);}
// Torn paper: a jagged edge top and bottom, the same every time you open the same page.
function bookTorn(seed){const r=yRng(seed),pts=[];for(let x=0;x<=100;x+=4)pts.push(`${x}% ${(r()*1.6).toFixed(2)}%`);
  for(let y=4;y<=96;y+=8)pts.push(`${(100-r()*0.8).toFixed(2)}% ${y}%`);
  for(let x=100;x>=0;x-=4)pts.push(`${x}% ${(100-r()*1.8).toFixed(2)}%`);
  for(let y=96;y>=4;y-=8)pts.push(`${(r()*0.8).toFixed(2)}% ${y}%`);return `polygon(${pts.join(',')})`;}
function bookTape(seed,n){const r=yRng(seed*7+3),spots=[[18,-12,-9],[66,-10,7],[40,-14,-3]];
  return spots.slice(0,n||2).map(([l,t,a])=>`<div class="sb-tape" style="left:${l+r()*8}%;top:${t}px;transform:rotate(${a+r()*6-3}deg)"></div>`).join('');}
function bookPage(seed,html,n){return `<div class="sb-page" style="clip-path:${bookTorn(seed)};transform:rotate(${(yRng(seed)()*1.6-0.8).toFixed(2)}deg)">${bookTape(seed,n)}${html}</div>`;}
// Per-game numbers: your team against the teams you played.
function bookTotals(games){const T={n:games.length,pts:[0,0],yd:[0,0],bites:[0,0],limbs:[0,0],died:0,w:0,l:0};
  for(const g of games){T.pts[0]+=g.us;T.pts[1]+=g.them;T.yd[0]+=g.yd[0];T.yd[1]+=g.yd[1];T.bites[0]+=g.bites[0];T.bites[1]+=g.bites[1];T.limbs[0]+=g.limbs[0];T.limbs[1]+=g.limbs[1];T.died+=g.died;if(g.us>g.them)T.w++;else T.l++;}
  return T;}
function bookStatRow(lb,a,b){const m=Math.max(a,b,0.1),f=x=>(Math.round(x*10)/10).toString();
  return `<div class="sb-row"><div class="lb">${lb}</div><div class="sb-bars"><div class="sb-bar us" style="width:${Math.max(3,a/m*100)}%"></div><div class="sb-bar them" style="width:${Math.max(3,b/m*100)}%"></div></div><div class="sb-n">${f(a)}<br>${f(b)}</div></div>`;}
const FATE_WORD=['lost in the Wild Card','lost the Graveyard Championship','lost the Rot Bowl','WON THE ROT BOWL!!!'];
// Build every page of one book: the cover, the team page, the photos two to a page, the games, and the last page.
function bookPages(bk,photos,live){const s=bk.season,T=bookTotals(bk.games),n=Math.max(1,T.n),name=LEAGUE[0].name,pages=[];
  const rec=bk.rec?`${bk.rec[0]}–${bk.rec[1]}`:(live&&CAREER?recStr(userTeam()):`${T.w}–${T.l}`),top=Object.entries(bk.scorers||{}).sort((a,b)=>b[1]-a[1]);
  const coverPh=photos.find(p=>p.k==='td')||photos[0];
  pages.push(bookPage(s*31+1,`<div class="sb-title">SEASON ${s}</div><div class="sb-sub">the ${name} scrapbook</div><div class="sb-doodle">☠ ✿ ☠</div>
    ${coverPh?`<div class="sb-photos"><div class="sb-photo" style="transform:rotate(${coverPh.r||-3}deg)"><img src="${coverPh.img}" alt=""><div class="cap">${coverPh.cap}</div></div></div>`:''}
    <div class="sb-sub" style="margin-top:16px">record: <span class="sb-big">${rec}</span></div>${bk.fate!=null&&bk.fate>=0?`<div class="sb-sub">we ${FATE_WORD[bk.fate]}</div>`:''}${live?'<div class="sb-sub" style="font-size:24px">(still writing this one)</div>':''}`,3));
  pages.push(bookPage(s*31+2,`<div class="sb-title" style="font-size:48px">OUR TEAM</div><div class="sb-key"><b style="color:#3e8a1a">us</b> vs <b style="color:#6b2b7a">them</b> (every game, on average)</div>
    ${T.n?[['points',T.pts[0]/n,T.pts[1]/n],['yards',T.yd[0]/n,T.yd[1]/n],['bites',T.bites[0]/n,T.bites[1]/n],['limbs pulled off',T.limbs[0]/n,T.limbs[1]/n]].map(x=>bookStatRow(...x)).join(''):'<div class="sb-sub">no games yet. go play one!!</div>'}
    ${T.n?`<div style="margin-top:14px">zombies who died: <span class="sb-big">${T.died}</span> (they got better)</div>`:''}
    ${top.length?`<div style="margin-top:8px">most tuchdowns: <span class="sb-big">${top[0][0]}</span> with ${top[0][1]}</div>`:''}`));
  const rest=photos.filter(p=>p!==coverPh);for(let i=0;i<rest.length;i+=2)pages.push(bookPage(s*31+10+i,`<div class="sb-photos">${rest.slice(i,i+2).map(p=>`<div class="sb-photo" style="transform:rotate(${p.r||2}deg)"><img src="${p.img}" alt=""><div class="cap">${p.cap}</div></div>`).join('')}</div>`,2));
  if(bk.games.length)pages.push(bookPage(s*31+5,`<div class="sb-title" style="font-size:46px">THE GAMES</div><div class="sb-list">${bk.games.map(g=>{const w=g.us>g.them;
    return `${g.po>=0?PO_NAME[g.po]:'wk '+(g.w+1)}: ${w?'beat':'lost to'} the ${LEAGUE[g.opp].name} ${g.us}–${g.them}${w?' ✓':' ✗'}`;}).join('<br>')}</div>`,1));
  if(!live)pages.push(bookPage(s*31+6,`<div class="sb-title" style="font-size:52px">THE END</div><div class="sb-sub">${bk.bowl!=null?`the ${LEAGUE[bk.bowl].name} won the Rot Bowl`:''}</div>
    ${bk.draft?`<div class="sb-sub" style="margin-top:14px">${bk.draft==='traded'?'we traded our draft pick 4 bones':`we dug up ${bk.draft} in the draft`}</div>`:''}<div class="sb-doodle" style="margin-top:20px">☠ see u next season ☠</div>`));
  return pages;}
// Open a book: "live" for the season still going, or a past season from the Library. Prev and Next turn the pages.
function bookOpen(season,page,back){const live=!CAREER.library||!CAREER.library.find(b=>b.season===season)||season===CAREER.season;
  const bk=live?Object.assign({},bookCur(),{fate:poLive()?null:(CAREER.po?poFate():null)}):CAREER.library.find(b=>b.season===season);
  bookShow(bk,snapsOf(season),live,page||0,back);}
function bookShow(bk,photos,live,page,back){bookCSS();const pages=bookPages(bk,photos,live),i=Math.max(0,Math.min(pages.length-1,page)),again=p=>()=>bookShow(bk,photos,live,p,back);
  seasonSub(`SEASON ${bk.season} SCRAPBOOK`,`<div class="sn-head" style="font-size:22px;margin:-6px 0 6px">page ${i+1} of ${pages.length}</div>${pages[i]}`,
    [{label:'Next page ›',hidden:i>=pages.length-1,act:again(i+1)},{label:'‹ Previous page',hidden:i===0,act:again(i-1)},{label:'Back',act:()=>(back||seasonOpen)()}],back||null);}
// The Library: a shelf with a spine for every finished season, champions in gold.
function seasonLibrary(){bookCSS();const L=(CAREER.library||[]).slice().reverse();
  seasonSub('THE LIBRARY',`<div class="sb-shelf">${L.map((b,i)=>`<div class="sb-spine" style="height:${110+(b.season*37%40)}px;background:${b.fate===3?'#b8902a':BOOK_SKY[b.season%BOOK_SKY.length]}">SEASON ${b.season}</div>`).join('')}</div>
    <div class="sn-line">${L.length?'Pick a season to flip through.':'Finished seasons go on the shelf.'}</div>`,
    [...L.map(b=>({label:`Season ${b.season} · ${b.rec[0]}–${b.rec[1]}`,sub:b.fate===3?'Rot Bowl champions':b.fate>=0?`playoffs: ${FATE_WORD[b.fate]}`:'missed the playoffs',act:()=>bookOpen(b.season,0,seasonLibrary)})),{label:'Back',act:()=>seasonOpen()}]);}
// The two menu items on the Season screen.
function snBooks(){const bk=CAREER.book&&CAREER.book.season===CAREER.season?CAREER.book:null,ng=bk?bk.games.length:0,np=snapsOf(CAREER.season).length;
  return [{label:'The Scrapbook',sub:ng?`${ng} game${ng===1?'':'s'} so far · ${np} photo${np===1?'':'s'}`:'fills up as you play',act:()=>bookOpen(CAREER.season,0)},
    {label:'The Library',hidden:!(CAREER.library&&CAREER.library.length),sub:'your past seasons',act:()=>seasonLibrary()}];}
// Testing aid: add ?book to the address to see a sample scrapbook made from the title screen, without touching your career.
function bookDemo(){const shots=[];for(let i=0;i<3;i++){try{const o=document.createElement('canvas');o.width=SNAP_W;o.height=SNAP_H;const c=o.getContext('2d'),sw=cv.width,sh=Math.round(cv.width*0.75);
    c.drawImage(cv,0,Math.round((cv.height-sh)*(0.3+i*0.2)),sw,sh,0,0,SNAP_W,SNAP_H);shots.push(o.toDataURL('image/jpeg',0.62));}catch(e){}}
  const ks=['td','head','half'],ph=shots.map((img,i)=>({k:ks[i],img,r:[-3,4,-2][i],cap:SCRAWL[ks[i]][0].replace('{name}','Crusty McRot')}));
  const games=Array.from({length:12},(_,w)=>{const us=7*Math.floor(Math.random()*5),them=7*Math.floor(Math.random()*4)+(Math.random()<0.5?0:7);
    return {w,po:-1,opp:1+(w%11),us,them:us===them?them+7:them,yd:[Math.round(lgRand(80,260)),Math.round(lgRand(70,220))],bites:[Math.floor(lgRand(0,6)),Math.floor(lgRand(0,6))],limbs:[Math.floor(lgRand(0,6)),Math.floor(lgRand(0,5))],died:Math.floor(lgRand(0,3))};});
  const bk={season:1,games,scorers:{'Crusty McRot':6,'Mabel Moldoon':4},rec:[7,5],fate:1,bowl:5,draft:'Gravella Bones'};
  bookShow(bk,ph,false,0,()=>toTitle());}
if(typeof location!=='undefined'&&/[?&]book\b/.test(location.search||''))setTimeout(()=>{try{bookDemo();}catch(e){}},1800);
