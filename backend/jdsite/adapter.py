"""Custom Allauth social account adapter.

This adapter intercepts the social login flow. If the email returned by the
provider already exists in the database, we prevent Allauth from showing the
default signup form and instead redirect the user back to the blog list page
with a friendly message indicating that the email is already in use via a
social account.

The message is added to Django's ``messages`` framework so it can be displayed
in the template. The redirect target is the URL name ``blog:list`` – adjust if
your project uses a different name.
"""

from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.exceptions import ImmediateHttpResponse
from django.http import HttpResponseRedirect
from django.contrib import messages
from django.urls import reverse
from django.contrib.auth import get_user_model


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """Override ``pre_social_login`` to handle existing email conflicts.

    When a user tries to log in with a social provider and the email address is
    already associated with an existing account, Allauth would normally present
    a signup form. We instead capture this situation, add a warning message, and
    redirect the user to the blog list page.
    """

    def pre_social_login(self, request, sociallogin):
        # ``sociallogin`` contains the user information fetched from the
        # provider. ``sociallogin.account.email_addresses`` holds the verified
        # email addresses.
        email = None
        if sociallogin.email_addresses:
            email = sociallogin.email_addresses[0].email
        elif sociallogin.user.email:
            email = sociallogin.user.email

        if email:
            User = get_user_model()
            if User.objects.filter(email__iexact=email).exists():
                # Email already exists – inform the user and redirect.
                messages.warning(
                    request,
                    "El correo electrónico ya está en uso mediante una cuenta tradicional o social. Por favor, inicia sesión con la cuenta existente o crea una rápidamente.",
                )
                # Redirect to the blog list (home) page.
                # Redirect to the blog list page (home). Adjust the URL name if your project uses a different one.
                # Redirect to the login page so the warning message can be shown.
                # After the user logs in (or chooses another account) they will be
                # redirected to the blog list via LOGIN_REDIRECT_URL.
                from django.urls import reverse

                redirect_url = reverse("account_login")
                raise ImmediateHttpResponse(HttpResponseRedirect(redirect_url))

        # If no conflict, fall back to the default behaviour.
        return super().pre_social_login(request, sociallogin)
