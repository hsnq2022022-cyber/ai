function widgetMarkup(w,agent,opts){
opts=opts||{};
const name=w.name||((agent&&agent.name)||'مساعدك الذكي');
const r=w.radius||16;
const credit=opts.credit&&(!ws()||ws().plan==='free');
const W=Math.min(w.width||360,420),H=Math.min(w.height||520,640);
const headBg=w.header?w.header:('linear-gradient(135deg,'+(w.primary||'#0ABAB5')+','+(w.secondary||'#0b514f')+')');
const borderSt=w.border?('border:1px solid '+(w.primary||'#0ABAB5')):'border:1px solid rgba(255,255,255,.08)';
const footInner=(w.online===false)
?('<div class="text-xs text-ink-300 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-center">'+esc(w.offline||'نحن غير متصلين حاليًا.')+'</div>')
:('<form class="w-form flex items-center gap-2" style="background:rgba(255,255,255,.04);border-radius:'+Math.max(r-6,8)+'px;padding:6px 8px">'
+'<input class="w-input flex-1 bg-transparent outline-none text-sm px-2 py-1.5 placeholder:text-ink-500 min-w-0" style="color:'+(w.text||'#e8eaed')+'" placeholder="'+esc(w.placeholder||'اكتب رسالتك...')+'" maxlength="500">'
+'<button type="submit" class="w-send p-2 rounded-xl text-white transition hover:opacity-85 flex-none" style="background:'+(w.primary||'#0ABAB5')+'" aria-label="إرسال">'+icon('send','w-4 h-4')+'</button></form>');
return '<div class="w-root flex flex-col '+(w.shadow===false?'':'shadow-soft')+' overflow-hidden msg-in" style="width:'+W+'px;height:'+H+'px;max-width:calc(100vw - 24px);max-height:72vh;border-radius:'+r+'px;'+borderSt+';background:'+(w.bg||'#1a1e24')+'">'
+'<div class="flex items-center gap-3 px-4 py-3" style="background:'+headBg+'">'
+'<div class="relative"><img src="'+(w.avatar||((agent&&agent.avatar)||AVT[0]))+'" class="w-10 h-10 rounded-full object-cover border-2 border-white/30" alt="" onerror="this.style.display=\'none\'">'+(w.online?'<span class="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white pulse-dot"></span>':'')+'</div>'
+'<div class="flex-1 min-w-0"><div class="font-display font-bold text-white text-sm truncate">'+esc(name)+'</div><div class="text-[11px] text-white/80">'+(w.online?'متصل الآن':'غير متصل')+'</div></div>'
+(w.logo?'<img src="'+w.logo+'" class="w-7 h-7 rounded-lg object-cover bg-white/10 p-0.5" alt="">':'')
+'<button type="button" data-action="w-close" class="text-white/80 hover:text-white p-1" aria-label="إغلاق">'+icon('x','w-4 h-4')+'</button></div>'
+'<div class="w-msgs flex-1 overflow-y-auto chat-scroll px-3 py-4 space-y-2" style="background:'+(w.bg||'#1a1e24')+'"></div>'
+'<div class="p-3 border-t border-white/5" style="background:'+(w.bg||'#1a1e24')+'">'
+(credit?'<div class="text-[10px] text-ink-500 text-center pb-1.5">مدعوم بواسطة <b class="text-tiffany-500">إدارة ســوشـــيــــال</b></div>':'')
+footInner+'</div></div>';}

function launcherMarkup(w){const bsz=(w.buttonSize||56)+'px';
return '<button type="button" data-action="w-open" class="relative rounded-full shadow-glow flex items-center justify-center transition hover:scale-105 flex-none" style="background:'+(w.primary||'#0ABAB5')+';width:'+bsz+';height:'+bsz+'" aria-label="فتح المحادثة">'
+'<svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12a8 8 0 0 1-8 8H4l1.5-3.5A8 8 0 1 1 21 12z"/></svg>'
+(w.badge?'<span class="absolute -top-1 -left-1 min-w-[20px] h-5 px-1 rounded-full text-[11px] font-bold text-white flex items-center justify-center" style="background:'+(w.secondary||'#0b514f')+'">1</span>':'')+'</button>'}

