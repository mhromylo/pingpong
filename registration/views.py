from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponseNotFound, HttpResponseRedirect, HttpResponse
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.decorators import login_required
from django.template.loader import render_to_string
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from random import shuffle
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

@ensure_csrf_cookie
def get_csrf_token(request):
    return JsonResponse({"csrf_token": get_token(request)})

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


def user_logout(request):
    logout(request)
    return JsonResponse({
                'success': True,
                'message': 'See you later! ',
                'redirect_url': '/index/'  # Optional: Tell the frontend where to redirect
            }, status=200)


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
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({'success': False, 'message': 'Invalid JSON data'}, status=400)

            game_id = data.get('game_id')
            player1_id = data.get('player1_id')
            player2_id = data.get('player2_id')
            player1_score = data.get('player1_score')
            player2_score = data.get('player2_score')

            # Get player profiles
            player1 = get_object_or_404(Profile, id=player1_id)
            player2 = get_object_or_404(Profile, id=player2_id)

            # Update the existing game
            game = get_object_or_404(Game, id=game_id)
            if (game.tournament_id != 0):
                tournament = get_object_or_404(Tournament, id=game.tournament_id)
            if player1_score > player2_score:
                player1.update_stats(won=1)
                player2.update_stats(won=0)
                game.winner = player1
                game.loser = player2
                if (tournament and (tournament.first_tour_winners.count() < 2)):
                    tournament.first_tour_winners.add(player1)
                    tournament.first_tour_lossers.add(player2)
            else:
                game.winner = player2
                game.loser = player1
                player2.update_stats(won=1)
                player1.update_stats(won=0)
                if (tournament and (tournament.first_tour_winners.count() < 2)):
                    tournament.first_tour_winners.add(player2)
                    tournament.first_tour_lossers.add(player1)
            game.player1_score = player1_score
            game.player2_score = player2_score
            game.save()  # Save changes
            if tournament:
                if game.game_type == Game.TOURNAMENT_GAME and tournament.first_tour_winners.count() == 2:
                    final = get_object_or_404(Game, tournament_id=tournament.id, game_type=Game.TOURNAMENT_FINAL)
                    finalists = list(tournament.first_tour_winners.all())
                    final.players.add(*finalists)

                    tournament_3or4 = get_object_or_404(Game, tournament_id=tournament.id, game_type=Game.TOURNAMENT_3OR4)
                    losers = list(tournament.first_tour_lossers.all())
                    tournament_3or4.players.add(*losers)

                elif game.game_type == Game.TOURNAMENT_FINAL:
                    tournament.winner = game.winner
                    tournament.second = game.loser

                elif game.game_type == Game.TOURNAMENT_3OR4:
                    tournament.third = game.winner
                    tournament.fourth = game.loser

                if tournament.winner and tournament.third:
                    tournament.status = 'completed'
                    tournament.save()
            return JsonResponse({'success': True, 'message': 'Game result saved successfully!', 'redirect_url': '/tournament/'})

        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=400)

    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)

@login_required
def tournament_name_user(request, player_id, player_number):
    if request.method == 'POST':
        display_name = request.POST.get('display_name')
        if not display_name:
            return JsonResponse({
                'success': False,
                'message': 'Display name is required.',
            }, status=400)
        try:
            player_id = int(player_id)
        except ValueError:
            return JsonResponse({
                'success': False,
                'message': 'Invalid player id format.',
            }, status=400)
        try:
            profile = Profile.objects.get(id=player_id)
        except Profile.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'profile ID.',
            }, status=400)
        profile.display_name = display_name
        profile.save()
        if (player_number == 2 ):
            request.session['player2'] = {
                'display_name': profile.display_name,
                'avatar_url': profile.avatar.url if profile.avatar else '',
                'wins': profile.wins,
                'losses': profile.losses,
                'id': profile.id,
            }
        if (player_number == 3 ):
            request.session['player3'] = {
                'display_name': profile.display_name,
                'avatar_url': profile.avatar.url if profile.avatar else '',
                'wins': profile.wins,
                'losses': profile.losses,
                'id': profile.id,
            }
        if (player_number == 4 ):
            request.session['player4'] = {
                'display_name': profile.display_name,
                'avatar_url': profile.avatar.url if profile.avatar else '',
                'wins': profile.wins,
                'losses': profile.losses,
                'id': profile.id,
            }
        return JsonResponse({
            'success': True,
            'message': 'Display name updated successfully.',
            'new_display_name': display_name,
            'player_number': player_number,
            'redirect_url': '/tournament/'
        })
    else:    
        return JsonResponse({
            'success': False,
            'message': 'Invalid request method.',
        }, status=405)

