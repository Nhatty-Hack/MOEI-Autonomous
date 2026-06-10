<div align="center">

# MOEI Autonomous Arrears Rescheduling Engine

**AI-Powered Assessment Portal for Sheikh Zayed Housing Programme**

*Challenge No. 1 — MOEI × 42 Abu Dhabi Hackathon*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-Vision-4285F4?logo=google)](https://ai.google.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev/)

</div>

---

## Problem Statement

MOEI's Finance and Collection Department processes housing arrears rescheduling requests through a **5-day manual evaluation cycle**. This project transforms that into an **instant AI-powered service** backed by 1,995 historical case records.

| Before | After |
|--------|-------|
| 5 working days | < 5 seconds |
| Manual, inconsistent | Automated, standardized |
| Undocumented decisions | Full audit trail |
| No fraud detection | Gemini Vision document validation |

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd Agentera-main
npm install --legacy-peer-deps

# 2. Configure API key
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key_here

# 3. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Features

### Citizen Portal (`/citizen`)
- UAE PASS simulated authentication (any 4-digit OTP)
- **Document upload with Gemini Vision validation**
  - Photo/selfie/random image → instant red rejection ("Invalid Document")
  - Valid salary certificate → green PASS with extracted salary & authenticity score
  - Gemini API failure → amber "Manual Verification Required" (routes to PENDING)
- Sample documents: [Genuine AED 35,000](/sample-docs/salary_certificate_genuine.html) · [Tampered AED 85,000](/sample-docs/salary_certificate_tampered.html)
- Fraud detection: >50% salary variance triggers **FRAUD ALERT** badge

### Officer Dashboard (`/officer`)
- Live assessment queue with 1,995 historical records loaded from `RescheduleArrears.xlsx`
- Fraud Risk: HIGH badge for flagged applications
- AI Pipeline trace log with step-by-step reasoning

### AI Pipeline (`/officer/pipeline`)
- Real-time terminal showing 6-step agentic pipeline
- Identity → Documents → Compliance → Historical → Gemini LLM → Decision

### Governance (`/officer/governance`)
- 12 compliance rules with live pass/fail indicators
- Audit trail for all decisions

---

## Document Validation Flow

```
Upload file
    │
    ▼
POST /api/validate-document
    │
    ├─ Gemini Vision ──────────────────────────────────────┐
    │   • is_valid_doc: true/false                          │
    │   • document_type: salary_cert | photo | other | …   │
    │   • extracted_salary, company_name, issue_date        │
    │   • authenticity_score 0–100                          │
    │                                                       │
    ├─ is_valid_doc = false ──→ rejected (red, 4s clear)   │
    ├─ Gemini throws (429/503) ─→ manual (amber)           │
    └─ Salary mismatch >50% ───→ fraud_flagged = true ─────┘

Submit assessment
    │
    ├─ Any manual ──→ REQUEST_DOCUMENTS / PENDING_INFO
    ├─ fraud_flagged ──→ REFER_TO_EMPLOYEE / REFERRED + FRAUD_DETECTION trace
    └─ Clean docs ──→ Normal 6-step agentic assessment
```

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/health` | GET | Server liveness check |
| `/api/applications` | GET | All applications (from xlsx) |
| `/api/document-validations` | GET | Current session validations |
| `/api/validate-document` | POST | Gemini Vision doc check |
| `/api/agent-assess/:id` | POST | Full agentic assessment |
| `/api/governance-rules` | GET | 12 compliance rules |
| `/` | GET | Officer dashboard |
| `/citizen` | GET | Citizen portal |
| `/officer/*` | GET | Officer views |

---

## Architecture

```
src/
├── services/
│   ├── geminiValidator.ts    # Gemini Vision — doc type check, salary extraction, fraud
│   ├── agent.ts              # 6-step agentic pipeline (Gemini 2.5 Flash)
│   ├── assessment.ts         # Deterministic fallback solver
│   ├── complianceEngine.ts   # DBR rules, tiered optimization matrix
│   └── dataLoader.ts         # xlsx → ReschedulingApplication[]
├── components/
│   ├── CitizenUploadStep.tsx  # Document upload with Gemini validation UI
│   ├── ApplicationsTable.tsx  # Officer queue with fraud badges
│   ├── AssessmentPanel.tsx    # Decision deep-dive + audit trace
│   ├── BeneficiaryView.tsx    # Citizen result view
│   └── Dashboard.tsx         # Analytics + KPI gauges
├── types.ts                   # All TypeScript interfaces
└── App.tsx                    # Router + sidebar navigation
server.ts                      # Express + Vite dev server
public/sample-docs/            # Salary certificate HTML assets (genuine + tampered)
RescheduleArrears.xlsx         # 1,995 historical records
```

---

## Compliance Rules

| Rule | Value |
|------|-------|
| DBR Limit (Employed) | 60% |
| DBR Limit (Retiree) | 50% |
| DBR Hard Ceiling (Retiree) | 80% |
| Net Income Ceiling | 100,000 AED |
| Repayment Term Range | 12–48 months |
| Green Delta Ceiling | 15% of current instalment |
| Fraud Detection Threshold | >50% salary variance |

---

## Team

**Agentera** — MOEI × 42 Abu Dhabi Hackathon

*Built with React 19, TypeScript 5.8, Gemini 2.5 Flash Vision, Express, Vite 6*
