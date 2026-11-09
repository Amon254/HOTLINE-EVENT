from django.db import models
from accounts.models import User
from venues.models import Venue


class Conversation(models.Model):
    """Thread between a client and a venue manager about a specific venue."""
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='conversations')
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations_as_client')
    manager = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations_as_manager')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # One conversation per client/venue pair
        unique_together = ['venue', 'client']
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.venue.name} — {self.client.get_full_name() or self.client.username}"

    @property
    def last_message(self):
        return self.messages.order_by('-created_at').first()

    @property
    def unread_count_for_client(self):
        return self.messages.filter(sender=self.manager, is_read=False).count()

    @property
    def unread_count_for_manager(self):
        return self.messages.filter(sender=self.client, is_read=False).count()


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    body = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username}: {self.body[:50]}"