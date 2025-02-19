from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponseNotFound, HttpResponseRedirect, HttpResponse
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.decorators import login_required
from django.template.loader import render_to_string
from django.contrib import messages
import json

from .forms import UserUpdateForm, ProfileUpdateForm, RegistrationForm, AddFriendsForm, TournamentUpdateForm, CreateTournamentForm
from .models import Profile, Game, Tournament


def index(request):
    return render(request, "registration/index.html")


def pvp(request, profile):
    return render(request, "registration/index.html", {'profile': profile})


def register_done(request):
    return render(request, "registration/register_done.html")

def check_authentication(request):
    if request.user.is_authenticated:
        return JsonResponse({"authenticated": True})
    return JsonResponse({"authenticated": False})

def register(request):
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Account created, you can now login")
            return JsonResponse({'success': True,
                                 'message': 'Account created, you can now login',
                                 'redirect_url': '/login/'
            }, status=200)
        else:
            messages.error(request, "Form not valid" )
            return JsonResponse({'success': False, 'message': 'There was an error, please try again later'}, status=400) 

    else: 
        form = RegistrationForm()   
        return render(request,'registration/register.html', {'form': form})



def user_login(request):
    if request.method == "POST":
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({'success': True,
                                 'message': 'You are now logged in',
                                 'redirect_url': '/index/'
            }, status=200)
        else:
            return JsonResponse({'success': False,
                                 'message': 'Invalid username or password',
                                 'redirect_url': '/login/'
            }, status=200)
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
            return JsonResponse({
                'success': True,
                'message': 'Your account has been updated!',
                'redirect_url': '/index/'  # Optional: Tell the frontend where to redirect
            }, status=200)
        else:
            return JsonResponse({
                'success': False,
                'message': 'Your account has not been updated!',
                'errors': {
                        **u_form.errors,  # Include user form errors
                        **p_form.errors   # Include profile form errors
                    }
            }, status=200)
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
            return JsonResponse({
                'success': True,
                'message': 'Your password was successfully updated!',
                'redirect_url': '/index/'  # Optional: Tell the frontend where to redirect
            }, status=200)
        else:
            return JsonResponse({
                'success': False,
                'message': 'Please correct the error in the form.!',
                'errors': form.errors  # Include user form errors
            }, status=200)
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
                    return JsonResponse({
                        'success': False,
                        'message': 'You cannot add yourself as a friend.'
                        }, status=200)
                elif friend_profile in user_profile.friends.all():
                    return JsonResponse({
                        'success': False,
                        'message': 'You are already friends..'
                        }, status=200)
                else:
                    user_profile.friends.add(friend_profile)
                    user_profile.save()
                    return JsonResponse({
                        'success': True,
                        'message': 'You are now friends',
                        'redirect_url': '/add_friend/'
                        }, status=200)
            except Exception as e:
                return JsonResponse({
                        'success': False,
                        'message': 'Something went wrong while adding friend.'
                        }, status=200)
        else:
            return JsonResponse({
                'success': False,
                'message': 'Please correct the error in the form.!',
                'errors': form.errors  # Include user form errors
            }, status=200)
    else:
        form = AddFriendsForm()
        return render(request, 'registration/add_friend.html', {'form': form})


@login_required
def delete_friend(request, f_id):
    if request.method == 'POST':
        friend = get_object_or_404(Profile, id=f_id)
        request.user.profile.friends.remove(friend)
        return JsonResponse({
                        'success': True,
                        'message': 'You are now not friends more',
                        'redirect_url': '/add_friend/'
                        }, status=200)
    else:
        return JsonResponse({
                        'success': False,
                        'message': 'Wrong request',
                        'redirect_url': '/add_friend/'
                        }, status=400)


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
            return JsonResponse({
                        'success': True,
                        'message': 'Second player logined',
                        'redirect_url': '/game_setup/'
                        }, status=200)
        else:
            return JsonResponse({
                        'success': False,
                        'message': 'Wrong credentials for Player 2',
                        }, status=200)
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
def tournament_name_user(request, player_number):
    if request.method == 'POST':
        form = CreateTournamentForm(request.POST)
        user = request.user
        profile = Profile.objects.get(user=user)
        t_form = TournamentUpdateForm(request.POST, instance=profile)
        if t_form.is_valid():
            display_name = request.POST.get('display_name')
            t_form.save()
            if player_number == 1:
                player_key = 'player1'
            elif player_number == 2:
                player_key = 'player2'
            elif player_number == 3:
                player_key = 'player3'
            elif player_number == 4:
                player_key = 'player4'
            else:
                return JsonResponse({'success': False, 'message': 'Invalid player number.'})
            return JsonResponse({
                'success': True,
                f'{player_key}_display_name': display_name,
                f'{player_key}_id': profile.id,
            })
        else:
            errors = {field: msgs for field, msgs in t_form.errors.items()}
            return JsonResponse({'success': False, 'errors': errors})
    return JsonResponse({'success': False, 'message': 'Invalid request method.'})
