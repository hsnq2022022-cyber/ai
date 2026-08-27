function classifyConvo(c){
const t=norm((c.messages||[]).filter(function(m){return m.from==='visitor'}).map(function(m){return String(m.text||'')}).join(' '));
let score=0;const tags=[];
if(/(سعر|بكم|يكلف|تكلف)/.test(t)){score+=10;tags.push('سأل عن السعر')}
if(/(توصيل|شحن|يوصل)/.test(t)){score+=15;tags.push('سأل عن التوصيل')}
if(/(دفع|فيزا|مدي|بطاقه|كاش|تحويل بنكي)/.test(t)){score+=20;tags.push('سأل عن الدفع')}
if(/(اريد اطلب|ابغي اطلب|ابى اطلب|اطلب الان|اشتري|اريد الشراء|احجز)/.test(t)){score+=40;tags.push('نية شراء')}
if(/(موظف|انسان|بشري)/.test(t))tags.push('طلب موظف');
score=Math.min(score,100);
let cls='استفسار عام';
if(c.status==='handoff')cls='يحتاج متابعة';
else if(score>=60)cls='مشتري';else if(score>=40)cls='عميل محتمل';else if(score>=15)cls='مهتم';
return {score:score,cls:cls,tags:tags};}

function updateCustomerInsights(convo){
const s=ws();if(!s||!convo)return;
const cust=s.contacts.find(function(x){return x.id===convo.contactId});if(!cust)return;
const r=classifyConvo(convo);
cust.leadScore=r.score;cust.class=r.cls;cust.lastSeen=now();
const manual=(cust.tags||[]).filter(function(tg){return !AUTO_TAGS.has(tg)});
cust.tags=[...new Set(manual.concat(r.tags))].slice(0,12);}

function aiRespondLocal(text,agent,agentId){
const t=norm(text);
if(HANDOFF.some(function(k){return t.indexOf(norm(k))>-1}))return {text:'أكيد، حولتك للموظف المختص الآن ✋ سيتابع معك خلال دقائق.',handoff:true};
if(/^(سلام|هلا|مرحبا|اهلا|هاي|صباح الخير|مساء الخير)/.test(t)&&t.length<15)return {text:'أهلًا وسهلًا 👋 كيف أقدر أساعدك؟'};
if(t.indexOf('شكرا')>-1&&t.length<25)return {text:'العفو 🤍 أي شيء ثاني أنا هنا.'};
const hits=searchKB(text,agentId);
if(hits.length&&hits[0].sc>=1)return {text:hits.map(function(h){return h.text}).join('\n')};
/* لا إجابات عامة خارج قاعدة المعرفة إطلاقًا */
return {text:NO_INFO_MSG};}

async function getAIReply(text,agent,widget,convo){
if(isRemote()&&cfg&&apiBase()&&widget){
try{
const res=await fetch(apiBase()+'/ai-respond',{method:'POST',headers:{'Content-Type':'application/json','api-key':cfg.key},body:JSON.stringify({widget_id:widget.id,token:widget.token,message:text,conversation_id:convo?convo.id:null})});
const j=await res.json().catch(function(){return{}});
if(j&&j.handoff_locked)return {text:j.message||'المحادثة بيد فريق الدعم الآن.',system:true};
if(j&&j.error==='limit')return {text:j.message||'تم تجاوز الحد الشهري لرسائل الذكاء الاصطناعي. الرجاء ترقية الخطة.',system:true};
if(j&&j.error){console.warn('ai-respond error → fallback للمحرك المحلي:',j.error);throw new Error(j.message||j.error)}
if(j&&j.reply){if(j.handoff&&convo)convo.status='handoff';return {text:j.reply,handoff:!!j.handoff}}
throw new Error('استجابة غير صالحة من الخادم');
}catch(e){console.warn('ai-respond fallback:',e&&e.message)}
}
return new Promise(function(resolve){setTimeout(function(){resolve(aiRespondLocal(text,agent,widget?widget.agentId:undefined))},600)});}

