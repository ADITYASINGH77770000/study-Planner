# 🍅 Mood-Based Study Planner

An AI-powered study planner that adapts to your mood, analyzes your notes, and suggests music.

## ✨ Features

- 🧠 **Mood-Based Planning** — 5 mood states, each with tailored session lengths & strategies
- 📎 **Upload Notes** — Drop PDFs, images, or text files → AI extracts topics, weak areas & key formulas
- 🤖 **Claude AI** (Anthropic) — Best for PDF & image analysis, nuanced plans
- ✨ **Gemini AI** (Google) — Free tier available, great for text-based analysis
- 🎵 **Music Guide** — Curated playlists for studying AND after studying, by mood
- 📊 **Mood History** — Track patterns over time
- 📚 **Subject Manager** — Auto-populated from your notes

---

## 🚀 Quick Start

### 1. Install & Run

```bash
npm install
npm run dev
```

Then open http://localhost:5173

### 2. Get Your API Key

**Claude (Anthropic)** — Best results, supports PDF/image upload:
- Go to https://console.anthropic.com/
- Create an account → API Keys → Create Key
- Copy key starting with `sk-ant-...`

**Gemini (Google)** — Free tier, great for text notes:
- Go to https://aistudio.google.com/app/apikey
- Sign in with Google → Create API Key
- Copy key starting with `AIza...`

### 3. Add Key in Settings

Open the app → click ⚙️ Settings → paste your key → start using!

---

## 📁 Project Structure

```
study-planner/
├── src/
│   ├── main.jsx          # React entry point
│   ├── App.jsx           # Main app (all screens)
│   ├── aiService.js      # Claude + Gemini API calls
│   └── musicData.js      # Mood-based music suggestions
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🔒 Privacy

- API keys are stored **only in browser memory** (not localStorage)
- Keys are cleared when you close the tab
- Files are sent directly to the AI provider (Anthropic/Google), never to any third-party server

---

## 🎵 Music Feature

The Music tab shows:
- **While Studying** — Playlists & artists matched to your mood (Lo-fi, Ambient, Epic, etc.)
- **After Studying** — Reward playlists to decompress or celebrate

All links open YouTube / Spotify in a new tab.

---

## 🛠 Build for Production

```bash
npm run build
# Output in /dist folder — deploy to Vercel, Netlify, etc.
```

---

## 💡 Tips

- Upload handwritten notes as images (PNG/JPG) — Claude AI reads them!
- For best results with PDFs, use Claude AI
- Gemini is free up to generous limits — great for daily use
- Check the Music tab after every study session 🎵
