from rest_framework import serializers
from .models import Venue, VenueCategory, VenueImage, VenueAvailability
from accounts.serializers import UserSerializer

class VenueCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = VenueCategory
        fields = '__all__'

class VenueImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = VenueImage
        fields = ['id', 'image', 'caption', 'is_primary', 'order']

class VenueListSerializer(serializers.ModelSerializer):
    average_rating = serializers.ReadOnlyField()
    reviews_count = serializers.ReadOnlyField()
    category = VenueCategorySerializer(read_only=True)

    class Meta:
        model = Venue
        fields = [
            'id', 'name', 'slug', 'short_description', 'category',
            'city', 'district', 'address',
            'latitude', 'longitude',
            'capacity_min', 'capacity_max',
            'price_per_day', 'price_per_hour',
            'cover_image', 'event_types',
            'has_parking', 'has_wifi', 'has_catering', 'has_ac', 'has_generator',
            'has_sound_system', 'has_projector', 'has_security',
            'is_featured', 'views_count',
            'average_rating', 'reviews_count',
            'created_at',
        ]

class VenueDetailSerializer(serializers.ModelSerializer):
    average_rating = serializers.ReadOnlyField()
    reviews_count = serializers.ReadOnlyField()
    category = VenueCategorySerializer(read_only=True)
    images = VenueImageSerializer(many=True, read_only=True)
    manager = UserSerializer(read_only=True)

    class Meta:
        model = Venue
        fields = '__all__'

class VenueWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venue
        exclude = ['manager', 'status', 'views_count', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['manager'] = self.context['request'].user
        return super().create(validated_data)