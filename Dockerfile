FROM python:3.11-slim

# Environment variables to optimize Python behavior
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONBUFFERED=1

# Set the working directory
WORKDIR /app

# Install required system dependencies (gettext for translations)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    netcat-openbsd gettext nano && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Expose the Django port
EXPOSE 8000

# Default command (if needed)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
