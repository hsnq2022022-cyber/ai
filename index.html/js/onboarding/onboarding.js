function engSource(k){var el=document.getElementById(ENG_SRC[k]);return el?el.textContent.trim():''}

function renderSetup(){
var connected=isRemote();
var phases=[['Supabase + قاعدة البيانات + RLS',true],['حفظ الودجات/الوكلاء مباشرة في Supabase',true],['widget.js + verify-widget + ai-respond (RAG)',true],['Knowledge Base: زحف + ملفات + نصوص + بديل يدوي',true],['عزل المعرفة لكل Agent + منع الإجابات العامة',true],['CRM: تصنيف + Lead Score + وسوم تلقائية',true],['معالج تهيئة (Onboarding) من 8 خطوات',true],['وضع محلي آمن عند انقطاع الخادم + إعادة مزامنة',true],['Billing + دفع حقيقي + إشعارات بريد',false]];
document.getElementById('app').innerHTML='<div class="min-h-screen max-w-4xl mx-auto px-4 py-10">'
+'<div class="flex items-center justify-between mb-8 flex-wrap gap-3"><a href="#/" class="flex items-center gap-2 font-display font-extrabold text-lg">'+brandHTML()+'</a><div class="flex gap-2">'+(me()?'<button data-action="go" data-to="#/app" class="btn-ghost !py-2 text-sm">لوحة التحكم</button>':'')+'<a href="#/" class="btn-ghost !py-2 text-sm">الرئيسية</a></div></div>'
+'<h1 class="font-display font-extrabold text-3xl mb-2">الخلفية والمحرك</h1>'
+'<p class="text-ink-400 text-sm leading-7 mb-8">كل الكود اللازم لتشغيل النظام مع عملاء حقيقيين: الترحيلات، الدوال، الويدجت، وخطوات النشر. بدون خادم يعمل التطبيق بالوضع المحلي الكامل.</p>'
+'<div class="grid md:grid-cols-[1fr_280px] gap-5 items-start"><div class="space-y-5">'
+'<div class="glass rounded-2xl p-6"><div class="flex items-center justify-between mb-4"><h3 class="font-display font-bold flex items-center gap-2">'+icon('db','w-5 h-5 text-tiffany-400')+' اتصال Supabase</h3>'+(connected?'<span class="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1">● متصل</span>':'<span class="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1">● غير متصل (وضع محلي)</span>')+'</div>'
+'<form id="f-setup" class="space-y-3"><label class="lbl2">Supabase Project URL<input name="url" class="inp-s ltr" placeholder="https://xxxx.supabase.co" value="'+esc((cfg&&cfg.url)||'')+'" required></label><label class="lbl2">Anon Public Key<input name="key" class="inp-s ltr" placeholder="eyJhbGciOi..." value="'+esc((cfg&&cfg.key)||'')+'" required></label>'
+'<div class="flex gap-2 flex-wrap"><button class="btn-primary">حفظ وفحص الاتصال</button>'+(connected?'<button type="button" data-action="sb-disconnect" class="btn-ghost !border-red-500/40 !text-red-300">فصل الاتصال والعودة للوضع المحلي</button>':'')+'</div></form></div>'
+'<div class="glass rounded-2xl p-6"><div class="flex items-center justify-between mb-4 flex-wrap gap-2"><h3 class="font-display font-bold flex items-center gap-2">'+icon('bolt','w-5 h-5 text-tiffany-400')+' ملفات التنفيذ</h3><span class="text-[11px] text-tiffany-300 bg-tiffany-500/10 border border-tiffany-500/30 rounded-full px-3 py-1">جاهزة للنشر</span></div>'
+'<div class="flex flex-wrap gap-2 mb-4">'+ENG_TABS.map(function(t){return '<button data-action="eng-tab" data-id="'+t[0]+'" class="eng-tab '+(engTab===t[0]?'on':'')+'">'+t[1]+'</button>'}).join('')+'</div><div id="eng-view"></div></div></div>'
+'<div class="space-y-5"><div class="glass rounded-2xl p-6"><h3 class="font-display font-bold mb-4">مراحل الإطلاق</h3><div class="space-y-2.5">'+phases.map(function(p,i){return '<div class="flex items-center gap-2.5 text-sm"><span class="w-6 h-6 rounded-full flex items-center justify-center text-[11px] flex-none '+(p[1]?'bg-tiffany-500 text-ink-950 font-bold':'bg-ink-800 text-ink-500')+'">'+(i+1)+'</span><span class="'+(p[1]?'text-ink-100':'text-ink-500')+'">'+p[0]+'</span>'+(p[1]?'<span class="mr-auto text-tiffany-400 flex-none">'+icon('check','w-4 h-4')+'</span>':'')+'</div>'}).join('')+'</div></div>'
+'<div class="glass rounded-2xl p-6 text-xs text-ink-400 leading-6 space-y-2"><p><b class="text-ink-200">سلسلة الأمان (ملزمة في كل الدوال)</b></p><p>widget_id → موجود → التوكن يطابق data.token → مفعّل → الـ Agent المرتبط بالسجل نفسه → معرفة ذلك الـ Agent فقط.</p><p>لا يُقبل أي agent_id أو workspace_id من المتصفح إطلاقًا. لا تصل أي مفاتيح أسرار إلى الويدجت.</p></div></div></div>'
+'<div id="sb-status" class="mt-5"></div></div>';
fillEngView();}

