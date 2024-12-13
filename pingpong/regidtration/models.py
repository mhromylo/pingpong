from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    display_name = models.CharField(max_length=50, unique=True, null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', default='avatars/default.png')
    wins = models.PositiveIntegerField(default=0)
    losses = models.PositiveIntegerField(default=0)
    friends = models.ManyToManyField('self', blank=True, symmetrical=True)

    def __str__(self):
        return self.display_name

class Meta:
    db_table = 'regidtration_profile'





def update_ranking(self):
    self.ranking = (self.ranking * 100) / (self.wins + self.losses)

class Tournament(models.Model):
    name = models.CharField(max_length=100)