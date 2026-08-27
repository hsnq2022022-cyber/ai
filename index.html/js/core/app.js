document.addEventListener('click',function(e){
var sbBtn=e.target.closest('[data-action="sb"]');
if(sbBtn){var s=document.getElementById('sidebar');if(s){s.classList.toggle('max-lg:-translate-x-full')}
var o=document.getElementById('sb-overlay');if(o)o.classList.toggle('hidden');return}
/* closest يلتقط الزر حتى لو كان النقر على أيقونة SVG أو نص داخل الزر */
var t=e.target&&e.target.closest?e.target.closest('[data-action]'):null;if(!t)return;
var a=t.dataset.action,id=t.dataset.id;
function cur(idv){return ws().widgets.find(function(x){return x.id===idv})}
function kbDoc(idv){return ws().kb.find(function(x){return x.id===idv})}
try{
if(a==='go')go(t.dataset.to);
else if(a==='scroll'){e.preventDefault();var el=document.querySelector(t.dataset.to);if(el)el.scrollIntoView({behavior:'smooth'})}
else if(a==='demo-enter'){
if(isRemote()){toast('أنت متصل بالخادم — سجّل الدخول أو أنشئ حسابًا حقيقيًا، أو افصل الاتصال لاستخدام وضع الضيف','err');return}
db.demo=true;if(!db.ws)db.ws=starterKit();persist();
toast('دخلت كضيف بدون حساب — جلستك وبياناتك تبقى محفوظة','ok');go('#/onboarding')}
else if(a==='logout'){
if(isRemote()){try{sbClient().auth.signOut()}catch(e3){}}
db.session=null;db.demo=false;db.ws=null;persist();
remoteUser=null;selConvo=null;draft=null;toast('تم تسجيل الخروج');go('#/')}
else if(a==='local-mode'){useLocalMode()}
else if(a==='sync-now'){
if(isRemote()&&db.ws&&db.ws.__wid){remoteBroken=false;save();toast('جارٍ إعادة المزامنة مع الخادم...','ok')}
else toast('لا يوجد اتصال خادم مهيأ — اربطه من صفحة الخلفية','err')}
else if(a==='soon-channel'){toast('قناة '+id+' ستتوفر في تحديث قادم — قناة الويدجت مفعّلة لك الآن','ok')}
else if(a==='new-agent'){
var lim=PLANS[ws().plan].agents;
if(ws().agents.length>=lim){toast('بلغت الحد الأقصى ('+lim+' Agents) في خطتك '+PLANS[ws().plan].name+' — قم بالترقية لزيادة العدد','err');go('#/app/billing');return}
agentModal()}
else if(a==='edit-agent')agentModal(id);
else if(a==='del-agent'){if(confirm('حذف هذا الـ Agent؟')){ws().agents=ws().agents.filter(function(x){return x.id!==id});save();route()}}
else if(a==='new-widget'){if(!ws().agents.length){toast('أنشئ Agent أولًا','err');go('#/app/agents');return}widgetModal()}
else if(a==='open-builder'){draft=null;go('#/app/builder?id='+id)}
else if(a==='save-widget'){
var wS=cur(draft.id);
if(wS){Object.assign(wS,draft);persist();
if(isRemote()){
var doneB=busy(t,'جارٍ الحفظ في قاعدة البيانات...');
syncWidgetToServer(wS).then(function(){if(doneB)doneB();toast('تم الحفظ في قاعدة البيانات ✔ — سينعكس على الويدجت المنشور فور تحميل الصفحة التالية','ok');save();})
.catch(function(err){wS.__unsynced=true;if(doneB)doneB();toast('فشل الحفظ في قاعدة البيانات: '+err.message,'err');save();route();});
}else{save();toast('تم حفظ إعدادات الويدجت ✔','ok')}}}
else if(a==='embed')embedModal(id);
else if(a==='copy-embed'){var wC=cur(id);if(wC){var apiC=apiBase()||'https://YOUR-PROJECT.supabase.co/functions/v1';copyText('<script src="https://cdn.aown.app/widget.js" data-widget-id="'+wC.id+'" data-token="'+wC.token+'" data-api="'+apiC+'" async><'+'/script>')}}
else if(a==='regen'){
var wR=cur(id);
if(wR){wR.token=uid('tk_');persist();
if(isRemote()){
var doneR=busy(t,'جارٍ التحديث في قاعدة البيانات...');
syncWidgetToServer(wR).then(function(){if(doneR)doneR();toast('تم توليد رمز جديد وحفظه في قاعدة البيانات ✔','ok');embedModal(id);save()})
.catch(function(err){wR.__unsynced=true;if(doneR)doneR();toast('فشل حفظ الرمز الجديد في قاعدة البيانات: '+err.message,'err');embedModal(id);save()});
}else{save();toast('تم توليد رمز جديد — الرمز القديم لم يعد صالحًا','ok');embedModal(id)}}}
else if(a==='w-toggle'){
var wT=cur(id);
if(wT){wT.enabled=!wT.enabled;persist();
var afterT=function(){if(document.getElementById('modal-root').children.length)embedModal(id);else route()};
if(isRemote()){
syncWidgetToServer(wT).then(function(){toast(wT.enabled?'تم تفعيل الويدجت وحفظه في قاعدة البيانات ✔':'تم تعطيل الويدجت وحفظه في قاعدة البيانات ✔','ok');save();afterT()})
.catch(function(err){wT.__unsynced=true;toast('حدث التغيير محليًا وفشلت المزامنة: '+err.message,'err');save();afterT()});
}else{save();toast(wT.enabled?'تم تفعيل الويدجت':'تم تعطيل الويدجت','ok');afterT()}}}
else if(a==='modal-close')closeModal();
else if(a==='kb-add'){kbTypeModal()}
else if(a==='kb-open'){
var kbid=(t.dataset&&t.dataset.id)?t.dataset.id:(t.getAttribute?t.getAttribute('data-id'):null);
kbTypeModalOpen(kbid);}
else if(a==='kb-diag-log'){
var docsL=ws().kb.map(function(k){return {name:k.name,type:k.type,status:k.status,agentId:k.agentId||'(مشترك)',chunks:k.chunkCount||0,lastSync:k.lastSync?new Date(k.lastSync).toISOString():'',error:k.error||''}});
console.group('KB Diagnostics');console.table(docsL);console.log('إجمالي المستندات:',docsL.length,'| إجمالي المقاطع:',docsL.reduce(function(a,k){return a+k.chunks},0));console.groupEnd();
toast('تمت طباعة التشخيص في console','ok')}
else if(a==='kb-reprocess'){
var docR=kbDoc(id);if(!docR)return;
if(docR.type==='url')processUrl(docR.name,docR);
else if(docR.type==='text')reIngestDoc(docR);
else if(docR.type==='file')reProcessFile(docR);}
else if(a==='kb-del'){
if(!confirm('حذف هذا المصدر ومقاطعه؟ لا يمكن التراجع.'))return;
var docD=kbDoc(id);if(!docD)return;
ws().kb=ws().kb.filter(function(x){return x.id!==id});persist();
if(isRemote()&&cfg&&apiBase()){
fetch(apiBase()+'/kb-ingest',{method:'POST',headers:{'Content-Type':'application/json','api-key':cfg.key},body:JSON.stringify({doc_id:docD.id,delete:true})})
.then(function(r){return r.json().catch(function(){return{}})}).then(function(j){toast(j&&j.ok?'تم حذف المصدر ومقاطعه من قاعدة البيانات ✔':'حُذف المصدر محليًا — تحقّق من حذف المقاطع يدويًا (راجع تبويب التشخيص)',j&&j.ok?'ok':'err');save();route()})
.catch(function(err){console.error(err);toast('حُذف محليًا لكن فشل الحذف من الخادم: '+arErr(err.message),'err');save();route()});
}else{save();route()}
return}
else if(a==='kb-sync'){
var docS=kbDoc(id);
if(docS&&docS.type==='url'){toast('جارٍ إعادة مزامنة الموقع...');processUrl(docS.name,docS)}
else toast('المزامنة متاحة لمصادر الروابط فقط','err')}
else if(a==='kb-edit'){var docE=kbDoc(id);if(docE)modal('<h3 class="font-display font-bold mb-3">تعديل المصدر اليدوي</h3><form id="f-kb-edit" class="space-y-3"><input type="hidden" name="id" value="'+docE.id+'"><label class="lbl2">العنوان (اختياري)<input name="title" class="inp-s" value="'+esc(docE.name)+'"></label><label class="lbl2">المحتوى (مصدر معرفة فقط)<textarea name="content" rows="8" class="inp-s">'+esc(docE.content||'')+'</textarea></label><button class="btn-primary w-full">حفظ وإعادة المعالجة</button></form>')}
else if(a==='ob-next'){var st=ws().settings;var curStep=st.onboardingStep||st.obStep||1;
if(curStep===1&&!String(st.name||'').trim()){toast('اكتب اسم النشاط أولًا','err');return}
if(curStep===2&&!(st.goals&&st.goals.length)){toast('اختر هدفًا واحدًا على الأقل','err');return}
if(curStep===6&&!st.obBuilt){toast('انتظر اكتمال البناء','err');return}
st.onboardingStep=curStep+1;st.obStep=curStep+1;save();route()}
else if(a==='ob-back'){var st2=ws().settings;var cs=st2.onboardingStep||st2.obStep||1;if(cs>1){st2.onboardingStep=cs-1;st2.obStep=cs-1;save();route()}}
else if(a==='ob-goal'){var st3=ws().settings;var g=t.dataset.id;st3.goals=st3.goals||[];var gi=st3.goals.indexOf(g);if(gi>-1)st3.goals.splice(gi,1);else st3.goals.push(g);save();route()}
else if(a==='ob-skip'){var st4=ws().settings;st4.onboarded=true;save();toast('تم تخطي التهيئة','ok');go('#/app')}
else if(a==='ob-finish'){var st5=ws().settings;st5.onboarded=true;save();toast('🎉 تم إنهاء الإعداد — أهلًا بك في لوحة إدارة ســوشـــيــــال','ok');go('#/app')}
else if(a==='ob-goto'){var st6=ws().settings;var ns=parseInt(t.dataset.id||'1',10);st6.onboardingStep=ns;st6.obStep=ns;save();route()}
else if(a==='ob-build'){obRunBuild()}
else if(a==='ob-test-page'){var st7=ws().settings;go('#/test?wid='+(st7.obWidgetId||st7.onboardingWidgetId||''))}
else if(a==='ob-builder'){var st8=ws().settings;var owid=st8.obWidgetId||st8.onboardingWidgetId;if(owid){draft=null;go('#/app/builder?id='+owid)}else toast('لم يتم إنشاء الويدجت بعد','err')}
else if(a==='handoff'){var c=ws().convos.find(function(x){return x.id===id});if(c){c.status='handoff';c.messages.push({from:'system',text:'تم تحويل المحادثة يدويًا لفريق الدعم.',at:now()});var cust0=ws().contacts.find(function(x){return x.id===c.contactId});if(cust0)cust0.class='يحتاج متابعة';save();route()}}
else if(a==='ai-back'){var c2=ws().convos.find(function(x){return x.id===id});if(c2){c2.status='active';c2.messages.push({from:'system',text:'أعاد الموظف تفعيل المساعد الذكي.',at:now()});save();route()}}
else if(a==='close-convo'){var c3=ws().convos.find(function(x){return x.id===id});if(c3){c3.status='closed';save();route()}}
else if(a==='reopen-convo'){var c4=ws().convos.find(function(x){return x.id===id});if(c4){c4.status='active';save();route()}}
else if(a==='del-convo'){if(confirm('حذف المحادثة؟')){ws().convos=ws().convos.filter(function(x){return x.id!==id});selConvo=null;save();route()}}
else if(a==='del-contact'){if(confirm('حذف العميل؟')){ws().contacts=ws().contacts.filter(function(x){return x.id!==id});save();route()}}
else if(a==='add-tag'){var c5=ws().contacts.find(function(x){return x.id===id});var v=prompt('اسم الوسم:');if(v&&c5){c5.tags=[...new Set((c5.tags||[]).concat([v]))];save();route()}}
else if(a==='note'){var c6=ws().contacts.find(function(x){return x.id===id});if(c6)modal('<h3 class="font-display font-bold mb-3">ملاحظات '+esc(c6.name)+'</h3><textarea id="note-ta" rows="5" class="inp-s w-full">'+esc(c6.notes||'')+'</textarea><button data-action="note-save" data-id="'+c6.id+'" class="btn-primary w-full mt-3">حفظ</button>')}
else if(a==='note-save'){var c7=ws().contacts.find(function(x){return x.id===id});if(c7){c7.notes=document.getElementById('note-ta').value;save();closeModal();toast('تم حفظ الملاحظات','ok')}}
else if(a==='del-member'){var tm=ws().settings.team;if(tm){tm.splice(parseInt(id,10),1);save();toast('تمت إزالة العضو','ok');route()}}
else if(a==='av'){if(draft){draft.avatar=t.dataset.v;route()}}
else if(a==='rm-logo'){if(draft){draft.logo='';route()}}
else if(a==='tg'){if(draft){var k=t.dataset.b;draft[k]=!draft[k];route()}}
else if(a==='save-settings'){ws().settings.name=document.getElementById('s-name').value;ws().settings.type=document.getElementById('s-type').value;ws().settings.lang=document.getElementById('s-lang').value;ws().settings.tz=document.getElementById('s-tz').value;save();toast('تم حفظ الإعدادات','ok')}
else if(a==='reset-ws'){if(confirm('سيتم حذف كل البيانات وإعادة بيانات البداية. متابعة؟')){var wid0=db.ws&&db.ws.__wid;db.ws=starterKit();if(wid0)db.ws.__wid=wid0;save();selConvo=null;draft=null;toast('تمت إعادة التعيين','ok');route()}}
else if(a==='del-account'){
if(isRemote()){toast('حذف الحساب يتم من إعدادات المصادقة في Supabase','err')}
else if(confirm('حذف الحساب نهائيًا من هذا الجهاز؟')){db.users=db.users.filter(function(u){return u.id!==db.session});db.session=null;db.ws=null;persist();go('#/')}}
else if(a==='choose-plan'){ws().plan=id;ws().invoices.unshift({id:uid('inv_'),plan:PLANS[id].name,amount:PLANS[id].price,date:now(),status:'مدفوعة'});save();toast('تم تغيير خطتك إلى '+PLANS[id].name+' 🎉 (الدفع الحقيقي في المرحلة التالية)','ok');route()}
else if(a==='inv')toast('تم تجهيز الفاتورة (نسخة عرض)','ok');
else if(a==='sb-disconnect'){cfg=null;sb=null;remoteBroken=false;try{localStorage.removeItem('aown_cfg')}catch(e2){}toast('تم فصل الاتصال — العودة للوضع المحلي','ok');route()}
else if(a==='eng-tab'){engTab=id;route()}
else if(a==='copy-eng'){if(engTab==='steps'){var tmp=document.createElement('div');tmp.innerHTML=ENG_STEPS;copyText(tmp.textContent.trim())}else copyText(engSource(engTab))}
else if(a==='sync-widget'){
var wY=cur(id);
if(wY){var doneY=busy(t,'جارٍ المزامنة...');
syncWidgetToServer(wY).then(function(){if(doneY)doneY();toast('تمت المزامنة مع قاعدة البيانات ✔','ok');save();route()})
.catch(function(err){if(doneY)doneY();toast('فشلت المزامنة: '+err.message,'err');route()});}}
else if(a==='del-widget'){
if(confirm('حذف هذا الويدجت؟')){
ws().widgets=ws().widgets.filter(function(x){return x.id!==id});persist();
if(isRemote()){
sbDeleteRow('widgets',id).then(function(){toast('تم حذف الويدجت من قاعدة البيانات ✔','ok');save();route()})
.catch(function(err){toast('حُذف محليًا لكن فشل الحذف من قاعدة البيانات: '+err.message,'err');save();route()});
}else{save();route()}}}
else if(a==='w-open'||a==='w-close'){/* تُعالج داخل mountWidget */}
else {console.warn('إجراء غير معروف:',a)}
}catch(err){console.error(err);toast('تعذر تنفيذ العملية','err')}});

