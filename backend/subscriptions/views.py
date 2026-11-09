from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Plan, Subscription, Payment
from .serializers import PlanSerializer, SubscriptionSerializer, PaymentSerializer


class PlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Plan.objects.all().order_by('price_monthly')
    serializer_class = PlanSerializer
    permission_classes = [permissions.AllowAny]


class SubscriptionViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Current user's subscription status."""
        try:
            sub = request.user.subscription
        except Subscription.DoesNotExist:
            # Auto-create free plan subscription
            free_plan, _ = Plan.objects.get_or_create(
                slug='free',
                defaults={'name': 'Gratuit', 'price_monthly': 0, 'max_venues': 1, 'max_photos': 5}
            )
            sub = Subscription.objects.create(user=request.user, plan=free_plan)

        # Auto-expire if needed
        if sub.expires_at and timezone.now() > sub.expires_at and sub.status == 'active':
            sub.status = 'expired'
            sub.save()

        return Response(SubscriptionSerializer(sub).data)


class PaymentViewSet(viewsets.GenericViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user).order_by('-created_at')

    def list(self, request):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    def create(self, request):
        """Submit a payment declaration."""
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        payment = serializer.save()

        # Mark subscription as pending until admin confirms
        sub = payment.subscription
        if sub.plan.slug != 'pro':
            pro_plan = Plan.objects.get(slug='pro')
            sub.plan = pro_plan
            sub.status = 'pending'
            sub.save()

        return Response(serializer.data, status=201)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def confirm(self, request, pk=None):
        """Admin confirms a payment."""
        try:
            payment = Payment.objects.get(pk=pk)
        except Payment.DoesNotExist:
            return Response({'error': 'Paiement introuvable'}, status=404)
        payment.confirm()
        return Response({'status': 'confirmed', 'message': 'Abonnement activé'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        """Admin rejects a payment."""
        try:
            payment = Payment.objects.get(pk=pk)
        except Payment.DoesNotExist:
            return Response({'error': 'Paiement introuvable'}, status=404)
        payment.status = 'rejected'
        payment.admin_note = request.data.get('reason', '')
        payment.save()
        # Revert to free if no other confirmed payments
        sub = payment.subscription
        if not sub.payments.filter(status='confirmed').exists():
            free_plan = Plan.objects.get(slug='free')
            sub.plan = free_plan
            sub.status = 'active'
            sub.expires_at = None
            sub.save()
        return Response({'status': 'rejected'})