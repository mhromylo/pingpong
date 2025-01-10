#!/bin/bash

python manage.py collectstatic --noinput
python manage.py makemigrations
python manage.py migrate

gunicorn --workers 3 pingpong.wsgi:application --bind 0.0.0.0:8000