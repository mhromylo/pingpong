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
    waiting_player = None  # Store the first player waiting for an opponent

    async def connect(self):
        if PongConsumer.waiting_player is None:
            # First player joins and waits
            PongConsumer.waiting_player = self.channel_name
            self.session_id = self.channel_name  # Temporary session ID
            await self.accept()
            await self.send(json.dumps({"event": "waiting_for_opponent"}))
        else:
            # Second player joins, assign them to the same session
            self.session_id = PongConsumer.waiting_player
            await self.accept()

            # Notify both players that the game is starting
            await self.channel_layer.send(
                PongConsumer.waiting_player,
                {"type": "game_start"}
            )
            await self.send(json.dumps({"event": "game_start"}))

            # Clear waiting player
            PongConsumer.waiting_player = None

    async def disconnect(self, close_code):
        if self.session_id == PongConsumer.waiting_player:
            PongConsumer.waiting_player = None

    async def game_start(self, event):
        await self.send(json.dumps({"event": "game_start"}))

    async def game_message(self, event):
        await self.send(text_data=json.dumps(event["message"]))
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