# Job Portal (FastAPI + FAISS + Gemini)

## 📌 Project Overview
Traditional recruitment platforms rely on rigid keyword matching, which often overlooks highly qualified candidates. This project is a **full-stack, AI-native Job Portal** that revolutionizes the hiring process by using **Generative AI (Google Gemini)** for structured data extraction and **Dense Vector Search (FAISS + HuggingFace)** for true semantic candidate-job matching.

The system allows candidates to apply seamlessly with PDF resumes and empowers recruiters to find the best talent based on contextual meaning, skills, and experience rather than exact keyword overlap.

---

## Core Architecture & Features

### AI & Semantic Search Engine
* **LLM Data Extraction:** Uses Google Gemini 2.5 Flash to automatically parse unstructured resumes and job descriptions into structured metadata (e.g., core skills, job titles, years of experience).
* **Dense Vector Embeddings:** Converts extracted profiles into 384-dimensional dense vectors using HuggingFace's `SentenceTransformers` (`all-MiniLM-L6-v2`).
* **Cosine Similarity Matching:** Utilizes FAISS (`IndexFlatIP`) with L2-normalized arrays to calculate highly accurate, human-readable semantic match percentages (0% - 100%).
* **Fault-Tolerant Heuristics:** Features deterministic fallback algorithms (regex/keyword matching) to ensure the vector engine continues to operate flawlessly even if external LLM APIs time out.

### Enterprise-Grade Security & Performance
* **Role-Based Access Control (RBAC):** Strict isolation between `CANDIDATE`, `RECRUITER`, and `ADMIN` roles using JWT authentication.
* **IDOR Prevention:** Cryptographically derives user identity from JWT payloads, preventing Cross-Tenant data leakage and Insecure Direct Object Reference attacks.
* **Asynchronous I/O:** Leverages FastAPI's async event loop for non-blocking in-memory PDF parsing (via PyMuPDF), preventing server hangs during high-traffic resume uploads.
* **Database Optimization:** Eliminates N+1 query bottlenecks using SQLAlchemy eager loading (`joinedload`) and utilizes production-ready connection pooling.

### Candidate Features
* Secure Registration & Login with dedicated Professional Profiles.
* Browse and securely bookmark/save active job listings.
* Apply to jobs via PDF upload (processed entirely in RAM for privacy).
* Track application pipeline statuses in real-time.

### Recruiter Features
* Create and manage job postings (automatically triggers AI vectorization).
* View a dedicated Job Dashboard with eager-loaded candidate applicant pools.
* Execute Semantic Vector Searches to find candidates meeting a specific `min_score` threshold.
* Update candidate application statuses (e.g., Applied → Shortlisted).

---

## Tech Stack

**Backend (REST API)**
* **Framework:** FastAPI (Async Python)
* **Database:** PostgreSQL (Production) / SQLite (Local Dev)
* **ORM:** SQLAlchemy 2.0
* **Validation:** Pydantic V2

**AI & Machine Learning**
* **LLM:** Google GenAI SDK
* **Vector Engine:** FAISS (Facebook AI Similarity Search - CPU)
* **Embeddings:** SentenceTransformers (`all-MiniLM-L6-v2`)
* **Document Parsing:** PyMuPDF (`fitz`)

**Frontend**
* **Framework:** React.js (Vite)
* **Styling:** Tailwind CSS

---

## Project Structure

```text
.
├── README.md
├── backend
│   ├── app
│   │   ├── api
│   │   │   ├── dependencies.py
│   │   │   └── routers
│   │   │       ├── admin.py
│   │   │       ├── applications.py
│   │   │       ├── auth_router.py
│   │   │       ├── dashboard.py
│   │   │       ├── jobs.py
│   │   │       ├── saved_jobs.py
│   │   │       └── search.py
│   │   ├── core
│   │   │   ├── auth.py
│   │   │   └── database.py
│   │   ├── models
│   │   │   └── schema.py
│   │   ├── schemas
│   │   │   ├── application_dto.py
│   │   │   ├── auth_dto.py
│   │   │   ├── dashboard_dto.py
│   │   │   ├── job_dto.py
│   │   │   ├── saved_job_dto.py
│   │   │   └── search_dto.py
│   │   ├── services
│   │   │   ├── application_service.py
│   │   │   ├── dashboard_service.py
│   │   │   ├── job_service.py
│   │   │   ├── saved_job_service.py
│   │   │   └── vector_service.py
│   │   └── utils
│   │       ├── embedding_pipeline.py
│   │       ├── llm_parser.py
│   │       └── text_parser.py
│   ├── main.py
│   └── requirements.txt
└── frontend
    ├── README.md
    ├── index.html
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.js
    ├── setup.txt
    ├── src
    │   ├── App.jsx
    │   ├── api
    │   │   └── client.js
    │   ├── components
    │   │   └── Navbar.jsx
    │   ├── context
    │   │   └── AuthContext.jsx
    │   ├── index.css
    │   ├── main.jsx
    │   └── pages
    │       ├── AdminDashboard.jsx
    │       ├── AllApplicants.jsx
    │       ├── CandidateDashboard.jsx
    │       ├── Home.jsx
    │       ├── JobDetail.jsx
    │       ├── Jobs.jsx
    │       ├── Login.jsx
    │       ├── PostJob.jsx
    │       ├── RecruiterDashboard.jsx
    │       ├── Register.jsx
    │       ├── ResumeUpload.jsx
    │       ├── SavedJobs.jsx
    │       └── SearchCandidates.jsx
    ├── tailwind.config.js
    └── vite.config.js
```

---

## Installation & Setup

### Prerequisites
* Python 3.10+
* Node.js 18+
* A Google Gemini API Key

### 🔹 Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables:**
   Create a `.env` file in the `backend/` directory and add the following:
   ```env
   # Database
   SQLALCHEMY_DATABASE_URL=sqlite:///./sql_app.db
   
   # Security
   JWT_SECRET_KEY=your_super_secret_key_here
   ALGORITHM=HS256
   
   # AI Integration
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```

5. **Run the API Server:**
   ```bash
   uvicorn main:app --reload
   ```
   *The interactive API documentation will be available at `http://127.0.0.1:8000/docs`.*

### 🔹 Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

---

## API Endpoints Overview

The backend follows a strict RESTful architecture. Key endpoint prefixes include:

* **`/auth`**: User registration, JWT login, and session validation.
* **`/jobs`**: Job creation, updates, and public retrieval.
* **`/applications`**: Asynchronous PDF resume uploads and candidate history.
* **`/search`**: Advanced FAISS semantic candidate querying.
* **`/dashboard`**: Recruiter pipeline management and applicant eager-loading.
* **`/saved-jobs`**: Secure candidate bookmarking.

*(For full request/response schemas, run the backend and visit the `/docs` Swagger UI).*