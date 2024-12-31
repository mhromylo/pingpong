import json
from channels.generic.websocket import AsyncWebsocketConsumer

class FriendStatusConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if self.user.is_authenticated:
            await self.channel_layer.group_add("online_status", self.channel_name)
            await self.accept()

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            await self.channel_layer.group_discard("online_status", self.channel_name)

    async def send_status_update(self, event):
        await self.send(text_data=json.dumps(event))