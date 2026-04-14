🚀 Job Portal with Resume Matching (FAISS Vector Search)

## 📌 Project Overview

This project is a **full-stack Job Portal web application** that enables candidates to apply for jobs and recruiters to efficiently find suitable candidates using **semantic resume matching**.

The system leverages **FAISS (Facebook AI Similarity Search)** to perform fast and accurate **vector-based similarity search** between job descriptions and candidate resumes.

---

## ✨ Key Features

### 👤 Candidate Module

* User Registration & Login
* Browse available job listings
* Apply for jobs
* Upload resume
* Save/bookmark jobs

### 🧑‍💼 Recruiter Module

* Post and manage job listings
* View candidate applications
* Search candidates using semantic matching
* Shortlist relevant candidates

### 🤖 Advanced Functionality

* Resume parsing and preprocessing
* Embedding generation for resumes and job descriptions
* **FAISS-based vector similarity search**
* Efficient candidate-job matching system

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Vite
* Tailwind CSS

### Backend

* FastAPI (Python)

### Database

* SQLite (for development)

### Machine Learning / Search

* FAISS (Vector Similarity Search)
* Embedding-based semantic matching

---

## 📁 Project Structure

```
JOB-PORTAL/
├── backend/
├── frontend/
├── .gitignore
├── README.md
```

---

## ⚙️ Installation & Setup

### 🔹 Backend Setup

```
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 🔹 Frontend Setup

```
cd frontend
npm install
npm run dev
```


