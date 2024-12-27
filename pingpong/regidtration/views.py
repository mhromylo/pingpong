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
from regidtration.forms import RegistrationForm, UserUpdateForm, SignUpForm, ProfileUpdateForm, AddFriendsForm
from django.shortcuts import get_object_or_404

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
            return JsonResponse({'success': True, 'message': 'User logged in!'})
        else:
            return JsonResponse({'success': False, 'errors': {'login': ['Invalid username or password.']}}, status=400)
    else:
        html = render_to_string('regidtration/login.html', {}, request=request)
        return JsonResponse({'success': True, 'html': html})

def user_logout(request):
    logout(request)
    return JsonResponse({'success': True})

def update_profile(request):
    user = request.user
    profile = Profile.objects.get(user=request.user)
    if request.method == 'POST':
        u_form = UserUpdateForm(request.POST, instance=user)
        p_form = ProfileUpdateForm(request.POST, request.FILES, instance=profile)
        if u_form.is_valid() and p_form.is_valid():
            u_form.save()
            p_form.save()
            return JsonResponse({'success': True, 'message': 'Your account has been updated!'})
        else:
            errors = u_form.errors, p_form.errors
            return JsonResponse({'success': False, 'errors': errors})
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
            login(request, form.user)
            return JsonResponse({'success': True, 'message': 'Your password was successfully updated!'})
        else:
            return JsonResponse({'success': False, 'errors': form.errors}, status=400)
    else:
        form = PasswordChangeForm(user=request.user)
        html = render_to_string('regidtration/change_password.html', {'form': form}, request=request)
        return JsonResponse({'success': True, 'html': html})


def add_friend(request):
    if request.method == 'POST':
        user_profile = Profile.objects.get(user=request.user)
        form = AddFriendsForm(request.POST)
        if form.is_valid():
            friend_name = form.cleaned_data['friend_name']
            try:
                friend_profile = get_object_or_404(Profile, display_name=friend_name)
                if user_profile == friend_profile:
                    return JsonResponse({'success': False, 'message': 'You cannot add yourself!'})
                elif friend_profile in user_profile.friends.all():
                    return JsonResponse({'success': False, 'message': 'You already have your friend!'})
                else:
                    user_profile.friends.add(friend_profile)
                    user_profile.save()
                    return JsonResponse({'success': True, 'message': 'You added your friend!'})
            except Exception as e:
                return JsonResponse({'success': False, 'Exception': str(e)})
        else:
            return JsonResponse({'success': False, 'Form not valid': form.errors})
    else:
        form = AddFriendsForm()
        html = render_to_string('regidtration/add_friend.html', {'form': form}, request=request)
        return JsonResponse({'success': True, 'html': html})

def list_friends(request):
    user_profile = Profile.objects.get(user=request.user)
    friends = user_profile.friends.all()
    friends_list = [{'display_name': f.display_name, 'is_online': f.is_online} for f in friends]
    return JsonResponse({'success': True, 'friends': friends_list})
# Create your views here.
