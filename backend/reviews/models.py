from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from accounts.models import User
from venues.models import Venue

class Review(models.Model):
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='reviews')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=200, blank=True)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['venue', 'author']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.venue.name} - {self.author.username} ({self.rating}/5)"
