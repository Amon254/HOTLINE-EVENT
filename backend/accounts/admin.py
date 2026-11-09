from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'city']
    list_filter = ['role', 'city']
    fieldsets = UserAdmin.fieldsets + (
        ('Infos supplémentaires', {'fields': ('role', 'phone', 'city', 'avatar')}),
    )
