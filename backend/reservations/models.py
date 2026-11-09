from django.db import models
from accounts.models import User
from venues.models import Venue

class Reservation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('confirmed', 'Confirmée'),
        ('cancelled', 'Annulée'),
        ('completed', 'Terminée'),
    ]
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='reservations')
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reservations')
    event_date = models.DateField()
    event_end_date = models.DateField(null=True, blank=True)
    event_type = models.CharField(max_length=50)
    guests_count = models.PositiveIntegerField()
    message = models.TextField(blank=True)
    total_price = models.DecimalField(max_digits=12, decimal_places=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    manager_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.venue.name} - {self.client.get_full_name()} ({self.event_date})"

    class Meta:
        ordering = ['-created_at']
