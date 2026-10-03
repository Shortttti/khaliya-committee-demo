import './interactions.js?v=khaliya-11';
import { auth, db } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { doc, getDoc, setDoc, updateDoc, writeBatch, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const $=(selector,root=document)=>root.querySelector(selector);
const params=new URLSearchParams(location.search);
const roles={
  manager:{label:'مكتب هندسي',name:'مدير المكتب',office:''},
  pm:{label:'مدير مشروع',name:'مدير مشروع',office:''},
  engineer:{label:'مهندس / موظف',name:'مهندس',office:''},
  client:{label:'عميل',name:'عميل',office:''},
  consultant:{label:'استشاري',name:'استشاري',office:''}
};

async function waitForAuthUser(){
  if(auth.currentUser)return auth.currentUser;
  return new Promise(resolve=>{
    let unsubscribe=()=>{};
    unsubscribe=onAuthStateChanged(auth,user=>{unsubscribe();resolve(user||null)},()=>resolve(null));
  });
}

document.querySelector('[data-nav-toggle]')?.addEventListener('click',()=>document.body.classList.toggle('nav-open'));
document.querySelectorAll('.site-nav a[href^="#"]').forEach(link=>link.addEventListener('click',()=>document.body.classList.remove('nav-open')));

const onboarding=$('[data-onboarding]');
if(onboarding){
  let role=sessionStorage.getItem('khaliya-onboarding-role')||params.get('role')||'manager';
  if(!roles[role])role='manager';
  const roleInfo=roles[role];
  const isManager=role==='manager';
  const isClient=role==='client';
  const setFieldGroup=(selector,visible)=>{
    document.querySelectorAll(selector).forEach(group=>{
      group.hidden=!visible;
      group.querySelectorAll('input,select,textarea,button').forEach(control=>{
        control.disabled=!visible;
        if(control.matches('[name="office"]'))control.required=visible;
        if(control.matches('[name="invite"],[name="clientInvite"]'))control.required=visible;
      });
    });
  };
  $('[data-role-label]').textContent=roleInfo.label;
  $('[data-onboard-title]').textContent=isManager?'لنجهّز مساحة مكتبك.':isClient?'اربط حسابك بمشروعك.':'اربط حسابك بمكتبك.';
  $('[data-onboard-desc]').textContent=isManager?'أنشئ مساحة المكتب ثم شارك رمز الدعوة مع أعضاء الفريق.':'أدخل رمز الدعوة الذي أرسله لك المكتب أو مدير المشروع.';
  setFieldGroup('[data-office-field]',isManager);
  setFieldGroup('[data-invite-field]',!isManager&&!isClient);
  setFieldGroup('[data-manager-invite]',isManager);
  setFieldGroup('[data-client-field]',isClient);
  $('[data-step-title]').textContent=isManager?'بيانات المكتب':'رمز الدعوة';
  $('[data-step-desc]').textContent=isManager?'تُحفظ بيانات المكتب في قاعدة البيانات.':'يجب أن يطابق الرمز البريد والدور المسجلين في حسابك.';
  $('[data-step2-title]').textContent=isManager?'التخصصات والفريق':'معلومات إضافية';
  $('[data-ready-title]').textContent=isManager?'مساحة مكتبك جاهزة.':'اكتمل ربط الحساب.';
  $('[data-ready-desc]').textContent='ستظهر هنا المشاريع والبيانات التي لديك صلاحية الوصول إليها.';
  $('[data-skip]')?.remove();
  document.querySelector('[data-demo-projects]')?.remove();

  let step=1;
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

  onboarding.noValidate=true;
  onboarding.addEventListener('submit',async event=>{
    event.preventDefault();
    event.stopPropagation();
    const current=await waitForAuthUser(),feedback=$('[data-onboard-feedback]')||$('.invite-feedback'),submit=event.target.querySelector('[type="submit"]');
    if(!current){if(feedback)feedback.textContent='انتهت جلسة التسجيل. سجّل الدخول ثم أكمل الإعداد.';return;}
    if(submit){submit.disabled=true;submit.textContent='جارٍ الحفظ…';}
    const saveGuard=setTimeout(()=>{if(submit?.disabled){if(feedback)feedback.textContent='الاتصال بقاعدة البيانات يتأخر. تحققي من الإنترنت ثم أعيدي المحاولة.';submit.disabled=false;submit.textContent='إعادة المحاولة';}},10000);
    try{
      const userRef=doc(db,'users',current.uid);
      const userSnap=await getDoc(userRef);
      if(!userSnap.exists())throw new Error('PROFILE_MISSING');
      const profile=userSnap.data();
      if(profile.onboardingComplete===true&&profile.officeId){
        location.replace(profile.role==='client'?'client.html':profile.role==='consultant'?'consultations.html':'home.html');
        return;
      }
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
        sessionStorage.setItem('khaliya-onboarding-office',officeName);
        const inviteEmail=$('[name="teammate"]')?.value.trim().toLowerCase();
        if(inviteEmail){
          const inviteRole=$('[name="inviteRole"]')?.value||'engineer';
          const inviteCode='KHALIYA-INV-'+crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase();
          await setDoc(doc(db,'publicInvites',inviteCode),{
            officeId,officeName,email:inviteEmail,role:inviteRole,projectIds:[],
            createdByUid:current.uid,status:'pending',createdAt:serverTimestamp()
          });
          if(feedback)feedback.textContent='تم إنشاء الدعوة وحفظها داخل مساحة المكتب: '+inviteCode;
        }
      }else{
        const inviteCode=String($('[name="invite"]')?.value||$('[name="clientInvite"]')?.value||'').trim().toUpperCase();
        if(!inviteCode)throw new Error('INVITE_REQUIRED');
        const inviteRef=doc(db,'publicInvites',inviteCode);
        const inviteQuery=await getDoc(inviteRef);
        if(!inviteQuery.exists())throw new Error('INVITE_NOT_FOUND');
        const invite=inviteQuery.data(),officeId=invite.officeId;
        if(invite.email?.toLowerCase()!==current.email?.toLowerCase())throw new Error('INVITE_EMAIL_MISMATCH');
        if(invite.role!==role)throw new Error('INVITE_ROLE_MISMATCH');
        const alreadyAccepted=invite.status==='accepted'&&invite.acceptedBy===current.uid;
        if(invite.status!=='pending'&&!alreadyAccepted)throw new Error('INVITE_INVALID');

        const userUpdate={
          officeId,
          officeName:invite.officeName||'',
          projectIds:Array.isArray(invite.projectIds)?invite.projectIds:[],
          onboardingComplete:true,
          inviteCode,
          updatedAt:serverTimestamp()
        };

        if(invite.status==='pending'){
          const batch=writeBatch(db);
          batch.update(inviteRef,{acceptedBy:current.uid,status:'accepted',acceptedAt:serverTimestamp()});
          batch.update(userRef,userUpdate);
          await batch.commit();
        }else{
          await updateDoc(userRef,userUpdate);
        }

        const memberRecord={
          id:current.uid,uid:current.uid,userCode:profile.userCode,
          name:profile.name,email:profile.email,role:profile.role,
          specialty:profile.specialty||'',officeId,
          projectIds:Array.isArray(invite.projectIds)?invite.projectIds:[],
          visibleTo:[current.uid],createdAt:serverTimestamp(),updatedAt:serverTimestamp()
        };
        try{
          await setDoc(doc(db,'offices',officeId,'team',current.uid),memberRecord,{merge:true});
          if(role==='consultant')await setDoc(doc(db,'offices',officeId,'consultants',current.uid),{
            id:current.uid,uid:current.uid,name:profile.name,specialty:profile.specialty||'',
            available:true,officeId,visibleTo:[current.uid],updatedAt:serverTimestamp()
          },{merge:true});
        }catch(memberError){
          console.warn('KHALIYA membership record repair deferred',memberError);
        }
      }
      location.replace(role==='client'?'client.html':role==='consultant'?'consultations.html':'home.html');
    }catch(error){
      console.error('KHALIYA onboarding failed',error);
      const messages={
        OFFICE_REQUIRED:'اكتب اسم المكتب قبل المتابعة.',
        INVITE_REQUIRED:'رمز الدعوة مطلوب للانضمام.',
        INVITE_NOT_FOUND:'رمز الدعوة غير موجود أو انتهت صلاحيته.',
        INVITE_EMAIL_MISMATCH:'هذا الرمز مرتبط ببريد إلكتروني مختلف.',
        INVITE_ROLE_MISMATCH:'رمز الدعوة مخصص لنوع حساب مختلف.',
        INVITE_INVALID:'الرمز لا يطابق نوع حسابك أو استُخدم مسبقًا.',
        ROLE_MISMATCH:'نوع الحساب لا يطابق ملف التسجيل.',
        PROFILE_MISSING:'لم يُعثر على ملف الحساب في قاعدة البيانات.'
      };
      const message=error.message==='CLOUD_TIMEOUT'?'انتهت مهلة الاتصال بقاعدة البيانات. تحققي من الاتصال ثم أعيدي المحاولة.':error.code==='permission-denied'?'قواعد Firestore لا تسمح بحفظ مساحة المكتب. يلزم مراجعة صلاحيات قاعدة البيانات.':messages[error.message]||'تعذر حفظ الإعداد. تحقق من الاتصال وصلاحيات قاعدة البيانات ثم حاول مجددًا.';
      if(feedback)feedback.textContent=message;
    }finally{
      clearTimeout(saveGuard);
      if(submit){submit.disabled=false;submit.textContent='الدخول إلى مساحة العمل';}
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
}
