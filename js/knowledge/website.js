async function fetchPage(url){
try{
const ctl=(typeof AbortController!=='undefined')?new AbortController():null;
const to=ctl?setTimeout(function(){ctl.abort()},12000):null;
const r=await fetch(url,{mode:'cors',signal:ctl?ctl.signal:undefined});
if(to)clearTimeout(to);
if(r.ok){const ct=(r.headers.get('content-type')||'');if(ct.indexOf('html')>-1||ct.indexOf('text')>-1||ct==='')return await r.text()}
throw new Error('direct');
}catch(e){
const proxy='https://api.allorigins.win/get?url='+encodeURIComponent(url);
const r2=await fetch(proxy);
if(!r2.ok)throw new Error('تعذر الوصول إلى الموقع');
const j=await r2.json().catch(function(){return null});
if(j&&j.contents)return j.contents;
throw new Error('تعذر جلب محتوى الموقع');}}

function extractHtml(html,baseUrl){
const d=new DOMParser().parseFromString(html,'text/html');
d.querySelectorAll('script,style,noscript,svg,iframe,nav,footer,form,button,header').forEach(function(n){n.remove()});
const titleEl=d.querySelector('title');
const title=titleEl?(titleEl.textContent||'').trim():'';
const body=d.querySelector('main')||d.querySelector('body')||d.documentElement;
const text=((title?title+'\n':'')+(body?body.textContent:'')).replace(/\s+/g,' ').trim();
let origin='';try{origin=new URL(baseUrl).origin}catch(e){}
const links=Array.from(d.querySelectorAll('a[href]')).map(function(a){try{return new URL(a.getAttribute('href'),baseUrl).toString()}catch(e){return null}}).filter(function(x){return x&&origin&&x.indexOf(origin)===0});
return {text:text,links:links};}

async function crawlLocal(url,doc){
const origin=new URL(url).origin;
const visited=new Set();const queue=[url];const pages=[];
while(queue.length&&visited.size<10){
const next=queue.shift();let u;try{u=new URL(next)}catch(e){continue}
const key=u.origin+u.pathname;
if(u.origin!==origin||visited.has(key))continue;
visited.add(key);
try{
const html=await fetchPage(u.toString());
const res=extractHtml(html,u.toString());
if(res.text.length>40)pages.push('صفحة: '+u.pathname+'\n'+res.text.slice(0,20000));
res.links.forEach(function(l){queue.push(l)});
}catch(e){/* تجاهل الصفحة الفاشلة وأكمل */}}
if(!pages.length)throw new Error('الموقع لا يحتوي نصًا كافيًا — قد يعتمد على JavaScript في عرض المحتوى');
doc.content=pages.join('\n').slice(0,60000);
chunkify(doc);doc.pages=visited.size;doc.status='ready';doc.lastSync=now();}

function urlFallbackModal(docId){
var d=ws().kb.find(function(x){return x.id===docId});if(!d)return;
modal('<h3 class="font-display font-bold text-lg mb-2">تعذر قراءة الموقع تلقائيًا</h3>'
+'<p class="text-xs text-ink-400 leading-6 mb-1">الرابط: <span class="ltr text-tiffany-300">'+esc(d.name)+'</span></p>'
+'<p class="text-xs text-ink-500 leading-6 mb-3">قد يمنع الموقع القراءة الآلية أو لا يتوفر اتصال كافٍ. الصق محتوى الموقع بنفسك وسيُضاف فورًا كمصدر معرفة جاهز.</p>'
+'<form id="f-urlfallback" class="space-y-3"><input type="hidden" name="docId" value="'+d.id+'">'
+'<textarea name="content" rows="9" required class="inp-s" placeholder="الصق هنا نصوص الموقع: المنتجات، الأسعار، الخدمات، السياسات، أوقات العمل..."></textarea>'
+'<div class="flex gap-2"><button class="btn-primary flex-1">حفظ كمصدر معرفة</button><button type="button" data-action="modal-close" class="btn-ghost">إلغاء</button></div></form>');}

async function processUrl(url,doc){
doc.status='processing';doc.error='';doc.content='جارٍ الزحف واستخراج المعلومات...';save();refreshKbUI();
try{
if(isRemote()&&cfg&&apiBase()&&db.ws&&db.ws.__wid){
const resp=await fetch(apiBase()+'/kb-crawl',{method:'POST',headers:Object.assign({'Content-Type':'application/json','api-key':cfg.key},await authHeaders()),body:JSON.stringify({url:url,doc_id:doc.id,workspace_id:db.ws.__wid,agent_id:doc.agentId||null})});
const j=await resp.json().catch(function(){return null});
if(!resp.ok||!j||j.error)throw new Error(arErr((j&&j.message)||('فشل الزحف ('+resp.status+')')));
doc.status='ready';doc.chunkCount=j.chunks||0;doc.pages=j.pages||1;doc.lastSync=now();
doc.content='تم الزحف عبر الخادم — '+(j.pages||1)+' صفحة، '+(j.chunks||0)+' مقطعًا مع تضمينات دلالية.';
save();refreshKbUI();toast('تم زحف الموقع ومعالجته ✔','ok');return;
}
await crawlLocal(url,doc);
save();refreshKbUI();
toast('تم استخراج معلومات الموقع ✔ — '+doc.chunkCount+' مقطع من '+(doc.pages||1)+' صفحة','ok');
}catch(err){
console.error('KB crawl error:',err);
doc.status='error';doc.error=arErr(err.message||String(err));doc.content='فشل الزحف: '+doc.error;
save();refreshKbUI();
toast('فشل الزحف التلقائي — أضف محتوى الموقع يدويًا','err');
urlFallbackModal(doc.id);}}
