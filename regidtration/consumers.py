import json
import uuid

from channels.generic.websocket import AsyncWebsocketConsumer, WebsocketConsumer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
    


class FriendStatusConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_authenticated:
            self.profile = self.user.profile
            await self.channel_layer.group_add(
                f"user_{self.profile.id}",
                self.channel_name
            )
            await self.accept()

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            await self.channel_layer.group_discard(
                f"user_{self.profile.id}",
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data.get("type") == "status_update":
            status = data["status"]
            self.profile.is_online = status == "online"
            self.profile.save()

            # Send status update to each friend's group
            for friend in self.profile.friends.all():
                await self.channel_layer.group_send(
                    f"user_{friend.id}",
                    {
                        "type": "friend_status",
                        "status": status,
                        "user_id": self.profile.user.id,  # send the user id
                    }
                )

    async def friend_status(self, event):
        # Send the friend status to WebSocket
        await self.send(text_data=json.dumps({
            "type": "friend_status",
            "status": event["status"],
            "user_id": event["user_id"]
        }))
class PongConsumer(AsyncWebsocketConsumer):
    players = []
    game_state = {
        'paddles': {'player1': 0, 'player2': 0},
        'ball': {'x': 400, 'y': 300, 'dx': 2, 'dy': 1.5},
        'score': {'player1': 0, 'player2': 0}
    }
    
    async def connect(self):
        if len(self.players) < 2:
            self.players.append(self)
            await self.accept()
            if len(self.players) == 2:
                for player in self.players:
                    await player.send(text_data=json.dumps({
                        'message': 'Game started!',
                        'status': 'ready',
                        'game_state': self.game_state
                    }))
        else:
            await self.close()

    async def disconnect(self, close_code):
        self.players.remove(self)
        print(f"Player diskonnected: {self}")

    async def receive(self, text_data):
        data = json.loads(text_data)
        print(f"Recived: {data}")
        
        if "action" in data:
            action = data["action"]
            if action == "move":
                player_id = data.get("playerId")
                paddle_y = data.get("paddleY")
                print(f"Player {player_id} moved paddle to {paddle_y}")
            # Handle move action here
            else:
                print("Unknown action:", action)
        else:
            print("No action provided in message.")
             
        for player in self.players:
            await player.send(text_data=json.dumps({
                'game_state': self.game_state
            }))
            self.update_ball()
            for player in self.players:
                await player.send(text_data=json.dumps({
                    'game_state': self.game_state
                }))
    def update_ball(self):
        # Handle ball movement
        self.game_state['ball']['x'] += self.game_state['ball']['dx']
        self.game_state['ball']['y'] += self.game_state['ball']['dy']

        # Ball-paddle collision detection and scoring
        if (self.game_state['ball']['x'] - 10 < 10 and
            self.game_state['ball']['y'] > self.game_state['paddles']['player1'] and
            self.game_state['ball']['y'] < self.game_state['paddles']['player1'] + 100):
            self.game_state['ball']['dx'] = -self.game_state['ball']['dx']

        elif (self.game_state['ball']['x'] + 10 > 790 and
              self.game_state['ball']['y'] > self.game_state['paddles']['player2'] and
              self.game_state['ball']['y'] < self.game_state['paddles']['player2'] + 100):
            self.game_state['ball']['dx'] = -self.game_state['ball']['dx']

        # Ball out of bounds logic (scoring)
        if self.game_state['ball']['x'] < 0:
            self.game_state['score']['player2'] += 1
            self.reset_ball()

        elif self.game_state['ball']['x'] > 800:
            self.game_state['score']['player1'] += 1
            self.reset_ball()

        # Ball bouncing on top and bottom
        if self.game_state['ball']['y'] <= 0 or self.game_state['ball']['y'] >= 600:
            self.game_state['ball']['dy'] = -self.game_state['ball']['dy']

    def reset_ball(self):
        self.game_state['ball'] = {'x': 400, 'y': 300, 'dx': 2, 'dy': 1.5}