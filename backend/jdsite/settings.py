import os
from pathlib import Path

from dotenv import load_dotenv

# from django.conf import settings

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# Ensure pymysql is used as MySQLdb fallback on Windows where mysqlclient may not compile
try:
    import pymysql

    pymysql.install_as_MySQLdb()
except Exception:
    # If pymysql is not available, the original MySQL client will be used (if installed)
    pass

SECRET_KEY = os.getenv("SECRET_KEY", "dev-key")
# DEBUG = os.getenv("DEBUG", "True") == "True"
DEBUG = True
# Detecta entorno
DJANGO_ENV = os.getenv("DJANGO_ENV", "development").lower()

# Fix AutoField warnings (W042)
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Configuración automática según entorno
if DJANGO_ENV == "production":
    DEBUG = False
    ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "jdiaz.tipsterbyte.com").split(",")
    # CSRF/HTTPS security settings for production
    CSRF_TRUSTED_ORIGINS = [
        "https://jaimediaz.dev",
        "https://www.jaimediaz.dev",
        "https://jdiaz.tipsterbyte.com",
        "https://localhost",
    ]
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_REFERRER_POLICY = "no-referrer-when-downgrade"
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
    # Proveedores sociales (CRÍTICO para URLs en v65+)
    "allauth.socialaccount.providers.google",
    "allauth.socialaccount.providers.github",
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
# Use SQLite for the test suite to avoid external DB dependencies.
import sys

if "test" in sys.argv:
    # Isolated SQLite database for tests.
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "test_db.sqlite3",
        }
    }
elif os.getenv("DB_ENGINE") == "mysql":
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
    "core.middleware.CSRFDiagnosticMiddleware",  # Para diagnosticar errores CSRF 403
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "allauth.account.middleware.AccountMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # "reactions.middleware.RateLimitMiddleware",
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

# --- MEDIA (para upload temporal del editor de blogs) ---
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# HU-028: Límite de tamaño de archivos para upload del editor (en MB)
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))

# --- EMAIL y SITE_URL ---
EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend"
)
DEFAULT_FROM_EMAIL = os.getenv(
    "DEFAULT_FROM_EMAIL", "Jaime Diaz <no-reply@localhost>"
)
OWNER_EMAIL = os.getenv("OWNER_EMAIL")
# URL base del sitio en desarrollo. Cambiada a localhost para que coincida con los
# redirect_uri que Google y GitHub esperan (evita el error redirect_uri_mismatch).
SITE_URL = os.getenv("SITE_URL", "http://localhost:8000")


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

# GITHUB SETTINGS
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
LOGIN_REDIRECT_URL = "/blog/"

JD_AVATAR_URL = f"{SITE_URL}/static/images/jd-imagen.jpg"

# --- AÑADIR ESTA LÍNEA AL FINAL ---
SITE_ID = 1

# --- CONFIGURACIÓN DJANGO ALLAUTH (PARA GOOGLE/GITHUB) ---
AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]

# Custom adapter to handle email conflicts during social login
# The adapter resides in the ``jdsite`` package (backend/jdsite/adapter.py).
# Use the module path ``jdsite.adapter.CustomSocialAccountAdapter``.
SOCIALACCOUNT_ADAPTER = "jdsite.adapter.CustomSocialAccountAdapter"

LOGOUT_REDIRECT_URL = "/blog/"

# ----------------------------------------------------------------------
# AUTHENTICATION SETTINGS FOR DEVELOPMENT
# ----------------------------------------------------------------------
# En desarrollo Django Allauth asume HTTPS por defecto, lo que genera
# redirect_uris como `https://localhost:8000/...`.  Los proveedores OAuth
# (Google y GitHub) están configurados para aceptar solo HTTP en entorno
# local, por lo que debemos forzar el uso de HTTP para evitar el error
# `redirect_uri_mismatch`.
ACCOUNT_DEFAULT_HTTP_PROTOCOL = "http"

# Forzar que la vista de login social no redirija automáticamente en GET.
# Con `SOCIALACCOUNT_LOGIN_ON_GET = False` se mostrará una página de
# confirmación (similar a la de Google) antes de redirigir a GitHub.
SOCIALACCOUNT_LOGIN_ON_GET = False

