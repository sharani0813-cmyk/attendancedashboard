# TimeCard — Employee Attendance Dashboard (Live / Shared)

A static HTML/CSS/JS dashboard where HR logs attendance and everyone viewing
the page — you and your friends, on any device — sees the same data update
**live**, powered by Firebase Firestore (free tier).

## Files
- `index.html` — page structure (header, form, report table, live indicator)
- `style.css` — dashboard styling, responsive layout, status badges
- `script.js` — validation, attendance % calculation, real-time Firestore sync
- `firebase-config.js` — **you fill this in** with your own Firebase project keys
- `firestore.rules` — security rules to paste into your Firebase project

## 1. Create a free Firebase project (5 minutes)

1. Go to https://console.firebase.google.com and click **Add project**
   (you can turn off Google Analytics, it's not needed).
2. Once created, click the **</> (web)** icon to register a web app.
   Give it any nickname — you don't need hosting from Firebase.
3. Firebase will show you a `firebaseConfig` object. Copy it.
4. Open `firebase-config.js` in this project and paste your values in,
   replacing the placeholders.
5. In the left sidebar go to **Build → Firestore Database → Create database**.
   Start in **production mode**, pick any region close to you.
6. Go to the **Rules** tab of Firestore, paste in the contents of
   `firestore.rules` from this project, and click **Publish**.

That's it — no backend server, no API keys to hide (Firebase web config is
meant to be public; access is controlled by the rules you just published).

## 2. Run locally

Because `script.js` uses ES module imports, open it through a local server
(not by double-clicking the file):

```bash
cd attendance-dashboard
python3 -m http.server 8000
# open http://localhost:8000
```

Open it in two browser tabs (or share your local network URL with a friend
on the same wifi) — add an entry in one tab and watch it appear instantly
in the other.

## 3. Push to GitHub

```bash
cd attendance-dashboard
git init
git add .
git commit -m "Live employee attendance dashboard"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

Create the empty repo first at https://github.com/new (don't add a README
there, to avoid a conflict with the push).

## 4. Deploy to Vercel

**Option A — Vercel website (no CLI):**
1. Go to https://vercel.com/new
2. Import the GitHub repo you just pushed
3. Framework preset: **Other** — leave Build Command / Output Directory blank
4. Click **Deploy**

**Option B — Vercel CLI:**
```bash
npm i -g vercel
cd attendance-dashboard
vercel        # preview deploy
vercel --prod # production deploy
```

You'll get a live URL like `https://your-repo-name.vercel.app` — send that
link to your friends and everyone will see the same live attendance table.

## Notes on the open rules

`firestore.rules` currently allows anyone with your Firebase project to read
and write the `attendance` collection — fine for a personal project shared
with friends. If you ever want to lock it down (e.g. only you can add
entries), the next step is adding Firebase Authentication and changing the
rule to `allow write: if request.auth != null;`. Ask if you'd like that added.
