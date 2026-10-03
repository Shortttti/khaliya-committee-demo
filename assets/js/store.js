import { auth, db } from './firebase.js';
import {
  collection, doc, deleteDoc, onSnapshot, query, setDoc, where, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const COLLECTIONS=['projects','tasks','changes','files','approvals','team','activity','notifications','clientRequests','consultations','decisions','meetings','schedule','timeline','quantities','chat','meetingRequests'];
const defaults=()=>({
  user:null,role:'engineer',language:'ar',projects:[],tasks:[],changes:[],files:[],
  approvals:[],team:[],activity:[],notifications:[],clientRequests:[],consultations:[],
  decisions:[],meetings:[],schedule:[],timeline:[],quantities:[],chat:[],meetingRequests:[],
  settings:{office:'',project:'',currency:'SAR',theme:'light',language:'ar',fontSize:'normal'}
});
let state=defaults(), profile=null, stop=[];

const clone=value=>structuredClone(value);
const localKey=uid=>'khaliya.workspace.v3:'+uid;
const emit=()=>window.dispatchEvent(new CustomEvent('khaliya:state',{detail:state}));
function savePreferences(){
  const uid=profile?.uid||auth.currentUser?.uid;
  if(!uid)return;
  try{localStorage.setItem(localKey(uid),JSON.stringify({settings:state.settings,user:state.user}))}catch{}
}
function idOf(row,index){return String(row?.id||row?.uid||row?.userId||row?.code||'').trim()||`item-${index}-${crypto.randomUUID()}`}
function projectIdOf(row){return row?.projectId||row?.project||''}
function normalize(row,id){
  const value={...row,id:String(row.id||id)};
  if(value.project===undefined&&value.projectId)value.project=value.projectId;
  return value;
}
function canSync(){return !!(profile?.uid&&profile?.officeId)}
function collectionPath(name){return collection(db,'offices',profile.officeId,name)}
function wire(row,id,name){
  const value={...row,id,officeId:profile.officeId,updatedAt:serverTimestamp()};
  if(value.project&&!value.projectId)value.projectId=value.project;
  if(name==='projects')value.projectId=id;
  delete value.project;
  value.visibleTo=Array.isArray(value.visibleTo)&&value.visibleTo.length?Array.from(new Set(value.visibleTo.map(String))):[profile.uid];
  return value;
}
function roleQuery(name){
  const ref=collectionPath(name);
  if(profile.role==='manager')return query(ref,where('officeId','==',profile.officeId));
  return query(ref,where('visibleTo','array-contains',profile.uid));
}
async function syncChanges(before,after){
  if(!canSync())throw new Error('يجب ربط الحساب بمكتب قبل حفظ بيانات المشروع.');
  const writes=[];
  for(const name of COLLECTIONS){
    const prev=Array.isArray(before[name])?before[name]:[];
    const next=Array.isArray(after[name])?after[name]:[];
    const oldMap=new Map(prev.map((row,index)=>[idOf(row,index),row]));
    const nextMap=new Map(next.map((row,index)=>[idOf(row,index),row]));
    for(const [id,row] of nextMap){
      if(JSON.stringify(oldMap.get(id))===JSON.stringify(row))continue;
      writes.push(setDoc(doc(collectionPath(name),id),wire(row,id,name)));
    }
    for(const id of oldMap.keys())if(!nextMap.has(id))writes.push(deleteDoc(doc(collectionPath(name),id)));
  }
  await Promise.all(writes);
}
function watchWorkspace(){
  stop.forEach(unsub=>unsub());stop=[];
  if(!canSync())return;
  for(const name of COLLECTIONS){
    try{
      stop.push(onSnapshot(roleQuery(name),snapshot=>{
        state[name]=snapshot.docs.map(item=>normalize(item.data(),item.id));
        savePreferences();emit();
      },error=>{
        console.error('KHALIYA Firestore read failed:',name,error);
        window.dispatchEvent(new CustomEvent('khaliya:data-error',{detail:{operation:'read',collection:name,error}}));
      }));
    }catch(error){console.error('KHALIYA Firestore subscription failed:',name,error)}
  }
}
export function bindCloudStore(nextProfile){
  profile={...nextProfile,uid:nextProfile?.uid||auth.currentUser?.uid||''};
  stop.forEach(unsub=>unsub());stop=[];
  const saved=profile.uid?JSON.parse(localStorage.getItem(localKey(profile.uid))||'{}'):{};
  state={...defaults(),settings:{...defaults().settings,...saved.settings},user:nextProfile?.name?{
    uid:profile.uid,userCode:nextProfile.userCode||`KHL-${profile.uid}`,name:nextProfile.name,
    email:nextProfile.email||'',phone:nextProfile.phone||'',role:nextProfile.role||'engineer',
    officeId:nextProfile.officeId||null,projectIds:nextProfile.projectIds||[]
  }:null,role:nextProfile?.role||'engineer'};
  if(nextProfile?.officeName)state.settings.office=nextProfile.officeName;
  savePreferences();watchWorkspace();emit();
}
export function getState(){return state}
export function saveState(next){
  const before=clone(state);state=next;savePreferences();emit();
  syncChanges(before,state).catch(error=>{
    console.error('KHALIYA Firestore write failed',error);
    window.dispatchEvent(new CustomEvent('khaliya:data-error',{detail:{operation:'write',error}}));
  });
  return state;
}
export function updateState(mutator){
  const before=clone(state);mutator(state);savePreferences();emit();
  syncChanges(before,state).catch(error=>{
    console.error('KHALIYA Firestore write failed',error);
    window.dispatchEvent(new CustomEvent('khaliya:data-error',{detail:{operation:'write',error}}));
  });
  return state;
}
export function makeId(prefix='KHL'){
  const compact=crypto.randomUUID().replaceAll('-','').slice(0,12).toUpperCase();
  return `${prefix}-${compact}`;
}
export function resetState(){state=defaults();savePreferences();emit();location.reload()}
export function projectById(id,source=state){return source.projects.find(project=>project.id===id)||null}
export function tasksFor(projectId,source=state){return source.tasks.filter(task=>!projectId||projectIdOf(task)===projectId)}
export function addActivity(text,detail='تحديث في مساحة العمل'){
  updateState(current=>current.activity.unshift({id:makeId('ACT'),text,detail,time:new Date().toISOString(),visibleTo:[profile?.uid].filter(Boolean)}))
}
export const roles={manager:'إدارة المكتب',pm:'إدارة المشروع',engineer:'الفريق الهندسي',client:'العميل',consultant:'الاستشاري'};
export const statuses=['قائمة المهام','قيد التنفيذ','قيد المراجعة','متأخرة','مكتملة'];
