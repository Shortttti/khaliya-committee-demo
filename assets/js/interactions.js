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
  if(finePointer.matches&&!document.querySelector('.khaliya-cursor-aura')){
    const aura=document.createElement('div');aura.className='khaliya-cursor-aura';aura.setAttribute('aria-hidden','true');document.body.append(aura);
  }
}
function setPointerGlow(event){
  if(!finePointer.matches||reducedMotion.matches)return;
  document.documentElement.style.setProperty('--mouse-x',event.clientX+'px');
  document.documentElement.style.setProperty('--mouse-y',event.clientY+'px');
  const aura=document.querySelector('.khaliya-cursor-aura');
  if(aura)aura.style.translate=(event.clientX-18)+'px '+(event.clientY-18)+'px';
}
function moveTilt(event){
  if(!finePointer.matches||reducedMotion.matches)return;
  const el=event.target.closest(tiltSelector);
  if(activeTilt!==el){resetTilt(activeTilt);activeTilt=el}
  if(!el)return;
  const rect=el.getBoundingClientRect();if(!rect.width||!rect.height)return;
  const x=event.clientX-rect.left,y=event.clientY-rect.top;
  el.style.setProperty('--pointer-x',x+'px');el.style.setProperty('--pointer-y',y+'px');
  el.style.setProperty('--tilt-x',((y/rect.height-.5)*-2.8).toFixed(2)+'deg');
  el.style.setProperty('--tilt-y',((x/rect.width-.5)*3.6).toFixed(2)+'deg');
  el.classList.add('pointer-active');
}
function moveMagnetic(event){
  if(!finePointer.matches||reducedMotion.matches)return;
  const el=event.target.closest(magneticSelector);
  if(activeMagnetic!==el){resetMagnetic(activeMagnetic);activeMagnetic=el}
  if(!el)return;
  const rect=el.getBoundingClientRect();if(!rect.width||!rect.height)return;
  const x=(event.clientX-(rect.left+rect.width/2))/rect.width;
  const y=(event.clientY-(rect.top+rect.height/2))/rect.height;
  el.style.setProperty('--mag-x',(x*7).toFixed(2)+'px');
  el.style.setProperty('--mag-y',(y*6).toFixed(2)+'px');
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
document.addEventListener('pointermove',event=>{setPointerGlow(event);moveTilt(event);moveMagnetic(event)},{passive:true});
document.addEventListener('pointerout',event=>{
  if(activeTilt&&(!event.relatedTarget||!activeTilt.contains(event.relatedTarget))){resetTilt(activeTilt);activeTilt=null}
  if(activeMagnetic&&(!event.relatedTarget||!activeMagnetic.contains(event.relatedTarget))){resetMagnetic(activeMagnetic);activeMagnetic=null}
},{passive:true});
window.addEventListener('blur',()=>{resetTilt(activeTilt);resetMagnetic(activeMagnetic);activeTilt=null;activeMagnetic=null});
document.addEventListener('pointerdown',ripple);
document.addEventListener('click',event=>{const copy=event.target.closest('[data-copy-id]');if(copy){event.preventDefault();copyProfileId(copy)}});
window.addEventListener('scroll',requestScrollSync,{passive:true});
window.addEventListener('resize',requestScrollSync,{passive:true});
window.addEventListener('pageshow',()=>document.body.classList.remove('page-leaving'));
ensureMotionUi();syncScrollState();enablePageTransitions();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initReveal,{once:true});else initReveal();
