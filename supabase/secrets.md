supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# هذي الدالتين تستقبل زوار الموقع (بدون تسجيل دخول) وتتحقق من widget token يدويًا داخل الكود — تبقى بدون verify-jwt:
supabase functions deploy ai-respond    --no-verify-jwt
supabase functions deploy verify-widget --no-verify-jwt

# هذي الثلاث تستدعى فقط من لوحة التحكم (مستخدم مسجّل دخول)، وصارت تتحقق من JWT + ملكية مساحة العمل داخل الكود —
# لازم تُنشر بدون --no-verify-jwt حتى تفرض Supabase نفسها وجود جلسة صالحة قبل حتى ما توصل للكود:
supabase functions deploy kb-process
supabase functions deploy kb-crawl
supabase functions deploy kb-ingest
