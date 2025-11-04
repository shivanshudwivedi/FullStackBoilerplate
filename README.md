# AfterQuery Interview Platform

- **Live App (Demo):** https://full-stack-boilerplate-rho.vercel.app/
- **Live Backend (Demo):** https://fullstackboilerplate-production.up.railway.app
- **Demo Video:** [Link to your demo video]

---

### Time & Availability

-- Hours spent on take-home: 10 hours
-- Weekly availability: 20 hours in-semester + more if project needs
-- Open to full-time: Yes

### Preferred Position

-- SWE Intern 
-- TPM Intern
-- (I love the mission of the company & ready to contribute in whatever manner possible)

### Contact

Name: Shivanshu Dwivedi
Email: shitanshri@gmail.com
Phone: +1-860-209-7055
Linkedin: https://wwww.linkedin.com/in/shivanshudwivedi
GitHub: https://wwww.github.com/shivanshudwivedi

---

## Description 

This repository contains a full-stack technical assessment platform designed to streamline the take-home interview process. It allows administrators to create coding assessments, invite candidates, and review their submissions in a seamless, integrated environment.

## Features Implemented

The platform includes a robust set of features for both administrators and candidates, ensuring a smooth and efficient interview workflow.

### Admin Experience

*   **Assessment Creation:** Admins can create new assessments, providing a title, description, detailed instructions in Markdown, and a link to a GitHub seed repository.
*   **Time Configuration:** Set flexible deadlines, including a window for candidates to start the assessment and a fixed duration for completion once started.
*   **Candidate Invitation:** Invite candidates by email and GitHub username. The platform automatically creates a private repository for each candidate and sends a collaborator invitation.
*   **Centralized Dashboard:** View all created assessments and the status of every invited candidate in a clear, organized dashboard.
*   **In-Platform Review:** Review candidate submissions directly within the application.
    *   **In-Platform Diff Viewer:** View detailed code changes with a side-by-side diff for each file, eliminating the need to navigate to GitHub.
    *   **AI-Powered Analysis:** Generate an AI-powered summary of a candidate's submission to quickly identify strengths and weaknesses.
    *   **AI-Powered Inline Commenting:** Select any block of code in the diff viewer and generate an AI comment based on a custom prompt (e.g., "Refactor this," "Explain this code").
    *   **Stack Ranking:** Rank candidates on a scale of 1-100 and add manual notes to standardize the review process.
*   **Admin Preview:** Preview an assessment from the candidate's perspective before sending it out, ensuring all instructions and details are correct.
*   **Follow-Up Workflow:** Send customized follow-up emails to candidates directly from the review page.

### Candidate Experience

*   **Email Invitation:** Candidates receive a personalized email invitation with a unique link to start their assessment.
*   **Clear Instructions:** A dedicated start page displays the assessment title, description, instructions, and deadlines.
*   **Automated Repository Creation:** Upon starting, a private GitHub repository is automatically created for the candidate from the seed repository.
*   **Collaborator Access:** The candidate is automatically invited to their private repository, ensuring they can clone and push their work securely.
*   **Submission Confirmation:** A confirmation modal requires the candidate to type "CONFIRM" to prevent accidental submissions.
*   **Post-Submission Access Control:** Once a candidate submits their work, their access to the repository is automatically revoked.

---

## Tech Stack

This project is a monorepo with a modern, full-stack architecture.

*   **Frontend:** Next.js, React, TypeScript
*   **Backend:** Python, FastAPI
*   **Database:** Supabase (PostgreSQL)
*   **Deployment:** Vercel (Frontend), Railway (Backend)
*   **Core Services:**
    *   **GitHub API:** For all repository management and diffing.
    *   **OpenRouter:** For all large language model (LLM) calls.

---

## Getting Started

To run this project locally, you will need to set up both the frontend and backend services.

### Prerequisites

*   Node.js and npm
*   Python and pip
*   A Supabase project
*   A GitHub account with a [Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/FullStackBoilerplate.git
cd FullStackBoilerplate
```

### 2. Configure Environment Variables

You will need to create `.env` files for both the frontend and backend. Examples are provided in `frontend/env.example` and `backend/env.example`.

*   **`frontend/.env`**:
    *   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key.
*   **`backend/.env`**:
    *   `SUPABASE_URL`: Your Supabase project URL.
    *   `SUPABASE_KEY`: Your Supabase service role key.
    *   `GITHUB_MACHINE_USER_TOKEN`: Your GitHub Personal Access Token.
    *   `OPENROUTER_API_KEY`: Your OpenRouter API key.
    *   `FRONTEND_URL`: The URL of your frontend (e.g., `http://localhost:3000` OR Deployed URL).

### 3. Set Up the Database

Navigate to the `db` directory and run the `schema.sql` file in your Supabase project's SQL editor to set up the necessary tables and policies.

### 4. Run the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The backend will be available at `http://localhost:8000` OR the Deployed URL.

### 5. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000` OR the deployed URL.

---

## Deployment

*   **Frontend:** The frontend is configured for seamless deployment to **Vercel**. Simply link your repository to a new Vercel project.
*   **Backend:** The backend is intended for deployment on **Railway**. Configure a new Railway project to run the `uvicorn` command.
