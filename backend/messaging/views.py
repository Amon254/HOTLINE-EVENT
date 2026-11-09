from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from venues.models import Venue


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(
            Q(client=user) | Q(manager=user)
        ).select_related('venue', 'client', 'manager').prefetch_related('messages')

    def create(self, request, *args, **kwargs):
        """Start or retrieve a conversation with a venue manager."""
        venue_id = request.data.get('venue')
        if not venue_id:
            return Response({'error': 'venue requis'}, status=400)

        try:
            venue = Venue.objects.get(pk=venue_id)
        except Venue.DoesNotExist:
            return Response({'error': 'Lieu introuvable'}, status=404)

        if request.user == venue.manager:
            return Response({'error': 'Vous ne pouvez pas vous écrire à vous-même'}, status=400)

        # Get or create conversation
        conversation, created = Conversation.objects.get_or_create(
            venue=venue,
            client=request.user,
            defaults={'manager': venue.manager}
        )

        # If first message included, save it
        first_msg = request.data.get('message', '').strip()
        if first_msg and created:
            Message.objects.create(
                conversation=conversation,
                sender=request.user,
                body=first_msg,
            )

        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=201 if created else 200)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get all messages in a conversation, mark incoming as read."""
        conversation = self.get_object()
        user = request.user

        # Mark messages from the other party as read
        conversation.messages.exclude(sender=user).update(is_read=True)

        msgs = conversation.messages.select_related('sender').all()
        serializer = MessageSerializer(msgs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Send a message in a conversation."""
        conversation = self.get_object()
        user = request.user

        # Only client or manager can send
        if user not in [conversation.client, conversation.manager]:
            return Response({'error': 'Non autorisé'}, status=403)

        body = request.data.get('body', '').strip()
        if not body:
            return Response({'error': 'Message vide'}, status=400)

        msg = Message.objects.create(
            conversation=conversation,
            sender=user,
            body=body,
        )
        # Bump updated_at on conversation
        conversation.save(update_fields=['updated_at'])

        serializer = MessageSerializer(msg, context={'request': request})
        return Response(serializer.data, status=201)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Total unread messages across all conversations."""
        user = request.user
        total = 0
        for conv in self.get_queryset():
            if user == conv.client:
                total += conv.unread_count_for_client
            elif user == conv.manager:
                total += conv.unread_count_for_manager
        return Response({'unread': total})