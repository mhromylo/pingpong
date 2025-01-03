from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from regidtration.models import Profile

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        display_name = instance.email
        Profile.objects.create(user=instance, display_name=display_name)
    else:
        instance.profile.save()

@receiver(user_logged_in)
def set_online_status(sender, request, user, **kwargs):
    profile = user.profile
    profile.is_online = True
    profile.save()

@receiver(user_logged_out)
def set_offline_status(sender, request, user, **kwargs):
    try:
        profile = user.profile
        profile.is_online = False
        profile.save()
    except Profile.DoesNotExist:
        pass