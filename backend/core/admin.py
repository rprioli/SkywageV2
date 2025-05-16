from django.contrib import admin
from .models import Profile, Flight, MonthlyCalculation, UserSettings

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('email', 'airline', 'position', 'created_at')
    search_fields = ('email', 'airline')
    list_filter = ('airline', 'position')


@admin.register(Flight)
class FlightAdmin(admin.ModelAdmin):
    list_display = ('flight_number', 'user', 'date', 'sector', 'hours', 'pay')
    search_fields = ('flight_number', 'sector')
    list_filter = ('month', 'year', 'is_outbound', 'is_turnaround', 'is_layover', 'is_asby')
    date_hierarchy = 'date'


@admin.register(MonthlyCalculation)
class MonthlyCalculationAdmin(admin.ModelAdmin):
    list_display = ('user', 'month', 'year', 'total_flight_hours', 'total_salary')
    search_fields = ('user__email',)
    list_filter = ('month', 'year')


@admin.register(UserSettings)
class UserSettingsAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at', 'updated_at')
    search_fields = ('user__email',)