@login_required
def tournament_name_user2(request):
    if request.method == 'POST':
        user = request.user
        player2_data = request.session.get("player2")
        profile = Profile.objects.get(user=user)
        profile2 = Profile.objects.get(id=player2_data["id"])
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
def tournament_name_user3(request):
    if request.method == 'POST':
        user = request.user
        player2_data = request.session.get("player2")
        player3_data = request.session.get("player3")
        profile = Profile.objects.get(user=user)
        profile2 = Profile.objects.get(id=player2_data["id"])
        profile3 = Profile.objects.get(id=player3_data["id"])
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
def tournament_name_user4(request):
    if request.method == 'POST':
        user = request.user
        player2_data = request.session.get("player2")
        player3_data = request.session.get("player3")
        player4_data = request.session.get("player4")
        profile = Profile.objects.get(user=user)
        profile2 = Profile.objects.get(id=player2_data["id"])
        profile3 = Profile.objects.get(id=player3_data["id"])
        profile4 = Profile.objects.get(id=player4_data["id"])
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
    c_form = CreateTournamentForm(request.POST)
    existing_tournament = Tournament.objects.filter(creator=player, started=False).first()
    if existing_tournament:
        # If there is a not-started tournament, show it and allow the user to join
        return render(request, 'registration/tournament.html', {
            'existing_tournament': existing_tournament,
            'player': player,
        })
    else:
        c_form = CreateTournamentForm(request.POST)
        return render(request, 'registration/tournament.html', {
            'player': player, 'c_form': c_form
        })

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
            return JsonResponse({
                'success': True,
                'message': "Player 2 added successfully!",
                'player2_display_name': player2.display_name,
                'player2_wins': player2.wins,
                'player2_losses': player2.losses,
                'player2_id': player2.id,
                'player2_avatar': player2.avatar.url if player2.avatar else '',
                'redirect_url': '/tournament/'
            })
        else:
            messages.error(request, "Wrong credentials for Player 2")
            return render(request, 'registration/tournament.html', {'player': player, 't_form': t_form})
    return render(request, 'registration/tournament.html', {'player': player, 't_form': t_form})

@login_required
def third_player_tournament(request):

    player = Profile.objects.get(user=request.user)
    t_form = TournamentUpdateForm(request.POST, instance=player)
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user3 = authenticate(request, username=username, password=password)
        if user3:
            player3 = Profile.objects.get(user=user3)
            request.session['player3'] = {
                'display_name': player3.display_name,
                'avatar_url': player3.avatar.url if player3.avatar else '',
                'wins': player3.wins,
                'losses': player3.losses,
                'id': player3.id,
            }
            return JsonResponse({
                'success': True,
                'message': "Player 3 added successfully!",
                'player3_display_name': player3.display_name,
                'player3_wins': player3.wins,
                'player3_losses': player3.losses,
                'player3_id': player3.id,
                'player3_avatar': player3.avatar.url if player3.avatar else '',
                'redirect_url': '/tournament/'
            })
        else:
            messages.error(request, "Wrong credentials for Player 3")
            return redirect(index)
    return redirect(index)

@login_required
def forth_player_tournament(request):

    player = Profile.objects.get(user=request.user)
    t_form = TournamentUpdateForm(request.POST, instance=player)
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user4 = authenticate(request, username=username, password=password)
        if user4:
            player4 = Profile.objects.get(user=user4)
            request.session['player4'] = {
                'display_name': player4.display_name,
                'avatar_url': player4.avatar.url if player4.avatar else '',
                'wins': player4.wins,
                'losses': player4.losses,
                'id': player4.id,
            }
            return JsonResponse({
                'success': True,
                'message': "Player 4 added successfully!",
                'player4_display_name': player4.display_name,
                'player4_wins': player4.wins,
                'player4_losses': player4.losses,
                'player4_id': player4.id,
                'player4_avatar': player4.avatar.url if player4.avatar else '',
                'redirect_url': '/tournament/'
            })
        else:
            messages.error(request, "Wrong credentials for Player 24")
            return redirect(index)
    return redirect(index)

@login_required
def create_tournament(request):
    if request.method == 'POST':
        player1 = Profile.objects.get(user=request.user)
        form = CreateTournamentForm(request.POST)
        t_form = TournamentUpdateForm(request.POST, instance=player1)
        if form.is_valid():
            tournament = form.save(commit=False)  # Don't save yet
            tournament.save()  # Save the tournament instance
            tournament.players.add(player1)
            tournament.creator = player1
            return JsonResponse({
                'success': True,
                'existing_tournament': tournament.name,
                'tournament_name': tournament.name,
                'tournament_id': tournament.id,
                'creator': tournament.creator.display_name,
                'player1_avatar': player1.avatar.url if player1.avatar else '',
                'player_count': tournament.players.count(),
                'redirect_url': '/tournament/'
            })
    else:
        form = CreateTournamentForm()
        return JsonResponse({
            'success': False,
            'message': 'Invalid request method',
            'redirect_url': '/tournament/'
        })

def get_tournament_data(request, tournament_id):
    try:
        tournament = Tournament.objects.get(id=tournament_id)
        # Fetch the players registered in the tournament
        players = tournament.players.all()  # assuming there's a `players` relationship
        players_data = [{"display_name": player.display_name, "avatar_url": player.avatar.url if player.avatar else ''} for player in players]
        
        return JsonResponse({
            "tournament_name": tournament.name,
            "players": players_data
        })
    except Tournament.DoesNotExist:
        return JsonResponse({"error": "Tournament not found"}, status=404)
    
def tournament_detail(request, tournament_id):
    tournament = Tournament.objects.get(id=tournament_id)
    # Optionally, add players and other data
    return render(request, 'tournament_detail.html', {'tournament': tournament})

def start_tournament(request):
    return render(request, 'registration/tournament.html') 