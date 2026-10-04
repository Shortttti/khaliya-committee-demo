import { bindCloudStore, SESSION_KEY } from './store.js';
import './interactions.js?v=demo-01';

if(!document.querySelector('link[data-demo-css]')){const link=document.createElement('link');link.rel='stylesheet';link.href='assets/css/demo.css';link.dataset.demoCss='';document.head.append(link)}

const publicPages = new Set(['login.html','signup.html','index.html']);
const filename = location.pathname.split('/').pop() || 'index.html';
let session = null;
try { session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch {}

if (!publicPages.has(filename) && filename !== 'onboarding.html' && !session) {
  location.replace('login.html');
} else {
  if (session) bindCloudStore(session);
  const ensureDemoBadge=()=>{
    const host=document.querySelector('#appContent');if(!host||host.querySelector('.demo-top-banner'))return;
    const badge=document.createElement('div');badge.className='demo-top-banner';badge.innerHTML='<span><b>وضع العرض</b> · البيانات محفوظة محليًا على هذا المتصفح</span><a href="login.html" data-demo-switch>تبديل الدور</a>';
    host.prepend(badge);
  };
  const mountObserver=new MutationObserver(ensureDemoBadge);mountObserver.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('khaliya:state',ensureDemoBadge);setTimeout(ensureDemoBadge,0);
  Promise.all([import('./app-core.js?v=demo-01'), import('./platform.js?v=demo-01')])
    .then(() => window.dispatchEvent(new Event('khaliya:platform-ready')))
    .catch(error => {
      console.error('KHALIYA demo startup failed', error);
      const root = document.querySelector('#appContent');
      if (root) root.innerHTML = '<section class="panel panel-pad"><h1>تعذر تحميل نسخة العرض</h1><p>أعد تحميل الصفحة أو ارجع إلى تسجيل الدخول.</p><a class="btn btn-primary" href="login.html">تسجيل الدخول</a></section>';
    });
}