def tournament(request):
    player = Profile.objects.get(user=request.user)
    c_form = CreateTournamentForm(request.POST)
    started_tournament = Tournament.objects.filter(creator=player, status = 'in_progress').first()
    if (started_tournament):
        return render(request, 'registration/tournament.html', {'tournament': started_tournament
    })
    tournament = Tournament.objects.filter(creator=player, status = 'not_started').first()
    if (tournament):
        return render(request, 'registration/tournament.html', {'tournament': tournament
    })
    return render(request, 'registration/tournament.html', {
        'player': player, 'c_form': c_form
    })

@login_required
def second_player_tournament(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user2 = authenticate(request, username=username, password=password)
        if user2:
            profile2 = Profile.objects.get(user=user2)
            profile2.is_online = True
            request.session['player2'] = {
                'display_name': profile2.display_name,
                'avatar_url': profile2.avatar.url if profile2.avatar else '',
                'wins': profile2.wins,
                'losses': profile2.losses,
                'id': profile2.id,
            }
            return JsonResponse({
                'success': True,
                'message': 'Player 2 logged in successfully.',
                'goal': 'Login',
                'player_number': 2,
                'player2_display_name': profile2.display_name,
                'player2_wins': profile2.wins,
                'player2_losses': profile2.losses,
                'player2_id': profile2.id,
                'player2_avatar': profile2.avatar.url if profile2.avatar else '',
                'redirect_url': '/tournament/'  # Optional: Redirect to the tournament page
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'Invalid username or password.',
            }, status=400)
    return JsonResponse({
        'success': False,
        'message': 'Invalid request method.',
    }, status=405)

@login_required
def third_player_tournament(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user:
            profile3 = Profile.objects.get(user=user)
            profile3.is_online = True
            request.session['player3'] = {
                'display_name': profile3.display_name,
                'avatar_url': profile3.avatar.url if profile3.avatar else '',
                'wins': profile3.wins,
                'losses': profile3.losses,
                'id': profile3.id,
            }
            return JsonResponse({
                'success': True,
                'message': 'Player 3 logged in successfully.',
                'goal': 'Login',
                'player_number': 3,
                'player3_display_name': profile3.display_name,
                'player3_wins': profile3.wins,
                'player3_losses': profile3.losses,
                'player3_id': profile3.id,
                'player3_avatar': profile3.avatar.url if profile3.avatar else '',
                'redirect_url': '/tournament/'  # Optional: Redirect to the tournament page
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'Invalid username or password.',
            }, status=400)
    return JsonResponse({
        'success': False,
        'message': 'Invalid request method.',
    }, status=405)

@login_required
def forth_player_tournament(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user:
            profile4 = Profile.objects.get(user=user)
            profile4.is_online = True
            request.session['player4'] = {
                'display_name': profile4.display_name,
                'avatar_url': profile4.avatar.url if profile4.avatar else '',
                'wins': profile4.wins,
                'losses': profile4.losses,
                'id': profile4.id,
            }
            return JsonResponse({
                'success': True,
                'message': 'Player 4 logged in successfully.',
                'goal': 'Login',
                'player_number': 4,
                'player4_display_name': profile4.display_name,
                'player4_wins': profile4.wins,
                'player4_losses': profile4.losses,
                'player4_id': profile4.id,
                'player4_avatar': profile4.avatar.url if profile4.avatar else '',
                'redirect_url': '/tournament/'  # Optional: Redirect to the tournament page
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'Invalid username or password.',
            }, status=400)
    return JsonResponse({
        'success': False,
        'message': 'Invalid request method.',
    }, status=405)

@login_required
def create_tournament(request):
    if request.method == 'POST':
        player1 = Profile.objects.get(user=request.user)
        form = CreateTournamentForm(request.POST)
        if form.is_valid():
            tournament = form.save(commit=False)  # Don't save yet
            tournament.creator = player1
            tournament.status = 'not_started'  # Set initial status
            tournament.save()  # Save the tournament instance
            tournament.players.add(player1)  # Add the creator as the first player
            return JsonResponse({
                'success': True,
                'tournament_name': tournament.name,
                'tournament_id': tournament.id,
                'creator': tournament.creator.display_name,
                'player1_avatar': tournament.creator.avatar.url if tournament.creator.avatar else '',
                'player_count': tournament.players.count(),
                'message': 'Tournament created successfully!',
                'redirect_url': '/tournament/'  # Optional: Redirect to the tournament page
            })
        else:
           return JsonResponse({
                'success': False,
                'message': 'There was an error creating the tournament.',
                'errors': form.errors  # Include form errors for debugging
            }, status=400)
    else:
        # Handle non-POST requests (e.g., GET)
        return JsonResponse({
            'success': False,
            'message': 'Invalid request method.',
            'redirect_url': '/tournament/'  # Redirect to the tournament page
        }, status=405)

@login_required
def join_tournament(request, tournament_id, player_id):
    tournament = Tournament.objects.get(id=tournament_id)
    player = Profile.objects.get(id=player_id)

    if tournament.players.count() < 4 and player not in tournament.players.all():
        tournament.players.add(player)
        return JsonResponse({
            'success': True,
            'message': f'{player.display_name} has joined the tournament.',
            'player_count': tournament.players.count(),
            'player_name': player.display_name,
            'player_avatar': player.avatar.url if player.avatar else '',
            'redirect_url': '/tournament/'
        })
    else:
        return JsonResponse({
            'success': False,
            'message': 'Tournament is full or you have already joined.'
        }, status=400)

@login_required
def quit_tournament(request, tournament_id, player_id):
    tournament = Tournament.objects.get(id=tournament_id)
    player = Profile.objects.get(id=player_id)
    if tournament.status == 'not_started':
        tournament.players.remove(player)
        tournament.save()
        return JsonResponse({
            'success': True,
            'message': f'{player.display_name} has quit the tournament.',
            'player_count': tournament.players.count(),
            'player_name': player.display_name,
            'redirect_url': '/tournament/'
        })
    else:
        return JsonResponse({
            'success': False,
            'message': 'Tournament already started.'
        }, status=400)
    
@login_required
def start_tournament(request, tournament_id):
    try:
        tournament = Tournament.objects.get(id=tournament_id)

        # Only start if there are enough players
        if tournament.players.count() < 4:
            return JsonResponse({
                'success': False,
                'message': 'Not enough players to start the tournament.'
            }, status=200)
        
        all_players_online = all(player.is_online for player in tournament.players.all())

        if not all_players_online:
            return JsonResponse({
                'success': False,
                'message': 'Not all players are online.'
            }, status=400)

        # Randomly shuffle players to generate matchups
        players = list(tournament.players.all())
        shuffle(players)
        game1 = Game.objects.create(game_type=Game.TOURNAMENT_GAME, player1=players[0], player2=players[1], tournament_id=tournament_id)
        game2 = Game.objects.create(game_type=Game.TOURNAMENT_GAME, player1=players[2], player2=players[3], tournament_id=tournament_id)
        game3 = Game.objects.create(game_type=Game.TOURNAMENT_FINAL)
        game4 = Game.objects.create(game_type=Game.TOURNAMENT_3OR4)
        tournament.games.add(game1)
        tournament.games.add(game2)
        tournament.games.add(game3)
        tournament.games.add(game4)
        tournament.status = 'in_progress'
        tournament.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Tournament started.',
            'redirect_url': '/tournament/'
        })

    except Tournament.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Tournament not found.'
        }, status=400)
    
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
