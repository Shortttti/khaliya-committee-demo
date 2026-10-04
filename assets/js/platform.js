import { auth, db } from './firebase.js';
import { bindCloudStore, getState, updateState, updateLocalOfficeName, makeId, flushPendingWrites } from './store.js?v=khaliya-14';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, arrayUnion, serverTimestamp, runTransaction, writeBatch } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const API_BASE='https://khaliyah-engineering-office.short-story-im.workers.dev';
const MODULES=new Set([
  'chat','project-summary','file-analysis','change-impact','version-compare',
  'meeting-analysis','decision-analysis','task-extraction','risk-analysis',
  'report','search','catch-up','client-assistant','requirements-analysis',
  'boq-analysis','schedule-impact','coordination-review','consultation',
  'code-compliance','concept-program','concept-massing'
]);

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[ch]));

function readWorkspace(){ return getState(); }
function toast(message){
  let region=document.querySelector('.toast-region');
  if(!region){
    region=document.createElement('div');
    region.className='toast-region';
    region.setAttribute('aria-live','polite');
    document.body.append(region);
  }
  const item=document.createElement('div');
  item.className='toast';
  item.innerHTML='<b>✓</b>'+escapeHtml(message);
  region.append(item);
  setTimeout(()=>item.remove(),3400);
}

const user=await new Promise(resolve=>{
  const unsubscribe=onAuthStateChanged(auth,current=>{
    unsubscribe();
    resolve(current||null);
  },()=>resolve(null));
});

if(!user){
  location.replace('login.html');
  await new Promise(()=>{});
}

const PROFILE_CACHE_PREFIX='khaliya.profile.v2:';
const PROFILE_CACHE_MAX_AGE=12*60*60*1000;
const profileCacheKey=PROFILE_CACHE_PREFIX+user.uid;
const cacheProfile=value=>({
  uid:value.uid||user.uid,email:value.email||user.email||'',name:value.name||'',phone:value.phone||'',
  role:value.role||'',officeId:value.officeId||null,officeName:value.officeName||'',
  projectIds:Array.isArray(value.projectIds)?value.projectIds:[],userCode:value.userCode||'',
  onboardingComplete:value.onboardingComplete!==false,specialty:value.specialty||''
});
const validRole=value=>['manager','pm','engineer','client','consultant'].includes(value?.role);
let profile={uid:user.uid,email:user.email||'',role:'',officeId:null,projectIds:[]};
let usedCachedProfile=false;
try{
  const cached=JSON.parse(localStorage.getItem(profileCacheKey)||'null');
  if(cached?.profile?.uid===user.uid&&validRole(cached.profile)&&cached.profile.officeId&&Date.now()-Number(cached.savedAt||0)<PROFILE_CACHE_MAX_AGE){
    profile={...profile,...cached.profile};
    bindCloudStore(profile);
    usedCachedProfile=true;
    window.dispatchEvent(new Event('khaliya:platform-ready'));
  }
}catch{}

try{
  const snap=await getDoc(doc(db,'users',user.uid));
  if(!snap.exists())throw new Error('PROFILE_NOT_FOUND');
  const fresh={...profile,...snap.data(),uid:user.uid,email:user.email||snap.data().email||''};
  if(!validRole(fresh))throw new Error('INVALID_PROFILE_ROLE');
  if(fresh.onboardingComplete===false||!fresh.officeId)throw new Error('ONBOARDING_REQUIRED');
  const compact=cacheProfile(fresh);
  const changed=!usedCachedProfile||JSON.stringify(cacheProfile(profile))!==JSON.stringify(compact);
  profile=fresh;
  try{localStorage.setItem(profileCacheKey,JSON.stringify({savedAt:Date.now(),profile:compact}))}catch{}
  if(changed)bindCloudStore(profile);
  if(!usedCachedProfile||changed)window.dispatchEvent(new Event('khaliya:platform-ready'));
}catch(error){
  console.error('KHALIYA profile unavailable',error);
  if(error?.message==='ONBOARDING_REQUIRED'){
    try{localStorage.removeItem(profileCacheKey)}catch{}
    location.replace('onboarding.html');
    await new Promise(()=>{});
  }
  if(error?.message==='PROFILE_NOT_FOUND'||error?.message==='INVALID_PROFILE_ROLE'){
    try{localStorage.removeItem(profileCacheKey)}catch{}
    location.replace('login.html?error=profile');
    await new Promise(()=>{});
  }
  if(!usedCachedProfile){
    location.replace('login.html?error=profile');
    await new Promise(()=>{});
  }
}

