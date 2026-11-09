from django.db import models
from accounts.models import User
from django.utils import timezone
from dateutil.relativedelta import relativedelta


class Plan(models.Model):
    PLAN_CHOICES = [
        ('free', 'Gratuit'),
        ('pro', 'Pro Gestionnaire'),
    ]
    name = models.CharField(max_length=50)
    slug = models.CharField(max_length=20, unique=True, choices=PLAN_CHOICES)
    price_monthly = models.DecimalField(max_digits=10, decimal_places=0, default=0)
    max_venues = models.PositiveIntegerField(default=1)
    max_photos = models.PositiveIntegerField(default=5)
    max_videos = models.PositiveIntegerField(default=0)
    has_analytics = models.BooleanField(default=False)
    has_priority_listing = models.BooleanField(default=False)
    has_messaging = models.BooleanField(default=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Subscription(models.Model):
    STATUS_CHOICES = [
        ('active', 'Actif'),
        ('pending', 'En attente de paiement'),
        ('expired', 'Expiré'),
        ('cancelled', 'Annulé'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='subscriptions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    started_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    auto_renew = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} — {self.plan.name} ({self.status})"

    @property
    def is_active(self):
        if self.status != 'active':
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        return True

    @property
    def days_remaining(self):
        if not self.expires_at:
            return None
        delta = self.expires_at - timezone.now()
        return max(0, delta.days)

    def extend(self, months=1):
        """Extend subscription by N months from now or from expiry."""
        base = max(timezone.now(), self.expires_at) if self.expires_at else timezone.now()
        self.expires_at = base + relativedelta(months=months)
        self.status = 'active'
        self.save()


class Payment(models.Model):
    METHOD_CHOICES = [
        ('wave', 'Wave'),
        ('orange_money', 'Orange Money'),
        ('mtn_money', 'MTN Money'),
        ('moov_money', 'Moov Money'),
    ]
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('confirmed', 'Confirmé'),
        ('rejected', 'Rejeté'),
    ]

    RECIPIENT_NUMBER = '+225 07 57 04 13 68'

    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='payments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=0)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    months = models.PositiveIntegerField(default=1)
    transaction_id = models.CharField(max_length=100, blank=True, help_text="ID de transaction fourni par l'utilisateur")
    sender_phone = models.CharField(max_length=20, blank=True, help_text="Numéro ayant effectué le paiement")
    screenshot = models.ImageField(upload_to='payments/screenshots/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} — {self.get_method_display()} {self.amount} FCFA ({self.status})"

    def confirm(self):
        """Admin confirms payment → extend subscription."""
        from django.utils import timezone
        self.status = 'confirmed'
        self.confirmed_at = timezone.now()
        self.save()
        self.subscription.extend(months=self.months)