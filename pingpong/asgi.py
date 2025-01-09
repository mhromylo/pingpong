"""
ASGI config for pingpong project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import include, path
from regidtration.consumers import FriendStatusConsumer

import pingpong

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pingpong.settings')

# application = ProtocolTypeRouter({
#     "http": get_asgi_application(),
#     "websocket": AuthMiddlewareStack(
#         URLRouter(
#             path('ws/status/', FriendStatusConsumer.as_asgi()),
#         )
#     ),
# })
