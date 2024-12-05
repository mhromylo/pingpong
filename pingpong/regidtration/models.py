from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Player(User):
    tournament_name = models.CharField(max_length=100, unique=True)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    rating = models.FloatField(default=0)
    avatar = models.ImageField(upload_to='avatars', null=True, blank=True, default=None)
    friends = models.ManyToManyField(User, related_name='friends')


def update_ranking(self):
    self.ranking = (self.ranking * 100) / (self.wins + self.losses)

class Tournament(models.Model):
    name = models.CharField(max_length=100)