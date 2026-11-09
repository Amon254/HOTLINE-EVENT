"""Admin API views — accessible uniquement aux is_staff/is_superuser."""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta

from accounts.models import User
from venues.models import Venue, VenueCategory
from reservations.models import Reservation
from reviews.models import Review
from subscriptions.models import Subscription, Payment, Plan
from messaging.models import Conversation, Message


class IsAdminStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_staff or request.user.role == 'admin')


class AdminStatsView(APIView):
    permission_classes = [IsAdminStaff]

    def get(self, request):
        now = timezone.now()
        month_ago = now - timedelta(days=30)
        week_ago  = now - timedelta(days=7)

        # Users
        total_users    = User.objects.count()
        new_users_week = User.objects.filter(date_joined__gte=week_ago).count()
        managers       = User.objects.filter(role='manager').count()
        clients        = User.objects.filter(role='client').count()

        # Venues
        total_venues   = Venue.objects.count()
        active_venues  = Venue.objects.filter(status='active').count()
        pending_venues = Venue.objects.filter(status='pending').count()

        # Reservations
        total_res      = Reservation.objects.count()
        pending_res    = Reservation.objects.filter(status='pending').count()
        confirmed_res  = Reservation.objects.filter(status='confirmed').count()
        revenue        = Reservation.objects.filter(status='confirmed').aggregate(t=Sum('total_price'))['t'] or 0

        # Subscriptions
        pro_subs    = Subscription.objects.filter(plan__slug='pro', status='active').count()
        pending_pay = Payment.objects.filter(status='pending').count()
        mrr         = pro_subs * 10000

        # Messages
        total_conv  = Conversation.objects.count()
        total_msgs  = Message.objects.count()
        new_msgs    = Message.objects.filter(created_at__gte=week_ago).count()

        # Monthly growth (users)
        prev_month  = now - timedelta(days=60)
        users_this  = User.objects.filter(date_joined__gte=month_ago).count()
        users_prev  = User.objects.filter(date_joined__gte=prev_month, date_joined__lt=month_ago).count()
        growth      = round(((users_this - users_prev) / max(users_prev, 1)) * 100, 1)

        return Response({
            'users':         { 'total': total_users, 'new_week': new_users_week, 'managers': managers, 'clients': clients, 'growth': growth },
            'venues':        { 'total': total_venues, 'active': active_venues, 'pending': pending_venues },
            'reservations':  { 'total': total_res, 'pending': pending_res, 'confirmed': confirmed_res, 'revenue': int(revenue) },
            'subscriptions': { 'pro_active': pro_subs, 'pending_payments': pending_pay, 'mrr': mrr },
            'messaging':     { 'conversations': total_conv, 'messages': total_msgs, 'new_week': new_msgs },
        })


