from django.shortcuts import render, redirect
from django.http import JsonResponse, Http404, HttpResponseNotFound
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.forms import UserCreationForm
import json
from django.contrib.auth.forms import *

from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.contrib import messages

from regidtration.forms import RegistrationForm

def index(request):
    return render(request, "regidtration/index.html")
def register(request):
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            form.save()
            username = form.cleaned_data.get('username')
            return JsonResponse({'user registered': True, 'message': 'User registered succesfully'})
        else:
            return JsonResponse({'error': False, 'errors': form.errors}, status=400)
    else:
        form = RegistrationForm()
        return render(request, 'regidtration/register.html', {'form': form})


# def register_two(request):
#     if request.method == "POST":
#         data = json.loads(request.body.decode('utf-8'))
#         username = data.get('username')
#         password1 = data.get('password1')
#         password2 = data.get('password2')
#
#         if not username or not password1 and password2:
#             return JsonResponse({'errors': 'All fields are required.'}, status=400)
#
#         if password1 != password2:
#             return JsonResponse({'errors': 'Passwords do not match.'}, status=400)
#
#         if User.objects.filter(username=username).exists():
#             return JsonResponse({'errors': 'Username already exists.'}, status=400)
#
#         User.objects.create_user(username=username, password=password1)
#         return JsonResponse({'message': 'User registered succesfully'}, status=201)
#
#     return JsonResponse({"errors": "Invalid request method"}, status=405)

# def user_login(request):
#     if request.method == "POST":
#         username = request.POST['username']
#         password = request.POST['password']
#         user = authenticate(request, username=username, password=password)
#         if user is not None:
#             login(request, user)
#             return redirect("index")
#     return render(request, 'regidtration/index.html')
#
# def user_logout(request):
#     logout(request)
#     return redirect("index")
#

# Create your views here.
