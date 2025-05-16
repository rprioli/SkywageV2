from rest_framework import serializers
from django.contrib.auth.models import User
from core.models import Profile
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom token serializer that includes user profile information in the token
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Try to get the user's profile
        try:
            profile = Profile.objects.get(email=user.email)
            # Add profile data to the token
            token['airline'] = profile.airline
            token['position'] = profile.position
            token['profile_id'] = str(profile.id)
        except Profile.DoesNotExist:
            # If profile doesn't exist, don't add profile data
            pass
            
        return token
