"""
URL configuration for pingpong project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from registration import views
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views



urlpatterns = [

    path('index/', views.index, name='index'),
    path('layout/', views.index, name='layout'),
    path('admin/', admin.site.urls),

    path('', views.index, name='index'),

    path('register/', views.register, name='register'),
    path('check-auth/', views.check_authentication, name='check-auth'),

    path('register_done/', views.register_done, name='register_done'),

    path('login/', views.user_login, name='login'),
    path('set_language/', views.set_language, name='set_language'),

    path('logout/', views.user_logout, name='logout'),

    path('update_profile/', views.update_profile, name='update_profile'),

    path('change_password/', views.change_password, name='change_password'),

    path('add_friend/', views.add_friend, name='add_friend'),

    path('delete_friend/<int:f_id>/', views.delete_friend, name='delete_friend'),

    path('game_setup/', views.game_setup, name='game_setup'),

    path('another_game/', views.another_game, name='another_game'),

    path('save_another_game_result/', views.save_another_game_result, name='save_another_game_result'),

    path('logout_game_setup/', views.logout_game_setup, name='logout_game_setup'),
    path('save_game_result/', views.save_game_result, name='save_game_result'),
    path('tournament/', views.tournament, name='tournament'),
    path('create_game/', views.create_game, name='create_game'),
    path('tournament_name_user/<int:player_id>/<int:player_number>/', views.tournament_name_user, name='tournament_name_user'),
    path('second_player_tournament/', views.second_player_tournament, name='second_player_tournament'),
    path('third_player_tournament/', views.third_player_tournament, name='third_player_tournament'),
    path('forth_player_tournament/', views.forth_player_tournament, name='forth_player_tournament'),
    path('create_tournament/', views.create_tournament, name='create_tournament'),
    path('get_tournament_data/<int:tournament_id>/', views.get_tournament_data, name='get_tournament_data'),
    path('tournament/<int:tournament_id>/', views.tournament_detail, name='tournament_detail'),
    path('get_csrf_token/', views.get_csrf_token, name='get_csrf_token'),
    path('start_tournament/<int:tournament_id>/', views.start_tournament, name='start_tournament'),
    path('finish_tournament/<int:tournament_id>/', views.finish_tournament, name='finish_tournament'),
    path('join_tournament/<int:tournament_id>/<int:player_id>/', views.join_tournament, name='join_tournament'),
    path('quit_tournament/<int:tournament_id>/<int:player_id>/', views.quit_tournament, name='quit_tournament'),
    path('logout_tournament/<int:player_number>/', views.logout_tournament, name='logout_tournament'),
    path('user_dashboard/', views.user_dashboard, name='user_dashboard'),
    path('game_dashboard/', views.game_dashboard, name='game_dashboard'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
