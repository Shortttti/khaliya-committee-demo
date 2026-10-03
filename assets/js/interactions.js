const finePointer=window.matchMedia('(hover:hover) and (pointer:fine)');
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const revealSelector=[
  '.hero-copy','.hero-visual','.feature-card','.workflow-list li','.role-grid article',
  '.security-inner > *','.closing-cta > *','.auth-intro','.auth-card','.wizard-panel',
  '.page-heading','.stats-grid > *','.panel','.today-project','.attention-row',
  '.table-wrap','.filter-bar','.manager-welcome','.manager-project','.task-achievement',
  '.quantity-project','.activity-row','.file-entry','.visual-review','.meeting-card'
].join(',');
const tiltSelector=[
  '.hero-visual','.feature-card','.role-grid article','.panel','.today-project',
  '.manager-welcome','.manager-stats > a','.manager-project','.task-achievement',
  '.auth-card','.wizard-card'
].join(',');
const magneticSelector='.btn,.button,.icon-btn,.display-btn,.font-btn,.copy-id-btn';

let activeTilt=null,activeMagnetic=null,revealObserver=null,countObserver=null,rafScroll=0;

function resetTilt(el){
  if(!el)return;
  ['--pointer-x','--pointer-y','--tilt-x','--tilt-y'].forEach(v=>el.style.removeProperty(v));
  el.classList.remove('pointer-active');
}
function resetMagnetic(el){
  if(!el)return;
  el.style.removeProperty('--mag-x');
  el.style.removeProperty('--mag-y');
}
function prepareReveal(root=document){
  if(reducedMotion.matches)return;
  const elements=[];
  if(root.nodeType===1&&root.matches?.(revealSelector))elements.push(root);
  root.querySelectorAll?.(revealSelector).forEach(el=>elements.push(el));
  elements.forEach((el,index)=>{
    if(el.dataset.motionReady)return;
    el.dataset.motionReady='true';
    el.classList.add('motion-reveal');
    el.style.setProperty('--reveal-delay',Math.min(index%8,7)*50+'ms');
    revealObserver?.observe(el);
  });
}
function prepareCounters(root=document){
  if(reducedMotion.matches)return;
  root.querySelectorAll?.('.stat-value').forEach(el=>{
    if(el.dataset.countReady)return;
    const raw=el.textContent.trim();
    if(!/^\d+(?:[.,]\d+)?%?$/.test(raw))return;
    el.dataset.countReady='true';
    el.dataset.countTarget=raw;
    countObserver?.observe(el);
  });
}
function animateCounter(el){
  if(el.dataset.counted)return;
  el.dataset.counted='true';
  const raw=el.dataset.countTarget||el.textContent.trim();
  const suffix=raw.endsWith('%')?'%':'';
  const numeric=Number(raw.replace('%','').replace(',','.'));
  if(!Number.isFinite(numeric))return;
  const decimals=(String(numeric).split('.')[1]||'').length;
  const duration=680,start=performance.now();
  const tick=now=>{
    const t=Math.min(1,(now-start)/duration);
    const eased=1-Math.pow(1-t,3);
    el.textContent=(numeric*eased).toFixed(decimals)+suffix;
    if(t<1)requestAnimationFrame(tick);else el.textContent=raw;
  };
  requestAnimationFrame(tick);
}
function initReveal(){
  if(reducedMotion.matches)return;
  revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    entry.target.classList.add('motion-in');
    revealObserver.unobserve(entry.target);
  }),{threshold:.07,rootMargin:'0px 0px -6% 0px'});
  countObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    animateCounter(entry.target);countObserver.unobserve(entry.target);
  }),{threshold:.45});
  prepareReveal(document);prepareCounters(document);
  new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{
    if(node.nodeType!==1)return;
    prepareReveal(node);prepareCounters(node);
  }))).observe(document.body,{childList:true,subtree:true});
}
function ensureMotionUi(){
  if(reducedMotion.matches)return;
  if(!document.querySelector('.motion-progress')){
    const progress=document.createElement('div');progress.className='motion-progress';progress.setAttribute('aria-hidden','true');document.body.append(progress);
  }
}
function ripple(event){
  const target=event.target.closest(magneticSelector+',.nav-link');
  if(!target)return;
  const rect=target.getBoundingClientRect(),wave=document.createElement('i');
  wave.className='motion-ripple';wave.style.left=(event.clientX-rect.left)+'px';wave.style.top=(event.clientY-rect.top)+'px';
  target.append(wave);setTimeout(()=>wave.remove(),650);
}
async function copyProfileId(button){
  const value=button.dataset.copyId||'';if(!value)return;
  try{
    if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(value);
    else{const area=document.createElement('textarea');area.value=value;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();document.execCommand('copy');area.remove()}
    button.classList.add('copied');button.setAttribute('aria-label',document.documentElement.lang==='en'?'Copied':'تم النسخ');
    setTimeout(()=>button.classList.remove('copied'),1400);
  }catch(error){console.error('KHALIYA ID copy failed',error)}
}
function syncScrollState(){
  const y=window.scrollY,max=Math.max(1,document.documentElement.scrollHeight-innerHeight),progress=Math.min(1,y/max);
  document.documentElement.classList.toggle('is-scrolled',y>10);
  document.documentElement.style.setProperty('--scroll-y',y+'px');
  document.documentElement.style.setProperty('--scroll-progress',progress);
  document.documentElement.style.setProperty('--hero-copy-y',Math.min(y*.055,28)+'px');
  document.documentElement.style.setProperty('--hero-visual-y',Math.min(y*.09,46)+'px');
  document.documentElement.style.setProperty('--bg-drift',Math.min(y*.035,34)+'px');
}
function requestScrollSync(){if(rafScroll)return;rafScroll=requestAnimationFrame(()=>{rafScroll=0;syncScrollState()})}
function enablePageTransitions(){
  document.addEventListener('click',event=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const link=event.target.closest('a[href]');if(!link||link.target==='_blank'||link.hasAttribute('download'))return;
    const href=link.getAttribute('href')||'';
    if(!href||href.startsWith('#')||href.startsWith('mailto:')||href.startsWith('tel:')||href.startsWith('javascript:'))return;
    const url=new URL(link.href,location.href);
    if(url.origin!==location.origin||url.href===location.href)return;
    event.preventDefault();document.body.classList.add('page-leaving');
    setTimeout(()=>{location.href=url.href},145);
  });
}
document.addEventListener('pointerdown',ripple);
document.addEventListener('click',event=>{const copy=event.target.closest('[data-copy-id]');if(copy){event.preventDefault();copyProfileId(copy)}});
window.addEventListener('scroll',requestScrollSync,{passive:true});
window.addEventListener('resize',requestScrollSync,{passive:true});
window.addEventListener('pageshow',()=>document.body.classList.remove('page-leaving'));
ensureMotionUi();syncScrollState();enablePageTransitions();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initReveal,{once:true});else initReveal();