function mountWidget(host,w,agent,opts){
if(!host||!w)return null;
opts=opts||{};
const isRight=(opts.position||w.position)==='bottom-right';
host.innerHTML='<div class="w-wrap flex flex-col items-end gap-3" style="position:'+(opts.fixed?'fixed':'absolute')+';'+(isRight?'right:16px':'left:16px')+';bottom:16px;z-index:60">'
+'<div class="w-panel hidden">'+widgetMarkup(w,agent,{credit:opts.credit})+'</div>'+launcherMarkup(w)+'</div>';
const panel=host.querySelector('.w-panel'),msgs=host.querySelector('.w-msgs'),form=host.querySelector('.w-form'),input=host.querySelector('.w-input');
let convo=null,open=false,rl=[];
const agentOf=function(){if(agent)return agent;const s=ws();return s?s.agents.find(function(a){return a.id===w.agentId}):null};
const aiBg=function(){return w.aiBg||w.primary||'#0ABAB5'};
const userBg=function(){return w.userBg||'#22272f'};
function pushMsg(from,text){
const el=document.createElement('div');
if(from==='system'){el.className='msg-in flex';el.innerHTML='<div class="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 w-full text-center">'+esc(text)+'</div>';}
else{el.className='msg-in flex '+(from==='visitor'?'justify-start':'justify-end');
el.innerHTML='<div class="max-w-[85%] text-sm leading-6 px-3.5 py-2.5 rounded-2xl '+(from==='visitor'?'rounded-tr-sm':'rounded-tl-sm')+'" style="background:'+(from==='visitor'?userBg():aiBg())+';color:'+(from==='visitor'?(w.text||'#e8eaed'):'#fff')+'">'+md(text)+'</div>';}
msgs.appendChild(el);msgs.scrollTop=msgs.scrollHeight;}
function typing(on){let t=host.querySelector('.w-typing');
if(on&&!t){t=document.createElement('div');t.className='w-typing typing flex gap-1 px-3 py-2 text-ink-400';t.innerHTML='<span></span><span></span><span></span>';msgs.appendChild(t);msgs.scrollTop=msgs.scrollHeight}
if(!on&&t)t.remove()}
function ensureConvo(){if(convo||!opts.persist||!ws())return;
let vid=lsGet('aown_vid');if(!vid){vid=uid('v_');lsSet('aown_vid',vid)}
let c=ws().contacts.find(function(x){return x.vid===vid});
if(!c){c={id:uid('c_'),vid:vid,name:'زائر '+vid.slice(-4),email:'',phone:'',firstSeen:now(),lastSeen:now(),tags:[],notes:'',class:'استفسار عام',leadScore:0};ws().contacts.unshift(c)}
c.lastSeen=now();
convo={id:uid('cv_'),contactId:c.id,agentId:w.agentId,widgetId:w.id,status:'active',createdAt:now(),updatedAt:now(),messages:[]};
ws().convos.unshift(convo);save()}
function openPanel(){open=true;panel.classList.remove('hidden');
const l=host.querySelector('[data-action="w-open"]');if(l)l.classList.add('hidden');
if(!msgs.children.length)pushMsg('ai',w.welcome||((agentOf()&&agentOf().welcome)||'أهلًا 👋'));
ensureConvo();setTimeout(function(){if(input)input.focus()},50)}
function closePanel(){open=false;panel.classList.add('hidden');
const l=host.querySelector('[data-action="w-open"]');if(l)l.classList.remove('hidden')}
host.addEventListener('click',function(e){const b=e.target.closest('[data-action]');if(!b)return;
if(b.dataset.action==='w-open')openPanel();
if(b.dataset.action==='w-close')closePanel()});
if(form)form.addEventListener('submit',function(e){e.stopPropagation();e.preventDefault();
if(w.online===false){pushMsg('system',w.offline||'نحن غير متصلين حاليًا.');return}
if(convo&&convo.status==='handoff'){pushMsg('system','المحادثة بيد فريق الدعم الآن — الـ AI متوقف حتى يعيد الموظف تفعيله.');return}
const text=input.value.trim();if(!text)return;
if(text.length>500){pushMsg('system','الرسالة طويلة جدًا، اختصرها قليلًا.');return}
rl.push(now());rl=rl.filter(function(x){return now()-x<2e4});
if(rl.length>5){pushMsg('system','تمهل قليلًا 🙂 أرسلت رسائل كثيرة في وقت قصير.');return}
input.value='';pushMsg('visitor',text);
if(convo){convo.messages.push({from:'visitor',text:text,at:now()});convo.updatedAt=now();updateCustomerInsights(convo);save()}
typing(w.typing!==false);
getAIReply(text,agentOf(),w,convo).then(function(res){
typing(false);
if(res.system){pushMsg('system',res.text);if(convo){convo.messages.push({from:'system',text:res.text,at:now()})}}
else{
if(convo){convo.messages.push({from:'ai',text:res.text,at:now()});convo.updatedAt=now();if(ws())ws().usage.ai++;updateCustomerInsights(convo);}
pushMsg('ai',res.text);
if(w.sound)beep();
if(res.handoff)pushMsg('system','تم تحويل المحادثة إلى فريق الدعم ✋');}
save();});});
if(w.autoOpen&&w.online!==false)setTimeout(function(){if(!open)openPanel()},(w.delay||3)*1000);
return {openPanel:openPanel,closePanel:closePanel};}

