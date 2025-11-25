import os
from pathlib import Path

from dotenv import load_dotenv

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
    # apps tuyas
    "inquiries",
    # "blog",
]

LANGUAGE_CODE = "es-co"
TIME_ZONE = "America/Bogota"
USE_I18N = True
USE_TZ = True

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
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True") == "True"
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER)
EMAIL_SUBJECT_PREFIX = os.getenv("EMAIL_SUBJECT_PREFIX", "[JD] ")
SITE_BASE_URL = os.getenv("SITE_BASE_URL", "http://localhost:8000")
REPLY_TO_EMAIL = os.getenv("REPLY_TO_EMAIL", EMAIL_HOST_USER)

# --- REDIRECCIÓN DE LOGIN ---
# Esto le dice a Django dónde ir cuando @login_required bloquea a un usuario
LOGIN_URL = "/me/login/"
LOGIN_REDIRECT_URL = "/ask/admin/threads/"

JD_AVATAR_URL = "https://jdiaz.tipsterbyte.com/static/jd-imagen.jpg"

# --- AÑADIR ESTA LÍNEA AL FINAL ---
SITE_ID = 1
