document.querySelector('link[href*="assets/css/app.css"]')?.setAttribute('href','assets/css/app.css?v=khaliya-prod-02');
const root=document.getElementById('appContent');
const brand='<span style="display:inline-grid;place-items:center;width:38px;height:38px;border-radius:12px;background:#174b37;color:#fff;font-weight:800;margin-inline-end:10px">خ</span><span style="font-weight:800;color:#174b37">خلية <small style="display:block;font-size:.68em;letter-spacing:.12em">KHALIYA</small></span>';
function showBootError(code){
  if(root)root.innerHTML='<section role="alert" style="max-width:760px;margin:8vh auto;padding:32px;border:1px solid #e5c4bd;border-radius:22px;background:#fff;color:#17382d;box-shadow:0 16px 40px #17382d12;font:inherit"><small style="font-weight:700;letter-spacing:.12em;color:#537b68">KHALIYA | خلية</small><h1 style="margin:14px 0 8px">تعذر تشغيل واجهة مساحة العمل</h1><p style="line-height:1.9;color:#51645b">لم تكتمل ملفات الواجهة. أعد تحميل الصفحة. إذا تكررت المشكلة أرسل رمز التشخيص التالي.</p><code style="display:inline-block;padding:8px 12px;border-radius:8px;background:#f3f5f3">'+code+'</code><p style="margin-top:22px"><button type="button" onclick="location.reload()" style="padding:10px 18px;border:0;border-radius:10px;background:#174b37;color:#fff;font:inherit;cursor:pointer">إعادة المحاولة</button> <a href="login.html" style="margin-inline-start:12px;color:#174b37">تسجيل الدخول</a></p></section>';
  const sidebar=document.querySelector('[data-shell-sidebar]');
  const topbar=document.querySelector('[data-shell-topbar]');
  if(sidebar&&!sidebar.innerHTML)sidebar.innerHTML='<div style="padding:22px">'+brand+'</div>';
  if(topbar&&!topbar.innerHTML)topbar.innerHTML='<div style="padding:20px;color:#17382d">مساحة العمل · خلية | KHALIYA</div>';
}
setTimeout(()=>{if(!window.KHALIYA_APP_STARTED)showBootError('APP-MODULE-TIMEOUT')},8000);
Promise.all([
  import('./app-core.js?v=khaliya-17'),
  import('./platform.js?v=khaliya-15')
]).then(()=>window.dispatchEvent(new Event('khaliya:platform-ready')))
  .catch(error=>{console.error('KHALIYA app startup failed',error);showBootError('APP-MODULE-LOAD')});
