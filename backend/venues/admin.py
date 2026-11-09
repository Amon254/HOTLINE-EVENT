from django.contrib import admin
from .models import Venue, VenueCategory, VenueImage, VenueAvailability

@admin.register(VenueCategory)
class VenueCategoryAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('name',)}

class VenueImageInline(admin.TabularInline):
    model = VenueImage
    extra = 1

@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'district', 'capacity_max', 'price_per_day', 'status', 'is_featured']
    list_filter = ['status', 'city', 'is_featured', 'category']
    search_fields = ['name', 'city', 'district']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [VenueImageInline]
    list_editable = ['status', 'is_featured']
