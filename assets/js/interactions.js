const canHover=window.matchMedia('(hover:hover) and (pointer:fine)');
let activeCard=null;
function resetCard(card){if(!card)return;card.style.removeProperty('--pointer-x');card.style.removeProperty('--pointer-y');card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y');card.classList.remove('pointer-active')}
document.addEventListener('pointermove',event=>{
 if(!canHover.matches)return;
 const card=event.target.closest('.manager-welcome,.manager-stats>a,.manager-project,.task-achievement,.achievement-toggle');
 if(activeCard!==card){resetCard(activeCard);activeCard=card}
 if(!card)return;
 const rect=card.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;
 card.style.setProperty('--pointer-x',x+'px');card.style.setProperty('--pointer-y',y+'px');
 card.style.setProperty('--tilt-x',((y/rect.height-.5)*-1.4).toFixed(2)+'deg');
 card.style.setProperty('--tilt-y',((x/rect.width-.5)*1.8).toFixed(2)+'deg');
 card.classList.add('pointer-active');
},{passive:true});
document.addEventListener('pointerout',event=>{
 if(activeCard&&(!event.relatedTarget||!activeCard.contains(event.relatedTarget))){resetCard(activeCard);activeCard=null}
},{passive:true});
window.addEventListener('blur',()=>{resetCard(activeCard);activeCard=null});

