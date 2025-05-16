from rest_framework import serializers
from .models import Profile, Flight, MonthlyCalculation, UserSettings

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['id', 'email', 'airline', 'position', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class FlightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flight
        fields = [
            'id', 'user', 'date', 'flight_number', 'sector', 
            'reporting_time', 'debriefing_time', 'hours', 'pay',
            'is_outbound', 'is_turnaround', 'is_layover', 'is_asby',
            'month', 'year', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MonthlyCalculationSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlyCalculation
        fields = [
            'id', 'user', 'month', 'year', 'total_flight_hours',
            'flight_pay', 'basic_salary', 'housing_allowance',
            'transportation_allowance', 'total_salary',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = ['id', 'user', 'settings', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
