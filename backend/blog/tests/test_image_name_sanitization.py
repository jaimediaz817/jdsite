import pytest  # type: ignore

# Importamos la función que hemos creado para sanitizar nombres de archivo
from blog.utils.importer.filename_utils import sanitizar_nombre


@pytest.mark.parametrize(
    "original, esperado",
    [
        ("mi foto.png", "mi_foto.png"),
        ("  espacio al inicio.jpg", "espacio_al_inicio.jpg"),
        (
            "Nombre-Con-Guiones y espacios.jpeg",
            "nombre-con-guiones_y_espacios.jpeg",
        ),
        ("CARACTERES#Especiales!.svg", "caracteresespeciales.svg"),
        ("Mixed CASE 123.PNG", "mixed_case_123.png"),
    ],
)
def test_sanitizar_nombre(original, esperado):
    """Verifica que la función elimina espacios y caracteres no permitidos.

    La salida siempre debe estar en minúsculas y sin caracteres especiales.
    """
    assert sanitizar_nombre(original) == esperado
