"""
LLM integration for structured data extraction using Google Gemini.
"""
import os

from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set.")

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# Initialize the client once to reuse HTTP connection pools across requests
client = genai.Client(api_key=GEMINI_API_KEY)


class WorkExperience(BaseModel):
    job_title: str
    company: str
    duration: str
    responsibilities: list[str] = Field(description="Key achievements, tools used, and duties")

class Education(BaseModel):
    degree: str
    institution: str
    graduation_year: str | None = None

class ResumeExtraction(BaseModel):
    professional_summary: str = Field(description="A concise 2-3 sentence summary of the candidate's core profile.")
    primary_skills: list[str] = Field(description="Hard skills, programming languages, databases, tools, and frameworks.")
    soft_skills: list[str] = Field(description="Interpersonal, leadership, and professional traits.")
    job_titles: list[str] = Field(description="A deduplicated list of all job titles held by the candidate.")
    years_of_experience: int = Field(description="Total estimated years of professional experience.")
    work_experience: list[WorkExperience]
    education: list[Education]
    certifications: list[str]

class JobExtraction(BaseModel):
    core_role_summary: str = Field(description="A concise 2-3 sentence summary of the primary purpose of the role.")
    mandatory_skills: list[str] = Field(description="Must-have hard skills, programming languages, databases, or tools.")
    nice_to_have_skills: list[str] = Field(description="Bonus, optional, or preferred skills.")
    soft_skills: list[str] = Field(description="Required interpersonal, leadership, and professional traits.")
    minimum_years_experience: int = Field(description="Minimum years of professional experience required. Output 0 if not specified.")
    education_requirements: list[str] = Field(description="Required degrees, certifications, or educational background.")


def extract_job_data(title: str, description: str, requirements: str) -> JobExtraction:
    """Extract structured parameters from raw job posting text."""
    prompt = f"""
    Act as an Expert Technical Recruiter. Extract structured data from the job posting provided below.
    This data will be used to calculate a similarity score against candidate resumes, so ensure the skills and experience requirements are categorized accurately.
    
    Job Title: {title}
    Description: {description}
    Requirements: {requirements}
    """

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_schema=JobExtraction,
            temperature=0.1, 
        ),
    )
    
    return JobExtraction.model_validate_json(response.text)


def extract_resume_data(raw_text: str) -> ResumeExtraction:
    """Extract structured professional history from raw resume text."""
    prompt = f"""
    Act as an HR Data Parser. Extract structured data from the resume text provided below.
    Ensure 'years_of_experience' is a calculated integer based on the work history timeline.
    Ensure 'professional_summary' is written in the third person.
    
    Resume Text:
    {raw_text}
    """

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_schema=ResumeExtraction,
            temperature=0.1,
        ),
    )
    
    return ResumeExtraction.model_validate_json(response.text)