function pgWidgets(){
var w=ws();
var cards=w.widgets.map(function(x){var a=w.agents.find(function(g){return g.id===x.agentId});
return '<div class="glass rounded-2xl p-6"><div class="flex items-center gap-3 mb-4"><span class="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-none" style="background:'+(x.primary||'#0ABAB5')+'">'+icon('widget','w-5 h-5')+'</span><div class="flex-1 min-w-0"><b class="font-display">'+esc(x.name)+'</b><div class="text-[11px] text-ink-500">Agent: '+esc((a&&a.name)||'—')+'</div></div><button data-action="w-toggle" data-id="'+x.id+'" class="switch'+(x.enabled?' on':'')+'" title="تفعيل/تعطيل"></button></div>'
+'<div class="ltr bg-ink-950 border border-ink-800 rounded-xl p-3 font-mono text-[11px] text-ink-400 overflow-x-auto whitespace-nowrap mb-4">&lt;script src="https://cdn.aown.app/widget.js" data-widget-id="'+x.id+'" data-token="'+x.token+'" data-api="'+esc(apiBase()||'https://YOUR-PROJECT.supabase.co/functions/v1')+'" async&gt;&lt;/script&gt;</div>'
+'<div class="flex flex-wrap gap-2"><button data-action="open-builder" data-id="'+x.id+'" class="btn-ghost !py-2 text-xs">'+icon('edit','w-3.5 h-3.5')+' تخصيص ومعاينة</button><button data-action="embed" data-id="'+x.id+'" class="btn-ghost !py-2 text-xs">'+icon('code','w-3.5 h-3.5')+' كود التضمين</button><button data-action="go" data-to="#/test?wid='+x.id+'" class="btn-ghost !py-2 text-xs">'+icon('globe','w-3.5 h-3.5')+' اختبار حي</button><button data-action="del-widget" data-id="'+x.id+'" class="p-2 text-red-400 hover:bg-red-500/10 rounded-lg mr-auto">'+icon('trash','w-4 h-4')+'</button></div>'
+'<div class="text-[11px] mt-3 '+(x.enabled?'text-emerald-400':'text-red-400')+'">'+(x.enabled?'● نشط — يستقبل الرسائل':'● معطل — لن يظهر للزوار')+(isRemote()&&!x.__unsynced?' • محفوظ في قاعدة البيانات':'')+'</div>'
+(x.__unsynced?'<div class="mt-2 flex items-center justify-between gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 text-[11px] text-amber-300"><span>تعديلات غير متزامنة مع قاعدة البيانات — الويدجت المنشور لن يراها</span><button data-action="sync-widget" data-id="'+x.id+'" class="btn-ghost !py-1 !px-3 text-[11px] flex-none">مزامنة الآن</button></div>':'')+'</div>'}).join('');
return '<div class="flex items-center justify-between mb-5 flex-wrap gap-3"><p class="text-sm text-ink-400">كل Widget يُحفظ مباشرة في جدول <span class="ltr">widgets</span> في Supabase (id + data.token + data.agentId).</p><button data-action="new-widget" class="btn-primary">'+icon('plus','w-4 h-4')+' Widget جديد</button></div><div class="grid md:grid-cols-2 gap-4">'+(cards||'<div class="md:col-span-2 glass rounded-2xl p-14 text-center text-ink-500">لا Widgets بعد.</div>')+'</div>';}