function pgConvos(h){
var w=ws();
var q=new URLSearchParams(h.split('?')[1]||'');
if(q.get('c'))selConvo=q.get('c');
if(!selConvo&&w.convos.length)selConvo=w.convos[0].id;
var c=w.convos.find(function(x){return x.id===selConvo});
var list=w.convos.map(function(c2){var ct=w.contacts.find(function(x){return x.id===c2.contactId});
return '<button data-action="go" data-to="#/app/conversations?c='+c2.id+'" class="w-full text-right flex items-center gap-3 rounded-xl p-2.5 transition '+(c2.id===selConvo?'bg-tiffany-500/10 border border-tiffany-500/30':'hover:bg-ink-850 border border-transparent')+'"><div class="w-9 h-9 rounded-full bg-ink-800 flex items-center justify-center text-xs font-bold text-tiffany-300 flex-none">'+esc(((ct&&ct.name)||'ز').charAt(0))+'</div><div class="flex-1 min-w-0"><div class="flex items-center justify-between gap-2"><span class="text-sm font-semibold truncate">'+esc((ct&&ct.name)||'زائر')+'</span><span class="text-[10px] text-ink-500 flex-none">'+timeAgo(c2.updatedAt)+'</span></div><div class="flex items-center gap-2 mt-0.5"><span class="text-[11px] text-ink-500 truncate flex-1">'+esc((c2.messages[c2.messages.length-1]||{}).text||'—')+'</span>'+statusBadge(c2.status)+'</div></div></button>'}).join('');
var right='<div class="flex-1 flex items-center justify-center text-ink-500 text-sm">لا توجد محادثة محددة — افتح «موقع تجريبي» لإنشاء محادثة حقيقية</div>';
if(c){
var ct=w.contacts.find(function(x){return x.id===c.contactId});
var ag=w.agents.find(function(a){return a.id===c.agentId});
var wg=w.widgets.find(function(x){return x.id===c.widgetId});
var msgsHtml=c.messages.map(function(m){
if(m.from==='system')return '<div class="msg-in flex"><div class="text-[11px] text-amber-300 bg-amber-500/10 rounded-lg px-3 py-1.5 w-full text-center">'+esc(m.text)+'</div></div>';
var vis=m.from==='visitor';
return '<div class="msg-in flex '+(vis?'justify-start':'justify-end')+'"><div class="max-w-[75%] text-sm leading-6 px-3.5 py-2.5 '+(vis?'bg-ink-800 rounded-2xl rounded-tr-sm':'bg-tiffany-600 text-white rounded-2xl rounded-tl-sm')+'">'+md(m.text)+'<div class="text-[10px] opacity-60 mt-1">'+(m.from==='ai'?'AI ':m.from==='team'?'الفريق ':'')+' '+fmtTime(m.at)+'</div></div></div>'}).join('');
right='<div class="p-4 border-b border-ink-800 flex items-center justify-between gap-2 flex-wrap"><div><div class="flex items-center gap-2 flex-wrap"><b class="font-display">'+esc((ct&&ct.name)||'زائر')+'</b>'+(ct?classBadge(ct.class):'')+'</div><div class="text-[11px] text-ink-500 mt-0.5">'+esc((ag&&ag.name)||'')+' • '+esc((wg&&wg.name)||'')+' • '+fmtDate(c.createdAt)+((ct&&ct.phone)?' • <span class="ltr">'+esc(ct.phone)+'</span>':'')+((ct&&ct.email)?' • <span class="ltr">'+esc(ct.email)+'</span>':'')+'</div></div>'
+'<div class="flex items-center gap-2 flex-wrap">'+statusBadge(c.status)+(c.status!=='handoff'?'<button data-action="handoff" data-id="'+c.id+'" class="btn-ghost !py-1.5 !px-3 text-xs">تحويل بشري</button>':'<button data-action="ai-back" data-id="'+c.id+'" class="btn-ghost !py-1.5 !px-3 text-xs">إعادة تفعيل AI</button>')+(c.status!=='closed'?'<button data-action="close-convo" data-id="'+c.id+'" class="btn-ghost !py-1.5 !px-3 text-xs">إغلاق</button>':'<button data-action="reopen-convo" data-id="'+c.id+'" class="btn-ghost !py-1.5 !px-3 text-xs">إعادة فتح</button>')+'<button data-action="del-convo" data-id="'+c.id+'" class="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">'+icon('trash','w-4 h-4')+'</button></div></div>'
+(c.status==='handoff'?'<div class="bg-amber-500/10 text-amber-300 text-xs py-2 px-4 border-b border-amber-500/20">المحادثة بيد فريق بشري — الـ AI متوقف حتى يضغط الموظف «إعادة تفعيل AI».</div>':'')
+'<div id="dash-msgs" class="flex-1 overflow-y-auto p-4 space-y-2.5 chat-scroll">'+msgsHtml+'</div>'
+'<form id="f-dash-msg" class="p-3 border-t border-ink-800 flex gap-2"><input name="m" class="flex-1 bg-ink-850 border border-ink-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-tiffany-500 min-w-0" placeholder="رد يدوي كالفريق..." maxlength="500"><button class="btn-primary !px-4 flex-none">'+icon('send','w-4 h-4')+'</button></form>';}
return '<div class="grid lg:grid-cols-[320px_1fr] gap-4 lg:h-[calc(100vh-140px)]"><div class="glass rounded-2xl overflow-hidden flex flex-col max-h-[400px] lg:max-h-none"><div class="p-3 border-b border-ink-800"><div class="flex items-center gap-2 bg-ink-850 border border-ink-800 rounded-xl px-3 py-2">'+icon('search','w-4 h-4 text-ink-500')+'<input id="c-search" class="bg-transparent outline-none text-sm flex-1 min-w-0" placeholder="بحث بالاسم..."></div></div><div class="flex-1 overflow-y-auto p-2 space-y-1" id="c-list">'+(list||'<p class="text-sm text-ink-500 p-4">لا محادثات بعد — جرّب الموقع التجريبي.</p>')+'</div></div><div class="glass rounded-2xl flex flex-col min-h-[500px] lg:min-h-0">'+right+'</div></div>';}
