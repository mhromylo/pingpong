from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    display_name = models.CharField(max_length=50, unique=True, null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', default='avatars/default.png')
    wins = models.PositiveIntegerField(default=0)
    losses = models.PositiveIntegerField(default=0)
    friends = models.ManyToManyField('self', blank=True)
    is_online = models.BooleanField(default=False)


    def __str__(self):
        return self.display_name

    def update_ranking(self):
        if self.wins + self.losses > 0:
            self.ranking = (self.wins / (self.wins + self.losses)) * 100
        else:
            self.ranking = 0.0
            
    def update_stats(self, won):
        if won:
            self.wins += 1
        else:
            self.losses += 1
        self.save()

    class Meta:
        db_table = 'registration_profile'

class Game(models.Model):
    player2 = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="games_as_Player2")
    player3 = models.ForeignKey(Profile, on_delete=models.CASCADE, null=True, blank=True, related_name="games_as_Player3")
    player4 = models.ForeignKey(Profile, on_delete=models.CASCADE, null=True, blank=True, related_name="games_as_Player4")
    winner = models.ForeignKey(Profile, on_delete=models.SET_NULL, related_name="games_won", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    game_type = models.CharField(max_length=50)
    class Meta:
        db_table = 'registration_game'
        
    def __str__(self):
        return f"Game ({self.created_at.strftime('%Y-%m-%d %H:%M:%S')} - {self.game_type})"

class Tournament(models.Model):
    name = models.CharField(max_length=100)
    players = models.ManyToManyField(Profile, related_name='tournaments')
    created_at = models.DateTimeField(default=timezone.now)
    creator = models.ForeignKey(Profile, on_delete=models.SET_NULL, related_name="tournaments_create", null=True, blank=True)
    started = models.BooleanField(default=False)

    class Meta:
        db_table = 'registration_tournament'

    def __str__(self):
        """Check if the tournament already has 3 players."""
        return self.name