# Permitir logout vía GET (evita conflictos con JS de comentarios)
ACCOUNT_LOGOUT_ON_GET = True

# --- CONFIGURACIÓN DE SEGURIDAD Y UNICIDAD DE CUENTAS ---
# Evitar que se registren usuarios con el mismo correo
# Incluir el campo de email en el formulario de registro pero hacerlo opcional.
# Con `ACCOUNT_EMAIL_REQUIRED = False` el email no es obligatorio y Allauth lo
# almacenará si el proveedor (GitHub) lo proporciona.
# Hacer que el email sea opcional: lo quitamos del formulario de registro.
# Incluir el campo email en el formulario de registro para que Allauth pueda
# crear la cuenta cuando el email es obligatorio y enlazar cuentas de distintos
# proveedores que compartan el mismo correo.
# Excluir el campo email del formulario de registro; Allauth obtendrá el email
# del proveedor social y lo almacenará automáticamente.
# No requerir que el email sea obligatorio para el registro ni para el login
# social. Esto permite que, si el email ya existe en el sistema, Allauth lo
# conecte automáticamente a la cuenta existente sin mostrar el formulario.
ACCOUNT_EMAIL_REQUIRED = False
# Allow users to log in using their email address instead of username.
ACCOUNT_AUTHENTICATION_METHOD = "email"
# Include the email, first name and last name fields in the signup form (optional). The asterisk indicates the field
# is required by the form UI, but we keep ACCOUNT_EMAIL_REQUIRED=False so the user can submit without providing an email.
ACCOUNT_SIGNUP_FIELDS = [
    "email",
    "first_name",
    "last_name",
    "username*",
    "password1*",
    "password2*",
]
ACCOUNT_UNIQUE_EMAIL = True
SOCIALACCOUNT_EMAIL_REQUIRED = False
ACCOUNT_EMAIL_VERIFICATION = "none"
SOCIALACCOUNT_EMAIL_VERIFICATION = "none"

# Configuración Social (Google/GitHub)
# Intentar autocompletar el registro si el correo ya existe.
# No requerimos que el email esté presente ni verificado para iniciar sesión
# con una cuenta social, lo que permite que el flujo de GitHub sea directo.
SOCIALACCOUNT_AUTO_SIGNUP = True
SOCIALACCOUNT_EMAIL_REQUIRED = False
# Si un usuario inicia sesión con Google y el correo ya existe en el sistema,
# conecta la cuenta social a ese usuario existente.
SOCIALACCOUNT_CONNECTION_EXISTS_ACTION = "connect"

# Guardar el email obtenido del proveedor aunque el formulario de registro no lo solicite.
SOCIALACCOUNT_STORE_EMAIL = True

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
        },
        # Solicitar permiso para obtener el email del usuario en GitHub
        "SCOPE": ["read:user", "user:email"],
        "AUTH_PARAMS": {"allow_signup": "true"},
    },
}

# Si el proveedor no devuelve el email directamente, Allauth intentará
# consultarlo mediante una petición adicional. Esto permite que el email
# se guarde en el modelo User aunque la respuesta inicial no lo incluya.
SOCIALACCOUNT_QUERY_EMAIL = True

# =================================================
# CONFIGURACIÓN ÚNICA PARA CV - CAMBIAR SOLO AQUÍ
# =================================================
CV_FILENAME = "CV_Jaime_Diaz.pdf"
CV_DOWNLOAD_NAME = "Jaime_Diaz_CV.pdf"
# =================================================

# =================================================
# LOGGING PARA DEBUGGING CSRF EN PRODUCCIÓN
# =================================================
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {name} {message}",
            "style": "{",
        },
        "simple": {
            "format": "[{levelname}] {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
    },
    "loggers": {
        "django.security.csrf": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": True,
        },
        "django.request": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": True,
        },
        "core.middleware": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": True,
        },
        "core.views": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": True,
        },
    },
}

# Handlers de errores personalizados
HANDLER404 = "404"
HANDLER500 = "500"