function pgBuilder(h){
var q=new URLSearchParams(h.split('?')[1]||'');
var id=q.get('id');
if(!draft||draft.id!==id){var src=ws().widgets.find(function(x){return x.id===id});draft=src?JSON.parse(JSON.stringify(src)):null}
if(!draft)return '<div class="glass rounded-2xl p-14 text-center text-ink-400">اختر Widget من <a class="text-tiffany-400 underline" href="#/app/widgets">قائمة الـ Widgets</a>.</div>';
var d=draft;
function row(label,inner){return '<div class="mb-4"><div class="text-xs text-ink-400 mb-1.5">'+label+'</div>'+inner+'</div>'}
var avBtns=AV_LOCAL.map(function(a){return '<button type="button" data-action="av" data-v="'+a+'" class="rounded-full overflow-hidden border-2 w-10 h-10 flex-none '+(d.avatar===a?'border-tiffany-500':'border-transparent')+'"><img src="'+a+'" class="w-full h-full object-cover"></button>'}).join('');
return '<div class="grid lg:grid-cols-[1fr_420px] gap-6 items-start"><div class="space-y-5">'
+'<div class="glass rounded-2xl p-6"><h3 class="font-display font-bold mb-4 text-tiffany-300">الألوان</h3><div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">'
+row('Primary','<input type="color" data-b="primary" value="'+(d.primary||'#0ABAB5')+'">')+row('Secondary','<input type="color" data-b="secondary" value="'+(d.secondary||'#0b514f')+'">')+row('رأس الويدجت (اختياري)','<input type="color" data-b="header" value="'+(d.header||d.primary||'#0ABAB5')+'">')+row('خلفية اللوحة','<input type="color" data-b="bg" value="'+(d.bg||'#1a1e24')+'">')+row('رسالة الزائر','<input type="color" data-b="userBg" value="'+(d.userBg||'#22272f')+'">')+row('رسالة الـ AI','<input type="color" data-b="aiBg" value="'+(d.aiBg||d.primary||'#0ABAB5')+'">')+row('لون النص','<input type="color" data-b="text" value="'+(d.text||'#e8eaed')+'">')+'</div></div>'
+'<div class="glass rounded-2xl p-6"><h3 class="font-display font-bold mb-4 text-tiffany-300">الشكل والموقع</h3><div class="grid sm:grid-cols-2 gap-4">'
+row('موضع الويدجت','<select data-b="position" class="inp-s"><option value="bottom-left"'+(d.position==='bottom-left'?' selected':'')+'>أسفل اليسار</option><option value="bottom-right"'+(d.position==='bottom-right'?' selected':'')+'>أسفل اليمين</option></select>')
+row('استدارة الزوايا: <b class="v-radius">'+d.radius+'</b>px','<input type="range" min="0" max="28" data-b="radius" value="'+d.radius+'" class="w-full">')
+row('العرض: <b class="v-width">'+d.width+'</b>px','<input type="range" min="300" max="420" data-b="width" value="'+d.width+'" class="w-full">')
+row('الارتفاع: <b class="v-height">'+d.height+'</b>px','<input type="range" min="420" max="640" data-b="height" value="'+d.height+'" class="w-full">')
+row('حجم زر الفتح: <b class="v-buttonSize">'+(d.buttonSize||56)+'</b>px','<input type="range" min="44" max="68" data-b="buttonSize" value="'+(d.buttonSize||56)+'" class="w-full">')
+row('الظل','<button type="button" data-action="tg" data-b="shadow" class="switch'+(d.shadow!==false?' on':'')+'"></button>')
+row('إطار بلون الـ Primary','<button type="button" data-action="tg" data-b="border" class="switch'+(d.border?' on':'')+'"></button>')+'</div>'
+row('Avatar الويدجت','<div class="flex gap-2 items-center flex-wrap">'+avBtns+'<label class="btn-ghost !py-1.5 text-xs cursor-pointer">رفع صورة<input type="file" accept="image/*" id="w-avatar-file" class="hidden"></label></div>')
+row('شعار الشركة (Branding)','<div class="flex gap-2 items-center">'+(d.logo?'<img src="'+d.logo+'" class="w-10 h-10 rounded-lg object-cover border border-ink-700">':'')+'<label class="btn-ghost !py-1.5 text-xs cursor-pointer">رفع شعار<input type="file" accept="image/*" id="w-logo-file" class="hidden"></label>'+(d.logo?'<button type="button" data-action="rm-logo" class="text-xs text-red-400">إزالة</button>':'')+'</div>')+'</div>'
+'<div class="glass rounded-2xl p-6"><h3 class="font-display font-bold mb-4 text-tiffany-300">العنوان والرسائل</h3>'
+row('اسم المساعد','<input data-b="name" class="inp-s" value="'+esc(d.name||'')+'">')+row('رسالة الترحيب','<input data-b="welcome" class="inp-s" value="'+esc(d.welcome||'')+'" placeholder="اتركها فارغة لاستخدام ترحيب الـ Agent">')+row('Placeholder حقل الكتابة','<input data-b="placeholder" class="inp-s" value="'+esc(d.placeholder||'')+'">')+row('رسالة عدم الاتصال','<input data-b="offline" class="inp-s" value="'+esc(d.offline||'')+'">')
+'<div class="grid sm:grid-cols-2 gap-4">'+row('حالة «متصل الآن»','<button type="button" data-action="tg" data-b="online" class="switch'+(d.online?' on':'')+'"></button>')+row('مؤشر الكتابة Typing','<button type="button" data-action="tg" data-b="typing" class="switch'+(d.typing?' on':'')+'"></button>')+'</div></div>'
+'<div class="glass rounded-2xl p-6"><h3 class="font-display font-bold mb-4 text-tiffany-300">السلوك</h3><div class="grid sm:grid-cols-2 gap-4">'
+row('فتح تلقائي','<button type="button" data-action="tg" data-b="autoOpen" class="switch'+(d.autoOpen?' on':'')+'"></button>')+row('التأخير قبل الفتح (ثوانٍ)','<input type="number" min="1" max="30" data-b="delay" class="inp-s" value="'+(d.delay||3)+'">')+row('شارة إشعارات','<button type="button" data-action="tg" data-b="badge" class="switch'+(d.badge?' on':'')+'"></button>')+row('صوت عند الرد','<button type="button" data-action="tg" data-b="sound" class="switch'+(d.sound?' on':'')+'"></button>')+row('سلوك الجوال','<select data-b="mobile" class="inp-s"><option value="panel"'+(d.mobile==='panel'?' selected':'')+'>لوحة عائمة</option><option value="full"'+(d.mobile==='full'?' selected':'')+'>ملء الشاشة</option></select>')+'</div></div>'
+'<div class="flex gap-2 flex-wrap"><button data-action="save-widget" class="btn-primary">'+icon('check','w-4 h-4')+' حفظ التغييرات</button><button data-action="embed" data-id="'+d.id+'" class="btn-ghost">'+icon('code','w-4 h-4')+' كود التضمين</button><button data-action="go" data-to="#/test?wid='+d.id+'" class="btn-ghost">'+icon('globe','w-4 h-4')+' اختبار في موقع</button></div></div>'
+'<div class="lg:sticky top-24"><div class="text-xs text-ink-400 mb-2 flex items-center gap-2">'+icon('spark','w-4 h-4 text-tiffany-400')+' معاينة حية — كل تغيير يظهر فورًا بدون حفظ</div><div class="glass rounded-2xl p-4 bg-ink-900 relative h-[640px] overflow-hidden grid-bg"><div id="w-preview" class="absolute bottom-4" style="'+(d.position==='bottom-right'?'right:16px':'left:16px')+'"></div></div></div></div>';}

