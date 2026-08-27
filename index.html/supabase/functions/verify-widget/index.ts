// supabase/functions/verify-widget/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";
const CORS={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, api-key, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(b,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...CORS,"Content-Type":"application/json"}});
Deno.serve(async(req)=>{
if(req.method==="OPTIONS")return new Response("ok",{headers:CORS});
try{
const {widget_id,token}=await req.json().catch(()=>({}));
if(!widget_id||!token)return json({error:"bad_request"},400);
const admin=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const {data:widgetRow}=await admin.from("widgets").select("id, workspace_id, data").eq("id",String(widget_id)).maybeSingle();
if(!widgetRow)return json({error:"invalid_widget"},403);
const wd:any=widgetRow.data??{};
if(typeof wd.token!=="string"||wd.token!==String(token))return json({error:"invalid_widget",message:"التوكن غير صحيح."},403);
if(wd.enabled===false)return json({error:"disabled"},403);
if(!wd.agentId)return json({error:"no_agent"},500);
const {data:agentRow}=await admin.from("agents").select("data").eq("id",String(wd.agentId)).maybeSingle();
const ad:any=agentRow?.data??{};
const {data:wsRow}=await admin.from("workspaces").select("plan").eq("id",widgetRow.workspace_id).maybeSingle();
return json({ok:true,widget_id,agent:{name:ad.name||"مساعدك الذكي",avatar:ad.avatar||""},settings:{
name:wd.name||ad.name||"مساعدك الذكي",welcome:wd.welcome||ad.welcome||"أهلًا بك 👋",
placeholder:wd.placeholder||"اكتب رسالتك...",offline:wd.offline||"نحن غير متصلين حاليًا.",
primary:wd.primary||"#0ABAB5",secondary:wd.secondary||"#0b514f",header:wd.header||"",bg:wd.bg||"#1a1e24",
userBg:wd.userBg||"#22272f",aiBg:wd.aiBg||"",text:wd.text||"#e8eaed",shadow:wd.shadow!==false,border:!!wd.border,
buttonSize:typeof wd.buttonSize==="number"?wd.buttonSize:56,radius:typeof wd.radius==="number"?wd.radius:16,
width:typeof wd.width==="number"?wd.width:360,height:typeof wd.height==="number"?wd.height:520,
position:wd.position||"bottom-left",avatar:wd.avatar||ad.avatar||"",logo:wd.logo||"",
online:wd.online!==false,typing:wd.typing!==false,autoOpen:!!wd.autoOpen,
delay:typeof wd.delay==="number"?wd.delay:3,badge:wd.badge!==false,sound:!!wd.sound,
mobile:wd.mobile==="full"?"full":"panel",credit:(wsRow?.plan||"free")==="free"}});
}catch(err){console.error(err);return json({error:"server"},500);}
});
