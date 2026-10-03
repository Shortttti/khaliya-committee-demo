import { auth, db } from './firebase.js';
import { bindCloudStore, getState, updateState, makeId } from './store.js?v=cloud-01';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp, runTransaction } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

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

let profile={uid:user.uid,email:user.email||'',role:'',officeId:null,projectIds:[]};
try{
  const snap=await getDoc(doc(db,'users',user.uid));
  if(!snap.exists())throw new Error('PROFILE_NOT_FOUND');
  profile={...profile,...snap.data()};
  if(!['manager','pm','engineer','client','consultant'].includes(profile.role))throw new Error('INVALID_PROFILE_ROLE');
  bindCloudStore(profile);
}catch(error){
  console.error('KHALIYA profile unavailable',error);
  location.replace('login.html?error=profile');
  await new Promise(()=>{});
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
  if(!(file instanceof File))throw new Error('File is required');
  const workspace=getState(),project=workspace.projects.find(item=>item.id===options.projectId);
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
  return {...result,visibleTo,ownerUid:user.uid,project};
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
    const form=event.target;
    const data=new FormData(form);
    const file=data.get('file');
    if(!(file instanceof File)||!file.size){
      toast('اختيار ملف للرفع أولًا');
      return;
    }
    const submit=form.querySelector('[type="submit"]');
    if(submit){submit.disabled=true;submit.textContent='جارٍ الرفع…'}
    try{
      const selected=String(data.get('project')||'');
      const result=await uploadFile(file,{
        projectId:authorizedProjectId(selected)||'unassigned',
        officeId:profile.officeId||'',
        visibility:'internal',
        sourceType:'project-file'
      });
      document.querySelector('#modalBackdrop')?.classList.remove('open');
      toast('تم رفع الملف وإرساله للتحليل والفهرسة');
      const projectId=authorizedProjectId(selected);
      if(projectId){
        updateState(state=>state.files.unshift({id:result.fileId||makeId('FILE'),project:projectId,projectId,ownerUid:user.uid,visibleTo:result.visibleTo||[user.uid],name:file.name,code:result.code||makeId('DOC'),discipline:String(data.get('discipline')||''),type:file.name.split('.').pop()?.toUpperCase()||file.type,version:1,updated:new Date().toISOString().slice(0,10),owner:profile.name||user.email,state:result.analysis?'تم التحليل':'جارٍ التحليل',storageKey:result.storageKey||'',downloadUrl:result.downloadUrl||'',analysis:result.analysis||null,visibleTo:result.visibleTo||[user.uid]}));
      }
      console.info('KHALIYA upload queued',result);
    }catch(error){
      toast('تعذر رفع الملف: '+(error.message||'خطأ'));
    }finally{
      if(submit){submit.disabled=false;submit.textContent='حفظ'}
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
      ['nawa-demo-session','nawa-onboarding-role','nawa-onboarding-name','nawa-onboarding-email','nawa-onboarding-office'].forEach(k=>sessionStorage.removeItem(k));
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
  if(!profile.officeId||!['client','engineer','pm'].includes(profile.role))throw new Error('FORBIDDEN');
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
async function createInvite(email,role,projectIds=[]){
  if(profile.role!=='manager')throw new Error('FORBIDDEN');
  const normalized=String(email||'').trim().toLowerCase();
  if(!normalized||!['pm','engineer','client','consultant'].includes(role))throw new Error('INVALID_INVITE');
  const code='KHL-'+crypto.randomUUID().replaceAll('-','').slice(0,10).toUpperCase();
  await setDoc(doc(db,'publicInvites',code),{
    officeId:profile.officeId,officeName:profile.officeName||'',
    email:normalized,role,projectIds,createdByUid:user.uid,
    status:'pending',createdAt:serverTimestamp()
  });
  return code;
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
  uploadFile,
  indexText,
  lookupUserByCode,
  addProjectMembership,
  createInvite,
  reserveConsultantSlot,
  currentContext,
  refreshToken:()=>auth.currentUser?.getIdToken(true),
  signOut:()=>signOut(auth)
});
