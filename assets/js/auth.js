import { auth, db } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const $=(s,r=document)=>r.querySelector(s);
const params=new URLSearchParams(location.search);
const roles={
  manager:{name:'مدير المكتب',initial:'م'},
  pm:{name:'مدير مشروع',initial:'م'},
  engineer:{name:'مهندس',initial:'هـ'},
  client:{name:'عميل',initial:'ع'}
};

if(document.querySelector('[data-auth="signup"]')&&params.get('role')){
  const choice=document.querySelector('[name="role"][value="'+params.get('role')+'"]');
  if(choice)choice.checked=true;
}

function saveLocalUser(profile,user){
  const role=profile.role||'engineer';
  const fallback=roles[role]||roles.engineer;
  const state=JSON.parse(localStorage.getItem('nawa.workspace.v2')||'{}');
  const name=(profile.name||user.displayName||user.email||fallback.name).trim();
  state.user={
    uid:user.uid,
    name,
    email:user.email||profile.email||'',
    phone:profile.phone||'',
    initial:name.slice(0,1)||fallback.initial,
    role
  };
  if(profile.officeName)state.settings={...(state.settings||{}),office:profile.officeName};
  localStorage.setItem('nawa.workspace.v2',JSON.stringify(state));
  return role;
}

document.querySelector('[data-forgot]')?.addEventListener('click',async e=>{
  e.preventDefault();
  const form=e.currentTarget.closest('form');
  const feedback=$('.form-feedback',form);
  const email=form?.querySelector('[name="email"]')?.value.trim();
  if(!email){feedback.textContent='اكتب البريد الإلكتروني أولًا ثم اختر استعادة كلمة المرور.';return}
  try{
    await sendPasswordResetEmail(auth,email);
    feedback.textContent='تم إرسال رابط استعادة كلمة المرور إلى البريد الإلكتروني.';
  }catch(error){
    console.error(error);
    feedback.textContent='تعذر إرسال رابط الاستعادة. تأكد من البريد وحاول مرة أخرى.';
  }
});

document.querySelector('[data-auth="login"]')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const form=e.currentTarget,data=new FormData(form),feedback=$('.form-feedback',form);
  const email=String(data.get('email')||'').trim();
  const password=String(data.get('password')||'');
  const submit=form.querySelector('[type="submit"]');
  feedback.textContent='جارٍ تسجيل الدخول...';
  if(submit)submit.disabled=true;
  try{
    await setPersistence(auth,data.get('remember')?browserLocalPersistence:browserSessionPersistence);
    const credential=await signInWithEmailAndPassword(auth,email,password);
    const snap=await getDoc(doc(db,'users',credential.user.uid));
    if(!snap.exists())throw new Error('PROFILE_NOT_FOUND');
    const role=saveLocalUser(snap.data(),credential.user);
    location.href=role==='client'?'client.html':'home.html';
  }catch(error){
    console.error(error);
    const code=error?.code||'';
    feedback.textContent=
      code==='auth/invalid-credential'||code==='auth/user-not-found'||code==='auth/wrong-password'
      ?'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
      :code==='auth/too-many-requests'
      ?'تم إيقاف المحاولات مؤقتًا. حاول لاحقًا.'
      :error?.message==='PROFILE_NOT_FOUND'
      ?'تم تسجيل الدخول لكن ملف المستخدم غير موجود في قاعدة البيانات.'
      :'تعذر تسجيل الدخول الآن. حاول مرة أخرى.';
  }finally{
    if(submit)submit.disabled=false;
  }
});

document.querySelector('[data-auth="signup"]')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const form=e.currentTarget,data=new FormData(form),feedback=$('.form-feedback',form);
  const role=String(data.get('role')||'manager');
  const name=String(data.get('name')||'').trim();
  const email=String(data.get('email')||'').trim();
  const phone=String(data.get('phone')||'').trim();
  const password=String(data.get('password')||'');
  const confirmPassword=String(data.get('confirmPassword')||'');
  const submit=form.querySelector('[type="submit"]');

  if(password!==confirmPassword){
    feedback.textContent='كلمتا المرور غير متطابقتين.';
    return;
  }

  feedback.textContent='جارٍ إنشاء الحساب...';
  if(submit)submit.disabled=true;

  try{
    await setPersistence(auth,browserLocalPersistence);
    const credential=await createUserWithEmailAndPassword(auth,email,password);
    const profile={
      uid:credential.user.uid,
      name,
      email:credential.user.email||email,
      phone,
      role,
      officeId:null,
      officeName:'',
      onboardingComplete:false,
      createdAt:serverTimestamp(),
      updatedAt:serverTimestamp()
    };
    await setDoc(doc(db,'users',credential.user.uid),profile);
    saveLocalUser(profile,credential.user);
    sessionStorage.setItem('nawa-onboarding-role',role);
    sessionStorage.setItem('nawa-onboarding-name',name);
    sessionStorage.setItem('nawa-onboarding-email',email);
    location.href='onboarding.html';
  }catch(error){
    console.error(error);
    const code=error?.code||'';
    feedback.textContent=
      code==='auth/email-already-in-use'
      ?'هذا البريد مسجل مسبقًا. استخدم تسجيل الدخول.'
      :code==='auth/invalid-email'
      ?'صيغة البريد الإلكتروني غير صحيحة.'
      :code==='auth/weak-password'
      ?'كلمة المرور ضعيفة. استخدم كلمة مرور أقوى.'
      :code==='permission-denied'||code==='firestore/permission-denied'
      ?'تم إنشاء الحساب، لكن قاعدة البيانات ما زالت تحتاج تفعيل قواعد الأمان.'
      :'تعذر إنشاء الحساب الآن. حاول مرة أخرى.';
  }finally{
    if(submit)submit.disabled=false;
  }
});