function fillEngView(){
var v=document.getElementById('eng-view');if(!v)return;
if(engTab==='steps'){v.innerHTML='<div class="flex justify-end mb-2"><button data-action="copy-eng" class="btn-ghost !py-2 text-xs">'+icon('copy','w-3.5 h-3.5')+' نسخ الخطوات</button></div>'+ENG_STEPS;return}
v.innerHTML='<div class="flex justify-end mb-2"><button data-action="copy-eng" class="btn-ghost !py-2 text-xs">'+icon('copy','w-3.5 h-3.5')+' نسخ الملف</button></div><pre class="codebox" style="max-height:480px">'+esc(engSource(engTab))+'</pre>';}

function renderTest(){
var s=ws();
var q=new URLSearchParams(location.hash.split('?')[1]||'');
var w=s?(s.widgets.find(function(x){return x.id===q.get('wid')})||s.widgets[0]):null;
if(!w){document.getElementById('app').innerHTML='<div class="p-20 text-center text-ink-400">لا يوجد ويدجت بعد. <a class="text-tiffany-400 underline" href="#/app/widgets">أنشئ ويدجت أولًا</a></div>';return}
var agent=s.agents.find(function(a){return a.id===w.agentId});
document.getElementById('app').innerHTML=
'<div class="fixed top-0 inset-x-0 z-50 bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-xs py-2 px-4 text-center">محاكاة موقع خارجي — هكذا يرى زوارك الويدجت <button data-action="go" data-to="#/app/widgets" class="underline mr-3 hover:text-white">العودة للوحة التحكم</button></div>'
+(!w.enabled?'<div class="fixed top-8 inset-x-0 z-50 bg-red-500/10 border-b border-red-500/30 text-red-300 text-xs py-2 px-4 text-center">هذا الويدجت معطل حاليًا من لوحة التحكم.</div>':'')
+'<div class="pt-16 bg-white text-slate-800 min-h-screen" dir="rtl"><div class="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between border-b border-slate-200"><b class="font-display text-slate-900">'+esc(s.settings.name||'موقع تجريبي')+'</b><div class="hidden md:flex gap-6 text-sm text-slate-500"><span>الرئيسية</span><span>المنتجات</span><span>تواصل معنا</span></div></div>'
+'<div class="max-w-5xl mx-auto px-4 py-14 text-center"><h1 class="font-display font-extrabold text-3xl text-slate-900 mb-3">مرحبًا بكم في '+esc(s.settings.name||'موقعنا')+'</h1><p class="text-slate-500 max-w-xl mx-auto">جرّب الويدجت الحي واسأل عن المعلومات المضافة في قاعدة المعرفة.</p>'
+'<div class="grid sm:grid-cols-3 gap-4 mt-10 text-right">'+[['خدمة العملاء','متوفرون دائمًا'],['المنتجات','حسب قاعدة المعرفة'],['الدعم','تحويل بشري عند الحاجة']].map(function(p){return '<div class="rounded-2xl border border-slate-200 p-5 bg-white shadow-sm"><div class="h-28 rounded-xl bg-slate-100 mb-4"></div><b>'+p[0]+'</b><div class="text-tiffany-600 font-bold mt-1">'+p[1]+'</div></div>'}).join('')+'</div></div>'
+'<div class="max-w-5xl mx-auto px-4 pb-16 text-sm text-slate-500 leading-7">جرّب الـ Grounding: اسأل عن معلومة موجودة في قاعدة المعرفة ثم عن معلومة غير موجودة.</div></div><div id="test-widget"></div>';
var tw=document.getElementById('test-widget');
if(w.enabled&&tw)mountWidget(tw,w,agent,{fixed:true,persist:true,credit:true});}

