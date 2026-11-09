from django.db import models
from accounts.models import User

class VenueCategory(models.Model):
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, default='building')
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Venue Categories"

class Venue(models.Model):
    STATUS_CHOICES = [
        ('active', 'Actif'),
        ('pending', 'En attente'),
        ('inactive', 'Inactif'),
    ]
    EVENT_TYPES = [
        ('mariage', 'Mariage'),
        ('corporate', 'Événement d\'entreprise'),
        ('anniversaire', 'Anniversaire'),
        ('conference', 'Conférence'),
        ('concert', 'Concert'),
        ('exposition', 'Exposition'),
        ('cocktail', 'Cocktail'),
        ('autre', 'Autre'),
    ]

    # Owner
    manager = models.ForeignKey(User, on_delete=models.CASCADE, related_name='venues')
    
    # Basic info
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    category = models.ForeignKey(VenueCategory, on_delete=models.SET_NULL, null=True, related_name='venues')
    description = models.TextField()
    short_description = models.CharField(max_length=300, blank=True)
    
    # Location (Côte d'Ivoire focus)
    address = models.CharField(max_length=300)
    city = models.CharField(max_length=100, default='Abidjan')
    district = models.CharField(max_length=100, blank=True, help_text="Commune / Quartier")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Capacity & Pricing
    capacity_min = models.PositiveIntegerField(default=1)
    capacity_max = models.PositiveIntegerField()
    price_per_day = models.DecimalField(max_digits=12, decimal_places=0, help_text="Prix en FCFA")
    price_per_hour = models.DecimalField(max_digits=10, decimal_places=0, null=True, blank=True, help_text="Prix horaire en FCFA")
    
    # Event types accepted
    event_types = models.JSONField(default=list, blank=True)
    
    # Amenities
    has_parking = models.BooleanField(default=False)
    has_wifi = models.BooleanField(default=False)
    has_catering = models.BooleanField(default=False)
    has_sound_system = models.BooleanField(default=False)
    has_projector = models.BooleanField(default=False)
    has_ac = models.BooleanField(default=False)
    has_generator = models.BooleanField(default=False)
    has_security = models.BooleanField(default=False)
    amenities_other = models.TextField(blank=True)
    
    # Media
    cover_image = models.ImageField(upload_to='venues/covers/', null=True, blank=True)
    
    # Meta
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_featured = models.BooleanField(default=False)
    views_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def average_rating(self):
        reviews = self.reviews.all()
        if reviews.exists():
            return round(sum(r.rating for r in reviews) / reviews.count(), 1)
        return None

    @property
    def reviews_count(self):
        return self.reviews.count()

class VenueImage(models.Model):
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='venues/gallery/')
    caption = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

class VenueAvailability(models.Model):
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='blocked_dates')
    date = models.DateField()
    reason = models.CharField(max_length=200, blank=True)

    class Meta:
        unique_together = ['venue', 'date']
