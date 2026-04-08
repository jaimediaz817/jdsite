from django.urls import path
from .views import soap_service

app_name = "soap_service"

urlpatterns = [
    path(
        "v3/19217075-6d4e-4818-98bc-416d1feb7b84",
        soap_service,
        name="acme-soap-endpoint",
    ),
]