function buildInstructions(goals, businessName) {
let instructions = 'أنت وكيل ذكاء اصطناعي لـ ' + businessName + ' عبر منصة إدارة ســوشـــيــــال. ';
if (goals.includes('حجز المواعيد')) instructions += 'اطلب من العميل الاسم والتاريخ المفضل للحجز. ';
if (goals.includes('الرد على الأسئلة')) instructions += 'أجب فقط من قاعدة المعرفة. لا تخترع معلومات. ';
if (goals.includes('توجيه العميل للشراء')) instructions += 'ساعد العميل في اختيار المنتج المناسب ووجّهه للشراء. ';
if (goals.includes('حل الشكاوى')) instructions += 'استمع للشكوى باهتمام وقدّم حلولاً من قاعدة المعرفة. ';
if (goals.includes('جمع بيانات العملاء')) instructions += 'اجمع اسم العميل وبريده ورقم هاتفه للمتابعة. ';
if (goals.includes('التحويل لموظف بشري')) instructions += 'إذا طلب العميل موظفاً بشرياً، حوّله بلباقة. ';
if (goals.includes('ترشيح المنتجات')) instructions += 'رشّح منتجات بناءً على احتياجات العميل من قاعدة المعرفة. ';
if (goals.includes('متابعة حالة الطلب')) instructions += 'اطلب رقم الطلب وتابع حالته من النظام. ';
if (goals.includes('توجيه العميل للجهة الصحيحة')) instructions += 'وجّه العميل للقسم أو الجهة المناسبة. ';
instructions += 'إذا لم تجد المعلومة في قاعدة المعرفة، قل نصًا: "' + NO_INFO_MSG + '"';
return instructions;}

function renderProgressBar(currentStep, totalSteps) {
totalSteps = totalSteps || 8;
var bars='';
for(var i=0;i<totalSteps;i++){
var isCompleted=i<currentStep, isCurrent=i===currentStep;
bars+='<div class="flex-1 h-[3px] rounded-full transition-all '+(isCompleted?'bg-tiffany-500':isCurrent?'bg-tiffany-500':'bg-ink-700 opacity-30')+'"></div>';}
return '<div class="flex gap-1.5 mb-8">'+bars+'</div>';}

function renderOnboardingPreview(step) {
const s = ws();
if(!s) return '';
const name = s.settings.name || 'نشاطك';
const goals = s.settings.goals || [];
const progress = Math.round((step / 8) * 100);
return `
<div class="glass rounded-2xl p-5">
<div class="flex items-center gap-3 mb-4">
<div class="w-10 h-10 rounded-xl bg-tiffany-500/10 text-tiffany-400 flex items-center justify-center">${icon('bot','w-5 h-5')}</div>
<div><div class="font-display font-bold text-sm">مساعد ${esc(name)}</div><div class="text-[11px] text-ink-500">● نجهّز وكيلك...</div></div>
</div>
${goals.length ? `<div class="mb-3"><div class="text-[11px] text-ink-500 mb-1.5">الأهداف</div><div class="flex flex-wrap gap-1">${goals.map(g=>`<span class="text-[10px] bg-tiffany-500/10 text-tiffany-300 border border-tiffany-500/30 rounded-full px-2 py-0.5">${esc(g)}</span>`).join('')}</div></div>` : ''}
<div class="mb-3"><div class="text-[11px] text-ink-500 mb-1.5">القنوات</div><div class="flex flex-wrap gap-1">
<span class="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full px-2 py-0.5">ويدجت الموقع ✓</span>
<span class="text-[10px] bg-ink-800 text-ink-500 border border-ink-700 rounded-full px-2 py-0.5">واتساب (قريباً)</span></div></div>
<div class="glass rounded-xl p-3 bg-ink-850/50">
<div class="flex items-center justify-between mb-1"><span class="text-[11px] text-ink-400">التقدم</span><span class="text-[11px] text-tiffany-300 font-bold">${progress}%</span></div>
<div class="h-1.5 bg-ink-800 rounded-full overflow-hidden"><div class="h-full bg-tiffany-500 rounded-full transition-all" style="width:${progress}%"></div></div>
</div>
${step >= 6 ? `<div class="mt-3 text-[11px] text-ink-400 italic">"${esc(name)} يجهّز وكيله الذكي الأول عبر إدارة ســوشـــيــــال..."</div>` : ''}
</div>`;}

