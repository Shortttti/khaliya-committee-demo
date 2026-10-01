const KEY='nawa.workspace.v2';
const seed={
 role:'manager',language:'ar',
 projects:[
  {id:'P-001',code:'NAWA-001',name:'مركز الرياض للأعمال',client:'شركة أفق للتطوير',manager:'سارة الحربي',location:'الرياض',type:'مبنى تجاري',start:'2026-06-01',due:'2026-11-30',progress:68,status:'على المسار',team:6,budget:2850000},
  {id:'P-002',code:'NAWA-002',name:'فيلا الروضة السكنية',client:'مؤسسة الروضة',manager:'أحمد السالم',location:'جدة',type:'سكني',start:'2026-05-14',due:'2026-11-18',progress:75,status:'على المسار',team:4,budget:780000},
  {id:'P-003',code:'NAWA-003',name:'مجمع النخيل السكني',client:'شركة النخيل',manager:'محمد القحطاني',location:'المدينة المنورة',type:'سكني',start:'2026-07-02',due:'2026-12-15',progress:42,status:'يحتاج متابعة',team:8,budget:4200000}
 ],
 tasks:[
  {id:'T-031',title:'تحديث المخطط المعماري A-104',project:'P-001',discipline:'معماري',assignee:'سارة الحربي',priority:'عالية',due:'2026-10-04',status:'قيد التنفيذ',change:'CR-017'},
  {id:'T-032',title:'مراجعة توزيع مخارج الهواء',project:'P-001',discipline:'ميكانيكي',assignee:'أحمد السالم',priority:'عالية',due:'2026-09-29',status:'متأخرة',change:'CR-017'},
  {id:'T-033',title:'مراجعة الأحمال الكهربائية للقاعة',project:'P-001',discipline:'كهربائي',assignee:'خالد الشهري',priority:'متوسطة',due:'2026-10-05',status:'قيد المراجعة',change:'CR-017'},
  {id:'T-034',title:'تحديث جدول كميات التشطيبات',project:'P-001',discipline:'كميات',assignee:'نورة المطيري',priority:'متوسطة',due:'2026-10-06',status:'قائمة المهام',change:'CR-017'},
  {id:'T-035',title:'مراجعة تعارض الجدار W-21',project:'P-001',discipline:'إنشائي',assignee:'محمد القحطاني',priority:'عالية',due:'2026-10-03',status:'قائمة المهام',change:'CR-017'},
  {id:'T-036',title:'تثبيت متطلب السعة R-012',project:'P-001',discipline:'إدارة المشروع',assignee:'سارة الحربي',priority:'عادية',due:'2026-09-28',status:'مكتملة',change:'CR-017'},
  {id:'T-024',title:'مراجعة مخطط الواجهة',project:'P-003',discipline:'معماري',assignee:'سارة الحربي',priority:'عالية',due:'2026-09-30',status:'متأخرة',change:'CHG-019'}
 ],
 changes:[
  {id:'CR-017',title:'توسيع غرفة الاجتماعات 03 بنسبة 20٪',project:'P-001',requester:'شركة أفق للتطوير',date:'2026-09-29',status:'قيد التنسيق',priority:'عالية',description:'زيادة مساحة غرفة الاجتماعات مع إبقاء المدخل من الممر الرئيسي.',disciplines:['معماري','إنشائي','ميكانيكي','كهربائي','كميات'],sources:['CR-017','A-104 v3','M-203 v2','قرار D-014']},
  {id:'CR-018',title:'إضافة غرفة اجتماعات صغيرة',project:'P-001',requester:'شركة أفق للتطوير',date:'2026-10-01',status:'جديد',priority:'متوسطة',description:'طلب إضافة مساحة اجتماع صغيرة قرب منطقة الاستقبال.',disciplines:['معماري','كهربائي']},
  {id:'CHG-019',title:'تعديل واجهة المبنى الشرقي',project:'P-003',requester:'شركة النخيل',date:'2026-09-27',status:'قيد المراجعة',priority:'عادية',description:'مراجعة اقتراح تعديل فتحات الواجهة.',disciplines:['معماري','إنشائي']}
 ],
 files:[
  {id:'A-104',name:'مخطط معماري — مركز الرياض للأعمال',code:'A-104',discipline:'معماري',type:'DWG',version:3,updated:'2026-10-01',owner:'سارة الحربي',state:'آخر إصدار',refs:['CR-017']},
  {id:'M-203',name:'مخطط أنظمة التكييف والتهوية',code:'M-203',discipline:'ميكانيكي',type:'PDF',version:2,updated:'2026-09-29',owner:'أحمد السالم',state:'مرجع قديم',refs:['A-104 v2']},
  {id:'BOQ-01',name:'جدول الكميات — التصميم الأولي',code:'BOQ-01',discipline:'كميات',type:'XLS',version:3,updated:'2026-09-28',owner:'نورة المطيري',state:'للمراجعة',refs:[]},
  {id:'REQ-001',name:'متطلبات العميل ونطاق العمل',code:'REQ-001',discipline:'إدارة المشروع',type:'PDF',version:1,updated:'2026-09-22',owner:'سارة الحربي',state:'معتمد',refs:['R-012']},
  {id:'MIN-014',name:'محضر اجتماع تنسيق التخصصات',code:'MIN-014',discipline:'إدارة المشروع',type:'PDF',version:1,updated:'2026-09-26',owner:'محمد القحطاني',state:'مسودة',refs:['D-014']}
 ],
 approvals:[
  {id:'APR-008',title:'مخطط معماري A-104 v3',project:'P-001',type:'مراجعة تصميم',recipient:'شركة أفق للتطوير',sent:'2026-09-29',status:'بانتظار العميل',change:'CR-017'},
  {id:'APR-009',title:'تقرير تقدم سبتمبر',project:'P-002',type:'اعتماد تقرير',recipient:'مؤسسة الروضة',sent:'2026-09-30',status:'بانتظار العميل',change:''},
  {id:'APR-010',title:'قرار D-014 — موقع الغرفة',project:'P-001',type:'مراجعة هندسية',recipient:'مديرة المكتب',sent:'2026-09-28',status:'معتمد',change:'CR-017'}
 ],
 team:[
  {name:'سارة الحربي',initial:'س',discipline:'هندسة معمارية',role:'مديرة مشروع',capacity:82,color:'',projects:2},
  {name:'أحمد السالم',initial:'أ',discipline:'هندسة ميكانيكية',role:'مهندس تكييف',capacity:54,color:'green',projects:2},
  {name:'محمد القحطاني',initial:'م',discipline:'هندسة إنشائية',role:'مهندس إنشائي',capacity:66,color:'blue',projects:2},
  {name:'نورة المطيري',initial:'ن',discipline:'كميات وتكاليف',role:'مهندسة كميات',capacity:41,color:'gold',projects:1},
  {name:'خالد الشهري',initial:'خ',discipline:'هندسة كهربائية',role:'مهندس كهربائي',capacity:72,color:'rose',projects:2}
 ],
 activity:[
  {text:'سارة حدّثت المخطط المعماري A-104',detail:'مركز الرياض للأعمال · الإصدار v3',time:'منذ 23 دقيقة'},
  {text:'وصل طلب تغيير جديد من العميل',detail:'CR-018 · إضافة غرفة اجتماعات',time:'منذ ساعة'},
  {text:'أحمد أكمل مراجعة التكييف',detail:'فيلا الروضة · المهمة HVAC-024',time:'منذ 3 ساعات'},
  {text:'أُرسل تقرير التقدم للمراجعة',detail:'فيلا الروضة السكنية',time:'أمس'}
 ],
 notifications:[{id:'N-1',text:'اعتماد A-104 v3 ينتظر رد العميل',type:'اعتماد',seen:false},{id:'N-2',text:'تعارض مرجعي بين M-203 و A-104',type:'تنسيق',seen:false},{id:'N-3',text:'مهمة توزيع الهواء متأخرة',type:'مهمة',seen:true}],
 settings:{office:'مكتب أفق للاستشارات',project:'P-001',currency:'SAR'}
};
export function getState(){try{const stored=localStorage.getItem(KEY);if(!stored)return structuredClone(seed);const parsed=JSON.parse(stored);return {...structuredClone(seed),...parsed,settings:{...seed.settings,...parsed.settings}}}catch{return structuredClone(seed)}}
export function saveState(state){localStorage.setItem(KEY,JSON.stringify(state));window.dispatchEvent(new CustomEvent('nawa:state',{detail:state}));return state}
export function updateState(mutator){const state=getState();mutator(state);return saveState(state)}
export function makeId(prefix='ID'){return `${prefix}-${Math.random().toString(36).slice(2,7).toUpperCase()}`}
export function resetState(){localStorage.removeItem(KEY);window.location.reload()}
export function projectById(id,state=getState()){return state.projects.find(p=>p.id===id)||state.projects[0]}
export function tasksFor(projectId,state=getState()){return state.tasks.filter(t=>!projectId||t.project===projectId)}
export function addActivity(text,detail='تحديث في مساحة العمل'){updateState(s=>s.activity.unshift({text,detail,time:'الآن'}))}
export const roles={manager:'مديرة المكتب',pm:'مدير المشروع',engineer:'مهندس',client:'العميل'};
export const statuses=['قائمة المهام','قيد التنفيذ','قيد المراجعة','متأخرة','مكتملة'];
