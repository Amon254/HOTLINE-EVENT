from rest_framework import serializers
from .models import Conversation, Message
from accounts.serializers import UserSerializer
from venues.serializers import VenueListSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender_detail = UserSerializer(source='sender', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_detail', 'body', 'is_read', 'created_at']
        read_only_fields = ['sender', 'created_at']

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)


class ConversationSerializer(serializers.ModelSerializer):
    client_detail = UserSerializer(source='client', read_only=True)
    manager_detail = UserSerializer(source='manager', read_only=True)
    venue_detail = VenueListSerializer(source='venue', read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'venue', 'venue_detail',
            'client', 'client_detail',
            'manager', 'manager_detail',
            'last_message', 'unread_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['client', 'manager', 'created_at', 'updated_at']

    def get_last_message(self, obj):
        msg = obj.last_message
        if msg:
            return {
                'body': msg.body,
                'sender_id': msg.sender_id,
                'created_at': msg.created_at,
                'is_read': msg.is_read,
            }
        return None

    def get_unread_count(self, obj):
        user = self.context['request'].user
        if user == obj.client:
            return obj.unread_count_for_client
        if user == obj.manager:
            return obj.unread_count_for_manager
        return 0