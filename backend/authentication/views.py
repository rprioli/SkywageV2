from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from core.models import Profile
from .serializers import UserSerializer, CustomTokenObtainPairSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom token view that uses our custom token serializer
    """
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """
    Register a new user and create a profile
    """
    # Extract data from request
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    airline = request.data.get('airline')
    position = request.data.get('position')

    # Validate required fields
    if not all([username, email, password, airline, position]):
        return Response(
            {'error': 'Username, email, password, airline, and position are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if username or email already exists
    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Username already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(email=email).exists() or Profile.objects.filter(email=email).exists():
        return Response(
            {'error': 'Email already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create user
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )

    # Create profile
    profile = Profile.objects.create(
        id=user.id,  # Use the same ID as the user
        email=email,
        airline=airline,
        position=position
    )

    # Return success response
    return Response(
        {
            'message': 'User registered successfully',
            'user': UserSerializer(user).data
        },
        status=status.HTTP_201_CREATED
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """
    Get the current user's profile
    """
    try:
        # Get the user's profile
        profile = Profile.objects.get(email=request.user.email)

        # Return the user and profile data
        return Response({
            'user': UserSerializer(request.user).data,
            'profile': {
                'id': profile.id,
                'email': profile.email,
                'airline': profile.airline,
                'position': profile.position,
                'created_at': profile.created_at,
                'updated_at': profile.updated_at
            }
        })
    except Profile.DoesNotExist:
        return Response(
            {'error': 'Profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
