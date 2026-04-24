# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
COPY docs/ai-collab-protocols.md /docs/ai-collab-protocols.md
COPY backend/tests/fixtures/stats_contract_cases.json /backend/tests/fixtures/stats_contract_cases.json
COPY content/roles.json /content/roles.json
RUN npm run build

# Stage 2: Python backend + serve static
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./backend/
COPY history_database/ ./history_database/
COPY --from=frontend-build /frontend/dist/ ./dist/
EXPOSE 8000
WORKDIR /app/backend
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
