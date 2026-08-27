-- إدارة ســوشـــيــــال — Phase 4: عزل صارم بين الوكلاء + أدوات تشخيص
create or replace function public.match_kb_chunks_agent(ws uuid, ag text, q vector, match_count int default 4)
returns table (doc_id text, content text, similarity float) language sql stable as $$
select c.doc_id, c.content, 1 - (c.embedding <=> q) as similarity
from public.knowledge_chunks c
where c.workspace_id = ws and c.embedding is not null and c.agent_id = ag
order by c.embedding <=> q limit match_count; $$;
create or replace view public.kb_diagnostics as
select d.id as doc_id, d.workspace_id, d.data->>'name' as name, d.data->>'type' as type,
d.data->>'status' as status, d.data->>'agentId' as agent_id,
(select count(*) from public.knowledge_chunks c where c.doc_id = d.id) as chunks_total,
(select count(*) from public.knowledge_chunks c where c.doc_id = d.id and c.embedding is not null) as embeddings,
(select count(distinct c.agent_id) from public.knowledge_chunks c where c.doc_id = d.id) as agents_linked
from public.knowledge_docs d;
