function go(h){if(location.hash===h)route();else location.hash=h}

function route(){
const h=location.hash||'#/';
try{
if(h.indexOf('#/app')===0){if(!me()){toast('يجب تسجيل الدخول أولًا للوصول للوحة التحكم','err');go('#/login');return}renderDash(h)}
else if(h==='#/login')renderAuth('login');
else if(h==='#/signup')renderAuth('signup');
else if(h==='#/forgot')renderAuth('forgot');
else if(h.indexOf('#/setup')===0)renderSetup();
else if(h.indexOf('#/test')===0){if(!me()){toast('سجّل الدخول أولًا لفتح صفحة الاختبار','err');go('#/login');return}renderTest()}
else if(h.indexOf('#/onboarding')===0){if(!me()){toast('يجب تسجيل الدخول أولًا','err');go('#/login');return}renderOnboarding()}
else renderLanding();
}catch(err){console.error(err);const app=document.getElementById('app');if(app)app.innerHTML='<div class="p-20 text-center text-ink-400">حدث خطأ غير متوقع. <a class="text-tiffany-400 underline" href="#/">العودة للرئيسية</a></div>'}}

window.addEventListener('hashchange',route);

function logoSVG(){return '<svg class="w-7 h-7 flex-none" viewBox="0 0 32 32"><rect x="2" y="2" width="28" height="28" rx="9" fill="#0ABAB5"/><path d="M16 8l2.2 5.8L24 16l-5.8 2.2L16 24l-2.2-5.8L8 16l5.8-2.2z" fill="#12151a"/></svg>'}

function brandHTML(){return logoSVG()+' إدارة <span class="text-tiffany-500">ســوشـــيــــال</span>'}

function handoffCount(){var s=ws();return s?s.convos.filter(function(c){return c.status==='handoff'}).length:0}

function statusBadge(st){return st==='active'?'<span class="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full px-2 py-0.5 flex-none">نشطة</span>':st==='handoff'?'<span class="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full px-2 py-0.5 flex-none">تحويل بشري</span>':'<span class="text-[10px] bg-ink-800 text-ink-400 border border-ink-700 rounded-full px-2 py-0.5 flex-none">مغلقة</span>'}

function classBadge(c){
var m={'مشتري':'bg-tiffany-500/15 text-tiffany-300 border-tiffany-500/30','عميل محتمل':'bg-emerald-500/15 text-emerald-300 border-emerald-500/30','مهتم':'bg-sky-500/15 text-sky-300 border-sky-500/30','يحتاج متابعة':'bg-amber-500/15 text-amber-300 border-amber-500/30','عميل حالي':'bg-violet-500/15 text-violet-300 border-violet-500/30','غير مهتم':'bg-ink-800 text-ink-400 border-ink-700'};
var cls=m[c]||'bg-ink-800 text-ink-400 border-ink-700';
return '<span class="text-[10px] border rounded-full px-2 py-0.5 flex-none '+cls+'">'+esc(c||'استفسار عام')+'</span>';}

