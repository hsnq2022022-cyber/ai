const apiBase=()=>(cfg&&cfg.url)?cfg.url.replace(/\/+$/,'')+'/functions/v1':null;

function sbClient(){if(!cfg||!cfg.url||!cfg.key)return null;if(!window.supabase)return null;
if(!sb){try{sb=window.supabase.createClient(cfg.url,cfg.key)}catch(e){return null}}return sb}

const isRemote=()=>!!sbClient();

function useLocalMode(){cfg=null;sb=null;remoteBroken=false;closeModal();toast('تم التحويل للوضع المحلي — بياناتك تُحفظ على هذا الجهاز','ok');route()}

async function pushTables(c,wid,s){
const T={agents:s.agents,widgets:s.widgets,knowledge_docs:s.kb,contacts:s.contacts,conversations:s.convos,invoices:s.invoices};
for(const t in T){
const r1=await c.from(t).delete().eq('workspace_id',wid);if(r1.error)throw r1.error;
if(T[t]&&T[t].length){const r2=await c.from(t).insert(T[t].map(function(x){return {id:x.id,workspace_id:wid,data:x}}));if(r2.error)throw r2.error;}}
const r3=await c.from('workspaces').update({name:s.settings.name,type:s.settings.type,lang:s.settings.lang,tz:s.settings.tz,team:s.settings.team,plan:s.plan,usage_ai:s.usage.ai}).eq('id',wid);
if(r3.error)throw r3.error;}

async function loadRemote(){
const c=sbClient();if(!c||!remoteUser)return false;
const prevSet=(db&&db.ws&&db.ws.settings)?db.ws.settings:null;
let q;
try{q=await c.from('workspaces').select('*').eq('owner_id',remoteUser.id).maybeSingle()}
catch(e){toast('تعذر الوصول إلى قاعدة البيانات — تحقق من الإنترنت','err');return false}
if(q.error){toast(/permission|policy/i.test(q.error.message)?'خطأ صلاحيات — تأكد من تفعيل سياسات RLS':'تعذر الاتصال بقاعدة البيانات','err');return false}
let wsRow=q.data;
if(!wsRow){wsRow=await provisionRemote(c);if(!wsRow)return false}
db.ws={__wid:wsRow.id,settings:{name:wsRow.name||'مساحة عمل',type:wsRow.type||'',lang:wsRow.lang||'العربية',tz:wsRow.tz||'Asia/Riyadh',team:wsRow.team||[],
onboarded:(prevSet&&prevSet.onboarded===true),goals:(prevSet&&prevSet.goals)||[],channels:(prevSet&&prevSet.channels)||['widget'],
onboardingStep:(prevSet&&prevSet.onboardingStep)||1,obStep:(prevSet&&prevSet.obStep)||1,obBuilt:!!(prevSet&&prevSet.obBuilt),
onboardingAgentId:(prevSet&&prevSet.onboardingAgentId)||null,onboardingWidgetId:(prevSet&&prevSet.onboardingWidgetId)||null,
obAgentId:(prevSet&&prevSet.obAgentId)||null,obWidgetId:(prevSet&&prevSet.obWidgetId)||null},
plan:wsRow.plan||'free',usage:{ai:wsRow.usage_ai||0},agents:[],widgets:[],kb:[],contacts:[],convos:[],invoices:[]};
const tabs=[['agents','agents'],['widgets','widgets'],['knowledge_docs','kb'],['contacts','contacts'],['conversations','convos'],['invoices','invoices']];
for(const p of tabs){const r=await c.from(p[0]).select('data').eq('workspace_id',wsRow.id);db.ws[p[1]]=(r.data||[]).map(function(x){return x.data})}
db.ws.convos.sort(function(a,b){return (b.updatedAt||0)-(a.updatedAt||0)});
return true;}

async function provisionRemote(c){
const kit=starterKit();
const r=await c.from('workspaces').insert({owner_id:remoteUser.id,name:kit.settings.name,type:kit.settings.type,lang:kit.settings.lang,tz:kit.settings.tz,team:kit.settings.team,plan:'free',usage_ai:0}).select().single();
if(r.error){toast('تعذر إنشاء مساحة العمل: '+r.error.message,'err');return null}
await pushTables(c,r.data.id,kit);return r.data;}

async function sbUpsert(table,row){
const c=sbClient();if(!c||!db.ws||!db.ws.__wid)throw new Error('الاتصال بقاعدة البيانات غير متوفر');
const clean=Object.assign({},row);delete clean.__unsynced;
const r=await c.from(table).upsert({id:clean.id,workspace_id:db.ws.__wid,data:clean},{onConflict:'id'});
if(r.error)throw new Error(r.error.message||'فشل الحفظ في قاعدة البيانات');}

async function sbDeleteRow(table,id){
const c=sbClient();if(!c||!db.ws||!db.ws.__wid)throw new Error('الاتصال بقاعدة البيانات غير متوفر');
const r=await c.from(table).delete().eq('id',id);if(r.error)throw new Error(r.error.message||'فشل الحذف من قاعدة البيانات');}

async function syncWidgetToServer(w){
const ag=ws().agents.find(function(a){return a.id===w.agentId});
if(ag)await sbUpsert('agents',ag);
await sbUpsert('widgets',w);
if(w.__unsynced)delete w.__unsynced;}
