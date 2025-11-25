from django import forms


class InquiryForm(forms.Form):
    name = forms.CharField(
        max_length=120,
        required=True,
        widget=forms.TextInput(
            attrs={"class": "form-control", "placeholder": "Tu nombre"}
        ),
    )
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(
            attrs={"class": "form-control", "placeholder": "Tu email"}
        ),
    )
    company = forms.CharField(
        max_length=120,
        required=False,
        widget=forms.TextInput(
            attrs={"class": "form-control", "placeholder": "Empresa (Opcional)"}
        ),
    )

    # --- NUEVOS CAMPOS ---
    phone = forms.CharField(max_length=40, required=False)
    meeting_date = forms.DateField(required=False)  # Formato esperado: YYYY-MM-DD
    meeting_time = forms.TimeField(required=False)  # Formato esperado: HH:MM
    # ---------------------

    message = forms.CharField(
        required=True,
        widget=forms.Textarea(
            attrs={
                "class": "form-control",
                "rows": 4,
                "placeholder": "¿En qué puedo ayudarte?",
            }
        ),
    )


class ResponseForm(forms.Form):
    response_message = forms.CharField(
        required=True,
        widget=forms.Textarea(attrs={"class": "form-control", "rows": 5}),
        label="Escribe tu respuesta",
    )
