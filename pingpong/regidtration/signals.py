from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from regidtration.models import Profile

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        display_name = instance.email
        Profile.objects.create(user=instance, display_name=display_name)
    instance.profile.save()