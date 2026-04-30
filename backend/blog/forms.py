from django import forms
from django.core.validators import MinLengthValidator, MaxLengthValidator


class CommentForm(forms.Form):
    """
    Formulario para comentarios publicos del blog
    """

    name = forms.CharField(
        max_length=80,
        validators=[MinLengthValidator(2), MaxLengthValidator(80)],
        widget=forms.TextInput(
            attrs={"class": "form-control", "placeholder": "Tu nombre"}
        ),
    )

    email = forms.EmailField(
        required=False,
        max_length=150,
        widget=forms.EmailInput(
            attrs={"class": "form-control", "placeholder": "Tu email (opcional)"}
        ),
    )

    identification_level = forms.ChoiceField(
        label="Nivel de identificación",
        choices=[
            ("anonymous", "Anónimo"),
            ("identified", "Identificado por email"),
            ("registered", "Registrado (OAuth)"),
        ],
        initial="anonymous",
        widget=forms.RadioSelect,
        required=True,
    )

    content = forms.CharField(
        validators=[MinLengthValidator(10), MaxLengthValidator(1000)],
        widget=forms.Textarea(
            attrs={
                "class": "form-control",
                "rows": 4,
                "placeholder": "Escribe tu comentario...",
            }
        ),
    )

    parent_id = forms.IntegerField(required=False, widget=forms.HiddenInput())

    # Honeypot anti bots
    website = forms.CharField(
        required=False, widget=forms.TextInput(attrs={"style": "display:none;"})
    )

    def clean_website(self):
        """
        Si el campo honeypot tiene contenido, es un bot
        """
        website = self.cleaned_data.get("website")
        if website:
            raise forms.ValidationError("Error de validación")
        return website

    def clean_content(self):
        content = self.cleaned_data.get("content")
        # Remover saltos de linea multiples
        while "\n\n\n" in content:
            content = content.replace("\n\n\n", "\n\n")
        return content
