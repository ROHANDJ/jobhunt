# JobHunt Pro — Fresher Edition 🎓

A complete job application platform for freshers targeting **Software Engineering** and **Data Science / ML** roles.  
Built as a single-page app with vanilla HTML, CSS, and JS — no build tools required.

---

## 📁 Project Structure

```
jobhunt-pro/
├── index.html          ← Main HTML — all pages (sidebar, topbar, 9 page divs, modals)
├── css/
│   └── styles.css      ← All styles — CSS variables, layout, components
└── js/
    ├── data.js         ← JOBS, NEWS, ROADMAP, email templates, recruiter lists
    ├── state.js        ← Global app state (S object)
    ├── ui.js           ← Navigation, modals, toasts, search, settings
    ├── jobs.js         ← Job board: render, filter, apply, detail modal
    ├── apply.js        ← Email composer, Gmail MCP send, recruiter tags, file upload
    ├── tracker.js      ← Application tracker table + status updates
    ├── news.js         ← Tech news: live fetch via Anthropic API + web_search
    ├── resume.js       ← Resume AI: ATS score + tips via Anthropic API
    ├── profile.js      ← Profile page: skills, score, sync to composer
    ├── dashboard.js    ← Dashboard widgets: stats, chart, activity feed, roadmap
    └── main.js         ← App entry point — DOMContentLoaded init
```

---

## 🚀 Quick Start

Just open `index.html` in a browser. No build step, no npm install.

```bash
# Option 1: directly open
open index.html

# Option 2: local server (avoids CORS issues for API calls)
npx serve .
# or
python3 -m http.server 3000
```

> ⚠️ **API calls** (Gmail send, Resume AI, News fetch) require the Anthropic API to be accessible from the browser context. These work out-of-the-box on Claude.ai artifacts.

---

## 🛠️ How to Customize

### Add / Edit Jobs
Edit the `JOBS` array in `js/data.js`. Each job object:
```js
{
  id: 19,
  title: 'Junior ML Engineer',
  company: 'Startup XYZ',
  logo: '🤖',
  dom: 'ds',         // 'swe' or 'ds'
  type: 'Full-time', // or 'Internship'
  salary: '₹8-12 LPA',
  remote: true,
  intern: false,
  exp: '0-1 yr',
  posted: '1h ago',
  desc: 'Job description here.',
  tags: ['Python', 'PyTorch', 'SQL'],
  rec: 'jobs@startupxyz.com',
}
```

### Change Theme Colors
Edit CSS variables in `css/styles.css`:
```css
:root {
  --accent: #7c6dfa;   /* primary purple */
  --green:  #34d399;   /* success green  */
  --orange: #fb923c;   /* warning orange */
  --sky:    #38bdf8;   /* info sky blue  */
}
```

### Add Email Templates
Add a new function to the `EMAIL_VARIATIONS` array in `js/data.js`:
```js
(name, role, skills, college) => `Dear Team,\n\nI'm ${name}...`
```

### Change Recruiter Lists
Edit `INDIAN_IT_RECRUITERS` and `MNC_RECRUITERS` arrays in `js/data.js`.

### Update the Roadmap
Edit the `ROADMAP` array in `js/data.js`. Each phase:
```js
{
  icon: '🧠',
  title: 'Phase X: Topic',
  sub: 'Short description',
  status: 'Label',
  sc: 'var(--green)',  // color variable
  items: ['Resource 1', 'Resource 2', 'Resource 3'],
}
```

---

## 🔌 API Integrations

### Gmail MCP (Auto Apply)
Located in `js/apply.js` → `sendEmails()`:
```js
mcp_servers: [{ type: 'url', url: 'https://gmail.mcp.claude.com/mcp', name: 'gmail-mcp' }]
```
Sends your cover letter + resume to each recruiter email via your connected Gmail.

### Anthropic API (Resume AI + News)
- **Model**: `claude-sonnet-4-20250514`
- **Resume AI** (`js/resume.js`): Analyzes resume vs JD, returns JSON with ATS score + tips
- **News** (`js/news.js`): Uses `web_search_20250305` tool to fetch live headlines

To swap the model, change the `model` field in any `fetch` call.

---

## 💡 Ideas for Improvement

| Feature | Where to add |
|---------|-------------|
| LocalStorage persistence | `js/state.js` — save/load `S` on change |
| Real job API (e.g. Adzuna) | `js/data.js` — replace static JOBS |
| Email tracking (open rates) | `js/apply.js` — add tracking pixel |
| Cover letter generator page | New page + `js/coverletter.js` |
| Interview scheduler | New page + Google Calendar MCP |
| Dark/light mode toggle | `css/styles.css` + `js/ui.js` |
| Pagination for job board | `js/jobs.js` → `renderJobCards()` |
| Resume PDF parser | `js/resume.js` → send base64 PDF to API |
| Notification system | `js/ui.js` + Service Workers |
| Multi-language support | `js/data.js` — i18n strings |

---

## 📦 Tech Stack

- **HTML5** — semantic structure
- **CSS3** — custom properties, grid, flexbox, animations
- **Vanilla JS** — no framework, no bundler
- **Google Fonts** — Syne, DM Sans, DM Mono
- **Anthropic API** — claude-sonnet-4-20250514
- **Gmail MCP** — `https://gmail.mcp.claude.com/mcp`

---

## 📄 License

MIT — free to use, modify, and distribute.
