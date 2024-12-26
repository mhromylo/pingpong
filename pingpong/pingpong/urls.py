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
from regidtration import views
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views


urlpatterns = [
    path('admin/', admin.site.urls),

    path('', views.index, name='index'),

    path('register/', views.register, name='register'),

    path('register_done/', views.register_done, name='register_done'),

    path('login/', views.user_login, name='login'),

    path('profile/', views.profile, name='profile'),

path('logout/', views.user_logout, name='logout'),

    path('update_profile/', views.update_profile, name='update_profile'),

    path('change_password/', views.change_password, name='change_password'),

    path('add_friend/', views.add_friend, name='add_friend'),
    path('friends/', views.list_friends, name='list_friends'),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
