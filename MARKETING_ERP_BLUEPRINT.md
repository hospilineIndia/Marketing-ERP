# 🚀 Hospiline Marketing ERP — V1 Blueprint (Updated)

---

## 1. Objective

Build a **mobile-first ERP system** for field marketing employees to:

- Capture leads quickly
- Upload visiting cards
- Add meeting notes
- Use AI to generate actionable insights

Admin users can:
- View and filter leads
- Export data

---

## 2. User Roles

### Admin
- View all leads
- Apply filters
- Export data (CSV)

### Field User
- Create leads
- Upload visiting cards
- Add notes
- View their own leads + AI insights

---

## 3. Core User Flows

### Field User Flow (Primary)

Login
→ Add Entry
→ Capture Visiting Card
→ Auto-fill (OCR)
→ Add Notes
→ Capture GPS Location
→ Submit

### Field User: My Leads

Login
→ My Leads
→ View entries
→ See AI insights (priority, intent, etc.)

### Admin Flow

Login
→ Dashboard
→ View leads
→ Filter/search
→ Export CSV

---

## 4. Features (V1 Scope)

### Must Have

#### Field Side
- Login (JWT)
- Lead creation
- Visiting card upload
- OCR extraction
- Notes input
- GPS capture
- "My Leads" view with AI insights

#### Admin Side
- Lead listing
- Filters (date, user)
- Export CSV

#### System
- AI processing (async)
- Role-based access

---

## 5. Tech Architecture

### Backend
- Node.js + Express
- PostgreSQL
- BullMQ (queue for AI processing)

### Frontend
- React (Vite)
- Tailwind CSS
- shadcn/ui (primary UI system)

### Infra
- Runs on port 4000
- Cloudflare Tunnel exposure

---

## 6. UI Strategy

### Field App (Mobile-first)

- App-like UI (NOT website feel)
- Bottom navigation
- Card-based layout
- Large touch-friendly inputs
- Minimal typing
- Camera-first workflow

### Admin Panel

- Responsive design
- Desktop → table layout
- Mobile → card layout

---

## 7. Database Schema

### users
- id
- name
- email
- password
- role (admin / field)

### leads
- id
- name
- phone
- company
- created_by
- latitude
- longitude

### visiting_cards
- id
- lead_id
- image_url
- ocr_data (JSONB)

### notes
- id
- lead_id
- text

### ai_insights
- id
- note_id
- intent
- priority (HIGH / MEDIUM / LOW)
- sentiment
- next_action
- entities (JSONB)

---

## 8. AI Pipeline

User submits note
→ Save to DB
→ Queue job
→ AI processes
→ Store structured insights

---

## 9. AI Alert System

| Condition | UI Behavior |
|----------|------------|
| HIGH priority | Highlight |
| MEDIUM | Medium |
| LOW | Low |
| Negative sentiment | Warning |
| Next action exists | Reminder |

---

## 10. OCR Flow

Image Upload
→ OCR API
→ Extract fields
→ Autofill form

---

## 11. GPS Capture

- Use browser Geolocation API
- Store latitude & longitude with lead

---

## 12. Security

- JWT authentication
- Role-based access
- Secure file uploads

---

## 13. Deployment

- Backend → localhost:4000
- PM2 managed
- Cloudflare Tunnel exposure
- Fully isolated from internal ERP

---

## 14. Development Phases

### Phase 1
- Setup backend + auth

### Phase 2
- Leads + upload + notes

### Phase 3
- OCR + AI

### Phase 4
- Admin dashboard

---

## 15. Principles

### Focus
- Mobile usability
- Speed
- Simplicity

### Avoid
- Overengineering
- Heavy UI libraries
- Real-time complexity

---

## Final Summary

Mobile-first AI-powered Marketing ERP
Built with Express + React + Tailwind + shadcn/ui
Designed for real-world field usage
