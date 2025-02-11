from rest_framework import serializers
from .models import Profile, Game  # Assuming you have Player and Game models

class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['user', 'display_name', 'avatar', 'wins', 'losses', 'friends', 'is_online']  # Adjust fields based on your model

class GameSerializer(serializers.ModelSerializer):
    players = PlayerSerializer(many=True)  # Nested serializer for players in a game

    class Meta:
        model = Game
        fields = ['id', 'status', 'players']
