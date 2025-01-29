from django.urls import re_path
from . import consumers

from regidtration.consumers import FriendStatusConsumer

websocket_urlpatterns = [
	re_path(r'ws/socket-server/', consumers.ChatConsumer.as_asgi())
#     path('ws/status/', FriendStatusConsumer.as_asgi()),
]