# Skywage V2

Skywage is a salary calculator tailored for airline cabin crew and pilots. It processes flight rosters to break down salaries by fixed and variable components, giving clear insights into monthly earnings.

## Project Overview

- **Audience**: CCMs, SCCMs, and pilots
- **Platform**: Desktop-first, mobile later
- **Supported Airline**: Flydubai (expandable)

## Architecture

- **Frontend**: HTML5, CSS3, React.js, Next.js, Shadcn
- **Backend**: Django (Python), JWT auth
- **Database**: Supabase
- **Auth**: Supabase

## Getting Started

### Frontend

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Backend

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows
venv\Scripts\activate
# Unix/MacOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
# Create a .env file in the backend directory (see .env.example)

# Run migrations
python manage.py migrate

# Start the development server
python manage.py runserver
```

The API will be available at [http://localhost:8000/api/](http://localhost:8000/api/).

## Features

- User account management with airline and position
- Flight data handling and processing
- Salary calculation with fixed and variable components
- Monthly earnings breakdown and visualization
