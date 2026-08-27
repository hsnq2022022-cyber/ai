function demoDocs(){return DEMO_TEXTS.map(function(t){return {agentId:'',chunks:t.split('\n').map(function(s){return {text:s,toks:tokens(s)}})}})}

function searchKB(q,agentId){
const qt=tokens(q);if(!qt.length)return[];const hits=[];
const s=ws();
/* التزام صارم: المعرفة الجاهزة فقط — لا مصادر خارجية */
const ready=(s&&Array.isArray(s.kb))?s.kb.filter(function(k){return k.status==='ready'&&(!k.agentId||k.agentId===agentId)}):[];
const src=ready.length?ready:(s?[]:demoDocs());
src.forEach(function(d){(d.chunks||[]).forEach(function(ch){
var sc=0;
qt.forEach(function(t){ch.toks.forEach(function(ct){
var tt=t.length>3?t.replace(/^ال/,''):t;
var cc=ct.length>3?ct.replace(/^ال/,''):ct;
if(ct===t)sc+=3;
else if(ct.indexOf(t)>-1||t.indexOf(ct)>-1)sc+=2;
else if(tt.length>2&&cc.length>2&&(cc.indexOf(tt)>-1||tt.indexOf(cc)>-1))sc+=1;})});
if(sc>0)hits.push({sc:sc,text:ch.text})})});
return hits.sort(function(a,b){return b.sc-a.sc}).slice(0,2);}

function refreshKbUI(){var h=location.hash||'';if(h.indexOf('#/app/kb')===0||h.indexOf('#/onboarding')===0)route()}

async function processFile(file,agentId){
const s=ws();
const doc={id:uid('kb_'),name:file.name,type:'file',agentId:agentId||'',content:'',status:'pending',chunks:[],chunkCount:0,createdAt:now(),size:file.size,error:'',storagePath:''};
s.kb.unshift(doc);save();refreshKbUI();
try{
if(isRemote()&&cfg&&apiBase()&&db.ws&&db.ws.__wid){
doc.status='uploading';save();refreshKbUI();
const c=sbClient();
const safe=file.name.replace(/[^\w.\-\u0600-\u06FF]+/g,'_');
const path=db.ws.__wid+'/'+doc.id+'/'+safe;
const up=await c.storage.from('kb-files').upload(path,file,{upsert:true});
if(up.error)throw new Error('فشل رفع الملف: '+up.error.message);
doc.storagePath=path;doc.status='processing';save();refreshKbUI();
const resp=await fetch(apiBase()+'/kb-process',{method:'POST',headers:{'Content-Type':'application/json','api-key':cfg.key},body:JSON.stringify({doc_id:doc.id,path:path,name:file.name,agent_id:agentId||null,workspace_id:db.ws.__wid})});
const j=await resp.json().catch(function(){return null});
if(!resp.ok||!j||j.error)throw new Error(arErr((j&&j.message)||('فشل معالجة الملف ('+resp.status+')')));
if(!j.chunks)throw new Error('لم يتم استخراج أي نص من الملف');
doc.status='ready';doc.chunkCount=j.chunks;doc.lastSync=now();
doc.content='تم استخراج النص وإنشاء '+j.chunks+' مقطعًا مع تضمينات دلالية.';
save();refreshKbUI();toast('تمت معالجة الملف ✔ — '+j.chunks+' مقطع','ok');return;
}
doc.status='processing';save();refreshKbUI();
const text=await extractFileClient(file);
if(!text||!text.trim())throw new Error('الملف لا يحتوي نصًا قابلًا للاستخراج');
doc.content=text.slice(0,120000);chunkify(doc);doc.status='ready';doc.lastSync=now();
save();refreshKbUI();toast('تمت معالجة الملف ✔ — '+doc.chunkCount+' مقطع أصبح جاهزًا للويدجت','ok');
}catch(err){
console.error('KB file error:',err);
doc.status='error';doc.error=arErr(err.message||String(err));doc.content='فشلت المعالجة: '+doc.error;
save();refreshKbUI();toast(doc.error,'err');}}

