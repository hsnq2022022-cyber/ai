// supabase/functions/ai-respond/index.ts — RAG صارم (temperature=0.1) بدون هلوسة
import { createClient } from "npm:@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
const CORS={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, api-key, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(b,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...CORS,"Content-Type":"application/json"}});
const PLAN_LIMITS:Record<string,number>={free:500,growth:5000,pro:50000};
const NO_INFO="عذراً، هذه المعلومة غير متوفرة لدي حالياً، هل أستطيع تحويلك لأحد موظفي الدعم؟";
const HANDOFF=["موظف","انسان","بشري","شخص حقيقي","مختص","مسؤول"];
const norm=(s:string)=>s.replace(/[\u064B-\u0652\u0640]/g,"").replace(/[أإآ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").toLowerCase();
function classify(messages:any[],status:string){
const t=norm(messages.filter(m=>m.from==="visitor").map(m=>String(m.text||"")).join(" "));
let score=0;const tags:string[]=[];
if(/(سعر|بكم|يكلف|تكلف)/.test(t)){score+=10;tags.push("سأل عن السعر");}
if(/(توصيل|شحن|يوصل)/.test(t)){score+=15;tags.push("سأل عن التوصيل");}
if(/(دفع|فيزا|مدي|بطاقه|كاش|تحويل بنكي)/.test(t)){score+=20;tags.push("سأل عن الدفع");}
if(/(اريد اطلب|ابغي اطلب|ابى اطلب|اطلب الان|اشتري|اريد الشراء|احجز)/.test(t)){score+=40;tags.push("نية شراء");}
if(/(موظف|انسان|بشري)/.test(t))tags.push("طلب موظف");
score=Math.min(score,100);
let cls="استفسار عام";
if(status==="handoff")cls="يحتاج متابعة";
else if(score>=60)cls="مشتري"; else if(score>=40)cls="عميل محتمل"; else if(score>=15)cls="مهتم";
return {score,cls,tags};
}
Deno.serve(async(req)=>{
if(req.method==="OPTIONS")return new Response("ok",{headers:CORS});
try{
const {widget_id,token,message,conversation_id}=await req.json().catch(()=>({}));
if(!widget_id||!token)return json({error:"bad_request",message:"طلب غير صالح."},400);
const text=String(message??"").trim();
if(!text)return json({error:"empty"},400);
if(text.length>500)return json({error:"too_long"},400);
const admin=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const {data:widgetRow}=await admin.from("widgets").select("*").eq("id",String(widget_id)).maybeSingle();
const wd:any=widgetRow?.data??{};
if(!widgetRow||typeof wd.token!=="string"||wd.token!==String(token))return json({error:"invalid_widget"},403);
if(wd.enabled===false)return json({error:"disabled"},403);
if(!wd.agentId)return json({error:"no_agent"},500);
const wsId=widgetRow.workspace_id,agentId=String(wd.agentId);
const {data:wsRow}=await admin.from("workspaces").select("*").eq("id",wsId).maybeSingle();
if(!wsRow)return json({error:"no_workspace"},404);
if((wsRow.usage_ai||0)>=(PLAN_LIMITS[wsRow.plan||"free"]??500))return json({error:"limit",message:"تم تجاوز الحد الشهري لرسائل الذكاء الاصطناعي. الرجاء ترقية الخطة."},429);
const {data:agentRow}=await admin.from("agents").select("*").eq("id",agentId).maybeSingle();
if(!agentRow)return json({error:"no_agent"},500);
const ad:any=agentRow.data??{};
let conv:any=null;
if(conversation_id){const r=await admin.from("conversations").select("*").eq("id",String(conversation_id)).maybeSingle();conv=r.data||null;}
const cd:any=conv?.data||{status:"active",messages:[],contactId:null};
if(cd.status==="handoff"&&!HANDOFF.some(k=>norm(text).includes(norm(k))))return json({handoff_locked:true,message:"هذه المحادثة بيد فريق الدعم الآن، سيتولى موظف بشري الرد."});
if(HANDOFF.some(k=>norm(text).includes(norm(k)))){
cd.status="handoff";cd.messages=cd.messages||[];cd.messages.push({from:"visitor",text,at:Date.now()});cd.updatedAt=Date.now();
if(conv)await admin.from("conversations").update({data:cd}).eq("id",conv.id);
return json({reply:"أكيد، حولتك للموظف المختص الآن ✋ سيتابع معك خلال دقائق.",handoff:true,conversation_id:conv?.id||null});
}
const apiKey=Deno.env.get("GEMINI_API_KEY");
if(!apiKey)return json({error:"server",message:"عذرًا، حصل خطأ مؤقت. حاول مرة ثانية."},500);
const genAI=new GoogleGenerativeAI(apiKey);
const qVec=(await genAI.getGenerativeModel({model:"text-embedding-004"}).embedContent(text)).embedding.values as number[];
const {data:hits}=await admin.rpc("match_kb_chunks_agent",{ws:wsId,ag:agentId,q:qVec,match_count:4});
const context=(hits||[]).filter((h:any)=>h.similarity>=0.55).map((h:any)=>h.content).join("\n---\n");
const history=(cd.messages||[]).slice(-10).filter((m:any)=>m.from==="visitor"||m.from==="ai")
.map((m:any)=>({role:m.from==="visitor"?"user" as const:"model" as const,parts:[{text:String(m.text)}]}));
const sys=[ad.instructions||"أنت موظف خدمة عملاء.",
"أنت موظف خدمة عملاء لمنصة إدارة ســوشـــيــــال. وظيفتك الوحيدة هي الإجابة بناءً على السياق المرفق فقط (Context).",
"إذا كان السؤال خارج السياق، أو يطلب أسعاراً أو خدمات أو منتجات أو مواعيد أو سياسات أو أرقاماً غير مذكورة في السياق، قل نصاً حرفياً:",
'"'+NO_INFO+'"',
"يمنع منعاً باتاً اختراع أي معلومات أو الاعتماد على معرفتك العامة أو تقدير أي أرقام أو تفاصيل.",
"كن مختصراً وطبيعياً. احترم لغة المستخدم واللهجة المحددة للـ Agent.",
context?"المعلومات الموثقة من قاعدة المعرفة (السياق الوحيد المسموح بالاعتماد عليه):\n"+context:"لا يوجد سياق متاح بخصوص هذا السؤال. يجب أن ترد بالنص الحرفي المحدد أعلاه فقط واعرض التحويل لموظف."].join("\n");
const model=genAI.getGenerativeModel({model:ad.model||"gemini-2.5-flash-lite",temperature:0.1,systemInstruction:sys});
const chat=model.startChat({history});
const res=await chat.sendMessage(text);
const reply=res.response.text().trim()||NO_INFO;
cd.messages=cd.messages||[];
cd.messages.push({from:"visitor",text,at:Date.now()},{from:"ai",text:reply,at:Date.now()});
cd.updatedAt=Date.now();
if(cd.contactId){
const cr=await admin.from("contacts").select("*").eq("id",cd.contactId).maybeSingle();
if(cr.data){const cud:any=cr.data.data||{};const cl=classify(cd.messages,cd.status);
cud.leadScore=cl.score;cud.class=cl.cls;cud.lastSeen=Date.now();
cud.tags=[...new Set([...(cud.tags||[]),...cl.tags])].slice(0,12);
await admin.from("contacts").update({data:cud}).eq("id",cr.data.id);}
}
if(conv)await admin.from("conversations").update({data:cd}).eq("id",conv.id);
await admin.rpc("increment_ai_usage",{wsid:wsId});
return json({reply,handoff:false,conversation_id:conv?.id||null});
}catch(err){console.error(err);return json({error:"server",message:"عذرًا، حصل خطأ مؤقت. حاول مرة ثانية."},500);}
});
