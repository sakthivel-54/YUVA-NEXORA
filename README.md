# NEXORA — Modern Engineering Digital Workspace

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Vanilla JS](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0%20(Pure%20Vanilla)-3ECF8E)](https://github.com/sakthivel-54/YUVA-NEXORA)
[![WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-3ECF8E)](https://www.w3.org/WAI/standards-guidelines/wcag/)

> **YuvaIntern Junior Frontend Developer Internship**  
> Developed as a single, progressively enhanced web application across five milestone weeks.

---

## 1. Project Overview

**NEXORA** is a modern, high-performance digital workspace platform tailored for engineering squads, systems architects, and project leads. Designed with an authentic developer/SaaS aesthetic, it delivers project organization, milestone triage, cross-functional team allocation, and productivity analytics with **zero external libraries or framework dependencies**.

### Visual Direction & Design Tokens
- **Theme:** Developer/SaaS Aesthetic (`#111318`, `#F6F4EF`, `#3ECF8E`)
- **Background:** `#111318` (Primary Deep Canvas)
- **Surface Panels:** `#171A21` (Raised Surface Cards)
- **Primary Text:** `#F6F4EF` (High-contrast Off-White)
- **Accent:** `#3ECF8E` (Emerald Tech Green)
- **Status Identifiers:** High-contrast tokens paired with non-color symbols (`● Active`, `✓ Completed`, `! At Risk`, `— On Hold`).
- **Strict Aesthetic Rules:** Zero gradients, zero excessive glows, zero purple tones, zero glassmorphism, zero unnecessary decorative elements.
- **Typography:** Monospace technical fonts for badges, IDs, and metrics numerals; clean system sans-serif for optimal body readability.

---

## 2. Core Features

### Landing Page (`index.html`)
- **Responsive Navigation:** Desktop navigation transitioning to an accessible slide-down mobile drawer.
- **Hero Showcase:** High-impact technical copy ("A clearer workspace for better work"), primary/secondary actions, and pure HTML/CSS interactive product mockup.
- **Core Architecture Cards:** 4 operational pillars (Project Management, Team Collaboration, Task Tracking, Productivity Insights).
- **Interactive Tabs Component:** Overview, Analytics, Activity, and Settings panels with full W3C keyboard arrow support.
- **Collapsible FAQ Accordion:** Accessible expandable questions with live `aria-expanded` and `hidden` attribute synchronization.
- **Accessible Project Modal:** Focus-trapped dialog with Escape key and backdrop dismissal.
- **Toast Notifications:** Reusable, polite live-region announcements with auto-dismissal and pause-on-hover.

### Analytics & Team Dashboard (`dashboard.html`)
- **Dynamic Data Binding:** Loads and validates structured JSON from `data/data.json`.
- **Dynamic Overview Cards:** 6 summary metrics calculated dynamically from data (Total Projects, Active, Completed, Team, Tasks, Average Progress).
- **Lightweight Visual Charts:** Pure Vanilla HTML/CSS bar charts for Status Distribution and Category Allocation, backed by accessible HTML tables for screen readers.
- **Multi-Faceted Search & Filter:** Simultaneous filtering by search substring (name, owner, category, ID), Status, Priority, and Category.
- **Accessible Table Sorting:** Interactive column headers with ascending/descending toggles, visual direction indicators, and `aria-sort`.
- **Project Detail Inspection Modal:** Comprehensive view of project progress, deadlines, allocated capacity, and filtered milestone tasks.
- **Team Roster Grid:** Individual squad contributor cards with role titles and active project mapping.
- **Live Activity Feed:** Chronological audit trail with formatted relative/absolute timestamps.
- **Resilience States:** Full handling of Loading spinners, Error banners with Retry action, and Empty States with Reset Filters action.
- **Cache-Busting Refresh Control:** Live data re-fetch with simulated network latency and confirmation toasts.

---

## 3. Technologies Used

- **HTML5:** Semantic landmarks (`header`, `nav`, `main`, `section`, `article`, `footer`), accessible tables, forms, and dialogs.
- **CSS3:** Custom properties (CSS variables), CSS Flexbox, CSS Grid, media queries, reduced motion support.
- **JavaScript (Vanilla ES6+):** Modular IIFEs, DOM APIs, event delegation, focus trapping, centralized state management.
- **Data Source:** Structured JSON (`data/data.json`) containing 12 projects, 8 team members, 24 tasks, and 16 activity logs.
- **Dependencies:** **Zero.** No React, Vue, Angular, Bootstrap, Tailwind, jQuery, or Chart.js.

---

## 4. Weekly Development Progression

This repository tracks each internship milestone sequentially across dedicated Git branches:

| Milestone | Branch | Commit Message | Focus Area & Deliverables |
| :--- | :--- | :--- | :--- |
| **Week 1** | `week-1` | `Week 1 - Responsive NEXORA Landing Page` | Semantic HTML5 structure, CSS design system tokens, responsive viewports (320px–1920px), foundational accessibility, and lightweight product preview. |
| **Week 2** | `week-2` | `Week 2 - Add Interactive UI Components` | Modular JS architecture (`js/app.js`), Accessible Tabs, FAQ Accordion, Project Modal dialog, Toast Notification live regions, and mobile drawer. |
| **Week 3** | `week-3` | `Week 3 - Enhance Accessibility` | Skip links, visible focus indicators, modal focus trap & restore, arrow key tab navigation, non-color status indicators, and reduced-motion media queries. |
| **Week 4** | `week-4` | `Week 4 - Optimize Frontend Performance` | Event delegation on containers, DOM query caching, GPU-composited transforms/opacity, script deferral, and efficient layout calculations. |
| **Week 5** | `week-5` | `Week 5 - Build Final NEXORA Dashboard` | Full interactive dashboard application (`dashboard.html`, `js/dashboard.js`), dynamic JSON binding, search/filter/sort, custom HTML/CSS charts, team & activity feeds. |
| **Release**| `main` | Production-Ready Release | Master branch combining all five milestones with complete technical documentation and production validation. |

---

## 5. Project Directory Structure

```text
YUVA-NEXORA/
│
├── index.html                   # Responsive Landing Page & Interactive Showcase
├── dashboard.html               # Working SaaS Analytics & Team Dashboard
│
├── css/
│   └── style.css                # Pure CSS3 Design System & Responsive Rules
│
├── js/
│   ├── app.js                   # Landing Page Interactivity (Tabs, Modal, Toasts)
│   └── dashboard.js             # Dashboard State, JSON Data Fetch, Filters & Chart
│
├── data/
│   └── data.json                # Project, Team, Task & Activity Records (12 Projects)
│
├── assets/
│   ├── images/                  # Lightweight Web Assets
│   └── icons/                   # Lightweight Clean SVG Vector Marks
│
├── .gitignore                   # Production Git Ignore Configuration
└── README.md                    # Technical Master Documentation
```

---

## 6. How to Run the Project Locally

Because the application uses modern JavaScript asynchronous `fetch()` APIs to load `data/data.json`, opening via `file://` protocol may trigger browser CORS restrictions. Running through a local HTTP server is strongly recommended.

### Method 1: VS Code Live Server (Recommended)
1. Open the project root directory in VS Code.
2. Install the **Live Server** extension (`ritwickdey.LiveServer`).
3. Right-click `index.html` or `dashboard.html` and choose **"Open with Live Server"**.
4. The application will launch at `http://127.0.0.1:5500/`.

### Method 2: Python 3 Built-in HTTP Server
```bash
# Navigate to the project root directory
cd YUVA-NEXORA

# Start Python HTTP server
python -m http.server 8000
```
Open your browser and navigate to `http://localhost:8000/`.

### Method 3: Node.js `npx serve`
```bash
cd YUVA-NEXORA
npx -y serve .
```

---

## 7. Accessibility Highlights

- **WCAG 2.1 AA Compliance:** Minimum color contrast of 15.6:1 for primary headings and 6.8:1 for body copy.
- **Skip Links:** Jump directly to `#main-content` or `#dashboard-main` via keyboard Tab.
- **Accessible Modals:** Trapped keyboard focus within dialogs, Escape key listener, backdrop dismissal, and focus restoration to original trigger button.
- **Non-Color Status Indicators:** Every status badge pairs color with symbols and explicit text (`● Active`, `✓ Completed`, `! At Risk`, `— On Hold`).
- **Reduced Motion Support:** `@media (prefers-reduced-motion: reduce)` resets all transitions and animations to 0.001s.
- **Accessible Data Visualizations:** All charts include a companion HTML data table for screen readers.

---

## 8. Performance Highlights

- **Zero Framework Footprint:** Zero kilobytes of framework or heavy library bloat.
- **Event Delegation:** Unified listeners handle accordion toggles, modal dialogs, tabs, and toast triggers.
- **Cached DOM References:** Eliminates redundant DOM queries during user interactions.
- **Hardware-Accelerated Transitions:** Animations strictly utilize `transform` and `opacity` to avoid layout reflows.

---

## 9. Browser Requirements & Technical Limitations

### Browser Support
- **Chrome / Chromium:** Version 90+ (Full Support)
- **Mozilla Firefox:** Version 88+ (Full Support)
- **Apple Safari:** Version 14+ (Full Support)
- **Microsoft Edge:** Version 90+ (Full Support)

### Technical Limitations
- Modern browser required for CSS Custom Properties, CSS Grid, and ES6+ JavaScript.
- Fetch API for local JSON loading requires HTTP server execution (`localhost`) to satisfy browser origin security policies.

---

## 10. Future Roadmap

- [ ] Backend REST API integration (Node.js / Go / Python).
- [ ] User authentication with JWT and Role-Based Access Control (RBAC).
- [ ] Multi-tenant database persistence (PostgreSQL / SQLite).
- [ ] Real-time multi-user collaboration via WebSockets.
- [ ] Progressive Web App (PWA) offline service workers.
- [ ] Advanced time-series velocity graphs and PDF report generation.

---

## 11. Author & Repository Information

- **Project:** NEXORA
- **Repository:** [https://github.com/sakthivel-54/YUVA-NEXORA](https://github.com/sakthivel-54/YUVA-NEXORA)
- **Intern:** YuvaIntern Junior Frontend Developer Intern
- **Track:** Frontend Web Development
- **License:** MIT License