async function reIngestDoc(doc){
doc.status='processing';doc.error='';save();refreshKbUI();
try{
if(isRemote()&&cfg&&apiBase()&&db.ws&&db.ws.__wid){
const resp=await fetch(apiBase()+'/kb-ingest',{method:'POST',headers:{'Content-Type':'application/json','api-key':cfg.key},body:JSON.stringify({doc_id:doc.id,text:doc.content,agent_id:doc.agentId||null,workspace_id:db.ws.__wid})});
const j=await resp.json().catch(function(){return null});
if(!resp.ok||!j||j.error)throw new Error(arErr((j&&j.message)||('فشل إعادة المعالجة ('+resp.status+')')));
doc.status='ready';doc.chunkCount=j.chunks||0;doc.lastSync=now();
save();refreshKbUI();toast('تمت إعادة المعالجة ✔','ok');return;
}
chunkify(doc);doc.status='ready';doc.lastSync=now();save();refreshKbUI();toast('تمت إعادة المعالجة ✔ — '+doc.chunkCount+' مقطع','ok');
}catch(err){console.error(err);doc.status='error';doc.error=arErr(err.message||String(err));save();refreshKbUI();toast('فشلت إعادة المعالجة: '+doc.error,'err');}}

async function reProcessFile(doc){
if(!doc.storagePath){
if(doc.content&&!/فشلت|فشل/.test(doc.content)){doc.status='processing';save();refreshKbUI();chunkify(doc);doc.status='ready';doc.lastSync=now();save();refreshKbUI();toast('تمت إعادة المعالجة ✔','ok');return}
toast('لا يوجد ملف مرفوع لهذا المصدر — ارفع الملف من جديد','err');return}
doc.status='processing';doc.error='';save();refreshKbUI();
try{
if(isRemote()&&cfg&&apiBase()&&db.ws&&db.ws.__wid){
const resp=await fetch(apiBase()+'/kb-process',{method:'POST',headers:{'Content-Type':'application/json','api-key':cfg.key},body:JSON.stringify({doc_id:doc.id,path:doc.storagePath,name:doc.name,agent_id:doc.agentId||null,workspace_id:db.ws.__wid})});
const j=await resp.json().catch(function(){return null});
if(!resp.ok||!j||j.error)throw new Error(arErr((j&&j.message)||('فشل المعالجة ('+resp.status+')')));
doc.status='ready';doc.chunkCount=j.chunks||0;doc.lastSync=now();doc.content='تم استخراج النص وإنشاء '+(j.chunks||0)+' مقطعًا.';
save();refreshKbUI();toast('تمت إعادة المعالجة ✔','ok');return;
}
doc.status='error';doc.error='إعادة معالجة الملفات المرفوعة تتطلب الاتصال بالخادم';save();refreshKbUI();toast(doc.error,'err');
}catch(err){console.error(err);doc.status='error';doc.error=arErr(err.message||String(err));save();refreshKbUI();toast('فشلت إعادة المعالجة: '+doc.error,'err');}}

function kbStatusBadge(k){
var act=['pending','uploading','processing','embedding'];
if(act.indexOf(k.status)>-1)return '<span class="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full px-2 py-0.5 inline-flex items-center gap-1 flex-none"><span class="ob-spin"></span> '+(KB_STATUSES[k.status]||'جارٍ المعالجة')+'</span>';
if(k.status==='error')return '<span class="text-[10px] bg-red-500/15 text-red-300 border border-red-500/30 rounded-full px-2 py-0.5 flex-none" title="'+esc(k.error||'')+'">فشل</span>';
return '<span class="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full px-2 py-0.5 flex-none">'+(k.type==='url'?'متزامن':'جاهز')+'</span>';}

