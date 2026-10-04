const STORAGE_KEY = 'khaliya.committee.demo.v1';
const SESSION_KEY = 'khaliya.committee.session.v1';
const collectionNames = ['projects','tasks','changes','files','approvals','team','activity','notifications','clientRequests','consultations','decisions','meetings','schedule','timeline','quantities','chat','meetingRequests','consultants','consultantSlots','teams','visualProposals','invites','joinRequests'];

const DEMO_PROJECTS = [
  {id:'airport-terminal',code:'KHL-042',name:'مبنى الخدمات – مطار المدينة',client:'شركة المدار للمطارات',manager:'م. نورة الحربي',due:'2027-03-18',progress:46,status:'قيد التنفيذ',location:'المدينة المنورة',clientUid:'client-airport',managerUid:'demo-pm',managerUids:['demo-pm'],memberUids:['demo-engineer'],officeManagerUids:['demo-manager']},
  {id:'jeddah-hospital',code:'KHL-047',name:'مستشفى الواحة التخصصي',client:'مجموعة الواحة الصحية',manager:'م. نورة الحربي',due:'2027-05-12',progress:28,status:'قيد التنسيق',location:'جدة',clientUid:'demo-client',managerUid:'demo-pm',managerUids:['demo-pm'],memberUids:['demo-engineer'],officeManagerUids:['demo-manager']},
  {id:'makkah-hotel',code:'KHL-051',name:'فندق بوابة مكة',client:'شركة ضيافة مكة',manager:'م. خالد العتيبي',due:'2027-06-30',progress:19,status:'مرحلة التصميم',location:'مكة المكرمة',clientUid:'client-hospitality',managerUid:'demo-manager',managerUids:['demo-manager'],memberUids:['demo-engineer'],officeManagerUids:['demo-manager']},
  {id:'khobar-waterfront',code:'KHL-054',name:'واجهة الخبر البحرية',client:'شركة شواطئ الشرقية',manager:'م. نورة الحربي',due:'2027-04-22',progress:63,status:'قيد التنفيذ',location:'الخبر',clientUid:'demo-client',managerUid:'demo-pm',managerUids:['demo-pm'],memberUids:['demo-engineer'],officeManagerUids:['demo-manager']},
  {id:'riyadh-schools',code:'KHL-058',name:'مجمع مدارس الوادي',client:'شركة روافد التعليم',manager:'م. خالد العتيبي',due:'2027-08-14',progress:12,status:'مرحلة التصميم',location:'الرياض',clientUid:'client-education',managerUid:'demo-manager',managerUids:['demo-manager'],memberUids:['demo-engineer'],officeManagerUids:['demo-manager']}
].map(project=>({...project,visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']}));

const DEMO_TASK_SPECS = [
  ['riyadh-center','TEAM-MEP-01',['تحديث مخطط مجاري الهواء للدور الرابع','مراجعة تنسيق مسارات الخدمات مع الإنشاء','إصدار جدول فتحات التكييف','تجهيز محضر مراجعة المخطط التنفيذي']],
  ['north-campus','TEAM-STR-02',['مطابقة محاور المبنى مع المخطط المعماري','استكمال تفاصيل تسليح السقف','مراجعة تقرير التربة وربطه بالأساسات','إعداد قائمة ملاحظات التنسيق للدور الأرضي']],
  ['heritage-hotel','TEAM-ARC-03',['تدقيق تفاصيل حجر الواجهة','مراجعة عينات التشطيبات الداخلية','تحديث مخطط الأسقف المستعارة','إعداد كشف الأبواب والنوافذ']],
  ['airport-terminal','TEAM-SITE-04',['مراجعة مخطط غرف الخدمات','حصر ملاحظات أنظمة السلامة','تنسيق مواقع اللوحات الإرشادية','تدقيق مسارات الحركة بالمبنى']],
  ['jeddah-hospital','TEAM-MEP-01',['مراجعة أحمال التكييف للأجنحة','تنسيق غرف المعدات الطبية','تحديث مخطط الصرف للدور الثاني','إعداد قائمة متطلبات غرف العزل']],
  ['makkah-hotel','TEAM-ARC-03',['تطوير تفاصيل مدخل الفندق','مراجعة توزيع الغرف النموذجية','مطابقة المواد مع دليل الهوية','تحديث جداول التشطيبات']],
  ['khobar-waterfront','TEAM-SITE-04',['مراجعة مناسيب الساحة الخارجية','تنسيق شبكة الري مع الإنارة','تدقيق تفاصيل المظلات','إعداد تقرير تقدم أعمال الموقع']],
  ['riyadh-schools','TEAM-QS-05',['حصر كميات القواطع الداخلية','مراجعة مساحة الفصول والممرات','تحديث جدول الأبواب','إعداد ملاحظات قابلية الوصول']]
];
const DEMO_TASKS = DEMO_TASK_SPECS.flatMap(([project,teamId,titles],projectIndex)=>titles.map((title,index)=>({
  id:'DEMO-T-'+project.toUpperCase()+'-'+(index+1),title,project,projectId:project,teamId,
  assignee:'م. سارة القحطاني',assigneeUid:'demo-engineer',
  status:['قائمة المهام','قيد التنفيذ','قيد المراجعة','مكتملة'][(projectIndex+index)%4],
  priority:['متوسط','عالي','منخفض','متوسط'][(projectIndex+index)%4],
  due:'2026-10-'+String(5+projectIndex*3+index).padStart(2,'0'),
  visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']
})));

const DEMO_TEAMS = [
  {id:'TEAM-MEP-01',teamCode:'TEAM-MEP-01',name:'فريق تنسيق الأنظمة الكهروميكانيكية',leadUid:'demo-pm',memberUids:['demo-engineer'],projectIds:['riyadh-center','north-campus','jeddah-hospital']},
  {id:'TEAM-STR-02',teamCode:'TEAM-STR-02',name:'فريق الإنشاءات والأساسات',leadUid:'demo-pm',memberUids:['demo-engineer'],projectIds:['north-campus','airport-terminal','riyadh-schools']},
  {id:'TEAM-ARC-03',teamCode:'TEAM-ARC-03',name:'فريق العمارة والواجهات',leadUid:'demo-pm',memberUids:['demo-engineer'],projectIds:['heritage-hotel','makkah-hotel','riyadh-schools']},
  {id:'TEAM-SITE-04',teamCode:'TEAM-SITE-04',name:'فريق الموقع والمتابعة الميدانية',leadUid:'demo-pm',memberUids:['demo-engineer'],projectIds:['airport-terminal','khobar-waterfront','jeddah-hospital']},
  {id:'TEAM-QS-05',teamCode:'TEAM-QS-05',name:'فريق الكميات والتكاليف',leadUid:'demo-pm',memberUids:['demo-engineer'],projectIds:['riyadh-center','makkah-hotel','khobar-waterfront','riyadh-schools']},
  {id:'TEAM-REV-06',teamCode:'TEAM-REV-06',name:'فريق المراجعة والاعتمادات',leadUid:'demo-pm',memberUids:['demo-engineer'],projectIds:['riyadh-center','heritage-hotel','airport-terminal','jeddah-hospital']}
].map(team=>({...team,visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']}));

const seed = () => ({
  user:null, role:'manager', language:'ar',
  projects:[
    {id:'riyadh-center',code:'KHL-024',name:'مركز الأعمال – الرياض',client:'شركة أفق للاستثمار',manager:'م. خالد العتيبي',due:'2026-12-15',progress:68,status:'قيد التنفيذ',location:'الرياض',clientUid:'demo-client',managerUid:'demo-pm',managerUids:['demo-pm'],memberUids:['demo-engineer'],officeManagerUids:['demo-manager'],visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']},
    {id:'north-campus',code:'KHL-031',name:'مجمع الكليات – المرحلة الثانية',client:'جامعة النور',manager:'م. نورة الحربي',due:'2027-02-20',progress:34,status:'قيد التنسيق',location:'المدينة المنورة',clientUid:'demo-client',managerUid:'demo-pm',managerUids:['demo-pm'],memberUids:['demo-engineer'],officeManagerUids:['demo-manager'],visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']},
    {id:'heritage-hotel',code:'KHL-019',name:'فندق الدرعية التراثي',client:'شركة رواسي',manager:'م. خالد العتيبي',due:'2027-01-10',progress:82,status:'قيد المراجعة',location:'الدرعية',clientUid:'demo-client',managerUid:'demo-manager',managerUids:['demo-manager'],memberUids:['demo-engineer'],officeManagerUids:['demo-manager'],visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']}
  ,...DEMO_PROJECTS],
  tasks:[
    {id:'T-101',title:'تحديث مسار التكييف في الدور الثالث',project:'riyadh-center',assignee:'م. سارة القحطاني',status:'قيد التنفيذ',priority:'عالي',due:'2026-10-07',visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']},
    {id:'T-102',title:'مراجعة مخطط الخدمات MEP',project:'riyadh-center',assignee:'م. فهد المطيري',status:'قيد المراجعة',priority:'متوسط',due:'2026-10-09',visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']},
    {id:'T-103',title:'اعتماد واجهة المدخل الرئيسي',project:'riyadh-center',assignee:'م. خالد العتيبي',status:'مكتملة',priority:'متوسط',due:'2026-10-02',visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']},
    {id:'T-104',title:'تدقيق كميات التشطيبات',project:'north-campus',assignee:'م. سارة القحطاني',status:'قائمة المهام',priority:'منخفض',due:'2026-10-12',visibleTo:['demo-manager','demo-pm','demo-engineer','demo-client','demo-consultant']}
  ,...DEMO_TASKS],
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
    {uid:'demo-pm',name:'نورة الحربي',email:'pm@khaliya.demo',role:'pm',specialty:'إدارة مشاريع',status:'نشط',projectIds:['riyadh-center','north-campus','airport-terminal','jeddah-hospital','khobar-waterfront'],teamIds:DEMO_TEAMS.map(team=>team.id)},
    {uid:'demo-engineer',name:'سارة القحطاني',email:'engineer@khaliya.demo',role:'engineer',specialty:'ميكانيكا',status:'نشط',projectIds:['riyadh-center','north-campus','heritage-hotel','airport-terminal','jeddah-hospital','makkah-hotel','khobar-waterfront','riyadh-schools'],teamIds:DEMO_TEAMS.map(team=>team.id)},
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
  meetingRequests:[], consultants:[], consultantSlots:[], teams:DEMO_TEAMS, visualProposals:[], invites:[{id:'INV-1',code:'KHL-2026',role:'engineer',status:'متاح'}], joinRequests:[],
  settings:{office:'مكتب خلية للاستشارات الهندسية',project:'riyadh-center',currency:'SAR',theme:'light',language:'ar',fontSize:'normal'}
});

let state = seed();
let profile = null;
const clone = value => structuredClone(value);
function mergeRows(defaultRows,savedRows,key='id'){const saved=Array.isArray(savedRows)?savedRows:[],map=new Map(saved.map(row=>[row[key],row])),defaultKeys=new Set(defaultRows.map(row=>row[key]));return [...defaultRows.map(row=>({...row,...(map.get(row[key])||{})})),...saved.filter(row=>!defaultKeys.has(row[key]))]}
const emit = () => window.dispatchEvent(new CustomEvent('khaliya:state',{detail:state}));
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(error){console.warn('Demo storage is full',error)}}
export function bindCloudStore(nextProfile={}){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if(saved){const defaults=seed();state={...defaults,...saved,projects:mergeRows(defaults.projects,saved.projects),tasks:mergeRows(defaults.tasks,saved.tasks),teams:mergeRows(defaults.teams,saved.teams),team:mergeRows(defaults.team,saved.team,'uid'),settings:{...defaults.settings,...saved.settings}}}
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
