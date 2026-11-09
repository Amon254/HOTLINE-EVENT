from rest_framework import serializers
from .models import Review
from accounts.serializers import UserSerializer

class ReviewSerializer(serializers.ModelSerializer):
    author_detail = UserSerializer(source='author', read_only=True)

    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ['author', 'created_at']

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)
