from datetime import date, timedelta

try:
    import holidays
except ImportError:
    holidays = None


def calculate_work_hours(start_date: date) -> int:
    """
    Calcula horas laborales desde start_date hasta hoy.
    Reglas:
    1. Lunes a Viernes (sin fines de semana).
    2. Excluye festivos de Colombia (si la librería holidays está instalada).
    3. Jornada de 8 horas.
    4. Resta 20 días de vacaciones por cada año completo trabajado.
    """
    end_date = date.today()
    # 1. Obtener festivos de Colombia para el rango de años
    co_holidays = set()
    if holidays:
        years = range(start_date.year, end_date.year + 1)
        # 'CO' es el código para Colombia
        co_holidays = holidays.country_holidays("CO", years=years)

    # 2. Contar días hábiles (Lunes-Viernes y no festivos)
    business_days = 0
    current_date = start_date

    while current_date <= end_date:
        # weekday(): 0=Lunes, 4=Viernes, 5=Sábado, 6=Domingo
        if current_date.weekday() < 5:
            if current_date not in co_holidays:
                business_days += 1
        current_date += timedelta(days=1)

    # 3. Calcular deducción por vacaciones (20 días por año)
    # Calculamos años transcurridos aproximados
    total_days_diff = (end_date - start_date).days
    years_worked = total_days_diff / 365.25
    vacation_days_to_deduct = int(years_worked * 20)

    # 4. Días efectivos de trabajo
    effective_days = business_days - vacation_days_to_deduct

    if effective_days < 0:
        effective_days = 0

    # 5. Retornar horas totales (8 horas diarias)
    return int(effective_days * 8)
