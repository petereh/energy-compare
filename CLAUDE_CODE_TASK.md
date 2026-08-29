# Task: Wire up upload + compare flow and deploy

I've written the core files below. Please do the following:

## 1. Install dependencies
```bash
npm install @supabase/supabase-js @anthropic-ai/sdk pdf-parse
npm install --save-dev @types/pdf-parse
```

## 2. Place these files exactly at these paths (create folders as needed):
- `lib/supabase.ts`
- `lib/extraction-prompt.ts`
- `app/api/upload/route.ts`
- `app/api/compare/route.ts`
- `app/page.tsx` (replace the existing default page)
- `app/results/[id]/page.tsx`

## 3. Add the serif font for headings
In `app/layout.tsx`, add a Google font import for a serif display face (e.g. `Fraunces`
or `Newsreader` via `next/font/google`) and apply it via a `font-serif` Tailwind class
or CSS variable — the pages use `font-serif` for headings. If Tailwind's default serif
stack is already acceptable, this step can be skipped, but check the headings render
with visual weight, not plain browser serif.

## 4. Verify environment variables are present
Check `.env` has (already synced via Stripe Projects + the anthropic-key variable):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`

If `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are named differently in `.env`
(e.g. `NEXT_PUBLIC_SUPABASE_URL`), update `lib/supabase.ts` to match the actual names.

## 5. Test locally
```bash
npm run dev
```
Upload one of the real Electric Ireland bill PDFs, confirm:
- It redirects to `/results/[id]`
- The results page shows a ranked list of plans with estimated costs
- Check Supabase table editor: confirm rows landed in `bill_uploads`, `bill_rates`,
  and `comparison_results`

## 6. Fix whatever breaks
Common things to check if it doesn't work first try:
- `pdf-parse` sometimes needs the `require()` import style in Next.js server routes
  (already done this way in the file) rather than `import` — if there's a build error
  about a missing test PDF file, this is why.
- Confirm the `plans`/`plan_rates` seed data is present (should be from earlier —
  11 plans, ~19 rates across Electric Ireland, Energia, Bord Gáis Energy).
- If Claude's extraction returns malformed JSON occasionally, that's expected at low
  rates — the route already strips code fences defensively, but log failures to see
  if the prompt needs tightening.

## 7. Push and deploy
```bash
git add .
git commit -m "Add upload and compare flow"
git push
```
Vercel auto-deploys from the GitHub connection already set up. Confirm the live URL
works end to end with a real bill upload.

## 8. Add production env vars to Vercel if not already there
In Vercel dashboard → Project → Settings → Environment Variables, confirm
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `ANTHROPIC_API_KEY` are all present
for the Production environment (Stripe Projects only synced them locally).