class AdminUsersView(APIView):
    permission_classes = [IsAdminStaff]

    def get(self, request):
        qs = User.objects.annotate(
            venues_count=Count('venues', distinct=True),
            reservations_count=Count('reservations', distinct=True),
        ).order_by('-date_joined')

        role   = request.query_params.get('role')
        search = request.query_params.get('search')
        if role:   qs = qs.filter(role=role)
        if search: qs = qs.filter(Q(username__icontains=search)|Q(email__icontains=search)|Q(first_name__icontains=search)|Q(last_name__icontains=search))

        data = []
        for u in qs[:100]:
            sub = getattr(u, 'subscription', None)
            data.append({
                'id': u.id, 'username': u.username, 'email': u.email,
                'first_name': u.first_name, 'last_name': u.last_name,
                'role': u.role, 'city': u.city, 'phone': u.phone,
                'is_active': u.is_active, 'date_joined': u.date_joined,
                'venues_count': u.venues_count,
                'reservations_count': u.reservations_count,
                'subscription': {
                    'plan': sub.plan.name if sub else 'Gratuit',
                    'status': sub.status if sub else '—',
                    'is_active': sub.is_active if sub else False,
                    'expires_at': sub.expires_at if sub else None,
                } if sub else {'plan': 'Gratuit', 'status': 'free', 'is_active': True, 'expires_at': None},
            })
        return Response(data)

    def post(self, request, user_id=None, action=None):
        """POST users/ -> créer ; POST users/<id>/<action>/ -> password | grant_pro | revoke_pro"""
        if user_id is None:
            d = request.data
            username, password = (d.get('username') or '').strip(), d.get('password') or ''
            if not username or len(password) < 6:
                return Response({'error': 'Identifiant et mot de passe (6 caractères min.) requis'}, status=400)
            if User.objects.filter(username__iexact=username).exists():
                return Response({'error': 'Identifiant déjà utilisé'}, status=400)
            role = d.get('role', 'client')
            if role not in ('client', 'manager', 'admin'):
                return Response({'error': 'Rôle invalide'}, status=400)
            u = User(username=username, email=d.get('email', ''), first_name=d.get('first_name', ''),
                     last_name=d.get('last_name', ''), phone=d.get('phone', ''), city=d.get('city', ''), role=role)
            u.is_staff = role == 'admin'
            u.set_password(password)
            u.save()
            return Response({'success': True, 'id': u.id}, status=201)
        try:
            u = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable'}, status=404)
        if action == 'password':
            pw = request.data.get('password') or ''
            if len(pw) < 6:
                return Response({'error': 'Mot de passe trop court (6 min.)'}, status=400)
            u.set_password(pw); u.save()
            return Response({'success': True})
        if action == 'grant_pro':
            try:
                months = max(1, min(int(request.data.get('months', 1)), 36))
            except (TypeError, ValueError):
                return Response({'error': 'Durée invalide'}, status=400)
            pro = Plan.objects.get(slug='pro')
            sub, _ = Subscription.objects.get_or_create(user=u, defaults={'plan': pro})
            sub.plan = pro
            sub.extend(months=months)
            return Response({'success': True})
        if action == 'revoke_pro':
            sub = getattr(u, 'subscription', None)
            if sub:
                sub.plan = Plan.objects.get(slug='free'); sub.status = 'active'; sub.expires_at = None; sub.save()
            return Response({'success': True})
        return Response({'error': 'Action inconnue'}, status=400)

    def patch(self, request, user_id):
        try:
            u = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable'}, status=404)
        d = request.data
        if u.pk == request.user.pk and (d.get('is_active') is False or ('role' in d and d['role'] != 'admin')):
            return Response({'error': 'Vous ne pouvez pas vous suspendre ni changer votre propre rôle'}, status=400)
        if 'role' in d:
            if d['role'] not in ('client', 'manager', 'admin'):
                return Response({'error': 'Rôle invalide'}, status=400)
            u.role = d['role']
            u.is_staff = d['role'] == 'admin' or u.is_superuser
        for f in ['is_active', 'first_name', 'last_name', 'email', 'phone', 'city']:
            if f in d:
                setattr(u, f, d[f])
        u.save()
        return Response({'success': True})

    def delete(self, request, user_id):
        if user_id == request.user.pk:
            return Response({'error': 'Vous ne pouvez pas supprimer votre propre compte'}, status=400)
        deleted, _ = User.objects.filter(pk=user_id).delete()
        return Response({'success': bool(deleted)}, status=200 if deleted else 404)


