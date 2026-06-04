# Supabase Auth Email Templates (MyVitrine)

Branded OTP email for passwordless sign-in (`signInWithOtp`). Designed **light-first** so Outlook / Apple Mail dark-mode inversion still reads as intentional gallery white, not broken transparency.

## Files

| File | Use |
|------|-----|
| `email-otp.html` | HTML body — paste into Supabase Dashboard |
| `email-otp-subject.txt` | Email subject line |
| `email-otp-plain.txt` | Optional plain-text body (recommended) |

## Where to paste (Supabase Dashboard)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → project **fxmiongkckkrllgyfwyw**
2. **Authentication** → **Email Templates**
3. Select **Magic Link** (this template is used for email OTP / `signInWithOtp`, even when you only send a code)
4. **Subject:** copy from `email-otp-subject.txt`
5. **Body (HTML):** copy entire contents of `email-otp.html`
6. If the UI offers a plain-text field, paste `email-otp-plain.txt`
7. Save

> **Local CLI (optional):** If you add `supabase/config.toml`, you can point `[auth.email.template.magic_link]` at `content_path = "./supabase/templates/auth/email-otp.html"` for local GoTrue. Production still uses Dashboard unless you manage config via deploy.

## Logo URL (upload script)

The HTML references a **solid-background** app icon (not transparent) for Outlook dark-mode safety:

```
https://fxmiongkckkrllgyfwyw.supabase.co/storage/v1/object/public/brand-assets/logos/icon.png
```

**Upload from repo root** (requires `SUPABASE_SERVICE_ROLE_KEY` in `apps/native/.env` or your shell):

```bash
pnpm upload:auth-email-icon
```

Script: [`supabase/scripts/upload-auth-email-icon.mjs`](../../scripts/upload-auth-email-icon.mjs) — copies `apps/native/assets/icon.png` → `brand-assets/logos/icon.png` with `upsert: true`.

Manual fallback: Dashboard → **Storage** → public bucket `brand-assets` → upload `logos/icon.png`.

## Template variables (Supabase / GoTrue)

| Variable | Purpose |
|----------|---------|
| `{{ .Token }}` | 6-digit OTP — **required**; also drives iOS QuickType autofill when prominent |
| `{{ .Email }}` | Recipient address (shown in footer) |
| `{{ .SiteURL }}` | Project site URL (available if needed) |

Do not rename `{{ .Token }}` — the app verifies this value via `verifyOtp`.

## Design notes

- **Light canvas** `#f7f5f2`, white card, charcoal type — matches Vitrine “white cube” email legibility
- **Logo cell** `#111111` matches `icon.png` black background so inversion does not halo
- **Code** large, monospace, letter-spaced — helps iOS/Android one-tap code autofill
- **`color-scheme: light`** meta hints reduce forced dark rewrites where clients respect it

## OTP expiry

Copy says “one hour.” Confirm **Authentication → Providers → Email** → OTP expiry matches (default is often 3600s). Update the HTML/plain text if you change it.

## Test

1. Request a sign-in code from the app (dev or prod)
2. Check inbox — light card, black logo tile, 6-digit code
3. On iOS: tap the code suggestion above the keyboard on the OTP screen
4. Open the same message in **Outlook** (mobile + desktop) with dark mode on — logo and code should remain readable

## Related app surfaces

- Native OTP UI: `apps/native/components/auth-screen.tsx`
- Send / verify: `apps/native/lib/supabase.ts` (`sendEmailOtp`, `verifyEmailOtp`)
