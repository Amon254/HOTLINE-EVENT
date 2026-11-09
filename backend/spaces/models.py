from django.db import models
from venues.models import Venue

SPACE_AMENITY_KEYS = [
    'climatisation', 'sonorisation', 'videoprojecteur', 'scene', 'piste_danse',
    'cuisine_traiteur', 'vestiaire', 'eclairage', 'acces_pmr', 'groupe_electrogene',
    'wifi', 'parking', 'securite', 'toilettes', 'espace_vip',
]


class VenueSpace(models.Model):
    """Un espace / une salle d'un lieu (ex. Grande salle, Jardin, Rooftop)."""
    KIND_CHOICES = [
        ('salle', 'Salle de réception'),
        ('jardin', 'Jardin'),
        ('terrasse', 'Terrasse / Rooftop'),
        ('conference', 'Salle de conférence'),
        ('vip', 'Salon VIP'),
        ('piscine', 'Espace piscine'),
        ('autre', 'Autre'),
    ]

    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='spaces')
    name = models.CharField(max_length=120)
    kind = models.CharField(max_length=20, choices=KIND_CHOICES, default='salle')
    description = models.TextField(blank=True)
    capacity_min = models.PositiveIntegerField(default=1)
    capacity_max = models.PositiveIntegerField()
    area_m2 = models.PositiveIntegerField(null=True, blank=True, help_text="Surface en m²")
    price_per_day = models.DecimalField(max_digits=12, decimal_places=0, help_text="Prix en FCFA")
    price_per_hour = models.DecimalField(max_digits=10, decimal_places=0, null=True, blank=True)
    amenities = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'id']
        verbose_name = 'Espace'
        verbose_name_plural = 'Espaces'

    def __str__(self):
        return f'{self.name} — {self.venue.name}'


class VenueSpaceImage(models.Model):
    space = models.ForeignKey(VenueSpace, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='venues/spaces/')
    caption = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']