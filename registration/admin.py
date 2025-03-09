from django.contrib import admin
from registration.models import Profile, Game, Tournament, AnotherGame

admin.site.register(Profile)
admin.site.register(Game)
admin.site.register(Tournament)
admin.site.register(AnotherGame)

# Register your models here.
