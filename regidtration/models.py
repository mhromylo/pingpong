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
        self.games_played += 1
        if won:
            self.wins += 1
        else:
            self.losses += 1
        self.save()

    class Meta:
        db_table = 'regidtration_profile'

class Game(models.Model):
    player1 = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="games_as_player1")
    player2 = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="games_as_player2")
    player1_score = models.PositiveIntegerField(default=0)
    player2_score = models.PositiveIntegerField(default=0)
    winner = models.ForeignKey(Profile, on_delete=models.SET_NULL, related_name="games_won", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save_game_result(self):
        if self.player1_score > self.player2_score:
            self.winner = self.player1
            self.player1.update_stats(won=True)
            self.player2.update_stats(won=False)
        elif self.player2_score > self.player1_score:
            self.winner = self.player2
            self.player1.update_stats(won=False)
            self.player2.update_stats(won=True)
        else:
            # Optional: Handle draw logic
            pass
        self.save()

    class Meta:
        db_table = 'regidtration_game'





class Tournament(models.Model):
    name = models.CharField(max_length=100)