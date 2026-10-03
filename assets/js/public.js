import { auth, db } from './firebase.js';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const $=(selector,root=document)=>root.querySelector(selector);
const params=new URLSearchParams(location.search);
const roles={
  manager:{label:'مكتب هندسي',name:'مدير المكتب',office:''},
  pm:{label:'مدير مشروع',name:'مدير مشروع',office:''},
  engineer:{label:'مهندس / موظف',name:'مهندس',office:''},
  client:{label:'عميل',name:'عميل',office:''},
  consultant:{label:'استشاري',name:'استشاري',office:''}
};

document.querySelector('[data-nav-toggle]')?.addEventListener('click',()=>document.body.classList.toggle('nav-open'));
document.querySelectorAll('.site-nav a[href^="#"]').forEach(link=>link.addEventListener('click',()=>document.body.classList.remove('nav-open')));

const onboarding=$('[data-onboarding]');
if(onboarding){
  let role=sessionStorage.getItem('nawa-onboarding-role')||params.get('role')||'manager';
  if(!roles[role])role='manager';
  const roleInfo=roles[role];
  const isManager=role==='manager';
  const isClient=role==='client';
  $('[data-role-label]').textContent=roleInfo.label;
  $('[data-onboard-title]').textContent=isManager?'لنجهّز مساحة مكتبك.':isClient?'اربط حسابك بمشروعك.':'اربط حسابك بمكتبك.';
  $('[data-onboard-desc]').textContent=isManager?'أنشئ مساحة المكتب ثم شارك رمز الدعوة مع أعضاء الفريق.':'أدخل رمز الدعوة الذي أرسله لك المكتب أو مدير المشروع.';
  document.querySelectorAll('[data-office-field]').forEach(field=>field.hidden=!isManager);
  document.querySelectorAll('[data-invite-field]').forEach(field=>field.hidden=isManager||isClient);
  document.querySelectorAll('[data-manager-invite]').forEach(field=>field.hidden=!isManager);
  document.querySelectorAll('[data-client-field]').forEach(field=>field.hidden=!isClient);
  $('[data-step-title]').textContent=isManager?'بيانات المكتب':'رمز الدعوة';
  $('[data-step-desc]').textContent=isManager?'تُحفظ بيانات المكتب في قاعدة البيانات.':'يجب أن يطابق الرمز البريد والدور المسجلين في حسابك.';
  $('[data-step2-title]').textContent=isManager?'التخصصات والفريق':'معلومات إضافية';
  $('[data-ready-title]').textContent=isManager?'مساحة مكتبك جاهزة.':'اكتمل ربط الحساب.';
  $('[data-ready-desc]').textContent='ستظهر هنا المشاريع والبيانات التي لديك صلاحية الوصول إليها.';
  $('[data-skip]')?.remove();
  document.querySelector('[data-demo-projects]')?.remove();

  let step=1,officeReady=false;
  const show=next=>{
    step=next;
    document.querySelectorAll('.wizard-panel').forEach(panel=>panel.classList.toggle('active',Number(panel.dataset.step)===step));
    document.querySelectorAll('.wizard-step').forEach((item,index)=>{item.classList.toggle('current',index+1===step);item.classList.toggle('done',index+1<step)});
    const progress=$('[data-progress]');
    if(progress)progress.style.width=step===1?'33%':step===2?'67%':'100%';
    if(step===3){
      $('[data-ready-office]').textContent=$('[name="office"]')?.value.trim()||'مكتبك';
      $('[data-ready-role]').textContent=roleInfo.label;
    }
  };
  document.querySelectorAll('[data-next]').forEach(button=>button.addEventListener('click',()=>{
    if(step===1){
      if(isManager&&!$('[name="office"]')?.value.trim()){ $('[name="office"]')?.focus();return; }
      if(!isManager){
        const code=String($('[name="invite"]')?.value||$('[name="clientInvite"]')?.value||'').trim();
        if(!code){ $('[name="invite"]')?.focus();return; }
      }
    }
    show(Math.min(step+1,3));
  }));
  document.querySelectorAll('[data-back]').forEach(button=>button.addEventListener('click',()=>show(Math.max(step-1,1))));

  $('[data-add-invite]')?.addEventListener('click',()=>{
    const email=$('[name="teammate"]')?.value.trim();
    const feedback=$('.invite-feedback');
    if(!email){if(feedback)feedback.textContent='أدخل البريد الإلكتروني أولًا.';return;}
    if(feedback)feedback.textContent='سيُنشأ رمز الدعوة بعد حفظ مساحة المكتب.';
  });

  onboarding.addEventListener('submit',async event=>{
    event.preventDefault();
    const current=auth.currentUser,feedback=$('.invite-feedback'),submit=event.target.querySelector('[type="submit"]');
    if(officeReady){location.href='home.html';return;}
    if(!current){if(feedback)feedback.textContent='انتهت جلسة التسجيل. سجّل الدخول ثم أكمل الإعداد.';return;}
    if(submit){submit.disabled=true;submit.textContent='جارٍ الحفظ…';}
    try{
      const userRef=doc(db,'users',current.uid);
      const userSnap=await getDoc(userRef);
      if(!userSnap.exists())throw new Error('PROFILE_MISSING');
      const profile=userSnap.data();
      if(profile.role!==role)throw new Error('ROLE_MISMATCH');
      if(isManager){
        const officeName=$('[name="office"]')?.value.trim();
        if(!officeName)throw new Error('OFFICE_REQUIRED');
        const officeId='office-'+current.uid;
        await setDoc(doc(db,'offices',officeId),{
          officeId,name:officeName,ownerUid:current.uid,managerUids:[current.uid],
          memberUids:[current.uid],city:$('[name="city"]')?.value.trim()||'',
          company:$('[name="company"]')?.value||'',officeEmail:$('[name="officeEmail"]')?.value.trim()||'',
          createdAt:serverTimestamp(),updatedAt:serverTimestamp()
        });
        await updateDoc(userRef,{officeId,officeName,projectIds:[],onboardingComplete:true,updatedAt:serverTimestamp()});
        await setDoc(doc(db,'offices',officeId,'team',current.uid),{id:current.uid,uid:current.uid,userCode:profile.userCode,name:profile.name,email:profile.email,role:profile.role,specialty:profile.specialty||'',officeId,projectIds:[],visibleTo:[current.uid],createdAt:serverTimestamp()});
        sessionStorage.setItem('nawa-onboarding-office',officeName);
        const inviteEmail=$('[name="teammate"]')?.value.trim().toLowerCase();
        if(inviteEmail){
          const inviteRole=$('[name="inviteRole"]')?.value||'engineer';
          const inviteCode='KHL-'+crypto.randomUUID().replaceAll('-','').slice(0,10).toUpperCase();
          await setDoc(doc(db,'publicInvites',inviteCode),{
            officeId,officeName,email:inviteEmail,role:inviteRole,projectIds:[],
            createdByUid:current.uid,status:'pending',createdAt:serverTimestamp()
          });
          officeReady=true;
          if(feedback)feedback.textContent='تم إنشاء الدعوة. أرسل هذا الرمز للموظف: '+inviteCode+' — اضغط زر الدخول بعد نسخه.';
          $('[data-ready-desc]').textContent='تم إنشاء مساحة المكتب. انسخ رمز الدعوة من الرسالة وأرسله للموظف.';
          return;
        }
      }else{
        const inviteCode=String($('[name="invite"]')?.value||$('[name="clientInvite"]')?.value||'').trim();
        if(!inviteCode)throw new Error('INVITE_REQUIRED');
        const inviteQuery=await getDoc(doc(db,'publicInvites',inviteCode));
        if(!inviteQuery.exists())throw new Error('INVITE_NOT_FOUND');
        const invite=inviteQuery.data(),officeId=invite.officeId;
        if(invite.email?.toLowerCase()!==current.email?.toLowerCase())throw new Error('INVITE_EMAIL_MISMATCH');
        if(invite.role!==role||invite.status!=='pending')throw new Error('INVITE_INVALID');
        await updateDoc(doc(db,'publicInvites',inviteCode),{acceptedBy:current.uid,status:'accepted',acceptedAt:serverTimestamp()});
        await updateDoc(userRef,{officeId,officeName:invite.officeName||'',projectIds:invite.projectIds||[],onboardingComplete:true,inviteCode,updatedAt:serverTimestamp()});
        await setDoc(doc(db,'offices',officeId,'team',current.uid),{id:current.uid,uid:current.uid,userCode:profile.userCode,name:profile.name,email:profile.email,role:profile.role,specialty:profile.specialty||'',officeId,projectIds:invite.projectIds||[],visibleTo:[current.uid],createdAt:serverTimestamp()});
      }
      location.href=role==='client'?'client.html':role==='consultant'?'consultations.html':'home.html';
    }catch(error){
      console.error('KHALIYA onboarding failed',error);
      const messages={
        OFFICE_REQUIRED:'اكتب اسم المكتب قبل المتابعة.',
        INVITE_REQUIRED:'رمز الدعوة مطلوب للانضمام.',
        INVITE_NOT_FOUND:'رمز الدعوة غير موجود أو انتهت صلاحيته.',
        INVITE_EMAIL_MISMATCH:'هذا الرمز مرتبط ببريد إلكتروني مختلف.',
        INVITE_INVALID:'الرمز لا يطابق نوع حسابك أو استُخدم مسبقًا.',
        ROLE_MISMATCH:'نوع الحساب لا يطابق ملف التسجيل.',
        PROFILE_MISSING:'لم يُعثر على ملف الحساب في قاعدة البيانات.'
      };
      if(feedback)feedback.textContent=messages[error.message]||'تعذر حفظ الإعداد. تحقق من قواعد Firestore وحاول مجددًا.';
    }finally{
      if(submit){submit.disabled=false;submit.textContent=officeReady?'المتابعة إلى مساحة العمل':'الدخول إلى مساحة العمل';}
    }
  });
}