/* KHALIYA motion v3 */
let cinematicRaf=0;

function ensureCinematicLayers(){
  if(reducedMotion.matches)return;
  if(!document.querySelector('.khaliya-ambient')){
    const ambient=document.createElement('div');
    ambient.className='khaliya-ambient';
    ambient.setAttribute('aria-hidden','true');
    ambient.innerHTML='<i></i><i></i><i></i>';
    document.body.prepend(ambient);
  }
  document.body.classList.add('motion-v3-ready');
}

function prepareCinematicSections(){
  if(reducedMotion.matches)return;
  const selector='.hero,.workflow-section,.security-band,.closing-cta,main>section,.content>section,.page.active>section,.page>.panel,.page>.grid';
  document.querySelectorAll(selector).forEach((section,index)=>{
    if(section.dataset.cinematicReady)return;
    section.dataset.cinematicReady='true';
    section.classList.add('cinematic-section');
    section.style.setProperty('--cinematic-index',index%8);
  });
}

function syncCinematicSections(){
  if(reducedMotion.matches)return;
  const center=innerHeight*.52;
  document.querySelectorAll('.cinematic-section').forEach(section=>{
    const rect=section.getBoundingClientRect();
    const sectionCenter=rect.top+rect.height/2;
    const distance=Math.abs(sectionCenter-center);
    const range=Math.max(innerHeight*.82,rect.height*.72);
    const focus=Math.max(0,Math.min(1,1-distance/range));
    section.style.setProperty('--section-focus',focus.toFixed(3));
    section.classList.toggle('cinematic-focus',focus>.48);
  });
}

function requestCinematicSync(){
  if(cinematicRaf)return;
  cinematicRaf=requestAnimationFrame(()=>{
    cinematicRaf=0;
    prepareCinematicSections();
    syncCinematicSections();
  });
}

function pageEnter(){
  if(reducedMotion.matches)return;
  document.body.classList.remove('page-entering');
  void document.body.offsetWidth;
  document.body.classList.add('page-entering');
  setTimeout(()=>document.body.classList.remove('page-entering'),850);
}

window.addEventListener('scroll',requestCinematicSync,{passive:true});
window.addEventListener('resize',requestCinematicSync,{passive:true});
window.addEventListener('pageshow',()=>{pageEnter();requestCinematicSync()});
new MutationObserver(requestCinematicSync).observe(document.body,{childList:true,subtree:true});
ensureCinematicLayers();
prepareCinematicSections();
syncCinematicSections();
pageEnter();
