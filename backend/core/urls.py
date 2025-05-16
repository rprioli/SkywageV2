from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'core'

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'profiles', views.ProfileViewSet, basename='profile')
router.register(r'flights', views.FlightViewSet, basename='flight')
router.register(r'monthly-calculations', views.MonthlyCalculationViewSet, basename='monthly-calculation')
router.register(r'user-settings', views.UserSettingsViewSet, basename='user-setting')

# The API URLs are now determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
]
