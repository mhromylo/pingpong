from django.shortcuts import render, redirect
from django.http import JsonResponse, Http404, HttpResponseNotFound, HttpResponseRedirect, HttpResponse
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.forms import UserCreationForm
import json
from django.contrib.auth.forms import *
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.contrib import messages
from django.template.loader import render_to_string
from .forms import UserUpdateForm, ProfileUpdateForm
from .models import Profile
from regidtration.forms import RegistrationForm, UserUpdateForm, SignUpForm, ProfileUpdateForm

def index(request):
    return render(request, "regidtration/index.html")

def register_done(request):
    return render(request, "regidtration/register_done.html")
def register(request):
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            form.save()
            return JsonResponse({'success': True, 'message': 'User registered successfully!'})
        else:
            return JsonResponse({'error': False, 'errors': form.errors}, status=400)
    else:
        form = RegistrationForm()
        html = render_to_string('regidtration/register.html', {'form': form}, request=request)
        return JsonResponse({'success': True, 'html': html})

def user_login(request):
    if request.method == "POST":
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            JsonResponse({'success': True, 'message': 'User logged in!'})
            return redirect('index')

        else:
            return JsonResponse({'success': False, 'errors': {'login': ['Invalid username or password.']}}, status=400)
    else:
        html = render_to_string('regidtration/login.html', {}, request=request)
        return JsonResponse({'success': True, 'html': html})

def user_logout(request):
    logout(request)
    messages.success(request, ("User logged out successfully!"))
    return redirect('index')


def profile(request):
    return render(request, 'regidtration/profile.html')

def update_profile(request):
    user = request.user
    profile = Profile.objects.get(user=request.user)
    if request.method == 'POST':
        u_form = UserUpdateForm(request.POST, instance=user)
        p_form = ProfileUpdateForm(request.POST, instance=profile)
        if u_form.is_valid() and p_form.is_valid():
            u_form.save()
            p_form.save()
            messages.success(request, ('Your account has been updated!'))
            return redirect('index')
        else:
           return JsonResponse({'success': False, 'errors': u_form.errors})
    else:
        u_form = UserUpdateForm(instance=user)
        p_form = ProfileUpdateForm(instance=profile)

    context = {
        'u_form': u_form,
        'p_form': p_form,
    }
    html = render_to_string('regidtration/update_profile.html', context, request=request)
    return JsonResponse({'success': True, 'html': html})

def change_password(request):
    if request.method == 'POST':
        form = PasswordChangeForm(data=request.POST, user=request.user)
        if form.is_valid():
            form.save()
            JsonResponse({'success': True, 'message': 'Your password was successfully updated!'})
            return redirect('index')
        else:
            messages.error(request, 'Please correct the error below.')

    else:
        form = PasswordChangeForm(user=request.user)
        html = render_to_string('regidtration/change_password.html', {'form': form}, request=request)
        return JsonResponse({'success': True, 'html': html})


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



# Create your views here.