function kbDiagnostics(){
var docs=ws().kb;
var totalChunks=docs.reduce(function(a,k){return a+(k.chunkCount||0)},0);
var errs=docs.filter(function(k){return k.status==='error'});
var act=['pending','uploading','processing','embedding'];
return '<div class="glass rounded-2xl p-4 mb-4 text-xs text-ink-400 space-y-2">'
+'<div class="flex items-center justify-between flex-wrap gap-2"><b class="text-ink-200 text-sm">تشخيص قاعدة المعرفة</b><button data-action="kb-diag-log" class="btn-ghost !py-1 !px-3 text-[11px]">طباعة التفاصيل في console</button></div>'
+'<div class="flex flex-wrap gap-x-5 gap-y-1"><span>المستندات: <b class="text-ink-200">'+docs.length+'</b></span><span>جاهز: <b class="text-emerald-300">'+docs.filter(function(k){return k.status==='ready'}).length+'</b></span><span>قيد المعالجة: <b class="text-amber-300">'+docs.filter(function(k){return act.indexOf(k.status)>-1}).length+'</b></span><span>فشل: <b class="text-red-300">'+errs.length+'</b></span><span>إجمالي المقاطع: <b class="text-ink-200">'+totalChunks+'</b></span></div>'
+(errs.length?'<div class="text-red-300">'+errs.map(function(k){return '• '+esc(k.name)+': '+esc(k.error||'خطأ غير معروف')}).join('<br>')+'</div>':'')
+'<div class="text-[10px] text-ink-600">للتشخيص الكامل من جهة الخادم استعلم عن <span class="ltr">kb_diagnostics</span> في SQL Editor (تبويب «٤. العزل الصارم والتشخيص»).</div></div>';}

function kbTypeModal(){
modal('<h3 class="font-display font-bold text-lg mb-1">إضافة مصدر معرفة</h3><p class="text-xs text-ink-500 mb-4">اختر نوع المصدر — ستتم المعالجة الفعلية فور الإضافة (رفع → استخراج → تقسيم → تضمينات).</p>'
+'<div class="grid grid-cols-3 gap-3">'
+'<button type="button" data-action="kb-open" data-id="file" class="glass rounded-xl p-4 text-center hover:border-tiffany-500/50 transition border border-transparent"><div class="mb-1 text-tiffany-400 flex justify-center">'+icon('doc','w-6 h-6')+'</div><div class="text-sm font-bold">ملف</div><div class="text-[10px] text-ink-500 mt-1">PDF / DOCX / XLSX / CSV / TXT</div></button>'
+'<button type="button" data-action="kb-open" data-id="text" class="glass rounded-xl p-4 text-center hover:border-tiffany-500/50 transition border border-transparent"><div class="mb-1 text-tiffany-400 flex justify-center">'+icon('edit','w-6 h-6')+'</div><div class="text-sm font-bold">نص يدوي</div><div class="text-[10px] text-ink-500 mt-1">اكتب المعلومة بنفسك</div></button>'
+'<button type="button" data-action="kb-open" data-id="url" class="glass rounded-xl p-4 text-center hover:border-tiffany-500/50 transition border border-transparent"><div class="mb-1 text-tiffany-400 flex justify-center">'+icon('globe','w-6 h-6')+'</div><div class="text-sm font-bold">رابط موقع</div><div class="text-[10px] text-ink-500 mt-1">زحف حتى 10 صفحات</div></button></div>');}

function showFileInfo(file){
var info=document.getElementById('kb-fileinfo');if(!info)return;
info.classList.remove('hidden');
var n=document.getElementById('kb-filename');if(n)n.textContent=file.name;
var sz=document.getElementById('kb-filesize');if(sz)sz.textContent=fmtSize(file.size);}