class AdminVenuesView(APIView):
    permission_classes = [IsAdminStaff]

    def get(self, request):
        qs = Venue.objects.select_related('manager', 'category').annotate(
            res_count=Count('reservations', distinct=True),
            rev_count=Count('reviews', distinct=True),
        ).order_by('-created_at')

        status = request.query_params.get('status')
        search = request.query_params.get('search')
        if status: qs = qs.filter(status=status)
        if search: qs = qs.filter(Q(name__icontains=search)|Q(city__icontains=search)|Q(district__icontains=search))

        data = [{
            'id': v.id, 'name': v.name, 'slug': v.slug,
            'status': v.status, 'is_featured': v.is_featured,
            'city': v.city, 'district': v.district,
            'price_per_day': int(v.price_per_day),
            'capacity_max': v.capacity_max,
            'views_count': v.views_count,
            'res_count': v.res_count,
            'rev_count': v.rev_count,
            'average_rating': v.average_rating,
            'category': v.category.name if v.category else '—',
            'manager': f"{v.manager.first_name} {v.manager.last_name}".strip() or v.manager.username,
            'manager_id': v.manager_id,
            'created_at': v.created_at,
        } for v in qs[:200]]
        return Response(data)

    def patch(self, request, venue_id):
        try:
            v = Venue.objects.get(pk=venue_id)
        except Venue.DoesNotExist:
            return Response({'error': 'Lieu introuvable'}, status=404)
        d = request.data
        for field in ['status', 'is_featured', 'name', 'city', 'district', 'address', 'description',
                      'short_description', 'price_per_day', 'price_per_hour', 'capacity_min', 'capacity_max']:
            if field in d:
                setattr(v, field, d[field] if d[field] != '' or field in ('name', 'city', 'district', 'address', 'description', 'short_description') else None)
        if 'category' in d:
            v.category = VenueCategory.objects.filter(pk=d['category']).first()
        if 'manager_id' in d:
            m = User.objects.filter(pk=d['manager_id']).first()
            if m:
                v.manager = m
        v.save()
        return Response({'success': True})

    def delete(self, request, venue_id):
        deleted, _ = Venue.objects.filter(pk=venue_id).delete()
        return Response({'success': bool(deleted)}, status=200 if deleted else 404)


class AdminPaymentsView(APIView):
    permission_classes = [IsAdminStaff]

    def get(self, request):
        qs = Payment.objects.select_related('user', 'subscription__plan').order_by('-created_at')
        status = request.query_params.get('status')
        if status: qs = qs.filter(status=status)

        data = [{
            'id': p.id,
            'user': f"{p.user.first_name} {p.user.last_name}".strip() or p.user.username,
            'user_email': p.user.email, 'user_phone': p.user.phone,
            'amount': int(p.amount), 'method': p.method,
            'method_label': p.get_method_display(),
            'months': p.months,
            'transaction_id': p.transaction_id,
            'sender_phone': p.sender_phone,
            'screenshot': p.screenshot.url if p.screenshot else None,
            'status': p.status,
            'status_label': p.get_status_display(),
            'created_at': p.created_at,
            'confirmed_at': p.confirmed_at,
            'admin_note': p.admin_note,
        } for p in qs[:200]]
        return Response(data)

    def post(self, request, payment_id, action):
        try:
            p = Payment.objects.get(pk=payment_id)
        except Payment.DoesNotExist:
            return Response({'error': 'Paiement introuvable'}, status=404)

        if action == 'confirm':
            p.confirm()
            return Response({'success': True, 'message': f"Abonnement activé pour {p.user.username}"})
        elif action == 'reject':
            p.status = 'rejected'
            p.admin_note = request.data.get('reason', '')
            p.save()
            sub = p.subscription
            if not sub.payments.filter(status='confirmed').exists():
                free = Plan.objects.get(slug='free')
                sub.plan = free; sub.status = 'active'; sub.expires_at = None; sub.save()
            return Response({'success': True})
        return Response({'error': 'Action inconnue'}, status=400)


    def delete(self, request, payment_id, action=None):
        deleted, _ = Payment.objects.filter(pk=payment_id).delete()
        return Response({'success': bool(deleted)}, status=200 if deleted else 404)


