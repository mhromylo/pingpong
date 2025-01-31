from django.urls import path
from . import consumers

from regidtration.consumers import FriendStatusConsumer, PongConsumer

websocket_urlpatterns = [
    path("ws/socket-server/", PongConsumer.as_asgi()),
]