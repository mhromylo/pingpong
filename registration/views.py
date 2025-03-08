from random import shuffle
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponseNotFound, HttpResponseRedirect, HttpResponse, HttpResponseForbidden
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.decorators import login_required
from django.template.loader import render_to_string
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.translation import activate
from django.conf import settings
from datetime import timedelta
from django.utils.translation import gettext as _
import json
from django.db import transaction
from django.views.decorators.http import require_http_methods
from django.db.models import Q

from .forms import UserUpdateForm, ProfileUpdateForm, RegistrationForm, AddFriendsForm, TournamentUpdateForm, CreateTournamentForm
from .models import Profile, Game, Tournament


def index(request):
    language_code = request.GET.get('language_code', None)
    activate(language_code) 
    return render(request, "registration/index.html")

def layout(request):
    language_code = request.GET.get('language_code', None)
    activate(language_code) 
    return render(request, "layout.html")

def set_language(request):
    if request.method == "POST":
        language_code = request.POST.get("language_code", None)
        if language_code:
            activate(language_code)
            # Set the language in session
            request.session['django_language'] = language_code
            
            # Set the language cookie with an expiration time
            response = JsonResponse({
                "success": True,
                "message": _("Language has been changed"),
                "redirect_url": "/index/",
                "lang" : language_code
            }, status=200)
            
            # Set a cookie that expires in 1 year
            response.set_cookie(
                settings.LANGUAGE_COOKIE_NAME, language_code,
                max_age=timedelta(days=365),
                expires=settings.SESSION_COOKIE_AGE
            )
            return response
        else:
            return JsonResponse({"success": False, "error": _("Missing language_code")}, status=400)
    return JsonResponse({"success": False, "error": _("Invalid request")}, status=405)

def pvp(request, profile):
    return render(request, "registration/index.html", {'profile': profile})


def register_done(request):
    return render(request, "registration/register_done.html")

def check_authentication(request):
    if request.user.is_authenticated:
        return JsonResponse({"authenticated": True})
    return JsonResponse({"authenticated": False})

@csrf_exempt
def get_csrf_token(request):
    if request.headers.get('X-Requested-With') != 'XMLHttpRequest':
        return HttpResponseForbidden("Invalid request.")
    return JsonResponse({'csrf_token': get_token(request)})

def register(request):
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, _("Account created, you can now login"))
            return JsonResponse({'success': True,
                                 'message': _("Account created, you can now login"),
                                 'redirect_url': '/login/'
            }, status=200)
        else:
            messages.error(request, "Form not valid" )
            return JsonResponse({'success': False, 'message': _("There was an error, please try again later")}, status=400) 

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
                                 'message': _("You are now logged in"),
                                 'redirect_url': '/index/'
            }, status=200)
        else:
            return JsonResponse({'success': False,
                                 'message': _("Invalid username or password"),
                                 'redirect_url': '/login/'
            }, status=200)
    else:
        return render(request, 'registration/login.html', {})