document.addEventListener('input',function(e){
var el=e.target;if(!el)return;
var ob=el.dataset?el.dataset.ob:null;
if(ob&&ws()&&ws().settings){
ws().settings[ob]=el.value;persist();
if(ob==='name'){
var nb=document.getElementById('ob-next-btn');
if(nb){var ok=String(ws().settings.name||'').trim().length>0;nb.disabled=!ok;nb.style.opacity=ok?'1':'0.4';if(ok)nb.classList.add('ob-next-active');else nb.classList.remove('ob-next-active');}
var h2=document.querySelector('.fadeUp h2');if(h2)h2.innerHTML='أهلًا '+(esc(String(ws().settings.name||'').trim())||'بك')+' في إدارة ســوشـــيــــال، لنجهّز وكيلك';}
return;}
var b=el.dataset?el.dataset.b:null;
if(!b||!draft)return;
draft[b]=el.type==='range'?parseFloat(el.value):el.value;
renderPreview();});

document.addEventListener('change',function(e){
var tgt=e.target;if(!tgt)return;
if(tgt.id==='w-avatar-file'||tgt.id==='w-logo-file'){var f=tgt.files[0];if(!f||!draft)return;var r=new FileReader();
r.onload=function(){if(tgt.id==='w-avatar-file')draft.avatar=r.result;else draft.logo=r.result;route()};r.readAsDataURL(f);return}
var b=tgt.dataset?tgt.dataset.b:null;
if(!b||!draft)return;
draft[b]=tgt.type==='checkbox'?tgt.checked:tgt.value;
route();});

