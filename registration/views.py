from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponseNotFound, HttpResponseRedirect, HttpResponse
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.decorators import login_required
from django.template.loader import render_to_string
from django.contrib import messages
import json

from .forms import UserUpdateForm, ProfileUpdateForm, RegistrationForm, AddFriendsForm, TournamentUpdateForm
from .models import Profile, Game


def index(request):
    return render(request, "registration/index.html")


def pvp(request, profile):
    return render(request, "registration/index.html", {'profile': profile})


def register_done(request):
    return render(request, "registration/register_done.html")


def register(request):
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Account created, you can now login")
            return redirect("index")
        else:
            messages.error(request, "There was an error, please try again later")
            return render(request, 'registration/login.html', {'form': form})
    else:
        form = RegistrationForm()
        return render(request, 'registration/register.html', {'form': form})



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
        return render(request, 'registration/login.html', {})


@login_required
def user_logout(request):
    logout(request)
    return redirect("index")


@login_required
def update_profile(request):
    user = request.user
    profile = Profile.objects.get(user=user)
    if request.method == 'POST':
        u_form = UserUpdateForm(request.POST, instance=user)
        p_form = ProfileUpdateForm(request.POST, request.FILES, instance=profile)
        if u_form.is_valid() and p_form.is_valid():
            u_form.save()
            p_form.save()
            messages.success(request, 'Your account has been updated!')
            return redirect('index')
        else:
            messages.error(request, 'There are errors updating your profile, please try again.')
            return redirect('index')
    else:
        u_form = UserUpdateForm(instance=user)
        p_form = ProfileUpdateForm(instance=profile)

    context = {
        'u_form': u_form,
        'p_form': p_form,
    }
    return render(request, 'registration/update_profile.html', context)



@login_required
def change_password(request):
    if request.method == 'POST':
        form = PasswordChangeForm(data=request.POST, user=request.user)
        if form.is_valid():
            form.save()
            login(request, form.user)
            messages.success(request, 'Your password was successfully updated!')
            return redirect('index')
        else:
            messages.error(request, 'Please correct the error in the form.')
            return redirect('index')
    else:
        form = PasswordChangeForm(user=request.user)
        return render(request, 'registration/change_password.html', {'form': form})


@login_required
def add_friend(request):
    if request.method == 'POST':
        user_profile = Profile.objects.get(user=request.user)
        form = AddFriendsForm(request.POST)
        if form.is_valid():
            friend_name = form.cleaned_data['friend_name']
            try:
                friend_profile = get_object_or_404(Profile, display_name=friend_name)
                if user_profile == friend_profile:
                    messages.error(request, 'You cannot add yourself as a friend.')
                    return redirect('index')
                elif friend_profile in user_profile.friends.all():
                    messages.error(request, 'You are already friends.')
                    return redirect('index')
                else:
                    user_profile.friends.add(friend_profile)
                    user_profile.save()
                    messages.success(request, 'You are now friends.')
                    return redirect('index')
            except Exception as e:
                messages.error(request, 'Something went wrong while adding friend.')
                return redirect('index')
        else:
            messages.error(request, 'Please correct the error in the form.')
            return redirect('index')
    else:
        form = AddFriendsForm()
        return render(request, 'registration/add_friend.html', {'form': form})


@login_required
def delete_friend(request, f_id):
    if request.method == 'POST':
        friend = get_object_or_404(Profile, id=f_id)
        request.user.profile.friends.remove(friend)
        messages.success(request, 'You are no longer friends.')
        return redirect('index')
    else:
        messages.error(request, 'Invalid request.')
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
                'id': player2.id,
            }
            return redirect('index')
        else:
            messages.error(request, "Wrong credentials for Player 2")
            return redirect('index')
    return render(request, 'registration/game_setup.html', {})


def logout_player2(request):
    if 'player2' in request.session:
        del request.session['player2']
        messages.success(request, "Player 2 has been logged out.")
    else:
        messages.error(request, "No Player 2 is currently logged in.")
    return redirect('index')


