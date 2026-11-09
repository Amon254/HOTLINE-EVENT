import django_filters
from .models import Venue

class VenueFilter(django_filters.FilterSet):
    city = django_filters.CharFilter(lookup_expr='icontains')
    district = django_filters.CharFilter(lookup_expr='icontains')
    capacity_min = django_filters.NumberFilter(field_name='capacity_max', lookup_expr='gte')
    price_max = django_filters.NumberFilter(field_name='price_per_day', lookup_expr='lte')
    price_min = django_filters.NumberFilter(field_name='price_per_day', lookup_expr='gte')
    has_parking = django_filters.BooleanFilter()
    has_wifi = django_filters.BooleanFilter()
    has_catering = django_filters.BooleanFilter()
    has_ac = django_filters.BooleanFilter()
    has_generator = django_filters.BooleanFilter()
    has_sound_system = django_filters.BooleanFilter()
    category = django_filters.CharFilter(field_name='category__slug')
    is_featured = django_filters.BooleanFilter()

    class Meta:
        model = Venue
        fields = ['city', 'district', 'capacity_min', 'price_max', 'price_min',
                  'has_parking', 'has_wifi', 'has_catering', 'has_ac',
                  'has_generator', 'has_sound_system', 'category', 'is_featured']
