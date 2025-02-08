from django.urls import path

from registration.consumers import FriendStatusConsumer

# websocket_urlpatterns = [
#     path('ws/status/', FriendStatusConsumer.as_asgi()),
# ]