def save_game_result(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            game_type = data.get('game_type')
            winner_id = data.get('winner_id')
            player2id = data.get('player2id')
            player2 = Profile.objects.get(id = player2id)
            player2.update_stats(won = 0)
            winner = Profile.objects.get(id = winner_id)
            winner.update_stats(won = 1)
            game = Game.objects.create(game_type=game_type, winner=winner, player2=player2)
            return JsonResponse({'success': True, 
                                 'message': 'Game result saved successfully!',
                                 'player2' : {
                                     'id': player2.id,
                                     'wins': player2.wins,
                                     'losses': player2.losses,
								 }
								 })
            player2 = Profile.objects.get(id=player2id)
            winner = Profile.objects.get(id=winner_id)
            
            player2.update_stats(won=0)
            winner.update_stats(won=1)
            
            Game.objects.create(game_type=game_type, winner=winner, player2=player2)
            return JsonResponse({'success': True, 'message': 'Game result saved successfully!'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=400)
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)

@login_required
def tornament_name_user(request):
    if request.method == 'POST':
        user = request.user
        profile = Profile.objects.get(user=user)
        t_form = TournamentUpdateForm(request.POST, instance=profile)
        if t_form.is_valid():
            display_name = request.POST.get('display_name')
            t_form.save()
            return render(request, 'registration/tournament.html', {'player': profile, 't_form': t_form})
        else:
            errors = {field: msgs for field, msgs in t_form.errors.items()}
            return JsonResponse({'success': False, 'errors': errors})
    return JsonResponse({'success': False, 'message': 'Invalid request method.'})
@login_required
def tornament_name_user2(request):
    if request.method == 'POST':
        user = request.user
        user2 = request.session['user2']
        profile = Profile.objects.get(user=user)
        profile2 = Profile.objects.get(user=user2)
        t_form = TournamentUpdateForm(request.POST, instance=profile2)
        if t_form.is_valid():
            display_name = request.POST.get('display_name')
            t_form.save()
            return render(request, 'registration/tournament.html', {'player': profile,' player2': profile2, 't_form': t_form})
        else:
            errors = {field: msgs for field, msgs in t_form.errors.items()}
            return JsonResponse({'success': False, 'errors': errors})
    return JsonResponse({'success': False, 'message': 'Invalid request method.'})
@login_required
def tornament_name_user3(request):
    if request.method == 'POST':
        user = request.user
        user2 = request.session['user2']
        user3 = request.session['user3']
        profile = Profile.objects.get(user=user)
        profile2 = Profile.objects.get(user=user2)
        profile3 = Profile.objects.get(user=user3)
        t_form = TournamentUpdateForm(request.POST, instance=profile3)
        if t_form.is_valid():
            display_name = request.POST.get('display_name')
            t_form.save()
            return render(request, 'registration/tournament.html', {'player': profile,' player2': profile2, ' player3': profile3,'t_form': t_form})
        else:
            errors = {field: msgs for field, msgs in t_form.errors.items()}
            return JsonResponse({'success': False, 'errors': errors})
    return JsonResponse({'success': False, 'message': 'Invalid request method.'})
@login_required
def tornament_name_user4(request):
    if request.method == 'POST':
        user = request.user
        user2 = request.session['user2']
        user3 = request.session['user3']
        user4 = request.session['user4']
        profile = Profile.objects.get(user=user)
        profile2 = Profile.objects.get(user=user2)
        profile3 = Profile.objects.get(user=user3)
        profile4 = Profile.objects.get(user=user4)
        t_form = TournamentUpdateForm(request.POST, instance=profile3)
        if t_form.is_valid():
            display_name = request.POST.get('display_name')
            t_form.save()
            return render(request, 'registration/tournament.html', {'player': profile,' player2': profile2, ' player3': profile3,' player4': profile4, 't_form': t_form})
        else:
            errors = {field: msgs for field, msgs in t_form.errors.items()}
            return JsonResponse({'success': False, 'errors': errors})
    return JsonResponse({'success': False, 'message': 'Invalid request method.'})
#return render(request, 'registration/tournament.html', {'player': profile, 't_form': t_form})
def tournament(request):
    player = Profile.objects.get(user=request.user)
    t_form = TournamentUpdateForm(request.POST, instance=player)
    if request.method == 'POST':
        if t_form.is_valid():
            t_form.save()
        else:
            t_form = TournamentUpdateForm(instance=player)
    return render(request, 'registration/tournament.html', {'player': player, 't_form': t_form})

@login_required
def second_player_tournament(request):
    player = Profile.objects.get(user=request.user)
    t_form = TournamentUpdateForm(request.POST, instance=player)
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user2 = authenticate(request, username=username, password=password)
        if user2:
            player2 = Profile.objects.get(user=user2)
            if player == player2:
                messages.error(request, "You cannot play against yourself.")
                return render(request, 'registration/tournament.html', {'player': player, 't_form': t_form})
            request.session['player2'] = {
                'display_name': player2.display_name,
                'avatar_url': player2.avatar.url if player2.avatar else '',
                'wins': player2.wins,
                'losses': player2.losses,
                'id': player2.id,
            }
            return render(request, 'registration/tournament.html', {'player': player, 'player2': player2, 't_form': t_form})
        else:
            messages.error(request, "Wrong credentials for Player 2")
            return render(request, 'registration/tournament.html', {'player': player, 't_form': t_form})
    return render(request, 'registration/tournament.html', {'player': player,'t_form': t_form})

@login_required
def third_player_tournament(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user3 = authenticate(request, username=username, password=password)
        if user3:
            if user3 is not None:
            # Ensure this user is not already logged in as another player
                existing_users = [
                    request.session.get("user2"),
                    request.session.get("user3"),
                ]
            player1 = Profile.objects.get(user=existing_users[0])
            player2 = Profile.objects.get(user=existing_users[1])
            if user3.username in existing_users:
                messages.error(request, f"{username} is already logged in as another player.")
                return render(request, 'registration/tournament.html', {'player': player1, 'player2': player2})
            player3 = Profile.objects.get(user=user3)
            request.session['player3'] = {
                'display_name': player3.display_name,
                'avatar_url': player3.avatar.url if player3.avatar else '',
                'wins': player3.wins,
                'losses': player3.losses,
                'id': player3.id,
            }
            return render(request, 'registration/tournament.html', {'player': player1, 'player2': player2, 'player3': player3})
        else:
            messages.error(request, "Wrong credentials for Player 3")
            return render(request, 'registration/tournament.html', {'player': player1, 'player2': player2})
    return render(request, 'registration/tournament.html', {'player': player1, 'player2': player2, 'player3': player3})