async function obBuildAgent(){
const s=ws();const st=s.settings;
if(st.obBuilt)return;
s.agents=s.agents.filter(function(a){return !a.__demo});
s.widgets=s.widgets.filter(function(w){return !w.__demo});
s.kb=s.kb.filter(function(k){return !k.__demo});
const name=st.name||'نشاطي';
const agent={id:uid('ag_'),name:name+' Assistant',desc:'وكيل ذكي لـ '+name+' أُنشئ عبر معالج التهيئة في إدارة ســوشـــيــــال.',avatar:AVT[0],
instructions:buildInstructions(st.goals||[],name),language:'العربية',tone:'ودي واحترافي',model:'gemini-2.5-flash-lite',
welcome:'أهلًا بك 👋 أنا مساعد '+name+'، اسألني وسأجيبك من معلوماتنا الموثقة فقط.',fallback:NO_INFO_MSG,createdAt:now()};
s.agents.push(agent);
s.kb.forEach(function(k){if(!k.agentId)k.agentId=agent.id});
const w=defWidget(agent.id,name+' Widget');
w.welcome='أهلًا بك 👋 أنا مساعد '+name+'، كيف أقدر أساعدك؟';
w.placeholder='اسأل وكيلك سؤالاً...';
s.widgets.push(w);
st.obBuilt=true;st.obAgentId=agent.id;st.obWidgetId=w.id;
st.onboardingAgentId=agent.id;st.onboardingWidgetId=w.id;
save();persist();
if(isRemote()){try{await sbUpsert('agents',agent);await syncWidgetToServer(w);}catch(e){toast('فشل الحفظ في قاعدة البيانات: '+e.message,'err')}}}

function obRunBuild(){
const st=ws().settings;
if(st.obBuilt)return;
const bar=document.getElementById('ob-build-bar');
const txt=document.getElementById('ob-build-txt');
let p=5;
const iv=setInterval(function(){p=Math.min(p+Math.random()*16,90);if(bar)bar.style.width=p+'%'},260);
obBuildAgent().then(function(){
clearInterval(iv);
if(bar)bar.style.width='100%';
if(txt)txt.innerHTML=icon('check','w-4 h-4 inline text-tiffany-400')+' تم بناء وكيلك الحقيقي';
const nb=document.getElementById('ob-next-btn');
if(nb){nb.disabled=false;nb.style.opacity='1';nb.classList.add('ob-next-active')}
toast('تم بناء وكيلك الحقيقي ✔','ok');
}).catch(function(err){
clearInterval(iv);
if(txt)txt.textContent='فشل البناء: '+(err.message||err);
toast('فشل البناء: '+(err.message||err),'err');});}

function obMountTest(){
const st=ws().settings;
const host=document.getElementById('ob-widget-host');
if(!host)return;
const w=ws().widgets.find(function(x){return x.id===(st.obWidgetId||st.onboardingWidgetId)});
const a=ws().agents.find(function(x){return x.id===(st.obAgentId||st.onboardingAgentId)});
if(!w||!a){host.innerHTML='<div class="p-8 text-center text-ink-500 text-sm">لم يتم العثور على الويدجت — عُد إلى خطوة البناء.</div>';return}
const inst=mountWidget(host,w,a,{fixed:false,persist:true,credit:true});
if(inst&&inst.openPanel)inst.openPanel();}