document.addEventListener('submit',async function(e){
var f=e.target;if(!f||!f.id)return;
if(f.classList&&f.classList.contains('w-form'))return;
e.preventDefault();
var fd=new FormData(f);
try{
if(f.id==='f-setup'){
var u=String(fd.get('url')).trim().replace(/\/+$/,''),k=String(fd.get('key')).trim();
if(!/^https:\/\/[a-z0-9.-]+\.supabase\.co$/i.test(u)){toast('رابط Supabase غير صالح','err');return}
cfg={url:u,key:k};sb=null;remoteBroken=false;
lsSet('aown_cfg',JSON.stringify(cfg));
var c=sbClient();
if(!c){toast('تعذر إنشاء اتصال Supabase — تأكد من اتصال الإنترنت وتحميل مكتبة Supabase','err');return}
toast('جارٍ فحص الاتصال...');
c.from('workspaces').select('id',{count:'exact',head:true}).then(function(res){
var st=document.getElementById('sb-status');
if(res.error){
var msg=res.error.message||'';
if(isNetErr(msg)){toast('فشل الاتصال بالشبكة — تحقق من الإنترنت أو تابع بالوضع المحلي','err')}
else if(/policy|permission|42501/i.test(msg)){toast('متصل ✔ لكن سياسات RLS غير مفعلة — شغّل مخطط SQL كاملًا','err')}
else if(/does not exist|PGRST|relation/i.test(msg)){toast('متصل ✔ لكن الجداول غير موجودة — شغّل مخطط SQL أولًا','err')}
else{toast('فشل الاتصال: '+msg,'err')}
if(st)st.innerHTML='<div class="glass rounded-2xl p-5 text-sm text-red-300 border-red-500/30">⚠️ '+esc(msg)+'</div>';
}else{
toast('الاتصال ناجح وقاعدة البيانات جاهزة ✔','ok');
if(st)st.innerHTML='<div class="glass rounded-2xl p-5 text-sm text-emerald-300 border-emerald-500/30">✅ Supabase جاهز — أنشئ حسابًا جديدًا وسيفتح معالج التهيئة تلقائيًا.</div>';
route();}}).catch(function(err){toast('فحص الاتصال فشل: '+arErr(err&&err.message),'err')});
return}
if(f.id==='f-login'){
var em=String(fd.get('email')).trim(),pw=fd.get('pass');
if(isRemote()){
var b=document.getElementById('b-login');if(b){b.disabled=true;b.textContent='جارٍ الدخول...'}
sbClient().auth.signInWithPassword({email:em,password:pw}).then(async function(res){
if(res.error){
if(isNetErr(res.error.message)){authNetFail(res.error.message)}
else toast(res.error.message==='Invalid login credentials'?'بيانات الدخول غير صحيحة':res.error.message,'err');
if(b){b.disabled=false;b.textContent='تسجيل الدخول'}return}
remoteUser=res.data.user;db.demo=false;
toast('جارٍ تحميل مساحة العمل...');
var ok=false;try{ok=await loadRemote()}catch(eL){console.error(eL)}
if(!ok){if(!db.ws){db.ws=starterKit();db.ws.__offline=true;persist()}remoteBroken=true;toast('تعذر تحميل بيانات الخادم — تعمل الآن بالوضع المحلي مؤقتًا','err')}
toast('مرحبًا بعودتك 👋 — جلستك محفوظة','ok');go((db.ws&&db.ws.settings.onboarded===true)?'#/app':'#/onboarding')}).catch(function(err){
if(b){b.disabled=false;b.textContent='تسجيل الدخول'}
if(isNetErr(err&&err.message)){authNetFail(err.message)}else toast('خطأ غير متوقع أثناء الدخول','err')});
return}
/* وضع محلي — بدون خادم */
var u=db.users.find(function(x){return x.email===em&&x.pw===hashPw(pw)});
if(!u){toast('بيانات الدخول غير صحيحة','err');return}
db.session=u.id;db.demo=false;persist();
if(!db.ws)db.ws=starterKit();persist();
toast('مرحبًا بعودتك 👋 — جلستك محفوظة','ok');go((db.ws&&db.ws.settings.onboarded===true)?'#/app':'#/onboarding')}
else if(f.id==='f-signup'){
var em2=String(fd.get('email')).trim(),pw2=fd.get('pass');
if(isRemote()){
var b2=document.getElementById('b-signup');if(b2){b2.disabled=true;b2.textContent='جارٍ إنشاء الحساب...'}
sbClient().auth.signUp({email:em2,password:pw2,options:{data:{name:fd.get('name'),company:fd.get('company')}}}).then(async function(res){
if(res.error){
if(isNetErr(res.error.message)){authNetFail(res.error.message)}
else toast(res.error.message,'err');
if(b2){b2.disabled=false;b2.textContent='إنشاء الحساب والبدء'}return}
if(!res.data.session){toast('تم إرسال رابط تفعيل إلى بريدك — فعّل الحساب ثم سجّل الدخول','ok');if(b2){b2.disabled=false;b2.textContent='إنشاء الحساب والبدء'}go('#/login');return}
remoteUser=res.data.user;db.demo=false;
toast('جارٍ إنشاء مساحة العمل في قاعدة البيانات...');
var ok=false;try{ok=await loadRemote()}catch(eL2){console.error(eL2)}
if(!ok){if(!db.ws){db.ws=starterKit();db.ws.__offline=true;persist()}remoteBroken=true}
if(db.ws){var s=ws();s.settings.name=String(fd.get('company')).trim()||s.settings.name;s.settings.type=fd.get('type');save()}
toast('تم إنشاء حسابك في إدارة ســوشـــيــــال 🎉 لنجهّز وكيلك','ok');go('#/onboarding')}).catch(function(err){
if(b2){b2.disabled=false;b2.textContent='إنشاء الحساب والبدء'}
if(isNetErr(err&&err.message)){authNetFail(err.message)}else toast('خطأ غير متوقع أثناء إنشاء الحساب','err')});
return}
/* وضع محلي — بدون خادم */
if(db.users.some(function(x){return x.email===em2})){toast('البريد مسجل مسبقًا','err');return}
var nu={id:uid('u_'),name:String(fd.get('name')).trim(),email:em2,pw:hashPw(pw2),createdAt:now()};
db.users.push(nu);db.session=nu.id;db.demo=false;db.ws=starterKit();db.ws.settings.name=String(fd.get('company')).trim();db.ws.settings.type=fd.get('type');persist();
toast('تم إنشاء مساحة عملك 🎉 لنجهّز وكيلك','ok');go('#/onboarding')}
else if(f.id==='f-forgot'){
var em3=String(fd.get('email')).trim();
if(isRemote()){
sbClient().auth.resetPasswordForEmail(em3,{redirectTo:location.origin+'#/login'}).then(function(res){
if(res.error){
if(isNetErr(res.error.message)){authNetFail(res.error.message)}
else toast(res.error.message,'err')}
else toast('إن وجد الحساب، وصلك رابط الاستعادة على بريدك. افتح الرابط لتعيين كلمة مرور جديدة.','ok')}).catch(function(err){authNetFail(err&&err.message)});
return}
toast('استعادة كلمة المرور تتطلب خادمًا — في الوضع المحلي يمكنك إنشاء حساب جديد','err')}
else if(f.id==='f-newpass'){
var np=fd.get('pass');
if(String(np).length<6){toast('كلمة المرور يجب أن تكون 6 أحرف على الأقل','err');return}
var btn=f.querySelector('button');if(btn){btn.disabled=true;btn.textContent='جارٍ الحفظ...'}
sbClient().auth.updateUser({password:np}).then(function(res){
if(res.error){toast(res.error.message,'err');if(btn){btn.disabled=false;btn.textContent='حفظ كلمة المرور الجديدة'}return}
closeModal();toast('تم تحديث كلمة المرور بنجاح ✔','ok');go('#/login')});
return}
else if(f.id==='f-agent'){
var idv=fd.get('id');var data=Object.fromEntries(fd);
var agentObj;
if(idv){agentObj=ws().agents.find(function(x){return x.id===idv});if(agentObj)Object.assign(agentObj,data)}
else{agentObj=Object.assign({},data,{id:uid('ag_'),createdAt:now()});ws().agents.push(agentObj)}
persist();
if(isRemote()&&agentObj){
var bA=f.querySelector('button');var doneA=busy(bA,'جارٍ الحفظ في قاعدة البيانات...');
try{await sbUpsert('agents',agentObj);if(doneA)doneA();toast('تم حفظ الـ Agent في قاعدة البيانات ✔','ok');save();closeModal();route();}
catch(err){if(doneA)doneA();toast('فشل حفظ الـ Agent في قاعدة البيانات: '+err.message,'err');save();closeModal();route();}
}else{save();closeModal();toast('تم حفظ الـ Agent ✔','ok');route()}
return}
else if(f.id==='f-widget'){
var nw=defWidget(fd.get('agentId'),String(fd.get('name')).trim());
ws().widgets.push(nw);persist();
var bW=f.querySelector('button');
if(isRemote()){
var doneW=busy(bW,'جارٍ الحفظ في قاعدة البيانات...');
syncWidgetToServer(nw).then(function(){if(doneW)doneW();toast('تم إنشاء الويدجت في قاعدة البيانات ✔','ok');save();closeModal();draft=null;go('#/app/builder?id='+nw.id);})
.catch(function(err){nw.__unsynced=true;if(doneW)doneW();toast('أُنشئ محليًا لكن فشلت المزامنة: '+err.message,'err');save();closeModal();draft=null;go('#/app/builder?id='+nw.id);});
}else{save();closeModal();draft=null;go('#/app/builder?id='+nw.id)}
return}
else if(f.id==='f-kbm-file'){
var fi=document.getElementById('kb-filepick');var file=fi&&fi.files[0];
if(!file){toast('اختر ملفًا أولًا — اضغط على منطقة الرفع أو اسحب الملف','err');return}
var agF=document.getElementById('kbm-file-agent');
closeModal();
processFile(file,agF?agF.value:'');
return}
else if(f.id==='f-kbm-text'){
var contentT=String(fd.get('content')||'').trim();
if(!contentT){toast('اكتب نص المعرفة أولًا','err');return}
var titleT=String(fd.get('title')||'').trim();
var agT=document.getElementById('kbm-text-agent');
closeModal();
await processTextDoc(titleT,contentT,agT?agT.value:'');
return}
else if(f.id==='f-kbm-url'){
var urlU=String(fd.get('url')||'').trim();
if(!/^https?:\/\//i.test(urlU)){toast('الرابط يجب أن يبدأ بـ http أو https','err');return}
var agU=document.getElementById('kbm-url-agent');
var dU={id:uid('kb_'),name:urlU,type:'url',agentId:agU?agU.value:'',content:'جارٍ الزحف واستخراج المعلومات...',status:'processing',chunks:[],chunkCount:0,createdAt:now(),error:''};
ws().kb.unshift(dU);save();closeModal();refreshKbUI();
processUrl(urlU,dU);
return}
else if(f.id==='f-urlfallback'){
var docF=ws().kb.find(function(x){return x.id===fd.get('docId')});
var cntF=String(fd.get('content')||'').trim();
if(!docF){closeModal();return}
if(!cntF){toast('الصق محتوى الموقع أولًا','err');return}
docF.type='text';docF.content=cntF;docF.error='';
closeModal();
reIngestDoc(docF);
return}
else if(f.id==='f-kb-edit'){
var docU=ws().kb.find(function(x){return x.id===fd.get('id')});
if(docU){
var newContent=String(fd.get('content')||'').trim();
if(!newContent){toast('المحتوى لا يمكن أن يكون فارغًا','err');return}
docU.name=String(fd.get('title')||'').trim()||newContent.slice(0,60);
docU.content=newContent;
closeModal();
reIngestDoc(docU);}
return}
else if(f.id==='f-dash-msg'){var cd=ws().convos.find(function(x){return x.id===selConvo});if(!cd)return;
var txt=String(fd.get('m')||'').trim();if(!txt)return;
cd.messages.push({from:'team',text:txt,at:now()});cd.updatedAt=now();save();route()}
else if(f.id==='f-team'){ws().settings.team.push({email:String(fd.get('email')).trim(),role:'عضو'});save();toast('تمت إضافة العضو','ok');route()}
}catch(err){console.error(err);toast('تعذر تنفيذ العملية','err')}});

window.addEventListener('error',function(ev){console.error('Social runtime error:',ev.message)});

async function boot(){
try{
loadDB();
if(!isRemote()&&db.demo&&!db.ws){db.ws=starterKit();persist()}
const c=sbClient();
if(c){
let s0=null;
try{s0=await c.auth.getSession()}catch(eS){console.warn('session fetch failed:',eS)}
remoteUser=(s0&&s0.data&&s0.data.session)?s0.data.session.user:null;
if(remoteUser)db.demo=false;
c.auth.onAuthStateChange(function(evt,session){
if(evt==='PASSWORD_RECOVERY'){
modal('<h3 class="font-display font-bold text-lg mb-2">تعيين كلمة مرور جديدة</h3><p class="text-xs text-ink-400 mb-4">تم التحقق من بريدك عبر رابط الاستعادة. اختر كلمة مرور جديدة لحسابك.</p><form id="f-newpass" class="space-y-3"><label class="lbl2">كلمة المرور الجديدة (6 أحرف على الأقل)<input name="pass" type="password" minlength="6" required class="inp-s" placeholder="••••••••"></label><button class="btn-primary w-full">حفظ كلمة المرور الجديدة</button></form>');
return;}
var nu=session?session.user:null;
if(nu&&nu.id!==(remoteUser&&remoteUser.id)){remoteUser=nu;db.demo=false;loadRemote().catch(function(){}).then(route)}
else if(!nu&&remoteUser){remoteUser=null;db.ws=null;route()}});
if(remoteUser){
var lok=false;
try{lok=await loadRemote()}catch(eL){console.error('loadRemote failed:',eL)}
if(!lok){
/* انقطاع الخادم: مساحة عمل محلية مؤقتة حتى يعود الاتصال */
if(!db.ws){db.ws=starterKit();db.ws.__offline=true;persist()}
remoteBroken=true;
toast('تعذر الوصول للخادم — تعمل الآن بالوضع المحلي مؤقتًا','err');}
}
}
route();
}catch(err){
console.error('Boot error:',err);
document.getElementById('app').innerHTML='<div class="p-16 text-center text-ink-300"><p class="mb-3">تعذر تشغيل التطبيق: '+esc(err.message||String(err))+'</p><p class="text-xs text-ink-500">غالبًا السبب: حجب الإنترنت داخل الـ Preview (مكتبات CDN) أو حجب localStorage. جرّب فتح الملف مباشرة في المتصفح.</p><button onclick="location.hash=\'#/\'" class="btn-primary mt-4">إعادة المحاولة</button></div>';}}

boot();