@login_required
def user_logout(request):
    if request.method == 'POST':
        logout(request)
        return JsonResponse({
                'success': True,
                'message': _("See you later!"),
                'redirect_url': '/index/'  # Optional: Tell the frontend where to redirect
            }, status=200)
    else:
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
                'message': _("Your account has been updated!"),
                'redirect_url': '/index/'  # Optional: Tell the frontend where to redirect
            }, status=200)
        else:
            return JsonResponse({
                'success': False,
                'message': _("Your account has not been updated!"),
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
                'message': _("Your password was successfully updated!"),
                'redirect_url': '/index/'  # Optional: Tell the frontend where to redirect
            }, status=200)
        else:
            return JsonResponse({
                'success': False,
                'message': _("Please correct the error in the form.!"),
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
                        'message': _("You cannot add yourself as a friend.")
                        }, status=200)
                elif friend_profile in user_profile.friends.all():
                    return JsonResponse({
                        'success': False,
                        'message': _("You are already friends..")
                        }, status=200)
                else:
                    user_profile.friends.add(friend_profile)
                    user_profile.save()
                    return JsonResponse({
                        'success': True,
                        'message': _("You are now friends"),
                        'redirect_url': '/add_friend/'
                        }, status=200)
            except Exception as e:
                return JsonResponse({
                        'success': False,
                        'message': 'Something went wrong while adding friend, maybe wrong display_name'
                        }, status=200)
        else:
            return JsonResponse({
                'success': False,
                'message': _("Please correct the error in the form.!"),
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
                        'message': _("You are now not friends more"),
                        'redirect_url': '/add_friend/'
                        }, status=200)
    else:
        return JsonResponse({
                        'success': False,
                        'message': _("Wrong request"),
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
    player1 = Profile.objects.get(user=request.user)
    game = Game.objects.filter(player1=player1, game_type=Game.PVP, status = 'waiting').first()
    if (game):
        return render(request, 'registration/game_setup.html', {'game': game})
    return render(request, 'registration/game_setup.html', {})

@login_required
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
def logout_game_setup(request):

    player_data = request.session.get('player2')
    if player_data:
        player_id = player_data.get('id')
    player = Profile.objects.get(id=player_id)
    player.is_online = False
    player.save()
    if 'player2' in request.session:
        del request.session['player2']  # Remove the correct session key
        return JsonResponse({
            'success': True,
            'message': _(f"Player 2 logged out.{player.id}"),
            'redirect_url': '/game_setup/'
        }, status=200)
    else:
        return JsonResponse({
            'success': False,
            'message': _(f"No Player 2 is currently logged in."),
            'redirect_url': '/game_setup/'
        }, status=200)

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

            if game_id == 0:
                return JsonResponse({'success': True, 'message': 'Game without saving result!', 'redirect_url': '/game_setup/'})
            # Get player profiles
            player1 = get_object_or_404(Profile, id=player1_id)
            player2 = get_object_or_404(Profile, id=player2_id)

            # Update the existing game
            game = get_object_or_404(Game, id=game_id)

            if game.winner:
                return JsonResponse({'success': False, 'message': 'Game result already recorded'}, status=400)
            
            tournament = None
            if game.tournament_id and game.tournament_id != 0:
                tournament = get_object_or_404(Tournament, id=game.tournament_id)
            with transaction.atomic():  
                if player1_score > player2_score:
                    player1.update_stats(won=1)
                    player2.update_stats(won=0)
                    game.winner = player1
                    game.loser = player2
                    game.status = "finished"
                    game.save()
                    if (tournament and (game.game_type == Game.TOURNAMENT_GAME)):
                        if not tournament.first_tour_winners.filter(id=player1.id).exists():
                            tournament.first_tour_winners.add(player1)
                        if not tournament.first_tour_losers.filter(id=player2.id).exists():
                            tournament.first_tour_losers.add(player2)
                else:
                    game.winner = player2
                    game.loser = player1
                    player2.update_stats(won=1)
                    player1.update_stats(won=0)
                    game.status = "finished"
                    game.save()
                    if (tournament and (game.game_type == Game.TOURNAMENT_GAME)):
                        if not tournament.first_tour_winners.filter(id=player2.id).exists():
                            tournament.first_tour_winners.add(player2)
                        if not tournament.first_tour_losers.filter(id=player1.id).exists():
                            tournament.first_tour_losers.add(player1)
                if (game.game_type == Game.PVP):
                    game.player1_score = player1_score
                    game.player2_score = player2_score
                    game.status = "finished"
                    game.save()
                    return JsonResponse({'success': True, 'message': 'Game result saved successfully!', 'redirect_url': '/game_setup/'})
                if tournament:
                    if (tournament.first_tour_winners.count() == 2 and (game.game_type == Game.TOURNAMENT_GAME)):
                                final = Game.objects.filter(tournament_id=tournament.id, game_type=Game.TOURNAMENT_FINAL).first()
                                if not final:
                                    finalists = list(tournament.first_tour_winners.all())
                                    final = Game.objects.create(game_type=Game.TOURNAMENT_FINAL, player1=finalists[0], player2=finalists[1], tournament_id=game.tournament_id)
                                    final.save()
                                    tournament.games.add(final)
                    if (tournament.first_tour_losers.count() == 2 and (game.game_type == Game.TOURNAMENT_GAME)):
                        third_place_match = Game.objects.filter(tournament_id=tournament.id, game_type=Game.TOURNAMENT_3OR4).first()
                        if not third_place_match:
                            losers = list(tournament.first_tour_losers.all())
                            third_place_match = Game.objects.create(game_type=Game.TOURNAMENT_3OR4, player1=losers[0], player2=losers[1], tournament_id=game.tournament_id)
                            third_place_match.save()
                            tournament.games.add(third_place_match)
                    if (game.game_type == Game.TOURNAMENT_FINAL):
                            tournament.winner = game.winner
                            tournament.second = game.loser
                            game.winner.update_tournament_stats(won=1)
                            game.loser.update_tournament_stats(won=0)
                    if (game.game_type == Game.TOURNAMENT_3OR4):
                        tournament.third = game.winner
                        tournament.fourth = game.loser
                        game.winner.update_tournament_stats(won=1)
                        game.loser.update_tournament_stats(won=0)
                    game.player1_score = player1_score
                    game.player2_score = player2_score
                    game.status = "finished"
                    game.save()
                    game.save()  # Save changes
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
                'message': _("Display name is required."),
            }, status=400)
        try:
            player_id = int(player_id)
        except ValueError:
            return JsonResponse({
                'success': False,
                'message': _("Invalid player id format."),
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
            'message': _("Display name updated successfully."),
            'new_display_name': display_name,
            'player_number': player_number,
            'redirect_url': '/tournament/'
        })
    else:    
        return JsonResponse({
            'success': False,
            'message': _("Invalid request method."),
        }, status=405)



