
<a id="disaster-response-system"></a>

<p align="center">
  <img src="frontend/frontend/public/banner.png" alt="Disaster Response System Banner" width="85%">
</p>

<h1 align="center">Disaster Response System 🚨</h1>
<p align="center">
  A Real-Time Disaster Management Platform for Citizens, Volunteers & Administrators
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi">
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?logo=react">
  <img src="https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql">
  <img src="https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite">
  <img src="https://img.shields.io/badge/TailwindCSS-4.x-38BDF8?logo=tailwindcss">
  <img src="https://img.shields.io/badge/Docker-supported-2496ED?logo=docker">
  <img src="https://img.shields.io/badge/license-MIT-green">
</p>

**Disaster Response System** is a full-stack web application designed to coordinate emergency response in real time — connecting citizens who report incidents, volunteers who respond on the ground, and administrators who manage resources, assignments, and alerts from a central command dashboard.
Built with FastAPI, React 19, PostgreSQL, and WebSockets, it provides role-based dashboards, live notifications, interactive maps, and a complete incident lifecycle management system.

## Table of Contents
- [💡 About the Project](#about-the-project)
- [⚡ Quick Start](#quick-start)
- [✨ Features](#features)
- [🗂️ Project Structure](#project-structure)
- [🖥️ Tech Stack](#tech-stack)
- [📄 Pages & Dashboards](#pages--dashboards)
- [🔌 API Modules](#api-modules)
- [🚀 Getting Started](#getting-started)
- [🛠️ Run with Docker](#run-with-docker)
- [🔒 Environment Variables](#environment-variables)
- [🚀 Future Enhancements](#future-enhancements)
- [🤝 Contributing](#contributing)
- [🙏 Acknowledgements](#acknowledgements)
- [📜 License](#license)

---

## ⚡ Quick Start

```bash
# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend/frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. The backend API runs at [http://localhost:8000](http://localhost:8000). 🚀

<p align="right">(<a href="#disaster-response-system">⬆ Back to top</a>)</p>

---

## 💡 About the Project

**Disaster Response System** is a role-driven emergency coordination platform. It allows:

- **Citizens** to report incidents with location, images, and severity—and track their status in real time
- **Volunteers** to browse available incidents nearby, accept assignments, toggle availability, and get live alerts
- **Administrators** to manage the full pipeline—from incident triage and volunteer assignment to resource dispatch and analytics reporting

The platform uses **JWT-based authentication** with role-specific protected routes, **WebSocket notifications** for live updates, **Leaflet maps** for geospatial incident plotting, and **Recharts** for analytics dashboards.

<p align="right">(<a href="#disaster-response-system">⬆ Back to top</a>)</p>

---

## ✨ Features

- **Role-Based Access Control** — Separate dashboards and protected routes for Citizens, Volunteers, and Admins
- **Incident Reporting** — Citizens submit incidents with title, description, location, severity, and image uploads (multipart form data)
- **Real-Time Notifications** — WebSocket-powered live alerts across all dashboards via `NotificationCenter`
- **Interactive Maps** — Leaflet + React-Leaflet powered map views for Citizens and Volunteers to visualize incidents geographically
- **Volunteer Assignment System** — Admins assign volunteers and resources to incidents; full assignment history tracked
- **Resource Management** — Admin panel to track, allocate, and view details of emergency resources
- **Alerts Management** — Broadcast and manage emergency alerts across all user groups
- **Analytics Dashboard** — Recharts-powered visualizations of incident trends, volunteer performance, and resource usage
- **Report Wrong Info** — Users can flag incorrect incident details for review
- **JWT Authentication** — Secure token-based login with role-aware redirects and route protection
- **Zustand State Management** — Lightweight, reactive global state for auth and UI
- **React Query Caching** — Efficient server-state syncing with stale-time and retry configuration
- **Docker Support** — Containerised backend + PostgreSQL via `docker-compose`
- **DB Migrations** — Alembic-managed database schema versioning

<p align="right">(<a href="#disaster-response-system">⬆ Back to top</a>)</p>

---

## 🗂️ Project Structure

```
Disaster_Management/
│
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI entry point, CORS, router registration
│   │   ├── auth/                      # JWT auth, login, role dependencies
│   │   ├── users/                     # User models + routes
│   │   ├── incidents/                 # Incident CRUD, image upload, status tracking
│   │   ├── volunteers/                # Volunteer profiles, availability, assignments
│   │   ├── resources/                 # Resource inventory and allocation
│   │   ├── alerts/                    # Alert broadcast system
│   │   ├── assignments/               # Assignment history (incidents ↔ volunteers/resources)
│   │   ├── notifications/             # WebSocket real-time notifications
│   │   ├── analytics/                 # Aggregated stats and reporting
│   │   ├── citizens/                  # Citizen-specific routes
│   │   └── core/                      # Config, DB engine, base models
│   │
│   ├── alembic/                       # Database migration scripts
│   ├── uploads/                       # Incident image file storage
│   ├── requirements.txt               # Python dependencies
│   ├── Dockerfile                     # Backend Docker image
│   ├── docker-compose.yml             # Backend + PostgreSQL orchestration
│   ├── .env                           # Environment config (DB URL, secrets)
│   └── adminlogin.py                  # Admin seeder / login helper script
│
└── frontend/
    └── frontend/
        ├── src/
        │   ├── App.jsx                # App root — React Query + Toaster + Router
        │   ├── main.jsx               # Vite entry point
        │   ├── api/                   # Axios service layer
        │   │   ├── axiosInstance.js   # Base Axios config with JWT interceptors
        │   │   ├── authService.js     # Login, register, password reset
        │   │   ├── incidentService.js # Incident CRUD + image upload
        │   │   ├── volunteerService.js# Volunteer profile + assignments
        │   │   ├── resourceService.js # Resource fetch + management
        │   │   └── alertService.js    # Alert fetch + management
        │   │
        │   ├── pages/
        │   │   ├── LandingPage.jsx        # Public home with auth modals
        │   │   ├── auth/                  # Login, Register, Password Reset
        │   │   ├── citizen/               # Citizen dashboard & inner pages
        │   │   ├── volunteer/             # Volunteer dashboard & inner pages
        │   │   └── admin/                 # Admin dashboard & inner pages
        │   │
        │   ├── components/
        │   │   ├── NotificationCenter.jsx # Real-time WebSocket notification bell
        │   │   ├── auth/                  # Auth modal components
        │   │   └── ui/                    # Shared UI components (PageLoader, etc.)
        │   │
        │   ├── routes/
        │   │   ├── AppRouter.jsx      # BrowserRouter + lazy routes + role redirects
        │   │   └── ProtectedRoute.jsx # Role-guarded route wrapper
        │   │
        │   ├── store/
        │   │   ├── authStore.js       # Zustand auth state (user, token, isAuthenticated)
        │   │   └── uiStore.js         # Zustand UI state (modals, sidebar)
        │   │
        │   ├── hooks/                 # Custom React hooks
        │   └── utils/                 # Helper functions (getRolePath, formatters)
        │
        ├── package.json
        ├── vite.config.js
        └── index.html
```

<p align="right">(<a href="#disaster-response-system">⬆ Back to top</a>)</p>

---

## 🖥️ Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) — high-performance async Python web framework
- **Language**: Python 3.11
- **ORM**: [SQLAlchemy](https://www.sqlalchemy.org/) + [Alembic](https://alembic.sqlalchemy.org/) for migrations
- **Database**: [PostgreSQL 15](https://www.postgresql.org/)
- **Auth**: JWT via `python-jose` + `passlib` + `bcrypt`
- **Real-Time**: WebSockets (native FastAPI)
- **File Uploads**: `python-multipart`
- **Server**: Uvicorn (ASGI)

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- **Routing**: [React Router DOM v7](https://reactrouter.com/)
- **State Management**: [Zustand v5](https://zustand-demo.pmnd.rs/)
- **Server State**: [@tanstack/react-query v5](https://tanstack.com/query)
- **HTTP Client**: [Axios](https://axios-http.com/) with JWT interceptors
- **Maps**: [Leaflet](https://leafletjs.com/) + [React-Leaflet v5](https://react-leaflet.js.org/)
- **Charts**: [Recharts v3](https://recharts.org/)
- **Forms**: [Formik](https://formik.org/) + [Yup](https://github.com/jquense/yup) validation
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/) + [React Icons](https://react-icons.github.io/)
- **Toast Notifications**: [react-hot-toast](https://react-hot-toast.com/)

### Infrastructure
- **Containerisation**: Docker + Docker Compose
- **CORS**: FastAPI CORSMiddleware configured for `localhost:5173`

<p align="right">(<a href="#disaster-response-system">⬆ Back to top</a>)</p>

---

## 📄 Pages & Dashboards

### 🌐 Public
| Route | Page | Description |
|---|---|---|
| `/` | Landing Page | Hero, features, auth modals (Login/Register) |
| `/reset-password` | Password Reset | Email-based password recovery |

### 👤 Citizen (`/citizen/*`)
| Route | Page | Description |
|---|---|---|
| `/citizen/overview` | Overview | Summary stats, recent incidents, quick actions |
| `/citizen/report` | Report Incident | Form to submit new incidents with image upload |
| `/citizen/my-incidents` | My Incidents | List of all incidents submitted by the citizen |
| `/citizen/nearby` | Nearby Incidents | Map view of incidents in the citizen's area |
| `/citizen/incident/:id` | Incident Detail | Full detail view with status updates and comments |
| `/citizen/alerts` | Alerts | Live emergency alerts broadcast |
| `/citizen/profile` | Profile | View and update citizen profile |
| `/citizen/report-wrong-info` | Report Wrong Info | Flag incorrect incident information |

### 🦺 Volunteer (`/volunteer/*`)
| Route | Page | Description |
|---|---|---|
| `/volunteer/overview` | Overview | Dashboard with assignments, stats, and quick actions |
| `/volunteer/available` | Available Incidents | Browse open incidents available to accept |
| `/volunteer/assignments` | My Assignments | All current and past assignments |
| `/volunteer/incident/:id` | Incident Details | Full incident view from volunteer perspective |
| `/volunteer/map` | Map View | Leaflet map showing geolocated incidents |
| `/volunteer/availability` | Availability Toggle | Toggle active/inactive status |
| `/volunteer/alerts` | Alerts | Emergency alert feed |
| `/volunteer/profile` | Profile | Volunteer profile management |
| `/volunteer/report-wrong-info` | Report Wrong Info | Flag incorrect data |

### 🛡️ Admin (`/admin/*`)
| Route | Page | Description |
|---|---|---|
| `/admin/overview` | Overview | Command centre — system-wide stats and KPIs |
| `/admin/incidents` | Incident Management | View, filter, update, and assign all incidents |
| `/admin/incidents/:id` | Incident Details | Deep-dive incident management with assignment controls |
| `/admin/volunteers` | Volunteer Management | Manage volunteers, view profiles, check availability |
| `/admin/resources` | Resource Management | Track and allocate emergency resources |
| `/admin/resources/:id` | Resource Details | Detailed resource view with assignment history |
| `/admin/alerts` | Alert Management | Broadcast and manage system-wide alerts |
| `/admin/assignments` | Assignment History | Full log of all volunteer + resource assignments |
| `/admin/analytics` | Analytics | Charts and insights — incidents, response times, trends |
| `/admin/map` | Map View | System-wide incident map for command overview |
| `/admin/report-wrong-info` | Report Wrong Info | Review citizen-flagged data corrections |

<p align="right">(<a href="#disaster-response-system">⬆ Back to top</a>)</p>

---

## 🔌 API Modules

All routes are mounted under the prefix `/api/v1`.

| Module | Prefix | Description |
|---|---|---|
| Auth | `/api/v1/auth` | Login, register, token refresh |
| Users | `/api/v1/users` | User CRUD and profile management |
| Incidents | `/api/v1/incidents` | Incident reporting, status updates, image upload |
| Volunteers | `/api/v1/volunteers` | Volunteer profiles and availability |
| Resources | `/api/v1/resources` | Resource inventory and details |
| Alerts | `/api/v1/alerts` | Create and fetch broadcast alerts |
| Assignments | `/api/v1/assignments` | Assignment history by incident, volunteer, or resource |
| Notifications | `/api/v1/notifications` | WebSocket endpoint for real-time push |
| Analytics | `/api/v1/analytics` | Aggregated stats and reporting |

<p align="right">(<a href="#disaster-response-system">⬆ Back to top</a>)</p>

---

## 🚀 Getting Started

### Prerequisites
- Python `3.11+`
- Node.js `18+` and npm
- PostgreSQL `15+`
- Git

### Backend Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Disaster_Management/backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate      # Windows
   source .venv/bin/activate   # macOS/Linux
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure your `.env` file:
   ```env
   APP_NAME=Disaster Response System
   ENV=development
   DATABASE_URL=postgresql://<user>:<password>@localhost:5432/disaster_db
   SECRET_KEY=your_secret_key
   ADMIN_SECRET_KEY=your_admin_key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   ```

5. Run database migrations:
   ```bash
   alembic upgrade head
   ```

6. Start the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```

   API is live at [http://localhost:8000](http://localhost:8000) | Docs at [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend Setup

1. Navigate to the frontend folder:
   ```bash
   cd Disaster_Management/frontend/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

   App is live at [http://localhost:5173](http://localhost:5173)

### Seed Admin Account

```bash
cd backend
python adminlogin.py
```

<p align="right">(<a href="#disaster-response-system">⬆ Back to top</a>)</p>

---

## 🛠️ Run with Docker

Run the entire backend stack (FastAPI + PostgreSQL) with Docker Compose:

### Build and start:
```bash
cd backend
docker-compose up --build
```

### Stop containers:
```bash
docker-compose down
```

The backend will be available at `http://localhost:8000` and PostgreSQL at port `5432`.

<p align="right">(<a href="#disaster-response-system">⬆ Back to top</a>)</p>

---

## 🔒 Environment Variables

Create a `.env` file in the `backend/` directory with the following keys:

| Variable | Description | Example |
|---|---|---|
| `APP_NAME` | Application name | `Disaster Response System` |
| `ENV` | Environment mode | `development` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/disaster_db` |
| `SECRET_KEY` | JWT signing secret | `supersecretkey123` |
| `ADMIN_SECRET_KEY` | Admin registration secret | `superadmin123` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry duration | `60` |

> ⚠️ **Never commit your `.env` file to version control.** It is already listed in `.gitignore`.

<p align="right">(<a href="#disaster-response-system">⬆ Back to top</a>)</p>

---

## 🚀 Future Enhancements

- 📱 Mobile application (React Native) for field volunteers
- 🔔 SMS / Email alert integration (Twilio, SendGrid)
- 🗺️ Real-time volunteer location tracking on the map
- 📊 Exportable PDF/CSV reports from the analytics dashboard
- 🤖 AI-based incident severity classification
- 🌍 Multi-language support (Hindi, Telugu, English)
- 🔐 OAuth2 social login (Google, Microsoft)
- 🧪 Automated end-to-end testing with Playwright

<p align="right">(<a href="#disaster-response-system">⬆ Back to top</a>)</p>

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#disaster-response-system">⬆ Back to top</a>)</p>

---

## 🙏 Acknowledgements

- [FastAPI](https://fastapi.tiangolo.com/) — Modern, high-performance Python web framework
- [React](https://react.dev/) — The UI library powering all dashboards
- [PostgreSQL](https://www.postgresql.org/) — Reliable relational database engine
- [Leaflet](https://leafletjs.com/) — Open-source interactive maps
- [Recharts](https://recharts.org/) — Composable charting for analytics
- [Zustand](https://zustand-demo.pmnd.rs/) — Lightweight global state management
- [TanStack Query](https://tanstack.com/query) — Powerful server-state synchronization
- [Docker](https://www.docker.com/) — Container platform for consistent environments

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*This project is maintained by **Gudiwada Sruthi**. For support, please open an issue in the repository.*
