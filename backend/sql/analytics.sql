
-- US-11: BASIC ANALYTICS

-- Total applications per job
SELECT job_id, COUNT(*) AS total_applications
FROM applications
GROUP BY job_id;

-- Total candidates
SELECT COUNT(*) AS total_candidates
FROM candidates;

-- Total jobs
SELECT COUNT(*) AS total_jobs
FROM jobs;

-- Applications per month
SELECT MONTH(created_at) AS month, COUNT(*) AS applications
FROM applications
GROUP BY MONTH(created_at);


-- US-12: OPTIMIZED QUERIES

-- Applications per job with job title
SELECT j.title, COUNT(a.id) AS total_applications
FROM jobs j
JOIN applications a ON j.id = a.job_id
GROUP BY j.title;

-- Top candidates
SELECT c.name, COUNT(a.id) AS total_applications
FROM candidates c
JOIN applications a ON c.id = a.candidate_id
GROUP BY c.name
ORDER BY total_applications DESC;

-- Jobs with no applications
SELECT j.title
FROM jobs j
LEFT JOIN applications a ON j.id = a.job_id
WHERE a.id IS NULL;