const STORAGE_KEY = 'khaliya.committee.demo.v1';
const SESSION_KEY = 'khaliya.committee.session.v1';
const collectionNames = ['projects','tasks','changes','files','approvals','team','activity','notifications','clientRequests','consultations','decisions','meetings','schedule','timeline','quantities','chat','meetingRequests','consultants','consultantSlots','teams','visualProposals','invites','joinRequests'];

const seed = () => ({
  user:null, role:'manager', language:'ar',
  projects:[
    {id:'riyadh-center',code:'KHL-024',name:'مركز الأعمال – الرياض',client:'شركة أفق للاستثمار',manager:'م. خالد العتيبي',due:'2026-12-15',progress:68,status:'قيد التنفيذ',location:'الرياض',clientUid:'demo-client',visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']},
    {id:'north-campus',code:'KHL-031',name:'مجمع الكليات – المرحلة الثانية',client:'جامعة النور',manager:'م. نورة الحربي',due:'2027-02-20',progress:34,status:'قيد التنسيق',location:'المدينة المنورة',clientUid:'demo-client',visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']},
    {id:'heritage-hotel',code:'KHL-019',name:'فندق الدرعية التراثي',client:'شركة رواسي',manager:'م. خالد العتيبي',due:'2027-01-10',progress:82,status:'قيد المراجعة',location:'الدرعية',clientUid:'demo-client',visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']}
  ],
  tasks:[
    {id:'T-101',title:'تحديث مسار التكييف في الدور الثالث',project:'riyadh-center',assignee:'م. سارة القحطاني',status:'قيد التنفيذ',priority:'عالي',due:'2026-10-07',visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']},
    {id:'T-102',title:'مراجعة مخطط الخدمات MEP',project:'riyadh-center',assignee:'م. فهد المطيري',status:'قيد المراجعة',priority:'متوسط',due:'2026-10-09',visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']},
    {id:'T-103',title:'اعتماد واجهة المدخل الرئيسي',project:'riyadh-center',assignee:'م. خالد العتيبي',status:'مكتملة',priority:'متوسط',due:'2026-10-02',visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']},
    {id:'T-104',title:'تدقيق كميات التشطيبات',project:'north-campus',assignee:'م. سارة القحطاني',status:'قائمة المهام',priority:'منخفض',due:'2026-10-12',visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']}
  ],
  changes:[
    {id:'CR-017',code:'CR-017',title:'تعديل مسار التكييف – الدور الثالث',project:'riyadh-center',status:'قيد التنسيق',priority:'عالي',requester:'مدير المشروع',description:'تعديل مسار مجرى الهواء لتفادي التعارض مع الجسر الإنشائي عند المحور C-4. يشمل التغيير تحديث مخطط MEP ومراجعة الارتفاع الصافي.',date:'2026-10-03',visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']},
    {id:'CR-014',code:'CR-014',title:'تحديث واجهة المدخل',project:'heritage-hotel',status:'بانتظار الاعتماد',priority:'متوسط',requester:'العميل',description:'تغيير مواد الواجهة وفق العينة المعتمدة.',date:'2026-10-01',visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']}
  ],
  files:[
    {id:'F-201',name:'مخطط التكييف – الدور الثالث v1.pdf',project:'riyadh-center',version:'v1',type:'مخطط MEP',date:'2026-10-01',visibility:'internal',visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']},
    {id:'F-202',name:'مخطط الإنشاء – الدور الثالث v2.pdf',project:'riyadh-center',version:'v2',type:'مخطط إنشائي',date:'2026-10-02',visibility:'internal',visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']},
    {id:'F-203',name:'محضر تنسيق التخصصات.pdf',project:'riyadh-center',version:'v1',type:'محضر',date:'2026-10-02',visibility:'client',visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']}
  ],
  approvals:[{id:'A-104',title:'اعتماد تصور المدخل – الإصدار 3',project:'riyadh-center',status:'بانتظار اعتماد العميل',date:'2026-10-04',visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']}],
  team:[
    {uid:'demo-manager',name:'خالد العتيبي',email:'manager@khaliya.demo',role:'manager',specialty:'إدارة المكتب',status:'نشط',projectIds:['riyadh-center','north-campus','heritage-hotel']},
    {uid:'demo-pm',name:'نورة الحربي',email:'pm@khaliya.demo',role:'pm',specialty:'إدارة مشاريع',status:'نشط',projectIds:['riyadh-center','north-campus']},
    {uid:'demo-engineer',name:'سارة القحطاني',email:'engineer@khaliya.demo',role:'engineer',specialty:'ميكانيكا',status:'نشط',projectIds:['riyadh-center','north-campus']},
    {uid:'demo-client',name:'أحمد الشمري',email:'client@khaliya.demo',role:'client',specialty:'عميل',status:'نشط',projectIds:['riyadh-center']},
    {uid:'demo-consultant',name:'فهد المطيري',email:'consultant@khaliya.demo',role:'consultant',specialty:'كهرباء',status:'نشط',projectIds:['riyadh-center']}
  ],
  activity:[
    {id:'ACT-1',text:'تم تسجيل التغيير CR-017',detail:'مركز الأعمال – الرياض · أُحيل للتنسيق بين التخصصات',time:'2026-10-04T07:20:00.000Z'},
    {id:'ACT-2',text:'رفع مخطط إنشائي v2',detail:'تم رصد تعارض محتمل مع مسار التكييف',time:'2026-10-04T06:45:00.000Z'},
    {id:'ACT-3',text:'اعتماد واجهة المدخل',detail:'اعتمد مدير المشروع التصور رقم A-104',time:'2026-10-03T13:10:00.000Z'}
  ],
  notifications:[{id:'N-1',title:'تعارض يحتاج مراجعة',detail:'CR-017 · الدور الثالث',read:false,date:'2026-10-04'}],
  clientRequests:[{id:'REQ-031',title:'طلب تعديل مدخل المشروع',project:'riyadh-center',status:'قيد المراجعة',clientUid:'demo-client',date:'2026-10-03',visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']}],
  consultations:[{id:'CONS-05',title:'استشارة تنسيق مجاري الهواء',project:'riyadh-center',consultantUid:'demo-consultant',status:'موعد مؤكد',date:'2026-10-06',time:'10:30',visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']}],
  decisions:[{id:'DEC-08',title:'اعتماد ارتفاع السقف المستعار',project:'riyadh-center',owner:'مدير المشروع',status:'معتمد',date:'2026-10-02',visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']}],
  meetings:[{id:'MTG-12',title:'اجتماع تنسيق MEP والإنشاء',project:'riyadh-center',date:'2026-10-06',time:'10:00',status:'مجدول',visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']}],
  schedule:[{id:'SCH-1',title:'تسليم مخططات الدور الثالث',project:'riyadh-center',date:'2026-10-09',status:'على المسار',visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']}],
  timeline:[], quantities:[{id:'Q-1',name:'مجاري هواء رئيسية',quantity:142,unit:'متر طولي',unitCost:260,project:'riyadh-center',visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']}],
  chat:[{id:'MSG-1',name:'نورة الحربي',text:'أرفقت مراجعة التغيير CR-017. نحتاج رأي الميكانيكا قبل نهاية اليوم.',time:'09:12',project:'riyadh-center',visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']}],
  meetingRequests:[], consultants:[], consultantSlots:[], teams:[], visualProposals:[], invites:[{id:'INV-1',code:'KHL-2026',role:'engineer',status:'متاح'}], joinRequests:[],
  settings:{office:'مكتب خلية للاستشارات الهندسية',project:'riyadh-center',currency:'SAR',theme:'light',language:'ar',fontSize:'normal'}
});

let state = seed();
let profile = null;
const clone = value => structuredClone(value);
const emit = () => window.dispatchEvent(new CustomEvent('khaliya:state',{detail:state}));
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(error){console.warn('Demo storage is full',error)}}
export function bindCloudStore(nextProfile={}){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if(saved) state={...seed(),...saved,settings:{...seed().settings,...saved.settings}};
  }catch{}
  profile={...nextProfile};
  try{
    const accounts=JSON.parse(localStorage.getItem('khaliya.demo.accounts')||'[]');
    for(const account of accounts){
      if(!state.team.some(member=>member.uid===account.uid))state.team.push({uid:account.uid,name:account.name,email:account.email,role:account.role,specialty:account.specialty||'عضو فريق',status:'نشط',projectIds:account.projectIds||['riyadh-center']});
    }
  }catch{}
  state.user={uid:profile.uid||'demo-manager',userCode:profile.userCode||'KHL-DEMO',name:profile.name||'خالد العتيبي',email:profile.email||'',phone:profile.phone||'',role:profile.role||'manager',officeId:'demo-office',officeName:state.settings.office,projectIds:profile.projectIds||['riyadh-center','north-campus','heritage-hotel']};
  state.role=state.user.role;
  persist();emit();
}
export function getState(){return state}
export async function flushPendingWrites(){persist();return true}
export function saveState(next){state=next;persist();emit();return state}
export function updateState(mutator){mutator(state);persist();emit();return state}
export function updateLocalOfficeName(name){state.settings.office=String(name||'');if(state.user)state.user.officeName=state.settings.office;persist();emit();return state}
export function makeId(prefix='KHL'){return `${prefix}-${crypto.randomUUID().slice(0,8).toUpperCase()}`}
export function resetState(){localStorage.removeItem(STORAGE_KEY);location.reload()}
export function projectById(id,source=state){return source.projects.find(project=>project.id===id)||null}
export function tasksFor(projectId,source=state){return source.tasks.filter(task=>!projectId||(task.project||task.projectId)===projectId)}
export function addActivity(text,detail='تحديث في مساحة العمل'){updateState(s=>s.activity.unshift({id:makeId('ACT'),text,detail,time:new Date().toISOString(),visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']}))}
export const roles={manager:'إدارة المكتب',pm:'إدارة المشروع',engineer:'الفريق الهندسي',client:'العميل',consultant:'الاستشاري'};
export const statuses=['قائمة المهام','قيد التنفيذ','قيد المراجعة','متأخرة','مكتملة'];
export { STORAGE_KEY, SESSION_KEY };
