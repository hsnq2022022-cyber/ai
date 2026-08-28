create extension if not exists vector;
create table if not exists public.knowledge_chunks (
id uuid primary key default gen_random_uuid(),
workspace_id uuid not null references public.workspaces(id) on delete cascade,
doc_id text not null, content text not null, embedding vector(768),
created_at timestamptz default now());
create index if not exists chunks_ws_idx on public.knowledge_chunks(workspace_id);
create index if not exists chunks_doc_idx on public.knowledge_chunks(doc_id);
create index if not exists chunks_hnsw_idx on public.knowledge_chunks using hnsw (embedding vector_cosine_ops);
alter table public.knowledge_chunks enable row level security;
drop policy if exists chunks_member on public.knowledge_chunks;
create policy chunks_member on public.knowledge_chunks for all
using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()))
with check (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));
create or replace function public.increment_ai_usage(wsid uuid) returns void language sql security definer as $$
update public.workspaces set usage_ai = usage_ai + 1 where id = wsid; $$;
create or replace function public.enforce_agent_limit() returns trigger language plpgsql security definer as $$
declare v_plan text; v_count int; v_limit int;
begin
select plan into v_plan from public.workspaces where id = NEW.workspace_id;
v_limit := case when v_plan='growth' then 10 when v_plan='pro' then 999 else 8 end;
select count(*) into v_count from public.agents where workspace_id = NEW.workspace_id;
if v_count >= v_limit then raise exception 'AGENT_LIMIT_REACHED'; end if;
return NEW;
end; $$;
drop trigger if exists trg_agent_limit on public.agents;
create trigger trg_agent_limit before insert on public.agents for each row execute function public.enforce_agent_limit();
insert into storage.buckets (id,name,public) values ('kb-files','kb-files',false) on conflict (id) do nothing;
drop policy if exists kb_files_member on storage.objects;
create policy kb_files_member on storage.objects for all
using (bucket_id='kb-files' and (auth.uid() in (select owner_id from public.workspaces where id::text=(storage.foldername(name))[1])))
with check (bucket_id='kb-files' and (auth.uid() in (select owner_id from public.workspaces where id::text=(storage.foldername(name))[1])));
