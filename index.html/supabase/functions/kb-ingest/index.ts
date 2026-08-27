// supabase/functions/kb-ingest/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
const json=(b,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
function chunkText(text:string,size=800,overlap=100){const clean=text.replace(/\s+/g," ").trim();const out:string[]=[];for(let i=0;i<clean.length;i+=size-overlap){const c=clean.slice(i,i+size).trim();if(c.length>20)out.push(c);}return out;}
Deno.serve(async(req)=>{
if(req.method==="OPTIONS")return new Response("ok",{headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"*"}});
try{
const body=await req.json().catch(()=>({}));
const doc_id=body.doc_id;
if(!doc_id)return json({error:"bad_request",message:"طلب غير صالح."},400);
const admin=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const authHeader=req.headers.get("Authorization")||"";
const jwt=authHeader.replace(/^Bearer\s+/i,"");
if(!jwt)return json({error:"unauthorized",message:"الجلسة غير صالحة."},401);
const{data:userData,error:userErr}=await admin.auth.getUser(jwt);
if(userErr||!userData?.user)return json({error:"unauthorized",message:"الجلسة غير صالحة."},401);
const ownerId=userData.user.id;
async function ownsWorkspace(wsId:string|null){
if(!wsId)return false;
const r=await admin.from("workspaces").select("id").eq("id",wsId).eq("owner_id",ownerId).maybeSingle();
return !!r.data;}
if(body.delete===true){
const dchk=await admin.from("knowledge_docs").select("workspace_id").eq("id",doc_id).maybeSingle();
if(!dchk.data||!(await ownsWorkspace(dchk.data.workspace_id)))return json({error:"forbidden"},403);
const d1=await admin.from("knowledge_chunks").delete().eq("doc_id",doc_id);
if(d1.error)return json({error:"delete",message:"فشل حذف المقاطع: "+d1.error.message},500);
const d2=await admin.from("knowledge_docs").delete().eq("id",doc_id);
if(d2.error)return json({error:"delete",message:"فشل حذف المستند: "+d2.error.message},500);
return json({ok:true,deleted:true});
}
const text=String(body.text||"").trim();
if(!text)return json({error:"empty",message:"النص فارغ."},422);
const dr=await admin.from("knowledge_docs").select("*").eq("id",doc_id).maybeSingle();
const row:any=dr.data;const dd:any=(row&&row.data)||{};
if(row&&body.workspace_id&&row.workspace_id!==body.workspace_id)return json({error:"forbidden"},403);
const wsId=body.workspace_id||(row?row.workspace_id:null);
if(!(await ownsWorkspace(wsId)))return json({error:"forbidden",message:"لا تملك صلاحية على مساحة العمل هذه."},403);
let agentId=body.agent_id||null;
if(!agentId)agentId=dd.agentId||null;
let targets:string[]=[];
if(agentId)targets=[agentId];
else{const ar=await admin.from("agents").select("id").eq("workspace_id",wsId);targets=(ar.data||[]).map((a:any)=>a.id);}
if(!targets.length)return json({error:"no_agent",message:"لا يوجد Agent لربط المعرفة به. أنشئ Agent أولًا."},422);
const chunks=chunkText(text).slice(0,400);
const genAI=new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY")!);
const embModel=genAI.getGenerativeModel({model:"text-embedding-004"});
await admin.from("knowledge_chunks").delete().eq("doc_id",doc_id);
const rows:any[]=[];
for(let i=0;i<chunks.length;i+=20){
const batch=chunks.slice(i,i+20);
const r=await embModel.batchEmbedContents(batch.map(c=>({content:c})));
r.embeddings.forEach((e:any,j:number)=>{targets.forEach(tg=>rows.push({workspace_id:wsId,doc_id,content:batch[j],embedding:e.values,agent_id:tg}));});
}
const ins=await admin.from("knowledge_chunks").insert(rows);
if(ins.error)return json({error:"insert",message:"فشل تخزين المقاطع: "+ins.error.message},500);
if(row){dd.status="ready";dd.chunkCount=chunks.length;dd.lastSync=Date.now();dd.error="";
await admin.from("knowledge_docs").update({data:dd}).eq("id",doc_id);}
return json({ok:true,chunks:chunks.length});
}catch(err){console.error("kb-ingest error",err);return json({error:"server",message:"فشل حفظ المعرفة: "+(err?.message||String(err))},500);}
});
