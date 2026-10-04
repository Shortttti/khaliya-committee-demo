import { auth } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { SESSION_KEY } from './store.js?v=demo-02';

if(!document.querySelector('link[data-demo-css]')){const link=document.createElement('link');link.rel='stylesheet';link.href='assets/css/demo.css';link.dataset.demoCss='';document.head.append(link)}

const sampleUsers = [
  {uid:'demo-office-owner',name:'مكتب خلية للاستشارات الهندسية',email:'office@khaliya.demo',role:'manager',userCode:'KHL-OFFICE',demoLabel:'المكتب'},
  {uid:'demo-manager',name:'خالد العتيبي',email:'manager@khaliya.demo',role:'manager'},
  {uid:'demo-engineer',name:'سارة القحطاني',email:'engineer@khaliya.demo',role:'engineer',projectIds:['riyadh-center','north-campus','heritage-hotel','airport-terminal','jeddah-hospital','makkah-hotel','khobar-waterfront','riyadh-schools']},
  {uid:'demo-client',name:'أحمد الشمري',email:'client@khaliya.demo',role:'client'},
  {uid:'demo-consultant',name:'فهد المطيري',email:'consultant@khaliya.demo',role:'consultant'}
];
const ROLE_LABELS={manager:'مدير المكتب',engineer:'موظف',client:'عميل',consultant:'مستشار'};
const $=(s,r=document)=>r.querySelector(s);
function feedback(form,text){const el=$('.form-feedback',form);if(el)el.textContent=text}
function setSession(user, role){
  const profile={...user,role,officeId:'demo-office',officeName:'مكتب خلية للاستشارات الهندسية',projectIds:['riyadh-center','north-campus','heritage-hotel'],userCode:user.userCode||'KHL-DEMO'};
  localStorage.setItem(SESSION_KEY,JSON.stringify(profile));
  localStorage.setItem('khaliya.demo.ai.account',user.firebaseUid||'');
  location.href=role==='client'?'client.html':role==='consultant'?'consultations.html':'home.html';
}
function fillSamples(){
  const root=$('[data-demo-accounts]');if(!root)return;
  root.innerHTML=sampleUsers.map(user=>`<button class="demo-account" type="button" data-demo-uid="${user.uid}"><span class="demo-avatar">${user.name[0]}</span><span><b>${user.demoLabel||ROLE_LABELS[user.role]}</b><small>${user.name}</small></span><span class="demo-enter">دخول ←</span></button>`).join('');
  root.addEventListener('click',e=>{const button=e.target.closest('[data-demo-uid]');if(!button)return;const user=sampleUsers.find(item=>item.uid===button.dataset.demoUid);if(user)setSession(user,user.role)});
}
fillSamples();

document.querySelector('[data-auth="login"]')?.addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget,data=new FormData(form),email=String(data.get('email')||'').trim().toLowerCase(),password=String(data.get('password')||''),role=String(data.get('role')||'manager');
  const local=sampleUsers.find(item=>item.email===email);
  if(local){setSession(local,local.role);return}
  feedback(form,'جارٍ التحقق من حساب KHALIYA لتفعيل الذكاء الاصطناعي…');
  try{
    const credential=await signInWithEmailAndPassword(auth,email,password);
    setSession({uid:'ai-'+credential.user.uid,firebaseUid:credential.user.uid,name:credential.user.displayName||email.split('@')[0],email:credential.user.email||email,projectIds:['riyadh-center']},role);
  }catch(error){
    console.error(error);
    feedback(form,error.code==='auth/invalid-credential'||error.code==='auth/user-not-found'?'بيانات الدخول غير صحيحة. اختر حسابًا تجريبيًا أو استخدم حساب KHALIYA فعليًا.':'تعذر تسجيل الدخول. تحقق من البيانات واتصال الإنترنت.');
  }
});

document.querySelector('[data-auth="signup"]')?.addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget,data=new FormData(form),name=String(data.get('name')||'').trim(),email=String(data.get('email')||'').trim().toLowerCase(),password=String(data.get('password')||''),confirm=String(data.get('confirmPassword')||''),role=String(data.get('role')||'manager'),code=String(data.get('inviteCode')||'').trim().toUpperCase();
  if(password!==confirm){feedback(form,'كلمتا المرور غير متطابقتين.');return}
  if(role!=='manager'&&code!=='KHL-2026'){feedback(form,'رمز المكتب التجريبي هو KHL-2026.');return}
  const profile={uid:'local-'+crypto.randomUUID(),name,email,role,officeId:'demo-office',officeName:'مكتب خلية للاستشارات الهندسية',projectIds:['riyadh-center'],userCode:'KHL-'+Math.random().toString(36).slice(2,8).toUpperCase()};
  let authCreated=false;
  if($('#auth-ai-enable')?.checked){
    feedback(form,'يتم إنشاء حساب مصادقة آمن لتفعيل AI…');
    try{const credential=await createUserWithEmailAndPassword(auth,email,password);profile.firebaseUid=credential.user.uid;authCreated=true}
    catch(error){feedback(form,error.code==='auth/email-already-in-use'?'البريد مسجل في KHALIYA. سجّل الدخول بدل إنشاء حساب جديد.':'تعذر إنشاء مصادقة AI؛ يمكنك متابعة نسخة العرض محليًا.');if(error.code==='auth/email-already-in-use')return}
  }
  const accounts=JSON.parse(localStorage.getItem('khaliya.demo.accounts')||'[]');
  accounts.push({uid:profile.uid,name,email,role,specialty:String(data.get('specialty')||''),projectIds:['riyadh-center'],authCreated});
  localStorage.setItem('khaliya.demo.accounts',JSON.stringify(accounts));
  setSession(profile,role);
});

document.querySelector('[data-forgot]')?.addEventListener('click',async event=>{
  event.preventDefault();const form=event.currentTarget.closest('form'),email=String(form?.querySelector('[name="email"]')?.value||'').trim();
  if(!email){feedback(form,'اكتب بريد حساب KHALIYA أولًا.');return}
  try{await sendPasswordResetEmail(auth,email);feedback(form,'أُرسل رابط استعادة كلمة المرور.')}catch{feedback(form,'تعذر إرسال رابط الاستعادة لهذا الحساب.')}
});

document.querySelector('[data-demo-reset]')?.addEventListener('click',async()=>{localStorage.removeItem('khaliya.committee.demo.v1');localStorage.removeItem(SESSION_KEY);try{await signOut(auth)}catch{}location.href='login.html'});
