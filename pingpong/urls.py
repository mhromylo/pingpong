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
    path('admin/', admin.site.urls),

    path('', views.index, name='index'),

    path('register/', views.register, name='register'),

    path('register_done/', views.register_done, name='register_done'),

    path('login/', views.user_login, name='login'),

path('logout/', views.user_logout, name='logout'),

    path('update_profile/', views.update_profile, name='update_profile'),

    path('change_password/', views.change_password, name='change_password'),

    path('add_friend/', views.add_friend, name='add_friend'),

    path('delete_friend/<int:f_id>/', views.delete_friend, name='delete_friend'),

    path('game_setup/', views.game_setup, name='game_setup'),

    path('logout_player2/', views.logout_player2, name='logout_player2'),
    path('save_game_result/', views.save_game_result, name='save_game_result'),
    path('tournament/', views.tournament, name='tournament'),
    path('tournament_name_user/<int:player_number>/', views.tournament_name_user, name='tournament_name_user'),
    path('tournament_name_user2/', views.tournament_name_user2, name='tournament_name_user2'),
    path('tournament_name_user3/', views.tournament_name_user3, name='tournament_name_user3'),
    path('tournament_name_user4/', views.tournament_name_user4, name='tournament_name_user4'),
    path('second_player_tournament/', views.second_player_tournament, name='second_player_tournament'),
    path('third_player_tournament/', views.third_player_tournament, name='third_player_tournament'),
    path('forth_player_tournament/', views.forth_player_tournament, name='forth_player_tournament'),
    path('create_tournament/', views.create_tournament, name='create_tournament'),
    path('get_tournament_data/<int:tournament_id>/', views.get_tournament_data, name='get_tournament_data'),
    path('tournament/<int:tournament_id>/', views.tournament_detail, name='tournament_detail'),
    path('start_tournament/', views.start_tournament, name='start_tournament'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
