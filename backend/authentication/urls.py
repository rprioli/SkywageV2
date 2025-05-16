from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

app_name = 'authentication'

urlpatterns = [
    # Custom token endpoints
    path('token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # User registration and profile endpoints
    path('register/', views.register_user, name='register'),
    path('profile/', views.get_user_profile, name='profile'),
]
