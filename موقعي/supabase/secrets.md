supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_API_KEY
supabase functions deploy ai-respond    --no-verify-jwt
supabase functions deploy verify-widget --no-verify-jwt
supabase functions deploy kb-process    --no-verify-jwt
supabase functions deploy kb-crawl      --no-verify-jwt
supabase functions deploy kb-ingest     --no-verify-jwt