class AdminReservationsView(APIView):
    permission_classes = [IsAdminStaff]

    def get(self, request):
        qs = Reservation.objects.select_related('venue', 'client').order_by('-created_at')
        status = request.query_params.get('status')
        if status: qs = qs.filter(status=status)

        data = [{
            'id': r.id,
            'venue': r.venue.name, 'venue_slug': r.venue.slug,
            'client': f"{r.client.first_name} {r.client.last_name}".strip() or r.client.username,
            'client_email': r.client.email,
            'event_date': r.event_date, 'event_type': r.event_type,
            'guests_count': r.guests_count,
            'total_price': int(r.total_price),
            'status': r.status, 'created_at': r.created_at,
        } for r in qs[:200]]
        return Response(data)


    def patch(self, request, res_id):
        try:
            r = Reservation.objects.get(pk=res_id)
        except Reservation.DoesNotExist:
            return Response({'error': 'Réservation introuvable'}, status=404)
        st = request.data.get('status')
        if st not in ('pending', 'confirmed', 'cancelled', 'completed'):
            return Response({'error': 'Statut invalide'}, status=400)
        r.status = st
        if 'manager_note' in request.data:
            r.manager_note = request.data['manager_note']
        r.save()
        return Response({'success': True})

    def delete(self, request, res_id):
        deleted, _ = Reservation.objects.filter(pk=res_id).delete()
        return Response({'success': bool(deleted)}, status=200 if deleted else 404)


class AdminReviewsView(APIView):
    permission_classes = [IsAdminStaff]

    def get(self, request):
        qs = Review.objects.select_related('venue', 'author').order_by('-created_at')[:300]
        return Response([{
            'id': r.id, 'venue': r.venue.name, 'venue_slug': r.venue.slug,
            'author': r.author.get_full_name() or r.author.username,
            'rating': r.rating, 'title': r.title, 'comment': r.comment, 'created_at': r.created_at,
        } for r in qs])

    def delete(self, request, review_id):
        deleted, _ = Review.objects.filter(pk=review_id).delete()
        return Response({'success': bool(deleted)}, status=200 if deleted else 404)


class AdminCategoriesView(APIView):
    permission_classes = [IsAdminStaff]

    def get(self, request):
        return Response([{'id': c.id, 'name': c.name, 'icon': c.icon, 'slug': c.slug,
                          'venues_count': c.venues.count()} for c in VenueCategory.objects.all().order_by('name')])

    def post(self, request):
        from django.utils.text import slugify
        name = (request.data.get('name') or '').strip()
        if not name:
            return Response({'error': 'Nom requis'}, status=400)
        slug = slugify(name) or 'categorie'
        base, i = slug, 2
        while VenueCategory.objects.filter(slug=slug).exists():
            slug = f'{base}-{i}'; i += 1
        c = VenueCategory.objects.create(name=name, icon=request.data.get('icon') or 'building', slug=slug)
        return Response({'success': True, 'id': c.id}, status=201)

    def patch(self, request, cat_id):
        c = VenueCategory.objects.filter(pk=cat_id).first()
        if not c:
            return Response({'error': 'Catégorie introuvable'}, status=404)
        for f in ('name', 'icon'):
            if request.data.get(f):
                setattr(c, f, request.data[f])
        c.save()
        return Response({'success': True})

    def delete(self, request, cat_id):
        deleted, _ = VenueCategory.objects.filter(pk=cat_id).delete()
        return Response({'success': bool(deleted)}, status=200 if deleted else 404)


class AdminPlansView(APIView):
    permission_classes = [IsAdminStaff]
    FIELDS = ['name', 'price_monthly', 'max_venues', 'max_photos', 'max_videos',
              'has_analytics', 'has_priority_listing', 'has_messaging', 'description']

    def get(self, request):
        return Response([{**{f: getattr(p, f) for f in self.FIELDS}, 'id': p.id, 'slug': p.slug,
                          'price_monthly': int(p.price_monthly),
                          'subscribers': p.subscriptions.count()} for p in Plan.objects.all()])

    def patch(self, request, plan_id):
        p = Plan.objects.filter(pk=plan_id).first()
        if not p:
            return Response({'error': 'Plan introuvable'}, status=404)
        for f in self.FIELDS:
            if f in request.data:
                setattr(p, f, request.data[f])
        p.save()
        return Response({'success': True})


