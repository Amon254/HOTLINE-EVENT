import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User
from venues.models import Venue, VenueCategory

# Categories
cats = [
    ('Salle de fête', 'party-popper', 'salle-de-fete'),
    ('Hôtel & Resort', 'hotel', 'hotel-resort'),
    ('Rooftop & Terrasse', 'sunset', 'rooftop-terrasse'),
    ('Espace Conférence', 'presentation', 'espace-conference'),
    ('Jardin & Plein air', 'tree', 'jardin-plein-air'),
    ('Restaurant & Lounge', 'utensils', 'restaurant-lounge'),
]
for name, icon, slug in cats:
    VenueCategory.objects.get_or_create(slug=slug, defaults={'name': name, 'icon': icon})

# Admin user
admin, _ = User.objects.get_or_create(username='admin', defaults={
    'email': 'admin@eventhotline.ci', 'role': 'admin', 'is_staff': True, 'is_superuser': True,
    'first_name': 'Admin', 'last_name': 'EventHotline', 'city': 'Abidjan'
})
admin.set_password('admin123')
admin.save()

# Manager
manager, _ = User.objects.get_or_create(username='manager1', defaults={
    'email': 'manager@eventhotline.ci', 'role': 'manager',
    'first_name': 'Kouassi', 'last_name': 'Amenan', 'city': 'Abidjan',
    'phone': '+225 07 12 34 56 78'
})
manager.set_password('manager123')
manager.save()

cat_fete = VenueCategory.objects.get(slug='salle-de-fete')
cat_hotel = VenueCategory.objects.get(slug='hotel-resort')
cat_roof = VenueCategory.objects.get(slug='rooftop-terrasse')
cat_conf = VenueCategory.objects.get(slug='espace-conference')
cat_jardin = VenueCategory.objects.get(slug='jardin-plein-air')
cat_resto = VenueCategory.objects.get(slug='restaurant-lounge')

