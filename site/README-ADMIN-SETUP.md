# Admin Panel Setup — Giri Photography

This adds a login-protected dashboard at `/admin` where your client can:
- Add/replace photos in each of the 10 portfolio categories
- Edit the price shown for each service on the Services page

## What's in this package

```
admin/
  index.html          → the admin login/dashboard page
  config.yml          → tells the dashboard what to show and where to save it
data/
  services.json        → editable prices (already filled with current values)
  portfolio/*.json      → editable photo lists, one file per category
                          (already filled with your current photos)
portfolio.js            → updated: now loads photos from data/portfolio/*.json
service.js               → updated: now loads prices from data/services.json
portfolio.css            → small addition (loading-state style)
service.html             → updated: added an id to each price so it can be filled in automatically
```

## One-time setup (you do this, not the client)

**Step 1 — Put the site on GitHub**
1. Create a free GitHub account if you don't have one.
2. Create a new repository and upload your entire site's files into it —
   your existing files (index.html, css/, js/, service/, etc.) *plus* all the
   new files from this package, merged in at the same folder level.
3. In Netlify: go to your site → **Site settings → Build & deploy → Link repository**,
   and connect it to this new GitHub repo. Netlify will now redeploy automatically
   every time the repo changes.

**Step 2 — Turn on login (Netlify Identity + Git Gateway)**
1. In your Netlify site dashboard: **Site settings → Identity → Enable Identity**
2. Same page → scroll to **Registration** → set to "Invite only" (so random people
   can't sign themselves up)
3. **Site settings → Identity → Services → Git Gateway → Enable Git Gateway**
   (this is what lets a logged-in client save changes without needing their own
   GitHub account)
4. Go to the **Identity** tab (top of your Netlify dashboard) → **Invite users** →
   enter your client's email. They'll get an email to set a password.

That's it — no more setup needed after this.

## What your client does from here on

1. Go to `yoursite.com/admin`
2. Log in with the email/password from the invite
3. **Photo Categories** → pick a category → add or replace photos → Publish
4. **Service Pricing** → pick a service → change the number → Publish
5. Site updates live within about a minute of clicking Publish

## Notes

- Uploaded photos are saved into the `service/` folder in your repo, matching
  where your existing images already live.
- The existing `data/portfolio/*.json` files were pre-filled with your current
  photos, so nothing changes on the live site until the client actually edits
  something.
- If you'd rather keep managing prices/photos yourself instead of handing this
  to the client, you can ignore `/admin` entirely and just edit these same
  JSON files directly in GitHub — the site reads from them either way.
