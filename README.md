# IITB Resume Creator

A web application for IIT Bombay students to visually edit their LaTeX resume through a drag-and-drop interface.

## Features

- **Drag & drop** — reorder sections, project entries, and bullet points
- **Live CSS preview** — pixel-faithful rendering of the IITB LaTeX template, updates instantly
- **Overflow detection** — colored dots show which bullets wrap to a second line in LaTeX
- **AI bullet assistant** — describes what you did, generates a placement-grade bullet point
- **LaTeX export** — generates the exact `.tex` source; PDF export via `pdflatex`

## Setup

### Prerequisites

```bash
node >= 18
npm >= 10
```

### For PDF export (optional)

PDF export uses `pdflatex` via the `node-latex` package. Install TeX Live:

**Ubuntu / Debian:**
```bash
sudo apt-get install texlive-full
```

**macOS:**
Download and install [MacTeX](https://www.tug.org/mactex/).

The app works fully without TeX Live — only the "Export PDF" button will fail (with a toast error). The `.tex` download always works.

### AI bullet assistant

Set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

### Running

```bash
npm install
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:3001

## Architecture

- `apps/web/` — React 18 + Vite + Tailwind + Zustand + dnd-kit
- `apps/api/` — Hono on Node.js

## Template

The preview and LaTeX generator are reverse-engineered from Shivam Soni's IITB placement resume. All spacing, fonts, section styles, and table structures exactly match the original `.tex` file.
