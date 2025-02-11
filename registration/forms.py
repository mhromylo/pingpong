from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django import forms
from django.contrib.auth.models import User
from .models import Profile


class RegistrationForm(UserCreationForm):
    email = forms.EmailField(widget=forms.EmailInput(attrs={'class': 'form-control'}))


    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']

    def __init__(self, *args, **kwargs):
        super(RegistrationForm, self).__init__(*args, **kwargs)

        self.fields['username'].widget.attrs.update({'class': 'form-control'})
        self.fields['password1'].widget.attrs.update({'class': 'form-control'})
        self.fields['password2'].widget.attrs.update({'class': 'form-control'})

class SignUpForm(UserCreationForm):
    class Meta:
        model = User
        fields = ['username', 'password']

    def __init__(self, *args, **kwargs):
        super(SignUpForm, self).__init__(*args, **kwargs)
        self.fields['username'].widget.attrs.update({'class': 'form-control'})
        self.fields['password'].widget.attrs.update({'class': 'form-control'})

class UserUpdateForm(UserChangeForm):
    password = None
    username = forms.CharField(widget=forms.TextInput(attrs={'class': 'form-control'}))
    email = forms.EmailField(widget=forms.EmailInput(attrs={'class': 'form-control'}))

    class Meta:
        model = User
        fields = ['username', 'email']

    def __init__(self, *args, **kwargs):
        super(UserUpdateForm, self).__init__(*args, **kwargs)
        self.fields['username'].widget.attrs.update({'class': 'form-control'})
        self.fields['email'].widget.attrs.update({'class': 'form-control'})

class ChangePasswordForm(forms.ModelForm):
    old_password = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'form-control'}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'form-control'}))
    confirm_password = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'form-control'}))
    class Meta:
        model = Profile
        fields = ['old_password', 'password', 'confirm_password']

class ProfileUpdateForm(forms.ModelForm):
    display_name = forms.CharField(widget=forms.TextInput(attrs={'class': 'form-control'}))
    avatar = forms.ImageField(widget=forms.FileInput(attrs={'class': 'form-control'}))

    class Meta:
        model = Profile
        fields = ['display_name', 'avatar']

    def __init__(self, *args, **kwargs):
        super(ProfileUpdateForm, self).__init__(*args, **kwargs)
        self.fields['display_name'].widget.attrs.update({'class': 'form-control'})

class AddFriendsForm(forms.Form):
    friend_name = forms.CharField(label='Friend Name', max_length=150)

class TournamentUpdateForm(forms.ModelForm):
    display_name = forms.CharField(widget=forms.TextInput(attrs={'class': 'form-control'}))

    class Meta:
        model = Profile
        fields = ['display_name']

    def __init__(self, *args, **kwargs):
        super(TournamentUpdateForm, self).__init__(*args, **kwargs)
        self.fields['display_name'].widget.attrs.update({'class': 'form-control'})