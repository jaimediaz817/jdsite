"""
Tests HU-045: slug opcional en editor de artículos.
"""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")
django.setup()

from pathlib import Path

import pytest

from blog.services import save_blog_to_source
from blog.models import BlogPost


@pytest.mark.django_db
def test_slug_sin_custom_slug_se_genera_desde_titulo(user):
    data = {
        "title": "Mi Articulo de Prueba",
        "description": "Descripcion de prueba",
        "content_md": "Contenido",
        "category": "General",
        "tags": [],
        "tiempo_lectura": 1,
        "files": [],
    }
    result = save_blog_to_source(data, user)
    assert result["slug"].endswith("mi-articulo-de-prueba")


@pytest.mark.django_db
def test_slug_con_custom_slug_se_usar_el_texto(user):
    data = {
        "title": "Mi Articulo de Prueba",
        "description": "Descripcion de prueba",
        "content_md": "Contenido",
        "category": "General",
        "tags": [],
        "tiempo_lectura": 1,
        "files": [],
        "custom_slug": "mi-slug-personalizado",
    }
    result = save_blog_to_source(data, user)
    assert result["slug"].endswith("mi-slug-personalizado")


@pytest.mark.django_db
def test_slug_duplicado_agrega_sufijo(user):
    data = {
        "title": "Mi Articulo de Prueba",
        "description": "Descripcion de prueba",
        "content_md": "Contenido",
        "category": "General",
        "tags": [],
        "tiempo_lectura": 1,
        "files": [],
        "custom_slug": "slug-duplicado",
    }
    save_blog_to_source(data, user)
    result = save_blog_to_source(data, user)
    assert result["slug"].endswith("slug-duplicado-2")


@pytest.mark.django_db
def test_edicion_sin_custom_slug_mantiene_slug(user):
    data = {
        "title": "Mi Articulo de Prueba",
        "description": "Descripcion de prueba",
        "content_md": "Contenido",
        "category": "General",
        "tags": [],
        "tiempo_lectura": 1,
        "files": [],
        "custom_slug": "mi-slug-fijo",
    }
    result = save_blog_to_source(data, user)
    slug = result["slug"]

    data["slug"] = slug
    result2 = save_blog_to_source(data, user)
    assert result2["slug"] == slug


@pytest.mark.django_db
def test_limites_titulo_descripcion_en_template(client):
    from django.urls import reverse

    response = client.get(reverse("blog:blog_editor"))
    content = response.content.decode()
    assert 'id="title"' in content
    assert 'maxlength="150"' in content
    assert 'id="description"' in content
    assert 'maxlength="350"' in content