if(document.body.classList.contains('public-page')){
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets=[...document.querySelectorAll('.hero-copy,.hero-visual,.trust-inner,.section-heading,.feature-card,.workflow-layout>*,.workflow-list li,.role-grid article,.security-inner>*,.closing-cta>*')];
  if(!reduced&&'IntersectionObserver'in window){
    document.body.classList.add('motion-ready');
    targets.forEach((element,index)=>{element.dataset.reveal='pending';element.style.setProperty('--reveal-delay',(index%4)*55+'ms')});
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.dataset.reveal='visible';observer.unobserve(entry.target)}}),{threshold:.12,rootMargin:'0px 0px -5% 0px'});
    targets.forEach(element=>observer.observe(element));
  }
  const visual=$('.hero-visual');
  if(visual&&!reduced&&window.matchMedia('(pointer:fine)').matches){
    visual.addEventListener('pointermove',event=>{
      const rect=visual.getBoundingClientRect();
      visual.style.setProperty('--hero-shift-x',(((event.clientX-rect.left)/rect.width-.5)*5).toFixed(1)+'px');
      visual.style.setProperty('--hero-shift-y',(((event.clientY-rect.top)/rect.height-.5)*5).toFixed(1)+'px');
    });
    visual.addEventListener('pointerleave',()=>{visual.style.setProperty('--hero-shift-x','0px');visual.style.setProperty('--hero-shift-y','0px')});
  }
}
