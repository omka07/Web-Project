# Backend image — serves Django via gunicorn.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install system deps needed by psycopg2 + general build tooling, then drop build tools.
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

# docker-compose runs migrate + gunicorn via its `command:`, but when run
# directly with `docker run` we fall back to a sensible default.
CMD ["gunicorn", "myproject.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