async function getOfficeSettings(){
  if(!profile?.officeId)return null;
  const snap=await getDoc(doc(db,'offices',profile.officeId));
  return snap.exists()?{...snap.data(),officeId:profile.officeId}:null;
}

async function updateOfficeSettings(values={}){
  if(profile?.role!=='manager'||!profile?.officeId)throw new Error('FORBIDDEN');
  const name=String(values.name||'').trim();
  if(!name)throw new Error('OFFICE_NAME_REQUIRED');
  const patch={
    name,
    city:String(values.city||'').trim(),
    company:String(values.company||'').trim(),
    officeEmail:String(values.officeEmail||'').trim(),
    updatedAt:serverTimestamp()
  };
  const batch=writeBatch(db);
  batch.update(doc(db,'offices',profile.officeId),patch);
  batch.update(doc(db,'users',user.uid),{officeName:name,updatedAt:serverTimestamp()});
  await batch.commit();
  profile={...profile,officeName:name};
  try{localStorage.setItem(profileCacheKey,JSON.stringify({savedAt:Date.now(),profile:cacheProfile(profile)}))}catch{}
  updateLocalOfficeName(name);
  return {...patch,officeId:profile.officeId};
}

async function token(){
  if(!auth.currentUser)throw new Error('AUTH_REQUIRED');
  return auth.currentUser.getIdToken();
}

async function api(path,{method='POST',body,headers={}}={}){
  const idToken=await token();
  const response=await fetch(API_BASE+path,{
    method,
    headers:{Authorization:'Bearer '+idToken,...headers},
    body
  });
  let data=null;
  const type=response.headers.get('content-type')||'';
  try{data=type.includes('application/json')?await response.json():await response.text()}catch{}
  if(!response.ok){
    const message=typeof data==='object'&&data?.error?data.error:'تعذر إكمال الطلب.';
    const error=new Error(message);
    error.status=response.status;
    error.data=data;
    throw error;
  }
  return data;
}

async function ai(module,payload={}){
  if(!MODULES.has(module))throw new Error('Unknown KHALIYA AI module: '+module);
  return api('/api/ai/'+module,{
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  });
}

