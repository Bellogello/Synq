<div align="center">

# Synq

**Focus. Flow. Finish.**

A mobile-first productivity app that bridges structured learning and deep work — organize your subjects, run focused Pomodoro sessions, and track everything in one place.

[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## What is Synq?

Synq is a full-stack study companion built for students who take their workflow seriously. It pairs a relational task system — organized by subject and topic — with a customizable Pomodoro timer, so you can plan deeply and execute without friction. Themes, cloud sync, and an archive system round it out into something you'll actually want to use every day.

---

## Features

### 🗂 Relational task management
Organize study items hierarchically by **Subject → Topic**. Foreign key relationships in the database ensure nothing gets orphaned or lost.

### ⏱ Aesthetic focus timer
A theme-aware Pomodoro timer designed to keep you in a flow state. Configurable work/break intervals with a clean, distraction-free UI.

### 🎨 Dynamic theming
Switch between curated UI themes — **Midnight Rose**, **Warm Mocha**, and **Mint Marine** — and watch the entire app update instantly. Themes are persisted across sessions.

### ☁️ Cloud persistence
All data is stored securely in Supabase (PostgreSQL), so your study queue follows you across devices.

### 🏆 Trophy Vault
An archive system that logs completed objectives and visualizes your lifetime academic progress. Finishing things feels good — this makes it visible.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS, Vite |
| Backend & Database | Supabase (PostgreSQL) |
| Routing | React Router |
| State management | React Hooks (`useState`, `useEffect`) |
| Icons | Google Material Symbols |

---

## Getting started

### Prerequisites

- Node.js v18+
- A [Supabase](https://supabase.com) project (free tier works fine)

### Installation

**1. Clone the repo**
```bash
git clone https://github.com/your-username/synq.git
cd synq
```

**2. Install dependencies**
```bash
npm install
```

**3. Add your environment variables**

Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_project_anon_key
```

You can find both values in your Supabase project under **Settings → API**.

**4. Start the dev server**
```bash
npm run dev
```

---

## Database schema

Synq uses a simple relational model:

```
subjects
├── id          uuid  (primary key)
├── name        text
└── created_at  timestamp

study_items
├── id          uuid  (primary key)
├── subject_id  uuid  (foreign key → subjects.id)
├── title       text
├── is_done     boolean
└── created_at  timestamp
```

`study_items.subject_id` references `subjects.id` with `ON DELETE CASCADE`, so removing a subject cleans up its items automatically.

---

## Project structure

```
src/
├── components/     # Reusable UI — Header, BottomNav, TimerRing, etc.
├── lib/            # Supabase client configuration
├── pages/          # Main views — Dashboard, Timer, Archive, Settings
├── App.jsx         # Global routing and theme provider
└── index.css       # CSS variables and Tailwind directives
```

---

## Roadmap

- [ ] Authentication (multi-user support)
- [ ] Session history and weekly stats
- [ ] Push notifications for break reminders
- [ ] PWA support for offline use

---

## Author

**Belal Mahmoud** — Software developer & tester

> Built with intent. Made for focus.