@login_required
def second_player_tournament(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user2 = authenticate(request, username=username, password=password)
        if user2:
            profile1 = Profile.objects.get(user=request.user)
            profile2 = Profile.objects.get(user=user2)
            redirect_url = request.META.get('HTTP_REFERER', '/default-page/')
            if (profile2 == profile1):
                return JsonResponse({
                'success': True,
                'message': _("You already logined"),
                'redirect_url': redirect_url
                })
            profile2.is_online = True
            profile2.save()
            request.session['player2'] = {
                'display_name': profile2.display_name,
                'avatar_url': profile2.avatar.url if profile2.avatar else '',
                'wins': profile2.wins,
                'losses': profile2.losses,
                'id': profile2.id,
            }
            return JsonResponse({
                'success': True,
                'message': _("Player 2 logged in successfully."),
                'goal': 'Login',
                'player_number': 2,
                'player2_display_name': profile2.display_name,
                'player2_wins': profile2.wins,
                'player2_losses': profile2.losses,
                'player2_id': profile2.id,
                'player2_avatar': profile2.avatar.url if profile2.avatar else '',
                'redirect_url': redirect_url  # Optional: Redirect to the tournament page
            })
        else:
            return JsonResponse({
                'success': False,
                'message': _("Invalid username or password."),
            }, status=400)
    return JsonResponse({
        'success': False,
        'message': _("Invalid request method."),
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
            profile3.save()
            request.session['player3'] = {
                'display_name': profile3.display_name,
                'avatar_url': profile3.avatar.url if profile3.avatar else '',
                'wins': profile3.wins,
                'losses': profile3.losses,
                'id': profile3.id,
            }
            return JsonResponse({
                'success': True,
                'message': _("Player 3 logged in successfully."),
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
                'message': _("Invalid username or password."),
            }, status=400)
    return JsonResponse({
        'success': False,
        'message': _("Invalid request method."),
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
            profile4.save()
            request.session['player4'] = {
                'display_name': profile4.display_name,
                'avatar_url': profile4.avatar.url if profile4.avatar else '',
                'wins': profile4.wins,
                'losses': profile4.losses,
                'id': profile4.id,
            }
            return JsonResponse({
                'success': True,
                'message': _("Player 4 logged in successfully."),
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
                'message': _("Invalid username or password."),
            }, status=400)
    return JsonResponse({
        'success': False,
        'message': _("Invalid request method."),
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
                'message': _("Tournament created successfully!"),
                'redirect_url': '/tournament/'  # Optional: Redirect to the tournament page
            })
        else:
           return JsonResponse({
                'success': False,
                'message': _("There was an error creating the tournament."),
                'errors': form.errors  # Include form errors for debugging
            }, status=400)
    else:
        # Handle non-POST requests (e.g., GET)
        return JsonResponse({
            'success': False,
            'message': _("Invalid request method."),
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
            'message': f'{player.display_name} {_(" has joined the tournament.")}',
            'player_count': tournament.players.count(),
            'player_name': player.display_name,
            'player_avatar': player.avatar.url if player.avatar else '',
            'redirect_url': '/tournament/'
        })
    else:
        return JsonResponse({
            'success': True,
            'message': 'Tournament is full or you have already joined.'
        }, status=200)

@login_required
def quit_tournament(request, tournament_id, player_id):
    tournament = Tournament.objects.get(id=tournament_id)
    player = Profile.objects.get(id=player_id)
    if tournament.status == 'not_started':
        tournament.players.remove(player)
        tournament.save()
        return JsonResponse({
            'success': True,
            'message': f'{player.display_name} {_(" has quit the tournament.")}',
            'player_count': tournament.players.count(),
            'player_name': player.display_name,
            'redirect_url': '/tournament/'
        })
    else:
        return JsonResponse({
            'success': False,
            'message': _("Tournament already started.")
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

        # if not all_players_online:
        #     return JsonResponse({
        #         'success': False,
        #         'message': 'Not all players are online.'
        #     }, status=400)

        # Randomly shuffle players to generate matchups
        players = list(tournament.players.all())
        shuffle(players)
        game1 = Game.objects.create(game_type=Game.TOURNAMENT_GAME, player1=players[0], player2=players[1], tournament_id=tournament_id)
        game2 = Game.objects.create(game_type=Game.TOURNAMENT_GAME, player1=players[2], player2=players[3], tournament_id=tournament_id)
        tournament.games.add(game1)
        tournament.games.add(game2)
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
    
@login_required
def finish_tournament(request, tournament_id):
    try:
        tournament = Tournament.objects.get(id=tournament_id)
        tournament.status = 'completed'
        tournament.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Tournament finished.',
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
        return JsonResponse({"error": _("Tournament not found")}, status=404)
    
def tournament_detail(request, tournament_id):
    tournament = Tournament.objects.get(id=tournament_id)
    # Optionally, add players and other data
    return render(request, 'tournament_detail.html', {'tournament': tournament})

def logout_tournament(request, player_number):
    player_key = f'player{player_number}'  # Format the dynamic key
    player_data = request.session.get(player_key)
    if player_data:
        player_id = player_data.get('id')
    player = Profile.objects.get(id=player_id)
    player.is_online = False
    player.save()
    if player_key in request.session:
        del request.session[player_key]  # Remove the correct session key
        return JsonResponse({
            'success': True,
            'message': _(f"Player {player_number} logged out.{player.id}"),
            'redirect_url': '/tournament/'
        }, status=200)
    else:
        return JsonResponse({
            'success': False,
            'message': _(f"No Player {player_number} is currently logged in."),
            'redirect_url': '/tournament/'
        }, status=200)


    
@login_required
def create_game(request):
    if request.method == 'POST':
        player1 = Profile.objects.get(user=request.user)
        game = Game.objects.create(game_type=Game.PVP, player1=player1)
        game.save()
        return JsonResponse({
                'success': True,
                'message': _("Game for result created successfully!"),
                'redirect_url': '/game_setup/'  # Optional: Redirect to the tournament page
            })
    else:
        # Handle non-POST requests (e.g., GET)
        return JsonResponse({
            'success': False,
            'message': _("Invalid request method."),
            'redirect_url': '/index/'  # Redirect to the tournament page
        }, status=405)

@login_required
def user_dashboard(request):
    player = Profile.objects.get(user=request.user)
    games = Game.objects.filter(Q(player1=player) | Q(player2=player) | Q(player3=player) | Q(player4=player))
    tournaments = Tournament.objects.filter(players=player)

    # Calculate additional metrics
    total_games = games.count()
    win_rate = (player.wins / (player.wins + player.losses)) * 100 if (player.wins + player.losses) > 0 else 0
    friends = player.friends.all()

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return render(request, 'registration/user_dashboard.html', {
            'player': player,
            'games': games,
            'tournaments': tournaments,
            'total_games': total_games,
            'win_rate': win_rate,
            'friends': friends,
        })
    return render(request, 'registration/index.html')

    
@require_http_methods(["GET", "POST"])
@login_required
def game_dashboard(request):
    games = Game.objects.all().order_by('-created_at')
    players = Profile.objects.all()

    # Apply filters for POST requests (form submission)
    if request.method == 'POST':
        player_filter = request.POST.get('player')
        if player_filter:
            games = games.filter(
                Q(player1_id=player_filter) |
                Q(player2_id=player_filter) |
                Q(player3_id=player_filter) |
                Q(player4_id=player_filter)
            )

            # Fetch the player's stats
            player = Profile.objects.get(id=player_filter)
            player_stats = {
                'wins': player.wins,
                'losses': player.losses,
            }
        else:
            player_stats = None

        # Render the game table as HTML
        html = render_to_string('registration/game_table.html', {'games': games})
        return JsonResponse({
            'success': True,
            'message': _("Filter applyed!"),
            'html': html,
            'player_stats': player_stats,  # Include player stats in the response
        })

    # For GET requests, render the full page
    context = {
        'games': games,
        'players': players,
    }
    return render(request, 'registration/game_dashboard.html', context)