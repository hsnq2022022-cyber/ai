alter table public.knowledge_chunks add column if not exists agent_id text;
create index if not exists chunks_agent_idx on public.knowledge_chunks(agent_id);
-- (استُبدلت في ترحيل المرحلة 4 بالدالة الصارمة — راجع تبويب «٤. العزل الصارم والتشخيص»)
