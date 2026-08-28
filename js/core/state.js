const AV_LOCAL=[
'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="24" fill="#0ABAB5"/><path d="M48 24l6.6 17.4L72 48l-17.4 6.6L48 72l-6.6-17.4L24 48l17.4-6.6L48 24z" fill="white"/></svg>'),
'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="24" fill="#077f7c"/><circle cx="48" cy="40" r="16" fill="white"/><path d="M48 60c8 0 14 2.5 14 5.5S56 71 48 71s-14-2.5-14-5.5S40 60 48 60z" fill="white"/></svg>'),
'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="24" fill="#0b514f"/><rect x="28" y="28" width="40" height="40" fill="white"/></svg>'),
];

const AVT=AV_LOCAL;

const NO_INFO_MSG='عذراً، هذه المعلومة غير متوفرة لدي حالياً، هل أستطيع تحويلك لأحد موظفي الدعم؟';

const PLANS={
free:{name:'البداية',price:0,agents:8,msgs:500,feat:['حتى 8 Agents','500 رسالة AI شهريًا','Knowledge Base أساسية','شعار إدارة سوشيال في الويدجت']},
growth:{name:'النمو',price:99,agents:10,msgs:5000,feat:['حتى 10 Agents','5,000 رسالة AI شهريًا','Knowledge Base متقدمة + RAG','إزالة شعار إدارة سوشيال']},
pro:{name:'الاحترافي',price:299,agents:999,msgs:50000,feat:['Agents غير محدودين','50,000 رسالة AI شهريًا','API كامل + Webhooks','أولوية دعم + SLA','نمو بدون حدود']}
};

const AI_MODELS=['gemini-2.5-flash-lite','gemini-2.5-flash','gemini-2.0-flash','gemini-1.5-pro'];

const CLASSES=['استفسار عام','مهتم','عميل محتمل','مشتري','عميل حالي','يحتاج متابعة','غير مهتم'];

const AUTO_TAGS=new Set(['سأل عن السعر','سأل عن التوصيل','سأل عن الدفع','نية شراء','طلب موظف']);

const KB_STATUSES={pending:'بانتظار البدء',uploading:'جارٍ الرفع',processing:'جارٍ المعالجة',embedding:'جارٍ إنشاء التضمينات',ready:'جاهز',error:'خطأ'};

let cfg=null;

// محاولة تحميل cfg من localStorage باستخدام المفتاح الموحد
try{cfg=JSON.parse(lsGet('backend_config'))}catch(e){}
// تراجع للمفتاح القديم إذا لم يكن الجديد موجودًا
if(!cfg){try{cfg=JSON.parse(lsGet('aown_cfg'))}catch(e){}}

let sb=null, remoteUser=null, remoteBroken=false;

const LS='aown_db_v1';

let db;

function loadDB(){try{db=JSON.parse(lsGet(LS))}catch(e){db=null}
if(!db||typeof db!=='object'){db={users:[],session:null,ws:null,demo:false};persist()}
if(typeof db.demo==='undefined')db.demo=false}

function persist(){lsSet(LS,JSON.stringify(db))}

function me(){
if(isRemote())return remoteUser?{id:remoteUser.id,name:((remoteUser.email||'مستخدم').split('@')[0]),email:remoteUser.email,demo:false}:null;
if(db&&db.demo)return {id:'demo',name:'زائر تجريبي',email:'demo@social.app',demo:true};
return db.users.find(function(u){return u.id===db.session})}

const ws=()=>db.ws;

function defWidget(agentId,name){return {id:uid('w_'),agentId:agentId,name:name,token:uid('tk_'),enabled:true,
primary:'#0ABAB5',secondary:'#0b514f',header:'',bg:'#1a1e24',userBg:'#22272f',aiBg:'',text:'#e8eaed',
shadow:true,border:false,buttonSize:56,radius:16,width:360,height:520,position:'bottom-left',
avatar:'',logo:'',welcome:'',placeholder:'اكتب رسالتك...',offline:'نحن غير متصلين حاليًا، اترك رسالتك وسنرد عليك قريبًا.',
online:true,typing:true,autoOpen:false,delay:3,badge:true,sound:false,mobile:'panel',createdAt:now()}}

// إصلاح: إكمال دالة chunkify
function chunkify(doc){
doc.chunks=String(doc.content||'').split(/\n+/).map(function(s){return s.trim()}).filter(function(s){return s.length>3}).map(function(s){return {text:s,toks:tokens(s)}});
doc.chunkCount=doc.chunks.length;
}

