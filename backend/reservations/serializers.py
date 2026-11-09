from rest_framework import serializers
from .models import Reservation
from venues.serializers import VenueListSerializer
from accounts.serializers import UserSerializer

class ReservationSerializer(serializers.ModelSerializer):
    venue_detail = VenueListSerializer(source='venue', read_only=True)
    client_detail = UserSerializer(source='client', read_only=True)

    class Meta:
        model = Reservation
        fields = '__all__'
        read_only_fields = ['client', 'status', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['client'] = self.context['request'].user
        return super().create(validated_data)
