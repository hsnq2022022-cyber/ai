async function processTextDoc(title,content,agentId){
const doc={id:uid('kb_'),name:title||content.slice(0,60),type:'text',agentId:agentId||'',content:content,status:'processing',chunks:[],chunkCount:0,createdAt:now(),error:''};
ws().kb.unshift(doc);save();refreshKbUI();
try{
if(isRemote()&&cfg&&apiBase()&&db.ws&&db.ws.__wid){
const resp=await fetch(apiBase()+'/kb-ingest',{method:'POST',headers:Object.assign({'Content-Type':'application/json','api-key':cfg.key},await authHeaders()),body:JSON.stringify({doc_id:doc.id,text:content,agent_id:agentId||null,workspace_id:db.ws.__wid})});
const j=await resp.json().catch(function(){return null});
if(!resp.ok||!j||j.error)throw new Error(arErr((j&&j.message)||('فشل حفظ المعرفة ('+resp.status+')')));
doc.status='ready';doc.chunkCount=j.chunks||0;doc.lastSync=now();
save();refreshKbUI();toast('تم حفظ المعرفة ✔ — '+doc.chunkCount+' مقطع','ok');return true;
}
chunkify(doc);doc.status='ready';doc.lastSync=now();
save();refreshKbUI();toast('تم حفظ المعرفة ✔ — '+doc.chunkCount+' مقطع أصبح جاهزًا للويدجت','ok');return true;
}catch(err){
console.error('KB text error:',err);
doc.status='error';doc.error=arErr(err.message||String(err));
save();refreshKbUI();toast('فشل حفظ المعرفة: '+doc.error,'err');return false;}}
