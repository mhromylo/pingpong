import json
from channels.generic.websocket import AsyncWebsocketConsumer

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