function starterKit(){
const a1={id:uid('ag_'),__demo:true,name:'موظف المبيعات',desc:'يرد على استفسارات الزوار ويساعدهم في اختيار المنتجات والأسعار.',avatar:AVT[0],instructions:'أنت موظف مبيعات ذكي، تساعد العملاء في اختيار المنتجات المناسبة.',language:'العربية',tone:'ودي واحترافي',model:'gemini-2.5-flash-lite',welcome:'أهلًا بك 👋 كيف أقدر أساعدك بالمنتجات؟'};
const a2={id:uid('ag_'),__demo:true,name:'دعم العملاء',desc:'يتابع الطلبات وسياسات الشحن والاسترجاع ويصعّد الحالات الحساسة.',avatar:AVT[1],instructions:'أنت موظف دعم عملاء متخصص.',language:'العربية',tone:'ودي واحترافي',model:'gemini-2.5-flash-lite',welcome:'أهلًا بك 👋 كيف أساعدك؟'};
const w1=defWidget(a1.id,'ويدجت المتجر');w1.__demo=true;
const w2=defWidget(a2.id,'ويدجت الدعم');w2.primary='#089e9a';w2.__demo=true;
const kb=[
{id:uid('kb_'),__demo:true,name:'المنتجات والأسعار',type:'text',agentId:a1.id,createdAt:now(),lastSync:now(),status:'ready',error:'',content:'سماعة بلوتوث برو بسعر 199 ريال.\nشاحن سريع 45 واط بسعر 89 ريال.\nعرض الباندل: سماعة + شاحن بسعر 259 ريال.',chunkCount:0},
{id:uid('kb_'),__demo:true,name:'سياسة الشحن والتوصيل',type:'text',agentId:'',createdAt:now(),lastSync:now(),status:'ready',error:'',content:'التوصيل داخل الرياض خلال 24 ساعة مجاني.\nالتوصيل خارج الرياض خلال 3 أيام برسوم 35 ريال.',chunkCount:0},
{id:uid('kb_'),__demo:true,name:'سياسة الاسترجاع',type:'text',agentId:'',createdAt:now(),lastSync:now(),status:'ready',error:'',content:'يمكن استرجاع المنتج خلال 30 يوم من الشراء بحالة جديدة وعبوته الأصلية.',chunkCount:0},
];
kb.forEach(chunkify);
return {agents:[a1,a2],widgets:[w1,w2],kb:kb,contacts:[],convos:[],
settings:{name:'مساحة عملي',type:'متجر إلكتروني',lang:'العربية',tz:'Asia/Riyadh',team:[],
onboarded:false,onboardingStep:1,obStep:1,obBuilt:false,onboardingAgentId:null,onboardingWidgetId:null,obAgentId:null,obWidgetId:null,goals:[],channels:['widget']},
plan:'free',usage:{ai:0},invoices:[]};
}

let pushTimer=null;

function save(){
persist();
if(isRemote()&&!remoteBroken&&db.ws&&db.ws.__wid){
clearTimeout(pushTimer);
pushTimer=setTimeout(function(){
pushTables(sbClient(),db.ws.__wid,db.ws).then(function(){
if(remoteBroken){remoteBroken=false;toast('عادت المزامنة مع الخادم ✔','ok');route()}
}).catch(function(err){
if(!remoteBroken){remoteBroken=true;toast('انقطعت المزامنة مع الخادم — تم الحفظ محليًا مؤقتًا. أعد المحاولة من الشريط الجانبي.','err')}})},2000)}}

const DEMO_TEXTS=['سماعة بلوتوث برو بسعر 199 ريال.\nشاحن سريع 45 واط بسعر 89 ريال.\nعرض الباندل: سماعة + شاحن بسعر 259 ريال.','سياسة التوصيل: نقدم توصيل مجاني داخل الرياض و 35 ريال خارجها.','سياسة الاسترجاع: 30 يوم عودة كاملة بدون أسئلة إذا كان المنتج بحالته الأصلية.'];

const HANDOFF=['موظف','انسان','بشري','شخص حقيقي','مختص','مسؤول'];

var engTab='secrets';

var ENG_TABS=[['secrets','١. المفاتيح والنشر'],['sql2','٢. ترحيل قاعدة البيانات'],['sql3','٣. عمود agent_id'],['sql4','٤. العزل الصارم والتشخيص']];

var ENG_SRC={secrets:'src-secrets',sql2:'src-sql2',sql3:'src-sql3',sql4:'src-sql4',ingest:'src-ingest',ai:'src-ai',verify:'src-verify',kbproc:'src-kbproc',crawl:'src-crawl',widgetjs:'src-widgetjs'};

var ENG_STEPS='<ol class="list-decimal pr-5 space-y-3 text-sm text-ink-300 leading-7"><li>شغّل ترحيل المرحلة 2 ثم «عمود agent_id» ثم «٤. العزل الصارم والتشخيص»</li><li>نسخ أكواد Edge Functions من التبويبات</li><li>نشر الـ Functions على Supabase</li></ol>';

var OB_GOALS=[['🛠️','حل الشكاوى'],['❓','الرد على الأسئلة'],['🛒','توجيه العميل للشراء'],['✨','ترشيح المنتجات'],['📅','حجز الاستشارات']];

var PAGES={'':'home',conversations:'convos',agents:'agents',widgets:'widgets',builder:'builder',contacts:'contacts',kb:'kb',analytics:'analytics',settings:'settings',backend:'backend',billing:'billing'};

var NAV=[['','الرئيسية','home'],['conversations','المحادثات','chat'],['agents','AI Agents','bot'],['widgets','Widgets','widget'],['contacts','العملاء','users'],['kb','Knowledge Base','book'],['analytics','التحليلات','chart'],['settings','الإعدادات','gear'],['billing','الخطط والفواتير','card']];

var selConvo=null;

var draft=null;
