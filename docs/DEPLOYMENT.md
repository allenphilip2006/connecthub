# Deployment Instructions

## Frontend (Vercel)
- Set build command: `npm run build`
- Output directory: `frontend/dist`
- Install command: `npm install`
- Root directory: `frontend`
- Environment:
  - VITE_API_BASE_URL set to backend domain if externalized

## Backend
- Deploy Spring Boot to a VM or platform supporting Java.
- Configure environment:
  - DATABASE_URL, DB_USER, DB_PASSWORD
  - JWT_SECRET
  - UPLOAD_DIR paths or S3 credentials
- Enable CORS for the Vercel domain.

## Domain Setup
- Point frontend domain to Vercel project.
- Backend domain and TLS via reverse proxy.
