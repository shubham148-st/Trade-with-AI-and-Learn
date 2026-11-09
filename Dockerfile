# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend Runtime
FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY nse-dashboard/ ./nse-dashboard/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

ENV PORT=5500
EXPOSE 5500

CMD ["sh", "-c", "gunicorn --chdir nse-dashboard app:app --bind 0.0.0.0:${PORT:-5500} --workers 2 --threads 4 --timeout 120"]
