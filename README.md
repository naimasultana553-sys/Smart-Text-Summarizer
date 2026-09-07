> Built by [Naima Sultana](https://github.com/naimasultana553-sys) | CSE Student, Bangladesh | [LinkedIn](https://www.linkedin.com/in/naima-sultana-76a678395)

# Smart Text Summarizer

Pastes long English text and returns a shorter version with length, bullet, and highlight options — open `index.html` to use it.
Live Demo: https://naimasultana553-sys.github.io/Smart-Text-Summarizer/ <!-- verify: Pages URL after rename, may need Pages re-enable -->

## Overview
Static single-page app with a landing hero and a summarizer workspace. Type or paste text into the Source Text area, pick options, and click Summarize to generate an extractive summary displayed in the Summary card. Summaries can be copied, downloaded as TXT/PDF via browser print, spoken with Text-to-Speech, and are saved to a 10-item history in `localStorage`. An optional English→Bangla translation is fetched via `https://api.mymemory.translated.net`. <!-- verify: whether MyMemory translation and TTS voices work in deployment requires live check -->

The summarization logic in `app.js` splits text into sentences, builds a word-frequency map excluding a hard-coded stop-word set, scores sentences by frequency, adds a small random jitter for variation, and returns top N sentences by ratio. <!-- verify: "AI-powered" claim in previous README not supported by code — code is frequency-based extractive -->

## Features
Verified in `index.html` and `app.js`:

- **Landing page** with parallax logo effect and "Open Text Summarizer" button that reveals `#app-wrapper`
- **Source Text** `textarea#source-text` with live word count `#input-word-count`, Clear button, and source TTS button
- **Length control** `select#summary-length`: Short (25%), Medium (50%), Long (75%)
- **Language control** `select#output-lang`: English / Bangla
- **Formatting toggles**: `input#bullet-mode` (renders `<ul>` list), `input#highlight-mode` (wraps top 40% of kept sentences in `<mark>`)
- **Summarize / Regenerate** buttons triggering the same `summarize()` function
- **Summary output** `div#summary-output` with word count `#output-word-count`, loader overlay `#loader`, Copy, Download .TXT (with UTF-8 BOM Blob), and Download .PDF (`window.print()`), and Summary TTS
- **History sidebar** `aside#history-sidebar` storing last 10 entries under `summary-history` in localStorage, clickable to restore
- **Translation** via `fetch` to MyMemory API when Bangla is selected

## Usage
No build step — static site.

1. Open `index.html` directly in a browser, or serve the folder:
   ```bash
   # any static server, e.g.
   npx serve .
   # or
   python -m http.server
   ```
2. Click "Open Text Summarizer"
3. Paste English text → choose Length / Language / Bullets / Highlight → Summarize
4. Copy or download from the Summary card; open History via the header button

No install required. No manifest file found, so no `npm install`.

## Tech Stack
Languages observed: HTML, CSS, JavaScript

Dependencies — no `package.json`, `requirements.txt`, or other manifest present in file list, so no verbatim manifest to quote. External resources referenced directly in `index.html` / `app.js`:

- Google Fonts: `Inter`, `Outfit` (via `fonts.googleapis.com`)
- Font Awesome 6.4.0 (via `cdnjs.cloudflare.com`)
- `html2pdf.js 0.10.1` included via script tag but not invoked in current `app.js` (PDF uses `window.print()`) <!-- verify: html2pdf inclusion is unused -->
- Runtime fetch to `api.mymemory.translated.net` for Bangla
- Web Speech API `speechSynthesis` for TTS <!-- verify: TTS voice availability is browser-dependent -->

## Project Structure
Actual file list observed:

```
Smart Text Summarizer/
├── index.html
├── style.css
├── app.js
├── logo.png
└── README.md
```

## License
No license file is currently included.

