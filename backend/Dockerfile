FROM python:3.11-slim

WORKDIR /workspace

# Copy dependencies and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files maintaining module structure
COPY app/ ./app/

# Expose port (default Cloud Run port)
ENV PORT=8080

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
