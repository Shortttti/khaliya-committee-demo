const $=(s,r=document)=>r.querySelector(s);
const params=new URLSearchParams(location.search);
if(document.querySelector('[data-auth="signup"]')&&params.get('role')){const choice=document.querySelector(`[name="role"][value="${params.get('role')}"]`);if(choice)choice.checked=true}
const roles={manager:{label:'مكتب هندسي',name:'جوري العروي',initial:'ج',office:'مكتب أفق للاستشارات'},pm:{label:'مدير مشروع',name:'سارة الحربي',initial:'س',office:'مكتب أفق للاستشارات'},engineer:{label:'مهندس',name:'أحمد السالم',initial:'أ',office:'مكتب أفق للاستشارات'},client:{label:'عميل',name:'شركة أفق للتطوير',initial:'أ',office:'شركة أفق للتطوير'}};
function goWorkspace(role){const u=roles[role]||roles.manager;try{const key='nawa.workspace.v2';const current=JSON.parse(localStorage.getItem(key)||'{}');const saved=current.user?.role===role?current.user:null;const name=sessionStorage.getItem('nawa-onboarding-name')||saved?.name||u.name;current.user={...(saved||{}),name,initial:name.trim().slice(0,1)||u.initial,role};if(role==='manager'&&sessionStorage.getItem('nawa-onboarding-role')==='manager'){const office=sessionStorage.getItem('nawa-onboarding-office');if(office)current.settings={...(current.settings||{}),office}}localStorage.setItem(key,JSON.stringify(current));sessionStorage.setItem('nawa-demo-session','1')}catch{}location.href=role==='client'?'client.html':'home.html'}
document.querySelector('[data-nav-toggle]')?.addEventListener('click',()=>document.body.classList.toggle('nav-open'));
document.querySelectorAll('.site-nav a[href^="#"]').forEach(a=>a.addEventListener('click',()=>document.body.classList.remove('nav-open')));
document.querySelector('[data-forgot]')?.addEventListener('click',e=>{e.preventDefault();const f=e.currentTarget.closest('form'),feedback=$('.form-feedback',f);feedback.textContent='استعادة كلمة المرور تتطلب تفعيل خدمة البريد في نسخة الخادم.'});
document.querySelector('[data-auth="login"]')?.addEventListener('submit',e=>{e.preventDefault();let role='manager';try{role=JSON.parse(localStorage.getItem('nawa.workspace.v2')||'{}').user?.role||role}catch{}goWorkspace(role)});
document.querySelector('[data-auth="signup"]')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),role=f.get('role')||'manager',u=roles[role];try{const state=JSON.parse(localStorage.getItem('nawa.workspace.v2')||'{}');state.user={name:f.get('name')||u.name,initial:(f.get('name')||u.name).trim().slice(0,1),role};if(role==='manager')state.settings={...(state.settings||{}),office:''};localStorage.setItem('nawa.workspace.v2',JSON.stringify(state));sessionStorage.setItem('nawa-onboarding-role',role);sessionStorage.setItem('nawa-onboarding-name',f.get('name')||u.name);sessionStorage.setItem('nawa-onboarding-email',f.get('email')||'')}catch{}location.href='onboarding.html'});
const onboarding=$('[data-onboarding]');
if(onboarding){let role=sessionStorage.getItem('nawa-onboarding-role')||params.get('role')||'manager';if(!roles[role])role='manager';const u=roles[role];$('[data-role-label]').textContent=u.label;const isJoin=role==='engineer'||role==='pm',isClient=role==='client',isManager=role==='manager';document.querySelectorAll('[data-office-field] input,[data-office-field] select').forEach(field=>{field.disabled=!isManager;field.required=isManager&&field.name==='office'});if(isJoin||isClient){$('[data-onboard-title]').textContent=isClient?'الانضمام إلى المشروع':'الانضمام إلى المكتب';$('[data-onboard-desc]').textContent=isClient?'رمز دعوة المشروع أو البريد المرتبط بالدعوة.':'رمز الدعوة المرسل من المكتب الهندسي.';$('[data-step-title]').textContent=isClient?'التحقق من دعوة المشروع':'دعوة المكتب';$('[data-step-desc]').textContent=isClient?'يمنحك رمز الدعوة الوصول إلى بيانات العميل المشتركة فقط.':'يلزم رمز دعوة للوصول إلى مساحة عمل المكتب.';document.querySelectorAll('[data-office-field]').forEach(x=>x.hidden=true);document.querySelectorAll('[data-invite-field]').forEach(x=>x.hidden=isClient);document.querySelectorAll('[data-client-field]').forEach(x=>x.hidden=!isClient);$('[data-step2-title]').textContent='تفضيلات مساحة العمل';$('[data-step2-desc]').textContent='ستظهر لك المشاريع والعناصر التي لديك صلاحية الوصول إليها.';$('[data-ready-title]').textContent='تم تجهيز مسار الانضمام.';$('[data-ready-desc]').textContent='تجربة الواجهة تستخدم بيانات توضيحية. تفعيل الدعوة يحتاج اتصالًا بخدمة الحسابات.'}
let step=1;const show=(next)=>{step=next;document.querySelectorAll('.wizard-panel').forEach(x=>x.classList.toggle('active',Number(x.dataset.step)===step));document.querySelectorAll('.wizard-step').forEach((x,i)=>{x.classList.toggle('current',i+1===step);x.classList.toggle('done',i+1<step)});$('[data-progress]').style.width=step===1?'33%':step===2?'67%':'100%';if(step===3){const name=$('[name="office"]')?.value.trim()||u.office;$('[data-ready-office]').textContent=name;$('[data-ready-role]').textContent=u.label;$('[data-skip]').hidden=true}};
document.querySelectorAll('[data-next]').forEach(b=>b.addEventListener('click',()=>{if(step===1&&role==='manager'){const name=$('[name="office"]')?.value.trim();if(!name){$('[name="office"]')?.focus();return}}show(Math.min(step+1,3))}));document.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>show(Math.max(step-1,1))));$('[data-add-invite]')?.addEventListener('click',()=>{const val=$('[name="teammate"]').value.trim();$('.invite-feedback').textContent=val?`أُضيف ${val} إلى قائمة الدعوات لهذه المعاينة.`:'إضافة بريد الزميل أولًا.'});onboarding.addEventListener('submit',e=>{e.preventDefault();if(role==='manager'){const office=$('[name="office"]')?.value.trim();try{const state=JSON.parse(localStorage.getItem('nawa.workspace.v2')||'{}');state.settings={...(state.settings||{}),office};localStorage.setItem('nawa.workspace.v2',JSON.stringify(state))}catch{}}goWorkspace(role)});$('[data-skip]')?.addEventListener('click',e=>{e.preventDefault();goWorkspace(role)});}