function kbTypeModalOpen(type){
type=String(type||'').trim();
if(type!=='file'&&type!=='text'&&type!=='url'){toast('نوع مصدر غير معروف','err');return}
if(type==='file'){
modal('<h3 class="font-display font-bold mb-3">رفع ملف</h3><form id="f-kbm-file" class="space-y-3">'
+'<div id="kb-drop" class="rounded-xl border-2 border-dashed border-ink-600 hover:border-tiffany-500/60 transition p-6 text-center cursor-pointer"><div class="text-ink-400 text-sm">اسحب الملف هنا أو اضغط للاختيار</div><div class="text-[10px] text-ink-600 mt-1">PDF, DOCX, XLS, XLSX, CSV, TXT</div><input id="kb-filepick" type="file" accept=".pdf,.txt,.docx,.csv,.xlsx,.xls,.md" class="hidden"></div>'
+'<div id="kb-fileinfo" class="hidden glass rounded-xl p-3 flex items-center justify-between text-xs"><span id="kb-filename" class="font-semibold"></span><span id="kb-filesize" class="text-ink-500"></span></div>'
+'<label class="lbl2">الـ Agent المرتبط (عزل المعرفة)<select id="kbm-file-agent" class="inp-s">'+agentOptions('')+'</select></label>'
+'<div class="flex gap-2"><button class="btn-primary flex-1">رفع ومعالجة</button><button type="button" data-action="modal-close" class="btn-ghost">إلغاء</button></div></form>');
setTimeout(function(){
var drop=document.getElementById('kb-drop'),inp=document.getElementById('kb-filepick');
if(!drop||!inp)return;
drop.addEventListener('click',function(){inp.click()});
['dragover','dragenter'].forEach(function(ev){drop.addEventListener(ev,function(e){e.preventDefault();drop.classList.add('border-tiffany-500')})});
['dragleave','drop'].forEach(function(ev){drop.addEventListener(ev,function(e){e.preventDefault();drop.classList.remove('border-tiffany-500');if(ev==='drop'&&e.dataTransfer&&e.dataTransfer.files[0]){inp.files=e.dataTransfer.files;showFileInfo(inp.files[0])}})});
inp.addEventListener('change',function(){if(inp.files[0])showFileInfo(inp.files[0])});
},50);
} else if(type==='text'){
modal('<h3 class="font-display font-bold mb-3">إضافة نص يدوي</h3><form id="f-kbm-text" class="space-y-3">'
+'<label class="lbl2">عنوان المعرفة (اختياري)<input name="title" class="inp-s" placeholder="مثال: أوقات العمل"></label>'
+'<label class="lbl2">النص *<textarea name="content" rows="6" required class="inp-s" placeholder="مثال: الدوام من السبت إلى الخميس، من الساعة 9 صباحًا حتى 6 مساءً."></textarea></label>'
+'<label class="lbl2">الـ Agent المرتبط (عزل المعرفة)<select id="kbm-text-agent" class="inp-s">'+agentOptions('')+'</select></label>'
+'<div class="flex gap-2"><button class="btn-primary flex-1">حفظ ومعالجة</button><button type="button" data-action="modal-close" class="btn-ghost">إلغاء</button></div></form>');
} else {
modal('<h3 class="font-display font-bold mb-3">إضافة رابط موقع</h3><form id="f-kbm-url" class="space-y-3">'
+'<label class="lbl2">رابط الموقع *<input name="url" type="url" required class="inp-s ltr" placeholder="https://example.com"></label>'
+'<div class="text-[10px] text-ink-500">يزحف حتى 10 صفحات ضمن نفس النطاق. إذا تعذرت القراءة الآلية سيفتح لك خيار لصق المحتوى يدويًا.</div>'
+'<label class="lbl2">الـ Agent المرتبط (عزل المعرفة)<select id="kbm-url-agent" class="inp-s">'+agentOptions('')+'</select></label>'
+'<div class="flex gap-2"><button class="btn-primary flex-1">إضافة ومزامنة</button><button type="button" data-action="modal-close" class="btn-ghost">إلغاء</button></div></form>');
}}

