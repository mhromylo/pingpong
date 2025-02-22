#!/bin/bash
until nc -z db 5432; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done
echo "PostgreSQL is up!"
python manage.py collectstatic --noinput
python manage.py makemigrations
python manage.py migrate

gunicorn --workers 3 pingpong.wsgi:application --bind 0.0.0.0:8000