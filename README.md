<div align="center">

# 🏛️ MOEI Autonomous Arrears Rescheduling Engine

**AI Agent for Instant Assessment of Housing Arrears Rescheduling Requests**

*Challenge No. 1 — MOEI × 42 Abu Dhabi Hackathon*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-Agentic-4285F4?logo=google)](https://ai.google.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev/)

</div>

---

## 📋 Problem Statement

The Ministry of Energy and Infrastructure's (MOEI) Finance and Collection Department currently processes housing arrears rescheduling requests through a **5-day manual evaluation cycle** involving:

- Manual identity verification and physical file collation
- Waiting for external credit reports (AECB)
- Manual net income extraction and DBR calculations
- Committee reviews for repayment term optimization
- Report writing, executive sign-offs, and physical mailout

This project transforms that process into an **instant, AI-powered service** that:

| Before | After |
|--------|-------|
| 5 working days | < 5 seconds |
| Manual, inconsistent | Automated, standardized |
| Undocumented decisions | Full audit trail |
| One officer at a time | Parallel batch processing |
| No governance visibility | Real-time compliance dashboard |

---

## 🏗️ Architecture

The solution uses a **Hybrid Agentic Architecture** — combining deterministic compliance rules with LLM reasoning:

```
┌──────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  ┌─────────┐  ┌───────────┐  ┌────────────────────────┐ │
│  │ App Queue│  │ Dashboard │  │ Governance Rules View │ │
│  └────┬────┘  └─────┬─────┘  └───────────┬────────────┘ │
└───────┼─────────────┼────────────────────┼───────────────┘
        │             │                    │
┌───────┴─────────────┴────────────────────┴───────────────┐
│                   Express API Server                      │
│  /api/agent-assess/:id  │  /api/governance-rules         │
└──────────┬──────────────┴────────────────────────────────┘
           │
┌──────────┴──────────────────────────────────────────────┐
│              Agentic Processing Pipeline                 │
│  ┌─────────┐   ┌──────────┐   ┌──────────────────────┐ │
│  │ Identity │──>│ Document │──>│ Compliance Matrix    │ │
│  │ Verify   │   │ OCR/Scan │   │ (12-48mo optimizer)  │ │
│  └─────────┘   └──────────┘   └──────────┬───────────┘ │
│                                           │              │
│  ┌──────────────────┐   ┌────────────────┴────────────┐ │
│  │ Gemini 2.5 Flash │<──│ Function Calling (Tool Use) │ │
│  │ NLP Reasoning     │──>│ Structured JSON Output      │ │
│  └──────────────────┘   └─────────────────────────────┘ │
│                                                          │
│  Output: Tier Classification + AR/EN Memos + Audit Trace │
└──────────────────────────────────────────────────────────┘
```

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| **Compliance Engine** | `src/services/complianceEngine.ts` | Single source of truth: DBR calculations, governance rules, tiered optimization matrix |
| **AI Agent** | `src/services/agent.ts` | Gemini 2.5 Flash with function-calling for tool-augmented reasoning |
| **Deterministic Solver** | `src/services/assessment.ts` | Fallback local assessment (no LLM needed) |
| **Frontend** | `src/App.tsx` + `src/components/` | React UI with tab navigation, batch processing, real-time dashboard |

### Governance Rules (Configurable)

| Rule | Value | Description |
|------|-------|-------------|
| DBR Limit (Employed) | 60% | Maximum debt-burden ratio for employed applicants |
| DBR Limit (Retiree) | 50% | Maximum DBR for retirees and senior citizens |
| DBR Hard Ceiling (Retiree) | 80% | Absolute cap — RED even for protected categories |
| Net Income Ceiling | 100,000 AED | Above this, redirected to commercial entities |
| Term Range | 12–48 months | Optimization search space for repayment schedules |
| Green Delta Ceiling | 15% | Monthly delta must be ≤ 15% of current installment for auto-approval |

---

## 🎯 Tier Classification System

| Tier | Meaning | Action |
|------|---------|--------|
| 🟢 **GREEN** | Auto-approved | Standard 24-month schedule satisfies all compliance rules |
| 🟡 **YELLOW** | Conditionally approved | Extended term (12-48 months) found via optimization loop |
| 🔴 **RED** | Escalated to human | Over-leveraged or no compliant solution exists |
| ⬜ **INFORMATION_HOLD** | Pending documents | Unstamped or draft documents detected by OCR validation |

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18 (recommended: 22+)
- Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd Agentera
npm install

# 2. Configure your API key
cp .env.example .env.local
# Edit .env.local and set GEMINI_API_KEY=your_actual_key

# 3. Run
npm run dev
```

Open http://localhost:3000

### Production Build

```bash
npm run build
npm start
```

---

## 🧪 Synthetic Test Cases

The prototype includes 8 diverse applications covering edge cases:

| # | Applicant | Category | Arrears | Expected Tier |
|---|-----------|----------|---------|---------------|
| 1 | Saeed Al-Mansoori | Employed | 12,000 AED | 🟢 GREEN |
| 2 | Fatima Al-Ali | Retiree | 19,200 AED | 🟡 YELLOW |
| 3 | Maryam Al-Heera | Widow with Custody | 14,400 AED | 🟡 YELLOW |
| 4 | Hamad Al-Nuaimi | Person of Determination | 36,000 AED | 🔴 RED |
| 5 | Khalid Al-Shehhi | Employed (unstamped docs) | 9,000 AED | ⬜ HOLD |
| 6 | Ahmed Al-Dhaheri | Senior Citizen | 7,500 AED | 🟢 GREEN |
| 7 | Noura Al-Kaabi | Employed (high arrears) | 45,000 AED | 🟡 YELLOW |
| 8 | Omar Al-Mazrouei | Employed (single miss) | 4,500 AED | 🟢 GREEN |

---

## 📁 Project Structure

```
Agentera/
├── server.ts                    # Express API server + Vite middleware
├── index.html                   # HTML entry point
├── vite.config.ts               # Vite + TailwindCSS v4 config
├── src/
│   ├── App.tsx                  # Root component with tab navigation
│   ├── main.tsx                 # React entry point
│   ├── types.ts                 # TypeScript interfaces
│   ├── data.ts                  # Synthetic test data (8 applications)
│   ├── index.css                # Global styles + Arabic font support
│   ├── services/
│   │   ├── complianceEngine.ts  # Core governance rules + math engine
│   │   ├── assessment.ts        # Deterministic local solver
│   │   └── agent.ts             # Gemini AI agentic pipeline
│   └── components/
│       ├── Header.tsx           # Hero header with MOEI branding
│       ├── PipelineComparison.tsx  # 5-day vs 5-second comparison
│       ├── ApplicationCard.tsx  # Individual application card
│       ├── AssessmentPanel.tsx   # Assessment deep-dive with trace log
│       ├── ProcessingAnimation.tsx # Terminal-style processing animation
│       ├── Dashboard.tsx        # Analytics + governance rules display
│       └── ErrorBanner.tsx      # Error notification component
└── .env.example                 # Environment variable template
```

---

## 🔑 Expected Impact

✅ **Instant service delivery** — From 5 working days to < 5 seconds  
✅ **Unified rules** — Same governance parameters applied consistently to every case  
✅ **Full transparency** — Every decision includes audit trace, rationale, and bilingual memos  
✅ **Human oversight preserved** — RED and INFORMATION_HOLD cases escalate to officers  
✅ **Bilingual output** — Arabic and English executive memos generated automatically  
✅ **Scalable** — Batch processing for entire application queues  

---

## 👥 Team

**Agentera** — MOEI × 42 Abu Dhabi Hackathon

---

*Built with React, TypeScript, Gemini 2.5 Flash, Express, Vite, and TailwindCSS*
