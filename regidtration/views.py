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
from .models import Profile, Game
from regidtration.forms import RegistrationForm, UserUpdateForm, SignUpForm, ProfileUpdateForm, AddFriendsForm
from django.shortcuts import get_object_or_404

def index(request):
    return render(request, "regidtration/index.html")

def pvp(request, Profile):
    return render(request, "regidtration/index.html", Profile)

def register_done(request):
    return render(request, "regidtration/register_done.html")
def register(request):
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Account created, you can now login")
            return redirect("index")
        else:
            messages.error(request, "There was an error, please try again later")
            form = RegistrationForm()
            html = render_to_string('regidtration/login.html', {}, request=request)
            return JsonResponse({'success': True, 'html': html})
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
            messages.success(request, "You are now logged in")
            return redirect("index")
        else:
            messages.error(request, "Invalid username or password")
            return redirect("index")
    else:
        html = render_to_string('regidtration/login.html', {}, request=request)
        return JsonResponse({'success': True, 'html': html})

@login_required()
def user_logout(request):
    logout(request)
    return redirect("index")

def update_profile(request):
    user = request.user
    profile = Profile.objects.get(user=request.user)
    if request.method == 'POST':
        u_form = UserUpdateForm(request.POST, instance=user)
        p_form = ProfileUpdateForm(request.POST, request.FILES, instance=profile)
        if u_form.is_valid() and p_form.is_valid():
            u_form.save()
            p_form.save()
            messages.success(request, 'Your account has been updated!')
            return redirect('index')
        else:
            errors = u_form.errors, p_form.errors
            messages.error(request, 'There are errors updating your profile, please try again with another one')
            return redirect('index')
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
            messages.success(request, 'Your password was successfully updated!')
            return redirect('index')
        else:
            messages.error(request, 'Please correct the error in form.')
            return redirect('index')
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
                    messages.error(request, 'You are cannot add yourself')
                    return redirect('index')
                elif friend_profile in user_profile.friends.all():
                    messages.error(request, 'You are already friend')
                    return redirect('index')
                else:
                    user_profile.friends.add(friend_profile)
                    user_profile.save()
                    messages.success(request, 'You are now friend')
                    return redirect('index')
            except Exception as e:
                messages.error(request, 'Something went wrong')
                return redirect('index')
        else:
            messages.error(request, 'Please correct the error in form.')
            return redirect('index')
    else:
        form = AddFriendsForm()
        html = render_to_string('regidtration/add_friend.html', {'form': form}, request=request)
        return JsonResponse({'success': True, 'html': html})
@login_required
def delete_friend(request, f_id):
    if request.method == 'POST':
        friend = get_object_or_404(Profile, id=f_id)
        friend.delete()
        messages.success(request, 'You are no longer friend')
        return redirect('index')
    else:
        messages.error(request, 'Please correct the error in form.')
        return redirect('index')

@login_required
def friend_list(request):
    user_profile = Profile.objects.get(user=request.user)
    friends = user_profile.friends.all()
    statuses = {friend.display_name: friend.is_online for friend in friends}
    return JsonResponse({'statuses': statuses})

@login_required
def game_setup(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user2 = authenticate(request, username=username, password=password)
        if user2:
            player1 = Profile.objects.get(user=request.user)
            player2 = Profile.objects.get(user=user2)
            if player1 == player2:
                return JsonResponse({'success': False, 'message': "You cannot play against yourself."})
            request.session['player2'] = {
                'display_name': player2.display_name,
                'avatar_url': player2.avatar.url if player2.avatar else '',
                'wins': player2.wins,
                'losses': player2.losses,
            }
            return redirect('index')
        else:
            messages.error(request, "Wrong credential for Player 2")
            return redirect('index')
    html = render_to_string('regidtration/game_setup.html', {}, request=request)
    return JsonResponse({'success': True, 'html': html})

def logout_player2(request):
    if 'player2' in request.session:
        del request.session['player2']
        messages.success(request, "Player 2 has been logged out.")
    else:
        messages.error(request, "No Player 2 is currently logged in.")
    return redirect('index')

@csrf_exempt
def save_game_result(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            game_type = data.get('game_type')
            winner_id = data.get('winner_id')
            player_ids = data.get('player_ids', [])
            winner = Profile.objects.get(id = winner_id)
            game = Game.objects.create(game_type=game_type, winner=winner)
            for player_id in player_ids:
                player = Profile.objects.get(id = player_id)
                game.players.add(player)
                return JsonResponse({'success': True, 'message': 'Game result saved successfully!'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=400)
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)