venues_data = [
    {
        'name': 'Palais des Congrès de Cocody', 'slug': 'palais-congres-cocody',
        'category': cat_conf, 'city': 'Abidjan', 'district': 'Cocody',
        'address': 'Boulevard de France, Cocody, Abidjan',
        'description': 'Grand espace de conférence au cœur de Cocody, équipé des dernières technologies audiovisuelles. Idéal pour séminaires, conférences internationales et événements d\'entreprise.',
        'short_description': 'Grand espace conférence high-tech au cœur de Cocody',
        'capacity_min': 50, 'capacity_max': 800,
        'price_per_day': 500000, 'price_per_hour': 80000,
        'event_types': ['conference', 'corporate', 'exposition'],
        'has_parking': True, 'has_wifi': True, 'has_projector': True,
        'has_sound_system': True, 'has_ac': True, 'has_generator': True, 'has_security': True,
        'is_featured': True, 'status': 'active',
    },
    {
        'name': 'Espace Émeraude Plateau', 'slug': 'espace-emeraude-plateau',
        'category': cat_fete, 'city': 'Abidjan', 'district': 'Plateau',
        'address': 'Avenue Terrasson de Fougères, Plateau, Abidjan',
        'description': 'Salle de fête luxueuse au Plateau, parfaite pour mariages et anniversaires. Décoration raffinée, service traiteur inclus sur demande.',
        'short_description': 'Salle luxueuse pour mariages & anniversaires au Plateau',
        'capacity_min': 100, 'capacity_max': 500,
        'price_per_day': 750000, 'price_per_hour': 120000,
        'event_types': ['mariage', 'anniversaire', 'cocktail'],
        'has_parking': True, 'has_wifi': True, 'has_catering': True,
        'has_sound_system': True, 'has_ac': True, 'has_generator': True,
        'is_featured': True, 'status': 'active',
    },
    {
        'name': 'Rooftop La Vue Marcory', 'slug': 'rooftop-la-vue-marcory',
        'category': cat_roof, 'city': 'Abidjan', 'district': 'Marcory',
        'address': 'Zone 4, Marcory, Abidjan',
        'description': 'Rooftop panoramique avec vue sur la lagune. Ambiance unique pour cocktails, soirées d\'entreprise et célébrations en plein air avec coucher de soleil.',
        'short_description': 'Rooftop avec vue lagune, parfait pour soirées & cocktails',
        'capacity_min': 30, 'capacity_max': 200,
        'price_per_day': 400000, 'price_per_hour': 70000,
        'event_types': ['cocktail', 'anniversaire', 'corporate'],
        'has_parking': False, 'has_wifi': True, 'has_catering': True,
        'has_sound_system': True, 'has_ac': False, 'has_generator': True,
        'is_featured': True, 'status': 'active',
    },
    {
        'name': 'Villa Jardin Riviera Golf', 'slug': 'villa-jardin-riviera-golf',
        'category': cat_jardin, 'city': 'Abidjan', 'district': 'Riviera',
        'address': 'Riviera Golf, Cocody, Abidjan',
        'description': 'Magnifique jardin privatif dans la Riviera pour vos événements en plein air. Espace verdoyant, piscine, et logement disponible.',
        'short_description': 'Jardin privatif avec piscine à la Riviera',
        'capacity_min': 20, 'capacity_max': 300,
        'price_per_day': 600000,
        'event_types': ['mariage', 'anniversaire', 'cocktail', 'corporate'],
        'has_parking': True, 'has_wifi': True, 'has_catering': True,
        'has_generator': True, 'has_security': True,
        'is_featured': False, 'status': 'active',
    },
    {
        'name': 'Salle Ivoire Yopougon', 'slug': 'salle-ivoire-yopougon',
        'category': cat_fete, 'city': 'Abidjan', 'district': 'Yopougon',
        'address': 'Yopougon Attié, Abidjan',
        'description': 'Grande salle de fête accessible à Yopougon, idéale pour baptêmes, mariages et fêtes communautaires. Espace spacieux et bien aéré.',
        'short_description': 'Grande salle accessible pour fêtes & cérémonies à Yopougon',
        'capacity_min': 50, 'capacity_max': 600,
        'price_per_day': 200000, 'price_per_hour': 35000,
        'event_types': ['mariage', 'anniversaire', 'autre'],
        'has_parking': True, 'has_wifi': False, 'has_catering': False,
        'has_sound_system': True, 'has_ac': True, 'has_generator': True,
        'is_featured': False, 'status': 'active',
    },
    {
        'name': 'Le Loft Bingerville', 'slug': 'le-loft-bingerville',
        'category': cat_resto, 'city': 'Abidjan', 'district': 'Bingerville',
        'address': 'Route de Bingerville, Abidjan',
        'description': 'Espace lounge moderne en bordure de lagune à Bingerville. Cadre naturel exceptionnel pour des événements intimistes ou des séminaires résidentiels.',
        'short_description': 'Lounge en bord de lagune à Bingerville',
        'capacity_min': 15, 'capacity_max': 120,
        'price_per_day': 350000, 'price_per_hour': 60000,
        'event_types': ['cocktail', 'corporate', 'conference'],
        'has_parking': True, 'has_wifi': True, 'has_catering': True,
        'has_ac': True, 'has_generator': True,
        'is_featured': False, 'status': 'active',
    },
    {
        'name': 'Grand Hôtel Sofitel Abidjan', 'slug': 'sofitel-abidjan',
        'category': cat_hotel, 'city': 'Abidjan', 'district': 'Plateau',
        'address': 'Avenue du Général de Gaulle, Plateau, Abidjan',
        'description': 'Hôtel 5 étoiles avec salles d\'événements de prestige. Service haut de gamme, restauration gastronomique et vue panoramique sur la lagune Ébrié.',
        'short_description': 'Hôtel 5★ avec salles de prestige vue lagune',
        'capacity_min': 10, 'capacity_max': 1000,
        'price_per_day': 1500000, 'price_per_hour': 200000,
        'event_types': ['mariage', 'corporate', 'conference', 'cocktail', 'exposition'],
        'has_parking': True, 'has_wifi': True, 'has_catering': True,
        'has_sound_system': True, 'has_projector': True, 'has_ac': True,
        'has_generator': True, 'has_security': True,
        'is_featured': True, 'status': 'active',
    },
    {
        'name': 'Espace Culturel de Treichville', 'slug': 'espace-culturel-treichville',
        'category': cat_fete, 'city': 'Abidjan', 'district': 'Treichville',
        'address': 'Avenue 13, Treichville, Abidjan',
        'description': 'Salle polyvalente au cœur de Treichville, alliant modernité et authenticité ivoirienne. Parfaite pour concerts, expositions et événements culturels.',
        'short_description': 'Espace polyvalent pour concerts & événements culturels',
        'capacity_min': 100, 'capacity_max': 400,
        'price_per_day': 300000, 'price_per_hour': 50000,
        'event_types': ['concert', 'exposition', 'anniversaire', 'autre'],
        'has_parking': False, 'has_wifi': True, 'has_sound_system': True,
        'has_ac': True, 'has_generator': True,
        'is_featured': False, 'status': 'active',
    },
]

for v in venues_data:
    if not Venue.objects.filter(slug=v['slug']).exists():
        Venue.objects.create(manager=manager, **v)

print(f"✅ {Venue.objects.count()} lieux créés")
print(f"✅ {VenueCategory.objects.count()} catégories créées")
print(f"✅ Utilisateurs: admin/admin123 et manager1/manager123")

# Update coordinates for existing venues
coords = {
    'palais-congres-cocody':       (5.3698, -3.9738),
    'espace-emeraude-plateau':     (5.3203, -4.0163),
    'rooftop-la-vue-marcory':      (5.2999, -3.9995),
    'villa-jardin-riviera-golf':   (5.3812, -3.9601),
    'salle-ivoire-yopougon':       (5.3467, -4.0780),
    'le-loft-bingerville':         (5.3550, -3.8830),
    'sofitel-abidjan':             (5.3224, -4.0196),
    'espace-culturel-treichville': (5.3000, -4.0100),
}
for slug, (lat, lng) in coords.items():
    Venue.objects.filter(slug=slug).update(latitude=lat, longitude=lng)
print("✅ Coordonnées GPS mises à jour")