# ClimateWise — Final Year Project starter

**Purpose:** an educational climate-change mobile app for teenagers and young adults.

This is the first working full-stack slice, not the finished FYP. It includes a mobile UI, a Python API, SQLite storage, lesson content, a quiz that is marked by the backend, and saved learner progress.

## What's included

- **Frontend:** Expo + React Native + TypeScript (`frontend/`)
- **Backend:** Python + FastAPI (`backend/main.py`)
- **Database:** SQLite; the database file is created automatically at `backend/climatewise.db`
- **API documentation:** FastAPI's interactive `/docs` page
- **Working flow:** open a lesson → mark it complete → answer quiz questions → see saved progress

The “Explore Data” screen is a planned UI section at this stage. It deliberately does not show made-up climate statistics. Later we will connect a documented public climate dataset and show the data source, units and date range in the app.

## Requirements

- Python 3.11 or newer
- Node.js 22 LTS (or the Node.js version required by the current Expo SDK)
- VS Code or another code editor

Expo's official project guide: https://docs.expo.dev/get-started/create-a-project/
FastAPI first steps: https://fastapi.tiangolo.com/tutorial/first-steps/

## 1. Start the backend (Windows PowerShell)

Open a terminal in this project, then run:

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

If PowerShell blocks activation, either allow it for the current terminal with `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` and activate again, or use Command Prompt and run `.venv\Scripts\activate.bat`.

### Ubuntu / Linux alternative

From the project root, use:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Now open these addresses in your browser:

- API status: http://127.0.0.1:8000/api/health
- Interactive API docs: http://127.0.0.1:8000/docs
- Lessons JSON: http://127.0.0.1:8000/api/lessons

Keep this terminal running.

## 2. Start the frontend

Open a **second terminal** at the project folder:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run start
```

When Expo starts, press **W** in the terminal to open the app in your computer's browser. For Android/iOS, install Expo Go on your phone and scan the QR code. Expo's official guide covers setup and troubleshooting: https://docs.expo.dev/tutorial/create-your-first-app/

### If testing on a physical phone

`127.0.0.1` on your phone points to the phone, not your computer. Find your computer's local Wi-Fi IP (on Windows, run `ipconfig` and look for the IPv4 address of the active Wi-Fi adapter), then edit `frontend/.env` to use it, for example:

```text
EXPO_PUBLIC_API_URL=http://192.168.1.25:8000
```

That IP is only an example. Use your own address and make sure the phone and computer are on the same network. Restart Expo after changing `.env`. Your firewall may need to allow local access to port 8000.

## 3. Learn by testing the API

With the backend running, open http://127.0.0.1:8000/docs. Try these endpoints:

- `GET /api/health` — checks whether the API is running
- `GET /api/lessons` — fetches lesson summaries from SQLite
- `GET /api/lessons/1` — fetches the full first lesson
- `GET /api/quiz/questions?lesson_id=1` — fetches quiz questions without exposing correct answers
- `POST /api/quiz/submit` — sends an answer to be checked and saved by the backend
- `GET /api/progress/demo-learner` — returns saved progress

A sample quiz submission body is:

```json
{
  "question_id": 1,
  "selected_option": 1,
  "learner_id": "demo-learner"
}
```

The backend checks the answer and records it in SQLite. The app uses the same demo learner ID for the first prototype; real accounts and authentication are future work.

## 4. Project structure

```text
climatewise-fyp/
├── README.md
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── climatewise.db        # generated automatically; not included in version control
└── frontend/
    ├── App.tsx               # app screens and navigation
    ├── app.json
    ├── package.json
    ├── tsconfig.json
    └── .env.example
```

## 5. Next milestones

1. Get the app running locally and understand the request/response flow.
2. Improve the lesson experience with original illustrations and accessible interactions.
3. Add sourced climate datasets and real data visualisations.
4. Add automated tests and improve database structure.
5. Build a defensible machine-learning feature based on learner activity, then evaluate it.
6. Consider an AI tutor only after the core learning flow is stable.
7. Write the formal proposal, requirements, architecture/UML, testing and evaluation evidence as the system evolves.

## Prototype limitations to record for the FYP

- The current learner is a demo profile; user registration, authentication, privacy controls and account management are not implemented.
- CORS is open for local development only and must be restricted before public deployment.
- Lesson content is starter content and will need a source review and references in the final academic version.
- Climate data charts, ML and AI are not implemented in this first slice. We will add them after the core system works.
