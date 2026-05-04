"""Custom views for the jdsite app.

This module currently provides a logout view that ensures any lingering
Django messages are cleared before redirecting the user to the login page.
The standard ``LogoutView`` from ``django.contrib.auth.views`` does not
explicitly clear the message storage, which can cause warning messages from
previous social‑login attempts to persist after the user logs out and tries
again.
"""

from django.contrib import messages
from django.contrib.auth import logout as auth_logout, login as auth_login
from django.contrib.auth import views as auth_views
from django.shortcuts import redirect
from django.utils.decorators import method_decorator
from django.views.decorators.debug import sensitive_post_parameters


def custom_logout(request):
    """Log the user out and clear any stored messages.

    The function performs the standard logout operation, then consumes any
    messages that may be present in the request's message storage. Finally it
    redirects to the ``login`` URL (named ``login`` in ``jdsite.urls``).
    """
    # Perform the logout – this removes the user from the session.
    auth_logout(request)

    # Consume and discard any messages that might be lingering from a prior
    # login attempt. ``list(messages.get_messages(request))`` forces the
    # iterator to be exhausted, effectively clearing the storage.
    list(messages.get_messages(request))

    # Redirect to the login page (the name ``login`` is defined in urls).
    return redirect("login")


class CustomLoginView(auth_views.LoginView):
    """Login view that clears stale messages and respects the "Recordar sesión" checkbox.

    * On every request we clear any pending Django messages to avoid leftover
      alerts from previous attempts.
    * When the form is submitted and the ``remember`` checkbox is checked we
      extend the session expiry to 30 days; otherwise the session expires when
      the browser is closed.
    """

    @method_decorator(sensitive_post_parameters("password"))
    def dispatch(self, request, *args, **kwargs):
        # Clear any lingering messages before processing the request.
        list(messages.get_messages(request))
        return super().dispatch(request, *args, **kwargs)

    def form_valid(self, form):
        # Let the parent handle authentication.
        response = super().form_valid(form)
        # Adjust session expiry based on the "Recordar sesión" checkbox.
        remember = self.request.POST.get("remember")
        if remember:
            # 30 days in seconds.
            self.request.session.set_expiry(60 * 60 * 24 * 30)
            # Set cookies to remember email and password (insecure, for demo purposes)
            email = self.request.POST.get("username", "")
            password = self.request.POST.get("password", "")
            # max_age 30 days
            max_age = 60 * 60 * 24 * 30
            response.set_cookie(
                "remember_email", email, max_age=max_age, httponly=False
            )
            response.set_cookie(
                "remember_password", password, max_age=max_age, httponly=False
            )
        else:
            # Expire on browser close.
            self.request.session.set_expiry(0)
            # Delete remember cookies if they exist
            response.delete_cookie("remember_email")
            response.delete_cookie("remember_password")
        return response

    def get_initial(self):
        """Pre‑populate the login form with remembered credentials.

        The ``remember_email`` and ``remember_password`` cookies are set when the
        user checks the "Recordar sesión" box.  If they exist we use their values
        as the initial data for the ``AuthenticationForm`` so the fields are
        filled automatically on the next visit.
        """
        initial = super().get_initial()
        request = self.request
        email = request.COOKIES.get("remember_email")
        password = request.COOKIES.get("remember_password")
        if email:
            initial["username"] = email
        if password:
            initial["password"] = password
        return initial
