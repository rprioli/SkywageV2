from django.db import models
from django.contrib.auth.models import User
from core.models import Profile

# The authentication app will use the Profile model from the core app
# and the built-in Django User model for authentication.
# No additional models are needed at this time.
