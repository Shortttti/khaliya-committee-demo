const finePointer=window.matchMedia('(hover:hover) and (pointer:fine)');
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');

const revealSelector=[
  '.hero-copy','.hero-visual','.feature-card','.workflow-list li','.role-grid article',
  '.security-inner > *','.closing-cta > *','.auth-intro','.auth-card','.wizard-panel',
  '.page-heading','.stats-grid > *','.panel','.today-project','.attention-row',
  '.table-wrap','.filter-bar','.manager-welcome','.manager-project','.task-achievement'
].join(',');

const tiltSelector=[
  '.hero-visual','.feature-card','.role-grid article','.panel','.today-project',
  '.manager-welcome','.manager-stats > a','.manager-project','.task-achievement'
].join(',');

let activeTilt=null;
let revealObserver=null;

function resetTilt(el){
  if(!el)return;
  el.style.removeProperty('--pointer-x');
  el.style.removeProperty('--pointer-y');
  el.style.removeProperty('--tilt-x');
  el.style.removeProperty('--tilt-y');
  el.classList.remove('pointer-active');
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
    el.style.setProperty('--reveal-delay',Math.min(index%7,6)*55+'ms');
    revealObserver?.observe(el);
  });
}

function initReveal(){
  if(reducedMotion.matches)return;
  revealObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      entry.target.classList.add('motion-in');
      revealObserver.unobserve(entry.target);
    });
  },{threshold:.08,rootMargin:'0px 0px -7% 0px'});
  prepareReveal(document);
  new MutationObserver(records=>{
    records.forEach(record=>record.addedNodes.forEach(node=>{
      if(node.nodeType===1)prepareReveal(node);
    }));
  }).observe(document.body,{childList:true,subtree:true});
}

function setPointerGlow(event){
  if(!finePointer.matches||reducedMotion.matches)return;
  document.documentElement.style.setProperty('--mouse-x',event.clientX+'px');
  document.documentElement.style.setProperty('--mouse-y',event.clientY+'px');
}

function moveTilt(event){
  if(!finePointer.matches||reducedMotion.matches)return;
  const el=event.target.closest(tiltSelector);
  if(activeTilt!==el){resetTilt(activeTilt);activeTilt=el}
  if(!el)return;
  const rect=el.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const x=event.clientX-rect.left,y=event.clientY-rect.top;
  el.style.setProperty('--pointer-x',x+'px');
  el.style.setProperty('--pointer-y',y+'px');
  el.style.setProperty('--tilt-x',((y/rect.height-.5)*-2.4).toFixed(2)+'deg');
  el.style.setProperty('--tilt-y',((x/rect.width-.5)*3.1).toFixed(2)+'deg');
  el.classList.add('pointer-active');
}

function ripple(event){
  const target=event.target.closest('.btn,.button,.icon-btn,.display-btn,.font-btn,.nav-link,.copy-id-btn');
  if(!target)return;
  const rect=target.getBoundingClientRect();
  const ripple=document.createElement('i');
  ripple.className='motion-ripple';
  ripple.style.left=(event.clientX-rect.left)+'px';
  ripple.style.top=(event.clientY-rect.top)+'px';
  target.append(ripple);
  setTimeout(()=>ripple.remove(),620);
}

async function copyProfileId(button){
  const value=button.dataset.copyId||'';
  if(!value)return;
  try{
    if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(value);
    else{
      const area=document.createElement('textarea');
      area.value=value;area.style.position='fixed';area.style.opacity='0';
      document.body.append(area);area.select();document.execCommand('copy');area.remove();
    }
    button.classList.add('copied');
    button.setAttribute('aria-label',document.documentElement.lang==='en'?'Copied':'تم النسخ');
    setTimeout(()=>button.classList.remove('copied'),1400);
  }catch(error){console.error('KHALIYA ID copy failed',error)}
}

document.addEventListener('pointermove',event=>{setPointerGlow(event);moveTilt(event)},{passive:true});
document.addEventListener('pointerout',event=>{
  if(activeTilt&&(!event.relatedTarget||!activeTilt.contains(event.relatedTarget))){resetTilt(activeTilt);activeTilt=null}
},{passive:true});
window.addEventListener('blur',()=>{resetTilt(activeTilt);activeTilt=null});
document.addEventListener('pointerdown',ripple);
document.addEventListener('click',event=>{
  const copyButton=event.target.closest('[data-copy-id]');
  if(copyButton){event.preventDefault();copyProfileId(copyButton)}
});

function syncScrollState(){
  document.documentElement.classList.toggle('is-scrolled',window.scrollY>10);
  document.documentElement.style.setProperty('--scroll-y',window.scrollY+'px');
}
window.addEventListener('scroll',syncScrollState,{passive:true});
syncScrollState();

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initReveal,{once:true});
else initReveal();