function renderOnboarding(){
const s=ws();
if(!s){go(me()?'#/app':'#/login');return}
const st=s.settings;
if(!st.goals)st.goals=[];
let step=st.onboardingStep||st.obStep||1;if(step<1)step=1;if(step>8)step=8;
st.onboardingStep=step;st.obStep=step;persist();
const name=st.name||'';
let title='',sub='',body='',nextOk=true,nextLabel='متابعة';
if(step===1){
title='أهلًا '+(name?esc(name):'بك')+' في إدارة ســوشـــيــــال، لنجهّز وكيلك';
sub='أكّد بيانات نشاطك — تُقرأ ديناميكيًا وتظهر في كل مكان تلقائيًا.';
nextOk=String(name).trim().length>0;
body='<div class="space-y-4"><label class="lbl2">اسم النشاط / الشركة *<input data-ob="name" class="inp" value="'+esc(name)+'" placeholder="مثال: متجر النخبة"></label>'
+'<label class="lbl2">نوع النشاط<select data-ob="type" class="inp">'+['متجر إلكتروني','شركة','عيادة','مطعم','صالون','عقارات','مكتب خدمات','مركز تدريب','أخرى'].map(function(t){return '<option '+(t===(st.type||'')?'selected':'')+'>'+t+'</option>'}).join('')+'</select></label></div>';}
else if(step===2){
title='ما الذي تريد أن يقوم به وكيلك؟';
sub='اختر هدفًا واحدًا على الأقل';
nextOk=st.goals.length>0;
body='<div class="grid sm:grid-cols-3 gap-3">'+OB_GOALS.map(function(g){
const sel=st.goals.indexOf(g[1])>-1;
return '<button type="button" data-action="ob-goal" data-id="'+esc(g[1])+'" class="glass rounded-xl p-4 text-right transition border '+(sel?'border-tiffany-500':'border-transparent hover:border-ink-600')+'" style="'+(sel?'background:rgba(10,186,181,0.1)':'')+'"><div class="text-xl mb-1">'+g[0]+'</div><div class="text-sm font-semibold">'+esc(g[1])+'</div>'+(sel?'<div class="text-[10px] text-tiffany-300 mt-1">'+icon('check','w-3 h-3 inline')+' محدد</div>':'')+'</button>'}).join('')+'</div>';}
else if(step===3){
title='وين بتنشر وكيلك؟';
sub='اختر القنوات اللي يستخدمها عملاؤك';
const soon=['واتساب','انستقرام','ماسنجر','إيميل','تيك توك','تيليجرام','هاتف'];
body='<div class="space-y-3">'
+'<div class="glass rounded-xl p-4 flex items-center justify-between border border-tiffany-500" style="background:rgba(10,186,181,0.1)"><div class="flex items-center gap-3"><span class="w-9 h-9 rounded-lg bg-tiffany-500/10 text-tiffany-400 flex items-center justify-center">'+icon('widget','w-4 h-4')+'</span><div><div class="text-sm font-bold">ويدجت الموقع</div><div class="text-[11px] text-ink-500">مفعّل وجاهز الآن</div></div></div><span class="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-1">✓ مفعّل</span></div>'
+'<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">'+soon.map(function(c){return '<button type="button" data-action="soon-channel" data-id="'+c+'" class="glass rounded-xl p-3 text-center opacity-60 hover:opacity-90 transition cursor-pointer"><div class="text-xs font-semibold">'+c+'</div><div class="text-[9px] text-ink-500 mt-0.5">قريباً — اضغط للتفاصيل</div></button>'}).join('')+'</div>'
+'<div class="glass rounded-xl p-4 text-xs text-ink-300 flex items-center justify-between flex-wrap gap-2"><span>✨ باقة مجانية · قناة واحدة مشمولة</span><button data-action="go" data-to="#/app/billing" class="text-tiffany-400 hover:underline">عرض الباقات</button></div></div>';}
else if(step===4){
title='خلي وكيلك يعرف منتجاتك';
sub='حط رابط صفحة وحدة ونقراها تلقائياً، أو ارفع ملف، أو اكتب بنفسك.';
const sources=s.kb.filter(function(k){return !k.__demo});
body='<div class="space-y-5">'
+'<div class="grid grid-cols-3 gap-3">'
+'<button type="button" data-action="kb-open" data-id="url" class="glass rounded-xl p-4 text-center hover:border-tiffany-500/50 transition border border-transparent"><div class="mb-1 text-tiffany-400 flex justify-center">'+icon('globe','w-6 h-6')+'</div><div class="text-sm font-bold">رابط موقع</div></button>'
+'<button type="button" data-action="kb-open" data-id="file" class="glass rounded-xl p-4 text-center hover:border-tiffany-500/50 transition border border-transparent"><div class="mb-1 text-tiffany-400 flex justify-center">'+icon('doc','w-6 h-6')+'</div><div class="text-sm font-bold">ملف</div></button>'
+'<button type="button" data-action="kb-open" data-id="text" class="glass rounded-xl p-4 text-center hover:border-tiffany-500/50 transition border border-transparent"><div class="mb-1 text-tiffany-400 flex justify-center">'+icon('edit','w-6 h-6')+'</div><div class="text-sm font-bold">نص يدوي</div></button></div>'
+'<div><div class="text-xs text-ink-500 mb-2">مصادرك الحالية ('+sources.length+') — ستُربط بوكيلك تلقائيًا في خطوة البناء:</div><div class="space-y-2">'
+(sources.map(function(k){
return '<div class="glass rounded-xl p-3 flex items-center gap-3"><span class="w-8 h-8 rounded-lg bg-tiffany-500/10 text-tiffany-400 flex items-center justify-center flex-none">'+icon(k.type==='url'?'globe':k.type==='file'?'doc':'edit','w-4 h-4')+'</span><div class="flex-1 min-w-0"><div class="text-xs font-semibold truncate">'+esc(k.name)+'</div><div class="text-[10px] text-ink-500">'+(k.chunkCount||0)+' مقطع'+(k.lastSync?' • آخر تحديث '+timeAgo(k.lastSync):'')+'</div></div>'+kbStatusBadge(k)+'</div>'}).join('')||'<div class="text-[11px] text-ink-600">لا مصادر بعد.</div>')+'</div></div></div>';}
else if(step===5){
title='هذا اللي تعلّمه وكيلك';
sub='';
const srcCount=s.kb.filter(function(k){return !k.__demo}).length;
const chunkTotal=s.kb.filter(function(k){return !k.__demo}).reduce(function(a,k){return a+(k.chunkCount||0)},0);
const tags=['وكلاء ذكاء حقيقيون','ربط قنوات حقيقي','بنية حقيقية للإنتاج','أمان الإنتاج','ويدجت موقع فعلي','تدفقات ذكية'];
body='<div class="space-y-5"><div class="flex items-center gap-3"><span class="w-12 h-12 rounded-full bg-tiffany-500/10 text-tiffany-400 flex items-center justify-center">'+icon('check','w-6 h-6')+'</span><div><div class="font-display font-bold">جاهز للبناء</div><div class="text-[11px] text-ink-500">'+srcCount+' مصدر معرفة • '+chunkTotal+' مقطع • '+st.goals.length+' هدف</div></div></div>'
+'<div class="flex flex-wrap gap-2">'+tags.map(function(t){return '<span class="text-[11px] bg-tiffany-500/10 text-tiffany-300 border border-tiffany-500/30 rounded-full px-3 py-1">'+t+'</span>'}).join('')+'</div>'
+'<button data-action="ob-goto" data-id="4" class="text-xs text-tiffany-400 hover:underline">أضف معلومات أكثر ←</button></div>';}
else if(step===6){
const urlDoc=s.kb.find(function(k){return k.type==='url'&&!k.__demo});
title='نجهّز وكيل تجربة لـ '+esc(name||'نشاطك');
sub='';
body='<div class="space-y-4"><div class="glass rounded-xl p-4 space-y-2 text-sm">'
+'<div class="flex items-center justify-between"><span class="text-ink-500 text-xs">اسم الوكيل</span><b>'+esc(name||'نشاطك')+' Assistant</b></div>'
+(urlDoc?'<div class="flex items-center justify-between"><span class="text-ink-500 text-xs">مصدر الموقع</span><span class="ltr text-xs text-tiffany-300">'+esc(urlDoc.name)+'</span></div>':'')
+'<div class="flex items-center justify-between"><span class="text-ink-500 text-xs">الأهداف</span><span class="text-xs">'+st.goals.length+' هدف</span></div></div>'
+'<div class="glass rounded-xl p-4"><div id="ob-build-txt" class="text-sm flex items-center gap-2 mb-3">'+(st.obBuilt?(icon('check','w-4 h-4 inline text-tiffany-400')+' تم بناء وكيلك الحقيقي'):'<span class="ob-spin"></span> نقرأ نشاطك...')+'</div>'
+'<div class="h-1.5 bg-ink-800 rounded-full overflow-hidden"><div id="ob-build-bar" class="h-full bg-tiffany-500 rounded-full transition-all" style="width:'+(st.obBuilt?'100':'5')+'%"></div></div></div>'
+(st.obBuilt?'':'<button data-action="ob-build" class="btn-ghost text-xs">إعادة محاولة البناء</button>')+'</div>';}
else if(step===7){
title='جرب وكيلك الحي';
sub='شات حي متصل فعليًا — يجيب من المعرفة الحقيقية التي أضفتها فقط.';
body='<div class="space-y-4"><div class="relative h-[540px] rounded-xl bg-ink-900 border border-ink-800 overflow-hidden grid-bg"><div id="ob-widget-host" class="absolute inset-0"></div></div>'
+'<div class="flex gap-2 flex-wrap"><button data-action="ob-next" class="btn-primary">وكيلي جاهز</button><button data-action="ob-test-page" class="btn-ghost">المعاينة</button><button data-action="ob-builder" class="btn-ghost">الإعداد</button></div></div>';}
else if(step===8){
title='اختر خطتك';
sub='يمكنك التغيير لاحقًا في أي وقت. الخطة المجانية تشمل 8 Agents.';
body='<div class="grid md:grid-cols-3 gap-4 mb-5">'+Object.keys(PLANS).map(function(k){var p=PLANS[k];
const cur=(s.plan===k);
return '<div class="glass rounded-2xl p-5 border '+(cur?'border-tiffany-500':'border-transparent')+'"><h3 class="font-display font-bold">'+p.name+(cur?' <span class="text-[10px] text-tiffany-300 bg-tiffany-500/10 border border-tiffany-500/30 rounded-full px-2 py-0.5">الباقة الحالية</span>':'')+'</h3><div class="my-3 font-display font-extrabold text-2xl">'+p.price+' <span class="text-xs text-ink-400 font-normal">ريال/شهر</span></div><ul class="text-[11px] text-ink-400 space-y-1.5 mb-4">'+p.feat.map(function(f){return '<li class="flex gap-1.5">'+icon('check','w-3 h-3 text-tiffany-500 mt-0.5 flex-none')+' '+f+'</li>'}).join('')+'</ul>'+(cur?'<button class="btn-ghost w-full" disabled>مفعّلة</button>':'<button data-action="choose-plan" data-id="'+k+'" class="'+(k==='growth'?'btn-primary':'btn-ghost')+' w-full">اختيار '+p.name+'</button>')+'</div>'}).join('')+'</div>'
+'<button data-action="ob-finish" class="btn-primary w-full !py-3.5 ob-next-active">إنهاء الإعداد</button>';}
document.getElementById('app').innerHTML='<div class="min-h-screen max-w-5xl mx-auto px-4 py-8">'
+'<div class="flex items-center justify-between mb-6 flex-wrap gap-3"><div class="flex items-center gap-2 font-display font-extrabold text-lg">'+logoSVG()+' معالج التهيئة</div>'
+'<div class="flex items-center gap-2">'+(step===1?'<button data-action="ob-skip" class="btn-ghost !py-2 text-xs">تخطي التهيئة</button>':'')+(step>1?'<button data-action="ob-back" class="btn-ghost !py-2 text-xs">رجوع</button>':'')+'</div></div>'
+renderProgressBar(step,8)
+'<div class="grid md:grid-cols-[1fr_280px] gap-5 items-start"><div class="glass rounded-2xl p-6 fadeUp">'
+'<h2 class="font-display font-extrabold text-2xl mb-1">'+title+'</h2>'
+(sub?'<p class="text-xs text-ink-500 mb-5">'+sub+'</p>':'<div class="mb-5"></div>')
+body
+(step<8?'<div class="mt-6 flex items-center justify-between">'+(step>1?'<button data-action="ob-back" class="btn-ghost">رجوع</button>':'<span></span>')+'<button id="ob-next-btn" data-action="ob-next" class="btn-primary '+(nextOk?'ob-next-active':'')+'" '+(nextOk?'':'disabled style="opacity:0.4;cursor:not-allowed"')+'>'+nextLabel+'</button></div>':'')
+'</div><div class="fadeUp">'+renderOnboardingPreview(step)+'</div></div></div>';
if(step===6&&!st.obBuilt)setTimeout(obRunBuild,400);
if(step===7)obMountTest();}
