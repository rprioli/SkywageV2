from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Profile, Flight, MonthlyCalculation, UserSettings
from .serializers import (
    ProfileSerializer, FlightSerializer,
    MonthlyCalculationSerializer, UserSettingsSerializer
)

class ProfileViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user profiles
    """
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own profile
        user_email = self.request.user.email
        return Profile.objects.filter(email=user_email)


class FlightViewSet(viewsets.ModelViewSet):
    """
    API endpoint for flights
    """
    serializer_class = FlightSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own flights
        try:
            profile = Profile.objects.get(email=self.request.user.email)
            return Flight.objects.filter(user=profile)
        except Profile.DoesNotExist:
            return Flight.objects.none()


class MonthlyCalculationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for monthly calculations
    """
    serializer_class = MonthlyCalculationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own monthly calculations
        try:
            profile = Profile.objects.get(email=self.request.user.email)
            return MonthlyCalculation.objects.filter(user=profile)
        except Profile.DoesNotExist:
            return MonthlyCalculation.objects.none()


class UserSettingsViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user settings
    """
    serializer_class = UserSettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own settings
        try:
            profile = Profile.objects.get(email=self.request.user.email)
            return UserSettings.objects.filter(user=profile)
        except Profile.DoesNotExist:
            return UserSettings.objects.none()