function renderPreview(){
var host=document.getElementById('w-preview');
if(!host||!draft)return;
var agent=ws().agents.find(function(a){return a.id===draft.agentId});
var dd=Object.assign({},draft,{width:Math.min(draft.width,356),height:Math.min(draft.height,560)});
host.innerHTML=widgetMarkup(dd,agent,{credit:false});
var msgs=host.querySelector('.w-msgs');
if(msgs)msgs.innerHTML='<div class="msg-in flex justify-end"><div class="max-w-[85%] text-sm leading-6 px-3.5 py-2.5 text-white rounded-2xl rounded-tl-sm" style="background:'+(draft.aiBg||draft.primary||'#0ABAB5')+'">'+md(draft.welcome||((agent&&agent.welcome)||'أهلًا 👋'))+'</div></div>'+(draft.typing!==false&&draft.online!==false?'<div class="typing flex gap-1 px-3 py-2 text-ink-500"><span></span><span></span><span></span></div>':'');
var cb=host.querySelector('[data-action="w-close"]');
if(cb)cb.addEventListener('click',function(e){e.stopPropagation();toast('هذه معاينة — زر الإغلاق يعمل في الويدجت المنشور','ok')});
['radius','width','height','buttonSize'].forEach(function(k){var el=host.parentElement.parentElement.querySelector('.v-'+k);if(el)el.textContent=draft[k]||''});}

