"""
Test script to verify the Django setup.
"""
import os
import django

# Print Python and Django versions
print(f"Python version: {'.'.join(map(str, os.sys.version_info[:3]))}")
print(f"Django version: {django.__version__}")

# Print installed apps
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skywage.settings')
django.setup()

from django.conf import settings
print("\nInstalled apps:")
for app in settings.INSTALLED_APPS:
    print(f"- {app}")

# Print database configuration
print("\nDatabase configuration:")
for key, value in settings.DATABASES['default'].items():
    if key != 'PASSWORD':  # Don't print the password
        print(f"- {key}: {value}")

print("\nSetup test completed successfully!")
