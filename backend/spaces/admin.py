from django.contrib import admin
from .models import VenueSpace, VenueSpaceImage


class SpaceImageInline(admin.TabularInline):
    model = VenueSpaceImage
    extra = 0


@admin.register(VenueSpace)
class VenueSpaceAdmin(admin.ModelAdmin):
    list_display = ('name', 'venue', 'kind', 'capacity_max', 'price_per_day', 'is_active')
    list_filter = ('kind', 'is_active')
    search_fields = ('name', 'venue__name')
    inlines = [SpaceImageInline]