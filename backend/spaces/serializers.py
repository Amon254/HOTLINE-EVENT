from rest_framework import serializers
from venues.models import Venue
from .models import VenueSpace, VenueSpaceImage, SPACE_AMENITY_KEYS


def can_manage(user, venue):
    return bool(user and user.is_authenticated and (
        venue.manager_id == user.id or user.is_staff or user.is_superuser
        or getattr(user, 'role', '') == 'admin'))


class SpaceImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = VenueSpaceImage
        fields = ['id', 'image', 'caption', 'is_primary', 'order']


class SpaceSerializer(serializers.ModelSerializer):
    images = SpaceImageSerializer(many=True, read_only=True)
    cover_image = serializers.SerializerMethodField()
    venue = serializers.PrimaryKeyRelatedField(queryset=Venue.objects.all())
    kind_label = serializers.CharField(source='get_kind_display', read_only=True)

    class Meta:
        model = VenueSpace
        fields = [
            'id', 'venue', 'name', 'kind', 'kind_label', 'description',
            'capacity_min', 'capacity_max', 'area_m2',
            'price_per_day', 'price_per_hour', 'amenities',
            'is_active', 'order', 'images', 'cover_image', 'created_at',
        ]
        read_only_fields = ['created_at']

    def get_cover_image(self, obj):
        imgs = list(obj.images.all())
        if not imgs:
            return None
        img = next((i for i in imgs if i.is_primary), imgs[0])
        request = self.context.get('request')
        url = img.image.url
        return request.build_absolute_uri(url) if request else url

    def validate_amenities(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError('Liste attendue.')
        bad = [v for v in value if v not in SPACE_AMENITY_KEYS]
        if bad:
            raise serializers.ValidationError(f'Équipements inconnus : {", ".join(map(str, bad))}')
        return value

    def validate_venue(self, venue):
        request = self.context.get('request')
        if not can_manage(getattr(request, 'user', None), venue):
            raise serializers.ValidationError("Vous n'êtes pas le gestionnaire de ce lieu.")
        return venue

    def validate(self, attrs):
        cmin = attrs.get('capacity_min', getattr(self.instance, 'capacity_min', 1))
        cmax = attrs.get('capacity_max', getattr(self.instance, 'capacity_max', None))
        if cmax is not None and cmin is not None and cmin > cmax:
            raise serializers.ValidationError({'capacity_max': 'La capacité maximale doit être supérieure à la minimale.'})
        price = attrs.get('price_per_day', getattr(self.instance, 'price_per_day', None))
        if price is not None and price <= 0:
            raise serializers.ValidationError({'price_per_day': 'Le prix doit être supérieur à 0.'})
        return attrs