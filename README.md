<div align="center">

<img src="logo.png" alt="Redact Review Logo" width="120" />

# Redact Review

### Enterprise-Grade AI-Powered PII Redaction Platform

**Multi-model consensus detection · Rich document preservation · Secure PDF export**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)

</div>

---

## 🌐 Deployed App

> [!NOTE]
> **The app is live and ready to use — no setup required.**

<div align="center">

[![🚀 Open Live App](https://img.shields.io/badge/🚀%20Open%20Live%20App-redactreview.onrender.com-6B1E2B?style=for-the-badge&logo=render&logoColor=white)](https://redactreview.onrender.com)

**[🔗 https://redactreview.onrender.com](https://redactreview.onrender.com)**

*Use the evaluator credentials below or create a free account instantly*

</div>

---

## 🎬 Demo Video

> [!IMPORTANT]
> **Watch the full demo before evaluating — it covers the complete redaction workflow end-to-end.**

<div align="center">

[![▶ Watch Full Demo](https://img.shields.io/badge/▶%20Watch%20Full%20Demo-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/QtRtr9pMx04)

**[🔗 https://youtu.be/QtRtr9pMx04](https://youtu.be/QtRtr9pMx04)**

*Upload → AI Consensus Scan → Human Review → Safe PDF Export — all in under 3 minutes*

</div>

---

## ✨ What is Redact Review?

**Redact Review** is an enterprise-grade document redaction platform that uses **three AI models simultaneously** to detect Personally Identifiable Information (PII). Unlike single-model approaches, Redact Review applies a **consensus algorithm**—an entity is flagged with high confidence only when multiple models agree, dramatically reducing false positives and catching more PII that a single model might miss.

Built for legal teams, compliance officers, and data protection workflows, Redact Review delivers:

- 🧠 **Triple AI Consensus** — Gemini 2.5 Flash + Llama 3.3 70B + Claude 3 Haiku, all running in parallel
- 📄 **Rich Document Fidelity** — Upload a `.docx` and see it rendered exactly as formatted (tables, headings, bold text, lists)
- 🔍 **Human-in-the-Loop Review** — Accept, reject, or ignore every AI suggestion with full audit trail
- 🔒 **Secure PDF Export** — Generate a permanently redacted PDF with all PII replaced by black bars
- 📊 **Intelligence Dashboard** — Real-time risk scoring, compliance checklists, and blind-spot analysis

---

## 🚀 Live Demo

> **URL:** [https://redactreview.onrender.com](https://redactreview.onrender.com)

For quick evaluator access, use the pre-configured demo account:

| Field | Value |
|-------|-------|
| **Email** | `harinin006@gmail.com` |
| **Password** | `Harini@0504` |

Or click **"Quick Login as Evaluator"** on the login page.

---

## 🏗️ Architecture Overview

```mermaid
flowchart TD
    User(["👤 User / Reviewer"])

    subgraph FE ["Frontend — React 19 + Vite + TypeScript"]
        Landing["🏠 Landing Page"]
        Dashboard["📋 Dashboard\n(Upload + Doc List)"]
        Workspace["✏️ Review Workspace\n(Core Editor + Sidebar)"]
        Intelligence["📊 Intelligence\n(Analytics + Risk)"]
    end

    subgraph API ["REST API — Express.js + Node 22"]
        Upload["upload.ts\n(DOCX → HTML)"]
        Docs["documents.ts\n(CRUD)"]
        Redactions["redactions.ts\n(Confirm/Reject)"]
        SafetyScan["safety-scan.ts\n(Final Sweep)"]
        Chat["chat.ts\n(AI Auditor)"]
        Export["export.ts\n(Redacted Export)"]
    end

    subgraph AI ["AI Consensus Engine"]
        Gemini["🤖 Gemini 1.5 Flash"]
        Groq["🦙 Groq — Llama 3.3 70B"]
        Claude["🌐 Claude 3 Haiku\n(OpenRouter)"]
        Consensus{{"Consensus\nAlgorithm\n(3× Runs)"}}
        Gemini --> Consensus
        Groq --> Consensus
        Claude --> Consensus
    end

    subgraph Data ["Data Layer"]
        DB[("🗄️ Supabase\nPostgreSQL\ndocuments · redactions")]
        Mammoth["📄 Mammoth\nDOCX → rich HTML\n+ plain text"]
    end

    User --> Landing
    User --> Dashboard
    User --> Workspace
    User --> Intelligence

    FE -->|"API calls /api/*"| API

    Upload --> Mammoth
    Mammoth --> DB
    Upload --> AI
    Redactions --> DB
    Docs --> DB
    SafetyScan --> AI
    Chat --> AI
    Chat --> DB
    Export --> DB

    AI -->|"PII spans + confidence"| Docs
```

### File Structure

```
SprintFour/
├── artifacts/
│   ├── api-server/          # Express.js REST API (Node 22, TypeScript)
│   │   └── src/
│   │       ├── lib/
│   │       │   └── detector.ts       # Triple-model AI consensus engine
│   │       └── routes/
│   │           ├── documents.ts      # CRUD + file processing
│   │           ├── upload.ts         # Mammoth DOCX → HTML extraction
│   │           ├── redactions.ts     # Redaction CRUD & status management
│   │           ├── intelligence.ts   # Risk scoring & compliance analytics
│   │           ├── blind-spots.ts    # Uncovered PII occurrence finder
│   │           ├── suspicious.ts     # Regex-based PII pattern scanner
│   │           ├── safety-scan.ts    # Post-redaction AI verification scan
│   │           ├── chat.ts           # AI Auditor conversational chat endpoint
│   │           ├── export.ts         # PDF generation with redaction overlays
│   │           └── auditor.ts        # AI-powered review auditor widget
│   │
│   └── redact-review/       # Vite + React 19 frontend (TypeScript)
│       └── src/
│           ├── pages/
│           │   ├── landing.tsx        # Marketing landing page
│           │   ├── login.tsx          # Authentication
│           │   ├── register.tsx       # User registration
│           │   ├── dashboard.tsx      # Document management hub
│           │   ├── review-workspace.tsx  # Core redaction editor
│           │   ├── intelligence.tsx   # Analytics & risk reporting
│           │   └── review-complete.tsx   # Post-review summary
│           └── components/
│               ├── AIAuditorWidget.tsx    # Floating AI review assistant
│               ├── CompleteReviewModal.tsx
│               ├── review/
│               │   ├── ReviewSidebar.tsx
│               │   ├── EntityDetailPanel.tsx
│               │   ├── PDFViewer.tsx
│               │   └── RemainingRiskBanner.tsx
│               └── ui/               # shadcn/ui component library
│
└── lib/
    ├── api-client-react/    # Auto-generated React Query hooks
    ├── api-spec/            # OpenAPI specification
    ├── api-zod/             # Zod validation schemas
    └── db/                  # Supabase client (PostgreSQL)
```

---

## 🧠 Core Feature: Triple-Model Consensus Detection

The heart of Redact Review is the **consensus detection engine** (`detector.ts`). When a document is uploaded, it fires three AI models **simultaneously** in parallel:

| Model | Provider | Role |
|-------|----------|------|
| **Gemini 2.5 Flash** | Google | Fast, high-recall PII extraction |
| **Llama 3.3 70B** | Groq (fast inference) | Large context, nuanced understanding |
| **Claude 3 Haiku** | Anthropic via OpenRouter | Conservative, precise detection |

Each model returns a list of PII spans `{ text, category }`. The engine then:

1. **Maps all detections to character offsets** in the original document text
2. **Groups overlapping spans** and counts how many models flagged each
3. **Calculates confidence** as `count / 3` (0.33 = 1 model, 0.66 = 2 models, 1.0 = all 3)
4. **Stores a consensus note** `{"count": 2, "models": [0,1], ...}` alongside each redaction

In the UI, this translates to:
- 🔴 **Critical** (all 3 models agree) — shown in red with high prominence
- 🟠 **Second Opinion** (1 model only) — flagged in orange for careful human review
- ✅ **Consensus** (2–3 models) — displayed with green confidence indicator

---

## 📄 Document Rendering: Preserving Formatting

Redact Review uses a **dual-storage strategy** to ensure DOCX files look exactly as uploaded while still being searchable by the AI engine.

When a `.docx` is uploaded, the server:
1. Converts it to HTML using **Mammoth** (`mammoth.convertToHtml`)
2. Sanitizes the HTML (removes scripts, event handlers)
3. Extracts **plain text** from the HTML (offset-stable, for AI detection)
4. Stores both in the database as a JSON envelope:

```json
{ "v": 1, "plain": "Employment Agreement...", "html": "<h1>Employment Agreement...</h1>" }
```

At read time, `decodeContent()` splits them apart:
- The **plain text** is used for all AI detection and offset calculations
- The **HTML** is rendered in the review workspace using `dangerouslySetInnerHTML`
- PII highlights are **injected directly** into the HTML string before rendering

This approach required **no database schema changes** and is fully backward-compatible with plain text and PDF documents.

---

## 🎨 Key Pages & UI Features

### 🏠 Landing Page (`/`)
Premium marketing page with scroll-driven animations (Framer Motion), glassmorphic hero section, feature grid, and an interactive document preview demonstrating the redaction workflow.

### 📊 Dashboard (`/dashboard`)
- Upload new documents (`.docx`, `.txt`, `.pdf`, `.md`)
- See redaction statistics per document (pending / confirmed / rejected)
- View document processing status
- One-click access to the review workspace

### ✏️ Review Workspace (`/review/:id`)
The most feature-rich part of the product:

| Feature | Description |
|---------|-------------|
| **Three view modes** | Original (live highlights) → Reviewed (black tape overlay) → Export (block preview) |
| **Interactive highlights** | Click any highlighted span to select it; color-coded by severity |
| **Sidebar review queue** | Tab-split between Pending / Confirmed / Rejected / User-added |
| **Entity detail panel** | Slide-in panel showing all occurrences of the same entity across the document |
| **Manual selection** | Highlight any text, pick a PII category, instantly add a redaction |
| **Keyboard shortcuts** | `J/K` to navigate, `R` to redact, `I` to ignore, `⌘Z` to undo |
| **Blind-spot detection** | Finds every other occurrence of confirmed PII that hasn't been redacted yet |
| **AI Auditor widget** | Floating assistant that proactively flags risky patterns |
| **Final safety scan** | Post-review AI check to catch anything missed before export |

### 📈 Intelligence Report (`/intelligence/:id`)
- **Privacy Risk Score** (0–100) calculated from remaining unresolved PII severity
- Compliance checklist (GDPR-style categories)
- Category breakdown with severity weighting
- Disputed entity analysis (second-opinion flags)

### 📥 Secure PDF Export
- For DOCX/TXT documents: generates a clean PDF with black rectangle overlays over every confirmed PII span
- For original PDFs: applies bounding-box coordinates to the original PDF pages
- Filename: `<document_title>_REDACTED.pdf`

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI framework |
| **Vite 7** | Build tool & dev server |
| **TypeScript 5.9** | Type safety |
| **Framer Motion** | Animations & transitions |
| **TanStack Query v5** | Server state & data fetching |
| **Wouter** | Lightweight client-side routing |
| **shadcn/ui + Radix UI** | Accessible component library |
| **Lucide React** | Icon set |
| **Sonner** | Toast notifications |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js 22 + Express** | REST API server |
| **TypeScript** | Type-safe server code |
| **Supabase (PostgreSQL)** | Database & authentication |
| **Mammoth** | DOCX → HTML conversion |
| **pdf-parse** | PDF text extraction |
| **pdf-lib** | PDF generation & redaction overlays |
| **Multer** | File upload handling |
| **Zod** | Runtime schema validation |
| **Pino** | Structured JSON logging |

### AI / LLM Providers
| Provider | Model | Role |
|----------|-------|------|
| **Google AI** | `gemini-2.5-flash` | Primary PII detection + safety scan |
| **Groq** | `llama-3.3-70b-versatile` | Secondary detection (ultra-fast inference) |
| **OpenRouter** | `anthropic/claude-3-haiku` | Third detection + auditor |

### Monorepo
| Tool | Purpose |
|------|---------|
| **pnpm workspaces** | Monorepo package management |
| **tsconfig references** | Shared TypeScript project references |
| **Supply-chain protection** | `minimumReleaseAge: 1440` (24hr delay for new npm packages) |

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js 22+
- pnpm 9+
- A Supabase project (PostgreSQL)

### 1. Clone & Install
```bash
git clone https://github.com/harininr/Sprintfour.git
cd Sprintfour
pnpm install
```

### 2. Environment Variables
Create a `.env` file in the root:
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Providers
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

### 3. Database Schema
In your Supabase project, create the required tables:

```sql
-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'uploaded',
  file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Redactions table
CREATE TABLE redactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  text TEXT NOT NULL,
  category TEXT NOT NULL,
  confidence FLOAT,
  status TEXT DEFAULT 'pending',
  source TEXT DEFAULT 'ai',
  bounding_boxes TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);
```

### 4. Start the Development Servers
```bash
# Build the API server
cd artifacts/api-server && npm run build && cd ../..

# Start both servers concurrently
PORT=3001 node artifacts/api-server/dist/index.mjs &
VITE_API_URL=http://localhost:3001 pnpm --filter @workspace/redact-review run dev
```

Or use the included start script:
```bash
bash start.sh
```

The frontend will be available at **http://localhost:5173** and the API at **http://localhost:3001**.

---

## 🔌 API Reference

All endpoints are prefixed with `/api`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/documents` | List all documents with redaction stats |
| `POST` | `/documents` | Create a document & trigger AI detection |
| `GET` | `/documents/:id` | Get document with all redactions |
| `DELETE` | `/documents/:id` | Delete document |
| `POST` | `/documents/upload` | Upload a file, extract text & HTML |
| `GET` | `/documents/:id/intelligence` | Risk score & compliance analytics |
| `GET` | `/documents/:id/blind-spots` | Find unredacted occurrences of confirmed PII |
| `GET` | `/documents/:id/suspicious` | Regex-based PII pattern scan |
| `POST` | `/documents/:id/safety-scan` | Post-review AI verification scan |
| `GET` | `/documents/:id/export-redacted` | Download redacted PDF |
| `GET` | `/redactions/:id` | Get single redaction |
| `PATCH` | `/redactions/:id` | Update redaction status / category |
| `POST` | `/redactions` | Create manual redaction |
| `DELETE` | `/redactions/:id` | Delete redaction |

---

## 📁 Supported File Types

| Format | Extension | Processing |
|--------|-----------|-----------|
| Word Document | `.docx`, `.doc` | Mammoth → Rich HTML + Plain Text |
| Plain Text | `.txt`, `.text` | Direct text extraction |
| Markdown | `.md` | Direct text extraction |
| PDF | `.pdf` | pdf-parse extraction + bounding box redaction |

**Max file size:** 20 MB

---

## 🔐 Security & Privacy

- **Supply-chain protection**: All npm packages must be published for ≥24 hours before installation
- **HTML sanitization**: Mammoth output is stripped of `<script>`, `<style>`, and all event handlers before storage or rendering
- **No cloud file storage**: Uploaded files are processed in-memory or transiently on disk; only extracted text is persisted to the database
- **Irreversible redaction**: Exported PDFs use opaque black rectangles directly overlaying the text layer — not just visual styling that can be removed

---

## 🎯 PII Categories Detected

| Category | Severity | Examples |
|----------|----------|---------|
| SSN | 🔴 Critical | Social Security Numbers |
| Financial | 🔴 Critical | Credit cards, bank accounts, financial IDs |
| Medical | 🟠 High | Medical record numbers, diagnoses |
| Phone | 🟠 High | Phone numbers, fax numbers |
| Date of Birth | 🟠 High | DOBs in any date format |
| Address | 🟡 Medium | Street addresses, ZIP codes |
| Email | 🟡 Medium | Email addresses |
| Name | 🟢 Low | Personal names |
| Organization | 🟢 Low | Company/institution names |
| Other | 🟢 Low | Miscellaneous PII |

---

## 🗺️ Project Roadmap

- [ ] Role-based access control (Reviewer / Approver / Admin)
- [ ] Batch document processing
- [ ] Custom PII rules & regex patterns
- [ ] GDPR / HIPAA compliance report export
- [ ] Redaction history & rollback
- [ ] Webhook notifications on review completion
- [ ] On-premise deployment support

---

## 👩‍💻 Author & Contributors

| Name | Role |
|------|------|
| **Harini N R** | Project Author — Full-stack design, AI integration, UI/UX |

---

## 🤝 Contributing

This project was built and authored entirely by **Harini N R** as part of **Sprint Four**. Feedback and issues are welcome via [GitHub Issues](https://github.com/harininr/Sprintfour/issues).

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ by **Harini N R**

[Live Demo](https://redactreview.onrender.com) · [GitHub](https://github.com/harininr/Sprintfour) · [Report a Bug](https://github.com/harininr/Sprintfour/issues)

</div>
