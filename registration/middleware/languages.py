from django.utils import translation
from django.utils.translation import activate


class SetDefaultLangMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check if language is set in the session or cookie
        language_code = request.COOKIES.get('django_language', None) or request.session.get('django_language', None)
        if language_code:
            activate(language_code)  # Set the language
            request.session['django_language'] = language_code
        else:
            # Fallback language
            activate('en')  # Default to English
            request.session['django_language'] = 'en'
        response = self.get_response(request)
        return response
