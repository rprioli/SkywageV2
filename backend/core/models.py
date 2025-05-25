import uuid
from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    """
    User profile model that extends the built-in Django User model.
    Maps to the 'profiles' table in Supabase.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    airline = models.CharField(max_length=100)
    POSITION_CHOICES = [
        ('CCM', 'Cabin Crew Member'),
        ('SCCM', 'Senior Cabin Crew Member'),
    ]
    position = models.CharField(max_length=4, choices=POSITION_CHOICES)
    nationality = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.email} - {self.airline} ({self.position})"


class Flight(models.Model):
    """
    Flight model to store flight data.
    Maps to the 'flights' table in Supabase.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(Profile, on_delete=models.CASCADE)
    date = models.DateField()
    flight_number = models.CharField(max_length=20)
    sector = models.CharField(max_length=100)
    reporting_time = models.CharField(max_length=10)
    debriefing_time = models.CharField(max_length=10)
    hours = models.FloatField()
    pay = models.FloatField()
    is_outbound = models.BooleanField(default=False)
    is_turnaround = models.BooleanField(default=False)
    is_layover = models.BooleanField(default=False)
    is_asby = models.BooleanField(default=False)
    month = models.IntegerField()
    year = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.flight_number} - {self.date} ({self.sector})"


class MonthlyCalculation(models.Model):
    """
    Monthly calculation model to store salary calculations.
    Maps to the 'monthly_calculations' table in Supabase.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(Profile, on_delete=models.CASCADE)
    month = models.IntegerField()
    year = models.IntegerField()
    total_flight_hours = models.FloatField()
    flight_pay = models.FloatField()
    basic_salary = models.FloatField()
    housing_allowance = models.FloatField()
    transportation_allowance = models.FloatField()
    total_salary = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - {self.month}/{self.year}"


class UserSettings(models.Model):
    """
    User settings model to store user-specific settings.
    Maps to the 'user_settings' table in Supabase.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(Profile, on_delete=models.CASCADE)
    settings = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Settings for {self.user.email}"
