import os
from pathlib import Path

from dotenv import load_dotenv

# from django.conf import settings

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY", "dev-key")
# DEBUG = os.getenv("DEBUG", "True") == "True"
DEBUG = True
# Detecta entorno
DJANGO_ENV = os.getenv("DJANGO_ENV", "development").lower()

# Configuración automática según entorno
if DJANGO_ENV == "production":
    DEBUG = False
    ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "jdiaz.tipsterbyte.com").split(",")
else:
    DEBUG = True
    ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    # django apps...
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
    # allauth apps
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    # apps tuyas
    "inquiries",
    "core",
    "blog",
    "reactions",
]

LANGUAGE_CODE = "es-co"
TIME_ZONE = "America/Bogota"
USE_I18N = True
USE_TZ = True

# FIX Unicode Windows Error
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# --- DB ---
if os.getenv("DB_ENGINE") == "mysql":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": os.getenv("DB_NAME"),
            "USER": os.getenv("DB_USER"),
            "PASSWORD": os.getenv("DB_PASSWORD"),
            "HOST": os.getenv("DB_HOST", "127.0.0.1"),
            "PORT": os.getenv("DB_PORT", "3307"),
            "OPTIONS": {"charset": "utf8mb4", "use_unicode": True},
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
# --- Middleware ---
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "reactions.middleware.RateLimitMiddleware",
]

ROOT_URLCONF = "jdsite.urls"

# --- Templates/Static ---
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]
STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"

STATICFILES_FINDERS = [
    "django.contrib.staticfiles.finders.FileSystemFinder",
    "django.contrib.staticfiles.finders.AppDirectoriesFinder",
]
# --- Email y SITE_URL ---
EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend"
)
DEFAULT_FROM_EMAIL = os.getenv(
    "DEFAULT_FROM_EMAIL", "Jaime Diaz <no-reply@localhost>"
)
OWNER_EMAIL = os.getenv("OWNER_EMAIL")
SITE_URL = os.getenv("SITE_URL", "http://127.0.0.1:8000")


# CONF NUEVA:EMAIL_BACKEND = os.getenv("EMAIL_BACKEND",
# "django.core.mail.backends.console.EmailBackend")

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_SES_REGION_NAME = os.getenv(
    "AWS_SES_REGION_NAME", "us-east-2"
)  # O la región donde creaste la identidad (ej: eu-west-1)
AWS_SES_REGION_ENDPOINT = f"email.{AWS_SES_REGION_NAME}.amazonaws.com"


EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True") == "True"
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER)
EMAIL_SUBJECT_PREFIX = os.getenv("EMAIL_SUBJECT_PREFIX", "[JD] ")
SITE_BASE_URL = os.getenv("SITE_BASE_URL", "http://localhost:8000")
REPLY_TO_EMAIL = os.getenv("REPLY_TO_EMAIL", EMAIL_HOST_USER)

# GUTHUB SETTINGS
JDIAZ817_GITHUB_PAT = os.getenv("JDIAZ817_GITHUB_PAT")
JDIAZ817_GITHUB_USERNAME = os.getenv("JDIAZ817_GITHUB_USERNAME")

JIVAN0017_GITHUB_PAT = os.getenv("JIVAN0017_GITHUB_PAT")
JIVAN0017_GITHUB_USERNAME = os.getenv("JIVAN0017_GITHUB_USERNAME")

# Lista de cuentas para iterar fácilmente
GITHUB_ACCOUNTS = [
    {
        "owner": "profesional",
        "username": JDIAZ817_GITHUB_USERNAME,
        "pat": JDIAZ817_GITHUB_PAT,
    },
    {
        "owner": "personal",
        "username": JIVAN0017_GITHUB_USERNAME,
        "pat": JIVAN0017_GITHUB_PAT,
    },
]

# --- REDIRECCIÓN DE LOGIN ---
# Esto le dice a Django dónde ir cuando @login_required bloquea a un usuario
LOGIN_URL = "/me/login/"
LOGIN_REDIRECT_URL = "/"

JD_AVATAR_URL = f"{SITE_URL}/static/images/jd-imagen.jpg"

# --- AÑADIR ESTA LÍNEA AL FINAL ---
SITE_ID = 1

# --- CONFIGURACIÓN DJANGO ALLAUTH (PARA GOOGLE/GITHUB) ---
AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]

LOGOUT_REDIRECT_URL = "/"

SOCIALACCOUNT_PROVIDERS = {
    "google": {
        "APP": {
            "client_id": os.getenv("GOOGLE_OAUTH_CLIENT_ID"),
            "secret": os.getenv("GOOGLE_OAUTH_CLIENT_SECRET"),
            "key": "",
        },
        "SCOPE": ["profile", "email"],
        "AUTH_PARAMS": {"access_type": "online"},
    },
    "github": {
        "APP": {
            "client_id": os.getenv("GITHUB_OAUTH_CLIENT_ID"),
            "secret": os.getenv("GITHUB_OAUTH_CLIENT_SECRET"),
            "key": "",
        }
    },
}

# =================================================
# CONFIGURACIÓN ÚNICA PARA CV - CAMBIAR SOLO AQUÍ
# =================================================
CV_FILENAME = "CV_Jaime_Diaz.pdf"
CV_DOWNLOAD_NAME = "Jaime_Diaz_CV.pdf"
# =================================================
