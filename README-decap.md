
Library site — Decap CMS ready (automatically generated)

What I changed
- Created `/content/data.json` which holds announcements, staff, books and e-resources data.
- Added `/admin/index.html` and `/admin/config.yml` (Decap CMS) configured to edit `content/data.json` via a file collection.
- Modified pages (announcements.html, staff.html, books.html, e-resources.html, notes.html, question-papers.html) to load content from `/content/data.json` dynamically using `main.js`.
- Kept styling and other assets intact.

How to deploy on Netlify (summary)
1. Create a GitHub repository and push the contents of this folder (recommended branch: main).
   git init
   git add .
   git commit -m "Initial site with Decap CMS support"
   git branch -M main
   git remote add origin https://github.com/YOURUSERNAME/YOURREPO.git
   git push -u origin main

2. On Netlify: Create a new site -> Git -> Connect to GitHub -> choose your repo -> Deploy site (no build command required if this is pure static HTML; publish directory is the repo root).

3. In Netlify site settings -> Identity: Enable Identity service. Under Services, enable Git Gateway (this will allow the CMS to write to the GitHub repo).

4. Under Deploys -> Build & deploy, ensure branch is 'main' (or whatever you used).

5. Visit https://YOUR-SITE.netlify.app/admin/ to open the CMS. Sign up / invite users via Netlify Identity and log in to edit content.

Notes & troubleshooting
- If you prefer to use direct GitHub backend instead of Git Gateway, change `backend.name` to `github` in `admin/config.yml` and add `repo: owner/repo`.
- If uploads fail, make sure `media_folder` exists or adjust paths in `admin/config.yml`.
- The current `content/data.json` is human-editable and also editable via the CMS. I populated it with sample data extracted from your announcements and placeholder staff/books.