function pgKB(){
var w=ws();
var docs=w.kb.map(function(k){
var cnt=(k.chunkCount!=null)?k.chunkCount:((k.chunks&&k.chunks.length)||0);
var ag=k.agentId?w.agents.find(function(a){return a.id===k.agentId}):null;
var icn=k.type==='url'?'globe':k.type==='file'?'doc':'edit';
var typeLbl=k.type==='url'?'رابط موقع':k.type==='file'?'ملف':'نص يدوي';
var acts='';
if(k.type==='url')acts+='<button data-action="kb-reprocess" data-id="'+k.id+'" class="p-2 text-tiffany-300 hover:bg-tiffany-500/10 rounded-lg" title="إعادة الزحف">'+icon('refresh','w-4 h-4')+'</button>';
if(k.type==='file')acts+='<button data-action="kb-reprocess" data-id="'+k.id+'" class="p-2 text-tiffany-300 hover:bg-tiffany-500/10 rounded-lg" title="إعادة المعالجة">'+icon('refresh','w-4 h-4')+'</button>';
if(k.type==='text')acts+='<button data-action="kb-edit" data-id="'+k.id+'" class="p-2 text-ink-400 hover:text-white hover:bg-ink-800 rounded-lg" title="تعديل">'+icon('edit','w-4 h-4')+'</button>';
acts+='<button data-action="kb-del" data-id="'+k.id+'" class="p-2 text-red-400 hover:bg-red-500/10 rounded-lg" title="حذف">'+icon('trash','w-4 h-4')+'</button>';
return '<div class="glass rounded-2xl p-5"><div class="flex items-start gap-4"><span class="w-11 h-11 rounded-xl bg-tiffany-500/10 text-tiffany-400 flex items-center justify-center flex-none">'+icon(icn,'w-5 h-5')+'</span>'
+'<div class="flex-1 min-w-0"><div class="flex items-center gap-2 flex-wrap"><b class="text-sm">'+esc(k.name)+'</b>'+kbStatusBadge(k)+'</div>'
+'<div class="text-[11px] text-ink-500 mt-1 flex flex-wrap gap-x-3 gap-y-1"><span>النوع: '+typeLbl+'</span><span>Agent: '+(ag?esc(ag.name):'مشترك (كل الوكلاء)')+'</span><span>'+cnt+' مقطع</span><span>أُضيف: '+fmtDate(k.createdAt)+'</span>'+(k.lastSync?'<span>آخر مزامنة: '+timeAgo(k.lastSync)+'</span>':'')+(k.size?'<span>الحجم: '+fmtSize(k.size)+'</span>':'')+'</div>'
+'<p class="text-xs text-ink-400 mt-2 leading-6 line-clamp-2">'+esc(k.content||'')+'</p>'
+(k.status==='error'?'<div class="text-[11px] text-red-300 mt-1">سبب الفشل: '+esc(k.error||'خطأ غير معروف')+' <button data-action="kb-reprocess" data-id="'+k.id+'" class="text-tiffany-300 underline mr-1">إعادة المحاولة</button></div>':'')
+'</div><div class="flex gap-1 flex-none">'+acts+'</div></div></div>'}).join('');
return '<div class="flex items-center justify-between mb-5 flex-wrap gap-3"><div><h2 class="font-display font-bold text-xl">مصادر المعرفة</h2><p class="text-xs text-ink-500 mt-1">كل مصدر معزول حسب الـ Agent — لا تداخل بين الوكلاء. الحالة لا تصبح «جاهز» إلا بعد نجاح المعالجة فعليًا.</p></div><button data-action="kb-add" class="btn-primary">'+icon('plus','w-4 h-4')+' إضافة مصدر</button></div>'
+kbDiagnostics()
+'<div class="space-y-3">'+(docs||'<div class="glass rounded-2xl p-12 text-center text-ink-500">لا مصادر بعد — <button data-action="kb-add" class="text-tiffany-400 underline">أضف مصدرًا الآن</button>: رابط موقعك، ملف، أو نص يدوي.</div>')+'</div>';}
