"""
Ajouter à seed_data.py ou exécuter séparément :
  cd backend && python seed_plans.py
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from subscriptions.models import Plan

Plan.objects.get_or_create(slug='free', defaults={
    'name': 'Gratuit',
    'price_monthly': 0,
    'max_venues': 1,
    'max_photos': 5,
    'max_videos': 0,
    'has_analytics': False,
    'has_priority_listing': False,
    'has_messaging': True,
    'description': 'Pour le grand public, toujours gratuit.',
})

Plan.objects.get_or_create(slug='pro', defaults={
    'name': 'Pro Gestionnaire',
    'price_monthly': 10000,
    'max_venues': 999,
    'max_photos': 20,
    'max_videos': 5,
    'has_analytics': True,
    'has_priority_listing': True,
    'has_messaging': True,
    'description': 'Pour les gestionnaires d\'espaces événementiels professionnels.',
})

print("✅ Plans créés : Gratuit + Pro Gestionnaire (10 000 FCFA/mois)")