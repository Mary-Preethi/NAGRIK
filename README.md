# NAGRIK — See. Speak. Act.

> **Independent Civic Issue Intelligence & Institutional Accountability Platform**  
> *Transforming fragmented citizen grievances into explainable systemic patterns, evidence-backed investigations, and measurable institutional outcomes.*

---

## 1. Product Identity & Purpose

**NAGRIK** (*Citizen*) is an independent, non-partisan civic intelligence system designed to solve a critical second-order problem: collecting individual complaints is not enough when thousands accumulate without resolution.

NAGRIK provides the intelligence layer that discovers systemic problems hidden within individual reports, calculates explainable mathematical priority, supports evidence-aware human investigation, maps institutional responsibility structures (without personal defamation), and tracks corrective action.

$$\text{SEE} \longrightarrow \text{SPEAK} \longrightarrow \text{AGGREGATE} \longrightarrow \text{UNDERSTAND} \longrightarrow \text{PRIORITISE} \longrightarrow \text{VERIFY} \longrightarrow \text{ACT} \longrightarrow \text{TRACK}$$

---

## 2. Core Architectural Guarantees & Invariants

1. **Every Report is Preserved**: Individual reports receive permanent, immutable tracking IDs (e.g. `NAG-2026-1001`) and remain accessible to citizens in their private dashboards even if not aggregated into top-priority clusters.
2. **Support $\neq$ Severity $\neq$ Truth**: Community support votes represent civic endorsement; they never alter evidentiary weight or legal veracity.
3. **Evidence is Optional**: Lack of documentary proof does not invalidate lived civic experience.
4. **Append-Only Immutable Audit Trail**: All reviewer, status, priority, and configuration modifications are recorded in an append-only audit log table. No API or UI mechanisms exist to edit or delete historical records.
5. **Zero Private Data Leakage**: Enforced at the Server-Side DTO serialization layer (`serializePublicIssue`, `serializePublicReport`), strictly preventing citizen emails, phone numbers, or private documents from reaching public clients.
6. **AI Resilience & Fallback Guarantees**: Gemini AI is an enhancement, not a single point of failure. If the Gemini API is unreachable, rate-limited, or misconfigured, the portal seamlessly switches to deterministic heuristic signal extraction without interrupting core operations.
7. **Bespoke Editorial Aesthetics**: Designed with contemporary Indian civic visual storytelling (curated quotes from Bharathiyar, Ambedkar, Kalam, Tagore, Phule, Nehru, Bose), restrained typography, high contrast, and 60fps performance.

---

## 3. Deterministic Priority Engine

Priority scores are calculated via a transparent, 7-factor weighted formula ($10.0 - 100.0$):

$$\text{Priority Score} = 10 \times \left( \begin{aligned}
& 0.25 \times \text{Severity} \\
+ & 0.20 \times \text{Urgency} \\
+ & 0.15 \times \text{Scale} \\
+ & 0.10 \times \text{Geographic Spread} \\
+ & 0.15 \times \text{Evidence Strength} \\
+ & 0.10 \times \text{Persistence} \\
+ & 0.05 \times \text{Growth}
\end{aligned} \right)$$

Every score is fully explainable via the interactive **"Why this priority?"** inspector.

---

## 4. Institutional Responsibility Graph

NAGRIK maps statutory accountability structures to public departments rather than individual persons:
- **Operational**: Direct maintenance and field execution units.
- **Supervisory**: Municipal and district regulatory inspection authorities.
- **Regulatory / Policy**: State pollution control and quality benchmark commissions.
- **Political / Ministerial**: Executive ministry answerable for capital budgets and policy.
- **Corrective**: Specialized bodies empowered to sanction emergency overhaul grants.

---

## 5. Local Setup & Quickstart

### Prerequisites
- **Node.js**: v18.0+ (Tested on v24.x)
- **npm**: v9.0+

### Installation Steps

```bash
# 1. Clone repository & install dependencies
npm install

# 2. Configure environment variables (SQLite zero-config is default)
cp .env.example .env

# 3. Generate Prisma client & sync database
npx prisma generate
npx prisma db push

# 4. Seed synthetic demonstration dataset
npm run prisma:seed

# 5. Run verification tests
npm run test:priority
npm run test:security

# 6. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view NAGRIK.

---

## 6. Pre-Seeded Demonstration Accounts

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Citizen** | `citizen@nagrik.in` | `Nagrik@2026` | Submit reports, support issues, view private dashboard |
| **Investigator** | `investigator@nagrik.in` | `Investigator@2026` | Priority queue, verify issues, map responsibility, log responses |
| **Admin** | `admin@nagrik.in` | `Admin@2026` | View append-only immutable audit trail & moderation |

---

## 7. Environment Variables Reference

| Variable | Required | Description |
|---|:---:|---|
| `DATABASE_URL` | Yes | Database connection string (default: `file:./dev.db`) |
| `JWT_SECRET` | Yes | Secret key for signed session authentication tokens |
| `SESSION_SECRET` | Yes | Server cookie signing secret |
| `GEMINI_API_KEY` | Optional | Google Gemini API Key. If omitted, heuristic fallback engine executes automatically |
| `NODE_ENV` | Yes | `development` or `production` |

---

## 8. License & Academic Disclaimer

NAGRIK is an independent product and academic concept. It is not affiliated with, sponsored by, or representative of any specific NGO, political party, or government agency.