class AdminChartsView(APIView):
    permission_classes = [IsAdminStaff]

    def get(self, request):
        from django.db.models.functions import TruncMonth, TruncWeek
        from django.db.models import Count, Sum
        from datetime import timedelta

        now = timezone.now()

        # ── Inscriptions par mois (12 derniers mois)
        users_by_month = (
            User.objects
            .filter(date_joined__gte=now - timedelta(days=365))
            .annotate(month=TruncMonth('date_joined'))
            .values('month')
            .annotate(total=Count('id'), managers=Count('id', filter=Q(role='manager')), clients=Count('id', filter=Q(role='client')))
            .order_by('month')
        )

        # ── Abonnements Pro par mois
        subs_by_month = (
            Subscription.objects
            .filter(started_at__gte=now - timedelta(days=365), plan__slug='pro')
            .annotate(month=TruncMonth('started_at'))
            .values('month')
            .annotate(total=Count('id'))
            .order_by('month')
        )

        # ── Revenus paiements confirmés par mois
        revenue_by_month = (
            Payment.objects
            .filter(status='confirmed', created_at__gte=now - timedelta(days=365))
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(total=Sum('amount'), count=Count('id'))
            .order_by('month')
        )

        # ── Réservations par mois
        res_by_month = (
            Reservation.objects
            .filter(created_at__gte=now - timedelta(days=365))
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(total=Count('id'), confirmed=Count('id', filter=Q(status='confirmed')))
            .order_by('month')
        )

        # ── Lieux par catégorie
        venues_by_cat = (
            Venue.objects.filter(status='active')
            .values('category__name')
            .annotate(total=Count('id'))
            .order_by('-total')
        )

        # ── Répartition méthodes de paiement
        payments_by_method = (
            Payment.objects.filter(status='confirmed')
            .values('method')
            .annotate(total=Count('id'), amount=Sum('amount'))
            .order_by('-total')
        )

        # ── Top lieux par vues
        top_venues = (
            Venue.objects.filter(status='active')
            .order_by('-views_count')[:10]
            .values('name', 'views_count', 'city', 'district')
        )

        # ── Répartition utilisateurs par rôle
        users_by_role = (
            User.objects.values('role')
            .annotate(total=Count('id'))
        )

        # ── Réservations par type d'événement
        res_by_type = (
            Reservation.objects.values('event_type')
            .annotate(total=Count('id'))
            .order_by('-total')[:8]
        )

        # ── MRR sur 12 mois (abonnés pro actifs par mois)
        mrr_by_month = []
        for i in range(11, -1, -1):
            month_start = (now.replace(day=1) - timedelta(days=i*30)).replace(day=1)
            month_end = (month_start + timedelta(days=32)).replace(day=1)
            active = Subscription.objects.filter(
                plan__slug='pro', status='active',
                started_at__lt=month_end,
            ).filter(Q(expires_at__gte=month_start) | Q(expires_at__isnull=True)).count()
            mrr_by_month.append({
                'month': month_start.strftime('%Y-%m'),
                'label': month_start.strftime('%b %Y'),
                'mrr': active * 10000,
                'subscribers': active,
            })

        def fmt_month(m):
            import calendar
            MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
            return MONTHS_FR[m.month - 1] + ' ' + str(m.year)

        return Response({
            'users_by_month': [{'month': fmt_month(x['month']), 'total': x['total'], 'managers': x['managers'], 'clients': x['clients']} for x in users_by_month],
            'subs_by_month':  [{'month': fmt_month(x['month']), 'total': x['total']} for x in subs_by_month],
            'revenue_by_month': [{'month': fmt_month(x['month']), 'total': int(x['total']), 'count': x['count']} for x in revenue_by_month],
            'res_by_month':   [{'month': fmt_month(x['month']), 'total': x['total'], 'confirmed': x['confirmed']} for x in res_by_month],
            'venues_by_cat':  [{'name': x['category__name'] or 'Sans catégorie', 'total': x['total']} for x in venues_by_cat],
            'payments_by_method': [{'method': x['method'], 'total': x['total'], 'amount': int(x['amount'])} for x in payments_by_method],
            'top_venues':     list(top_venues),
            'users_by_role':  [{'role': x['role'], 'total': x['total']} for x in users_by_role],
            'res_by_type':    [{'type': x['event_type'], 'total': x['total']} for x in res_by_type],
            'mrr_by_month':   mrr_by_month,
        })