function widgetModal(){
modal('<h3 class="font-display font-bold text-lg mb-4">Widget جديد</h3><form id="f-widget" class="space-y-3"><label class="lbl2">اسم الويدجت<input name="name" required class="inp-s" placeholder="مثال: ويدجت المتجر"></label><label class="lbl2">اربطه بـ Agent محدد (معرفة معزولة)<select name="agentId" class="inp-s">'+ws().agents.map(function(a){return '<option value="'+a.id+'">'+esc(a.name)+'</option>'}).join('')+'</select></label><button class="btn-primary w-full">إنشاء وحفظ في قاعدة البيانات</button></form>');}

function embedModal(id){
var w=ws().widgets.find(function(x){return x.id===id});if(!w)return;
var api=apiBase()||'https://YOUR-PROJECT.supabase.co/functions/v1';
modal('<h3 class="font-display font-bold text-lg mb-2">كود التضمين</h3><p class="text-xs text-ink-400 mb-4">ألصق هذا السطر قبل وسم الإغلاق &lt;/body&gt; في موقعك. استبدل مصدر السكربت برابط استضافة widget.js الفعلي لديك.</p><div class="ltr bg-ink-950 border border-ink-800 rounded-xl p-4 font-mono text-xs text-tiffany-300 overflow-x-auto whitespace-pre mb-4">&lt;script src="https://cdn.aown.app/widget.js"\ndata-widget-id="'+w.id+'"\ndata-token="'+w.token+'"\ndata-api="'+esc(api)+'" async&gt;&lt;/script&gt;</div><div class="flex flex-wrap gap-2 mb-4"><button data-action="copy-embed" data-id="'+w.id+'" class="btn-primary !py-2 text-xs">'+icon('copy','w-3.5 h-3.5')+' نسخ الكود</button><button data-action="regen" data-id="'+w.id+'" class="btn-ghost !py-2 text-xs">'+icon('bolt','w-3.5 h-3.5')+' إعادة توليد الرمز</button><button data-action="w-toggle" data-id="'+w.id+'" class="btn-ghost !py-2 text-xs '+(w.enabled?'!text-red-300':'')+'">'+(w.enabled?'تعطيل الويدجت':'تفعيل الويدجت')+'</button></div><div class="text-[11px] mb-3 '+(w.enabled?'text-emerald-400':'text-red-400')+'">'+(w.enabled?'● الويدجت نشط':'● الويدجت معطل — لن يظهر للزوار')+'</div><button data-action="modal-close" class="btn-ghost w-full">إغلاق</button>');}