function dashShell(page,body,title){
var u=me(),s=ws();
var isDemo=!!(u&&u.demo);
var navBtns=NAV.map(function(n){
var active=(page===n[0])||(page==='builder'&&n[0]==='widgets');
return '<button data-action="go" data-to="#/app'+(n[0]?'/'+n[0]:'')+'" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition '+(active?'bg-tiffany-500/10 text-tiffany-300 border border-tiffany-500/30':'text-ink-300 hover:bg-ink-850 border border-transparent')+'">'+icon(n[2],'w-[18px] h-[18px]')+' '+n[1]+(n[0]==='conversations'&&handoffCount()?'<span class="mr-auto text-[10px] bg-amber-500 text-ink-950 font-bold rounded-full px-1.5 py-0.5">'+handoffCount()+'</span>':'')+'</button>'}).join('');
var connBtn='';
if(remoteBroken)connBtn='<button data-action="sync-now" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:border-amber-400">'+icon('refresh','w-4 h-4')+' المزامنة متوقفة — اضغط لإعادة الاتصال</button>';
else if(isRemote())connBtn='<button data-action="go" data-to="#/setup" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20">'+icon('db','w-4 h-4')+' Supabase متصل — الجلسة محفوظة</button>';
else if(isDemo)connBtn='<button data-action="go" data-to="#/setup" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20">'+icon('eye','w-4 h-4')+' وضع تجريبي — محفوظ تلقائيًا</button>';
else connBtn='<button data-action="go" data-to="#/setup" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20">'+icon('db','w-4 h-4')+' وضع محلي — اربط الخلفية</button>';
document.getElementById('app').innerHTML='<div class="min-h-screen flex">'
+'<aside id="sidebar" class="fixed lg:sticky top-0 h-screen w-[250px] bg-ink-900 border-l border-ink-800 z-40 flex flex-col transition-transform lg:translate-x-0 max-lg:-translate-x-full flex-none">'
+'<div class="h-16 flex items-center gap-2 px-5 border-b border-ink-800 font-display font-extrabold flex-none text-sm">'+brandHTML()+'</div>'
+'<div class="px-5 py-3 text-[11px] text-ink-500 border-b border-ink-800 truncate flex-none">مساحة العمل: <b class="text-ink-300">'+esc(s.settings.name)+'</b></div>'
+'<nav class="flex-1 overflow-y-auto p-3 space-y-1">'+navBtns+'</nav>'
+'<div class="p-3 border-t border-ink-800 space-y-1 flex-none">'+connBtn
+'<button data-action="go" data-to="#/test" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-ink-300 hover:bg-ink-850">'+icon('globe','w-[18px] h-[18px]')+' موقع تجريبي</button>'
+'<button data-action="logout" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-red-300 hover:bg-red-500/10">'+icon('out','w-[18px] h-[18px]')+' '+(isDemo?'الخروج من الوضع التجريبي':'تسجيل الخروج')+'</button></div></aside>'
+'<div class="flex-1 min-w-0"><header class="h-16 sticky top-0 z-30 glass flex items-center justify-between px-4 md:px-8">'
+'<div class="flex items-center gap-3"><button data-action="sb" class="lg:hidden text-ink-300">'+icon('menu')+'</button><h1 class="font-display font-bold text-lg">'+title+'</h1>'+(isDemo?'<span class="hidden sm:inline-flex text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-full px-2.5 py-1">وضع تجريبي — البيانات محلية لكنها محفوظة</span>':'')+'</div>'
+'<div class="flex items-center gap-3"><span class="hidden sm:flex items-center gap-2 text-xs text-ink-400 bg-ink-850 border border-ink-800 rounded-full px-3 py-1.5">'+icon('bolt','w-3.5 h-3.5 text-tiffany-400')+' '+s.usage.ai+' / '+PLANS[s.plan].msgs+' رسالة AI</span><div class="w-9 h-9 rounded-full bg-tiffany-500/15 border border-tiffany-500/40 text-tiffany-300 flex items-center justify-center font-bold text-sm">'+esc(u.name.charAt(0))+'</div></div></header>'
+'<main class="p-4 md:p-8 max-w-[1200px]">'+body+'</main></div></div>'
+'<div id="sb-overlay" class="fixed inset-0 bg-black/60 z-30 hidden lg:hidden" data-action="sb"></div>';}

function statCard(ic,label,val,sub){return '<div class="glass rounded-2xl p-5"><div class="flex items-center justify-between mb-3"><span class="text-xs text-ink-400">'+label+'</span><span class="w-9 h-9 rounded-xl bg-tiffany-500/10 text-tiffany-400 flex items-center justify-center">'+icon(ic,'w-4 h-4')+'</span></div><div class="font-display font-extrabold text-2xl">'+val+'</div>'+(sub?'<div class="text-[11px] text-ink-500 mt-1">'+sub+'</div>':'')+'</div>'}

function renderDash(h){
var seg=(h.split('?')[0].match(/#\/app\/?([\w-]*)/)||[,''])[1];
var page=PAGES[seg]||'home';
if(page==='home'&&ws()&&ws().settings.onboarded!==true){go('#/onboarding');return}
var titles={home:'الرئيسية',convos:'المحادثات',agents:'AI Agents',widgets:'Widgets',builder:'Widget Builder',contacts:'العملاء',kb:'Knowledge Base',analytics:'التحليلات',settings:'الإعدادات',billing:'الاشتراك'};
var body='';
if(page==='home')body=pgHome();
else if(page==='convos')body=pgConvos(h);
else if(page==='agents')body=pgAgents();
else if(page==='widgets')body=pgWidgets();
else if(page==='builder')body=pgBuilder(h);
else if(page==='contacts')body=pgContacts();
else if(page==='kb')body=pgKB();
else if(page==='analytics')body=pgAnalytics();
else if(page==='settings')body=pgSettings();
else if(page==='billing')body=pgBilling();
dashShell(page,body,titles[page]);
afterRender(page);}

function afterRender(page){
if(page==='builder')renderPreview();
if(page==='convos'){var m=document.getElementById('dash-msgs');if(m)m.scrollTop=m.scrollHeight;
var se=document.getElementById('c-search');
if(se)se.addEventListener('input',function(e){var v=norm(e.target.value);$$('#c-list button').forEach(function(b){b.style.display=norm(b.textContent).indexOf(v)>-1?'':'none'})})}}