/* Progressive reveal keeps the landing page calm while making the scroll feel alive. */
if(document.body.classList.contains('public-page')){
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTargets=[
    ...document.querySelectorAll('.hero-copy,.hero-visual,.trust-inner,.section-heading,.feature-card,.workflow-layout>*,.workflow-list li,.role-grid article,.security-inner>*,.closing-cta>*')
  ];
  if(!reduced&&'IntersectionObserver' in window){
    document.body.classList.add('motion-ready');
    revealTargets.forEach((el,index)=>{el.dataset.reveal='pending';el.style.setProperty('--reveal-delay',`${(index%4)*55}ms`)});
    const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.dataset.reveal='visible';revealObserver.unobserve(entry.target)}
    }),{threshold:.12,rootMargin:'0px 0px -5% 0px'});
    revealTargets.forEach(el=>revealObserver.observe(el));
  }
  const heroVisual=document.querySelector('.hero-visual');
  if(heroVisual&&!reduced&&window.matchMedia('(pointer:fine)').matches){
    heroVisual.addEventListener('pointermove',event=>{
      const rect=heroVisual.getBoundingClientRect();
      const x=((event.clientX-rect.left)/rect.width-.5)*5;
      const y=((event.clientY-rect.top)/rect.height-.5)*5;
      heroVisual.style.setProperty('--hero-shift-x',`${x.toFixed(1)}px`);
      heroVisual.style.setProperty('--hero-shift-y',`${y.toFixed(1)}px`);
    });
    heroVisual.addEventListener('pointerleave',()=>{
      heroVisual.style.setProperty('--hero-shift-x','0px');
      heroVisual.style.setProperty('--hero-shift-y','0px');
    });
  }
}