async function uploadFile(file,options={}){
  if(!(file instanceof File)||!file.size)throw new Error('FILE_REQUIRED');
  if(file.size>50*1024*1024)throw new Error('FILE_TOO_LARGE');
  const workspace=getState(),project=workspace.projects.find(item=>item.id===options.projectId);
  const isClientRequestAttachment=profile.role==='client'&&options.sourceType==='client-request-attachment'&&!options.projectId;
  if(profile.role!=='manager'&&!project&&!isClientRequestAttachment)throw new Error('PROJECT_REQUIRED');
  const visibleTo=[...new Set([user.uid,...(project?.visibleTo||[]),...(project?.managerUids||[]),...(project?.officeManagerUids||[]),project?.clientUid].filter(Boolean))];
  const headers={
    'Content-Type':file.type||'application/octet-stream',
    'X-File-Name':encodeURIComponent(file.name),
    'X-Project-Id':options.projectId||'unassigned',
    'X-Visibility':options.visibility||'internal',
    'X-Source-Type':options.sourceType||'project-file'
  };
  if(options.officeId)headers['X-Office-Id']=options.officeId;
  const result=await api('/api/files/upload',{body:file,headers});
  return {...result,storageKey:result.storageKey||result.key||'',fileId:result.fileId||'',visibleTo,ownerUid:user.uid,project};
}
async function conceptImage(payload){
  return api('/api/ai/concept-image',{
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  });
}
async function fileStatus(storageKey){
  if(!storageKey)throw new Error('FILE_KEY_REQUIRED');
  return api('/api/files/status?key='+encodeURIComponent(storageKey),{method:'GET'});
}
async function downloadFile(file){
  const key=String(file?.storageKey||'');
  if(!key)throw new Error('FILE_KEY_REQUIRED');
  const idToken=await token();
  const response=await fetch(API_BASE+'/api/files/download?key='+encodeURIComponent(key),{headers:{Authorization:'Bearer '+idToken}});
  if(!response.ok){let message='تعذر تنزيل الملف.';try{const data=await response.json();message=data.error||message}catch{}throw new Error(message)}
  const blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=String(file.name||'project-file');document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
async function indexText(payload){
  return api('/api/knowledge/index-text',{
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  });
}

async function health(){
  const response=await fetch(API_BASE+'/health',{cache:'no-store'});
  if(!response.ok)throw new Error('KHALIYA AI health check failed');
  return response.json();
}

function currentContext(){
  const state=readWorkspace();
  const projectId=new URLSearchParams(location.search).get('project')||state.settings?.project||'';
  const project=(state.projects||[]).find(x=>x.id===projectId)||null;
  return {
    project,
    projects:(state.projects||[]).slice(0,20),
    tasks:(state.tasks||[]).filter(x=>!projectId||x.project===projectId).slice(0,60),
    changes:(state.changes||[]).filter(x=>!projectId||x.project===projectId).slice(0,30),
    files:(state.files||[]).slice(0,50),
    approvals:(state.approvals||[]).filter(x=>!projectId||x.project===projectId).slice(0,30),
    activity:(state.activity||[]).slice(0,30)
  };
}

function authorizedProjectId(candidate){
  const id=String(candidate||'').trim();
  if(!id)return '';
  if(profile?.role==='manager'&&profile?.officeId)return id;
  if(Array.isArray(profile?.projectIds)&&profile.projectIds.includes(id))return id;
  return '';
}

function sourcesLabel(sources){
  if(!Array.isArray(sources)||!sources.length)return 'لا توجد مصادر مفهرسة بعد';
  return sources.map(x=>x.title||x.sourceId||x.id).filter(Boolean).join(' · ');
}

function showModal(title,text,meta=''){
  let root=document.querySelector('#platformAiModal');
  if(!root){
    root=document.createElement('div');
    root.id='platformAiModal';
    root.className='modal-backdrop';
    root.innerHTML='<section class="modal" role="dialog" aria-modal="true"><header class="modal-head"><h2></h2><button class="modal-close" type="button" data-platform-close aria-label="إغلاق">×</button></header><div class="modal-body"><div class="platform-ai-result" style="white-space:pre-wrap;line-height:1.9"></div><small class="platform-ai-meta" style="display:block;margin-top:14px"></small></div><footer class="modal-foot"><button class="btn btn-primary" type="button" data-platform-close>إغلاق</button></footer></section>';
    document.body.append(root);
    root.addEventListener('click',event=>{
      if(event.target===root||event.target.closest('[data-platform-close]'))root.classList.remove('open');
    });
  }
  root.querySelector('h2').textContent=title;
  root.querySelector('.platform-ai-result').textContent=text;
  root.querySelector('.platform-ai-meta').textContent=meta;
  root.classList.add('open');
}

async function runUiModule(module,{title,message,context,id}={}){
  showModal(title||'KHALIYA AI','جارٍ التحليل…','يتم التحليل من خلال KHALIYA AI');
  try{
    const workspace=currentContext();
    let focused=context||workspace;
    if(id){
      const state=readWorkspace();
      const change=(state.changes||[]).find(x=>x.id===id);
      if(change)focused={...workspace,selectedChange:change};
    }
    const result=await ai(module,{
      message:message||title||'حلل البيانات المتاحة.',
      context:focused,
      projectId:authorizedProjectId(focused?.project?.id||focused?.selectedChange?.project||''),
      useKnowledge:true
    });
    showModal(title||'KHALIYA AI',result.answer||'لم تصل نتيجة نصية.',[
      result.model?'النموذج: '+result.model:'',
      'المصادر: '+sourcesLabel(result.sources),
      result.humanReviewRequired?'يلزم اعتماد بشري قبل استخدام النتيجة كقرار هندسي.':''
    ].filter(Boolean).join(' · '));
    return result;
  }catch(error){
    showModal(title||'KHALIYA AI','تعذر إكمال التحليل.\n'+(error.message||'خطأ غير معروف'),'يمكن المحاولة مرة أخرى بعد التحقق من تسجيل الدخول والصلاحيات.');
    throw error;
  }
}

document.addEventListener('submit',async event=>{
  if(event.target?.id==='chatForm'){
    event.preventDefault();
    event.stopImmediatePropagation();
    const input=document.querySelector('#chatInput');
    const box=document.querySelector('#chatMessages');
    const q=input?.value.trim();
    if(!q||!box)return;
    box.insertAdjacentHTML('beforeend','<div class="msg user">'+escapeHtml(q)+'</div>');
    input.value='';
    const pending=document.createElement('div');
    pending.className='msg ai';
    pending.textContent='جارٍ التحليل…';
    box.append(pending);
    box.scrollTop=box.scrollHeight;
    try{
      const context=currentContext();
      const result=await ai('chat',{
        message:q,
        context,
        projectId:authorizedProjectId(context.project?.id||''),
        useKnowledge:true
      });
      pending.innerHTML=escapeHtml(result.answer||'لم تصل إجابة.')+'<small>المصادر: '+escapeHtml(sourcesLabel(result.sources))+'</small>';
    }catch(error){
      pending.innerHTML='تعذر الاتصال بمساعد خلية.<small>'+escapeHtml(error.message||'خطأ غير معروف')+'</small>';
    }
    box.scrollTop=box.scrollHeight;
    return;
  }

  if(event.target?.id==='modalForm'&&event.target.dataset.action==='upload'){
    event.preventDefault();
    event.stopImmediatePropagation();
    const form=event.target,data=new FormData(form),file=data.get('file');
    const kind=String(data.get('attachmentKind')||'document');
    if(!(file instanceof File)||!file.size){toast('اختاري ملفًا للرفع أولًا');return}
    if(file.size>50*1024*1024){toast('حجم الملف أكبر من 50MB. اختاري ملفًا أصغر.');return}
    const imageExt=/\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(file.name);
    if(kind==='image'&&!((file.type||'').startsWith('image/')||imageExt)){toast('اختاري صورة بصيغة مدعومة.');return}
    const selected=String(data.get('project')||'');
    if(profile.role!=='manager'&&!authorizedProjectId(selected)){toast('اختاري مشروعًا مرتبطًا بحسابك قبل رفع الملف.');return}
    const submit=form.querySelector('[type="submit"]'),statusBox=form.querySelector('[data-upload-status]');
    if(submit){submit.disabled=true;submit.textContent='جارٍ الرفع…'}
    if(statusBox)statusBox.textContent='يتم رفع الملف إلى التخزين الآمن…';
    let recordId='';
    try{
      const projectId=authorizedProjectId(selected);
      const result=await uploadFile(file,{
        projectId:projectId||'',
        officeId:profile.officeId||'',
        visibility:String(data.get('visibility')||'internal'),
        sourceType:kind==='image'?'project-image':'project-file'
      });
      recordId=result.fileId||makeId('FILE');
      const record={
        id:recordId,project:projectId||'',projectId:projectId||'',
        ownerUid:user.uid,visibleTo:result.visibleTo||[user.uid],
        name:file.name,code:String(data.get('code')||'').trim()||makeId('DOC'),
        discipline:String(data.get('discipline')||''),attachmentKind:kind,
        mimeType:file.type||'application/octet-stream',size:file.size,
        type:file.name.split('.').pop()?.toUpperCase()||file.type||'FILE',version:1,
        updated:new Date().toISOString().slice(0,10),owner:profile.name||user.email,
        state:result.queued?'قيد المعالجة':'تم الرفع',storageKey:result.storageKey||'',
        downloadUrl:result.downloadUrl||'',analysis:result.analysis||null
      };
      updateState(state=>state.files.unshift(record));
      if(statusBox)statusBox.textContent='تم رفع الملف. جارٍ تثبيت السجل في قاعدة البيانات…';
      await flushPendingWrites();
      document.querySelector('#modalBackdrop')?.classList.remove('open');
      toast('تم رفع الملف وحفظه في مساحة العمل');
    }catch(error){
      if(recordId)updateState(state=>{state.files=state.files.filter(item=>item.id!==recordId)});
      console.error('KHALIYA upload failed',error);
      const message=error.message==='FILE_TOO_LARGE'?'حجم الملف يتجاوز الحد المسموح.':
        error.message==='PROJECT_REQUIRED'?'اختاري مشروعًا مرتبطًا بالحساب.':
        error.status===403?'لا توجد صلاحية لرفع هذا الملف إلى المشروع المحدد.':
        (error.message||'خطأ غير معروف');
      if(statusBox)statusBox.textContent='فشل الرفع: '+message;
      toast('تعذر رفع الملف: '+message);
    }finally{
      if(submit){submit.disabled=false;submit.textContent='رفع وحفظ'}
    }
  }
},true);

document.addEventListener('click',async event=>{
  const suggestion=event.target.closest('.suggestion[data-question]');
  if(suggestion){
    event.preventDefault();
    event.stopImmediatePropagation();
    const input=document.querySelector('#chatInput');
    if(input){
      input.value=suggestion.dataset.question||suggestion.textContent.trim();
      document.querySelector('#chatForm')?.requestSubmit();
    }
    return;
  }

  const action=event.target.closest('[data-action]');
  if(!action)return;
  const name=action.dataset.action;

  if(name==='logout'){
    event.preventDefault();
    event.stopImmediatePropagation();
    try{await signOut(auth)}finally{
      ['khaliya-demo-session','khaliya-onboarding-role','khaliya-onboarding-name','khaliya-onboarding-email','khaliya-onboarding-office','nawa-demo-session','nawa-onboarding-role','nawa-onboarding-name','nawa-onboarding-email','nawa-onboarding-office'].forEach(k=>sessionStorage.removeItem(k));
      location.replace('login.html');
    }
    return;
  }

  if(name==='clear-chat'){
    event.preventDefault();
    event.stopImmediatePropagation();
    const box=document.querySelector('#chatMessages');
    if(box)box.innerHTML='<div class="msg ai">بدأت محادثة جديدة مع KHALIYA AI.<small>الإجابات تستخدم البيانات المسموح بها والمصادر المفهرسة عند توفرها.</small></div>';
    return;
  }

  const map={
    analyze:['change-impact','تحليل أثر التغيير','حلل أثر هذا التغيير على التخصصات والملفات والمهام والجدول والكميات والاعتمادات.'],
    coordination:['coordination-review','مراجعة التنسيق','راجع التنسيق بين التخصصات وحدد نقاط التعارض والتسليمات المطلوبة.'],
    proposal:['concept-program','مقترح تصميم مبدئي','اقترح برنامجًا وتصوّرًا مبدئيًا مناسبًا للمتطلبات المتاحة مع توضيح الافتراضات.'],
    report:['report','ملخص ذكي','أنشئ ملخصًا مهنيًا لحالة المكتب والمشاريع والإجراءات المفتوحة.']
  };
  if(map[name]){
    event.preventDefault();
    event.stopImmediatePropagation();
    const [module,title,message]=map[name];
    try{await runUiModule(module,{title,message,id:action.dataset.id||''})}catch{}
  }
},true);

async function lookupUserByCode(code,expectedRole){
  if(profile.role!=='manager')throw new Error('FORBIDDEN');
  const value=String(code||'').trim();
  if(!value.startsWith('KHL-'))throw new Error('INVALID_USER_ID');
  const uid=value.slice(4);
  const snap=await getDoc(doc(db,'users',uid));
  if(!snap.exists())throw new Error('USER_NOT_FOUND');
  const found=snap.data();
  if(found.userCode!==value||found.officeId!==profile.officeId)throw new Error('USER_NOT_IN_OFFICE');
  if(expectedRole&&found.role!==expectedRole)throw new Error('ROLE_MISMATCH');
  return found;
}
async function reserveConsultantSlot({consultantUid,projectId,date,time,consultationId}){
  if(!profile.officeId||!['manager','client','engineer','pm'].includes(profile.role))throw new Error('FORBIDDEN');
  if(!date||!time||!consultantUid)throw new Error('MISSING_APPOINTMENT');
  const slotId=String(consultantUid+'_'+date+'_'+time).replace(/[^a-zA-Z0-9_-]/g,'-');
  const slotRef=doc(db,'offices',profile.officeId,'consultantSlots',slotId);
  await runTransaction(db,async transaction=>{
    const current=await transaction.get(slotRef);
    if(current.exists())throw new Error('CONSULTANT_SLOT_TAKEN');
    transaction.set(slotRef,{
      id:slotId,officeId:profile.officeId,projectId,consultantUid,
      requestedByUid:user.uid,consultationId,date,time,
      visibleTo:[user.uid,consultantUid],createdAt:new Date().toISOString()
    });
  });
  return slotId;
}
async function rotateOfficeInvite(){
  if(profile.role!=='manager'||!profile.officeId)throw new Error('FORBIDDEN');
  const officeRef=doc(db,'offices',profile.officeId);
  const code='KHALIYA-INV-'+crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase();
  const inviteRef=doc(db,'publicInvites',code);
  await runTransaction(db,async tx=>{
    const officeSnap=await tx.get(officeRef);
    if(!officeSnap.exists()||officeSnap.data().ownerUid!==user.uid&&!officeSnap.data().managerUids?.includes(user.uid))throw new Error('FORBIDDEN');
    const office=officeSnap.data(),oldCode=office.activeInviteCode;
    if(oldCode&&oldCode!==code){
      const oldRef=doc(db,'publicInvites',oldCode),oldSnap=await tx.get(oldRef);
      if(oldSnap.exists()&&oldSnap.data().status==='active')tx.update(oldRef,{status:'revoked',revokedAt:serverTimestamp(),revokedByUid:user.uid});
    }
    tx.set(inviteRef,{
      id:code,officeId:profile.officeId,officeName:office.name||profile.officeName||'',
      managerUids:Array.isArray(office.managerUids)?office.managerUids:[user.uid],
      allowedRoles:['pm','engineer','client','consultant'],scope:'office',
      createdByUid:user.uid,status:'active',createdAt:serverTimestamp()
    });
    tx.update(officeRef,{activeInviteCode:code,updatedAt:serverTimestamp()});
  });
  return code;
}
async function approveJoinRequest(uid){
  if(profile.role!=='manager'||!profile.officeId)throw new Error('FORBIDDEN');
  const officeId=profile.officeId,requestRef=doc(db,'offices',officeId,'joinRequests',uid);
  const userRef=doc(db,'users',uid),teamRef=doc(db,'offices',officeId,'team',uid);
  const officeRef=doc(db,'offices',officeId),notificationRef=doc(db,'offices',officeId,'notifications',makeId('NTF'));
  await runTransaction(db,async tx=>{
    const [reqSnap,userSnap,officeSnap]=await Promise.all([tx.get(requestRef),tx.get(userRef),tx.get(officeRef)]);
    if(!reqSnap.exists()||!userSnap.exists()||!officeSnap.exists())throw new Error('JOIN_REQUEST_NOT_FOUND');
    const request=reqSnap.data(),target=userSnap.data(),office=officeSnap.data();
    if(request.status!=='pending')throw new Error('JOIN_REQUEST_ALREADY_HANDLED');
    if(target.officeId&&target.officeId!==officeId)throw new Error('USER_ALREADY_LINKED');
    if(!Array.isArray(office.managerUids)||!office.managerUids.includes(user.uid)&&office.ownerUid!==user.uid)throw new Error('FORBIDDEN');
    tx.update(requestRef,{status:'accepted',reviewedByUid:user.uid,reviewedAt:serverTimestamp()});
    tx.update(userRef,{officeId,officeName:office.name||'',projectIds:[],onboardingComplete:true,inviteCode:request.inviteCode,joinRequestStatus:'accepted',updatedAt:serverTimestamp()});
    tx.set(teamRef,{id:uid,uid,userCode:request.userCode,name:request.name,email:request.email,role:request.role,specialty:request.specialty||'',officeId,projectIds:[],visibleTo:[uid,user.uid],createdAt:serverTimestamp(),updatedAt:serverTimestamp()},{merge:true});
    if(request.role==='consultant')tx.set(doc(db,'offices',officeId,'consultants',uid),{id:uid,uid,name:request.name,specialty:request.specialty||'',available:true,officeId,visibleTo:[uid,user.uid],updatedAt:serverTimestamp()},{merge:true});
    tx.set(notificationRef,{id:notificationRef.id,officeId,type:'join-request-approved',text:'تم قبول طلب انضمامك إلى '+(office.name||'المكتب'),recipientUid:uid,visibleTo:[uid],createdByUid:user.uid,createdAt:serverTimestamp(),readBy:[]});
  });
}
async function rejectJoinRequest(uid){
  if(profile.role!=='manager'||!profile.officeId)throw new Error('FORBIDDEN');
  const officeId=profile.officeId,requestRef=doc(db,'offices',officeId,'joinRequests',uid);
  const notificationRef=doc(db,'offices',officeId,'notifications',makeId('NTF'));
  await runTransaction(db,async tx=>{
    const officeSnap=await tx.get(doc(db,'offices',officeId)),reqSnap=await tx.get(requestRef);
    if(!officeSnap.exists()||!reqSnap.exists())throw new Error('JOIN_REQUEST_NOT_FOUND');
    const office=officeSnap.data(),request=reqSnap.data();
    if(office.ownerUid!==user.uid&&!office.managerUids?.includes(user.uid))throw new Error('FORBIDDEN');
    if(request.status!=='pending')throw new Error('JOIN_REQUEST_ALREADY_HANDLED');
    tx.update(requestRef,{status:'rejected',reviewedByUid:user.uid,reviewedAt:serverTimestamp()});
    tx.set(notificationRef,{id:notificationRef.id,officeId,type:'join-request-rejected',text:'لم تتم الموافقة على طلب انضمامك إلى '+(office.name||'المكتب'),recipientUid:uid,visibleTo:[uid],createdByUid:user.uid,createdAt:serverTimestamp(),readBy:[]});
  });
}
async function removeOfficeMember(uid){
  if(profile.role!=='manager'||!profile.officeId||uid===user.uid)throw new Error('FORBIDDEN');
  const officeId=profile.officeId,userRef=doc(db,'users',uid),teamRef=doc(db,'offices',officeId,'team',uid),joinRef=doc(db,'offices',officeId,'joinRequests',uid),notificationRef=doc(db,'offices',officeId,'notifications',makeId('NTF'));
  await runTransaction(db,async tx=>{
    const [officeSnap,targetSnap,teamSnap,joinSnap]=await Promise.all([tx.get(doc(db,'offices',officeId)),tx.get(userRef),tx.get(teamRef),tx.get(joinRef)]);
    if(!officeSnap.exists()||!targetSnap.exists()||!teamSnap.exists())throw new Error('MEMBER_NOT_FOUND');
    const office=officeSnap.data(),target=targetSnap.data();
    if(office.ownerUid!==user.uid&&!office.managerUids?.includes(user.uid))throw new Error('FORBIDDEN');
    if(target.role==='manager'||target.officeId!==officeId)throw new Error('MEMBER_CANNOT_BE_REMOVED');
    tx.delete(teamRef);
    if(joinSnap.exists()&&joinSnap.data().status==='accepted')tx.update(joinRef,{status:'removed',reviewedByUid:user.uid,reviewedAt:serverTimestamp()});
    if(target.role==='consultant')tx.delete(doc(db,'offices',officeId,'consultants',uid));
    tx.update(userRef,{officeId:'',officeName:'',projectIds:[],onboardingComplete:false,joinRequestStatus:'removed',updatedAt:serverTimestamp()});
    tx.set(notificationRef,{id:notificationRef.id,officeId,type:'member-removed',text:'تمت إزالة حسابك من '+(office.name||'المكتب'),recipientUid:uid,visibleTo:[uid],createdByUid:user.uid,createdAt:serverTimestamp(),readBy:[]});
  });
}
async function addProjectMembership(uid,projectId){
  if(profile.role!=='manager')throw new Error('FORBIDDEN');
  const snap=await getDoc(doc(db,'users',uid));
  if(!snap.exists()||snap.data().officeId!==profile.officeId)throw new Error('USER_NOT_IN_OFFICE');
  await updateDoc(doc(db,'users',uid),{projectIds:arrayUnion(projectId)});
}

window.KHALIYA_PLATFORM=Object.freeze({
  apiBase:API_BASE,
  user,
  profile,
  health,
  ai,
  conceptImage,
  fileStatus,
  downloadFile,
  uploadFile,
  indexText,
  lookupUserByCode,
  addProjectMembership,
  rotateOfficeInvite,
  approveJoinRequest,
  rejectJoinRequest,
  removeOfficeMember,
  reserveConsultantSlot,
  getOfficeSettings,
  updateOfficeSettings,
  currentContext,
  refreshToken:()=>auth.currentUser?.getIdToken(true),
  signOut:()=>signOut(auth)
});
