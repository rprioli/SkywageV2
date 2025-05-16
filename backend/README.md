# Skywage Backend

This is the Django backend for the Skywage application, a salary calculator for airline cabin crew and pilots.

## Tech Stack

- Django 5.2.1
- Django REST Framework 3.16.0
- Django REST Framework SimpleJWT 5.5.0
- PostgreSQL (via Supabase)

## Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   - Create a `.env` file in the backend directory
   - Add the required environment variables (see `.env.example`)

5. Run migrations:
   ```
   python manage.py migrate
   ```

6. Create a superuser:
   ```
   python manage.py createsuperuser
   ```

7. Run the development server:
   ```
   python manage.py runserver
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register/`: Register a new user
- `POST /api/auth/token/`: Obtain JWT token
- `POST /api/auth/token/refresh/`: Refresh JWT token
- `POST /api/auth/token/verify/`: Verify JWT token
- `GET /api/auth/profile/`: Get user profile

### Core

- `GET /api/core/profiles/`: List user profiles
- `GET /api/core/profiles/{id}/`: Get a specific profile
- `GET /api/core/flights/`: List flights
- `POST /api/core/flights/`: Create a new flight
- `GET /api/core/flights/{id}/`: Get a specific flight
- `PUT /api/core/flights/{id}/`: Update a flight
- `DELETE /api/core/flights/{id}/`: Delete a flight
- `GET /api/core/monthly-calculations/`: List monthly calculations
- `POST /api/core/monthly-calculations/`: Create a new monthly calculation
- `GET /api/core/monthly-calculations/{id}/`: Get a specific monthly calculation
- `PUT /api/core/monthly-calculations/{id}/`: Update a monthly calculation
- `DELETE /api/core/monthly-calculations/{id}/`: Delete a monthly calculation
- `GET /api/core/user-settings/`: List user settings
- `POST /api/core/user-settings/`: Create user settings
- `GET /api/core/user-settings/{id}/`: Get specific user settings
- `PUT /api/core/user-settings/{id}/`: Update user settings
- `DELETE /api/core/user-settings/{id}/`: Delete user settings

## Database Schema

The backend uses the following models:

- **Profile**: User profile with airline and position
- **Flight**: Flight data including date, flight number, sector, hours, and pay
- **MonthlyCalculation**: Monthly salary calculations
- **UserSettings**: User-specific settings stored as JSON

## Authentication

The backend uses JWT (JSON Web Token) authentication. To access protected endpoints, include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Development

- Run tests: `python manage.py test`
- Check code style: `flake8`
- Generate migrations: `python manage.py makemigrations`
- Apply migrations: `python manage.py migrate`
