from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Reservation
from .serializers import ReservationSerializer

class ReservationViewSet(viewsets.ModelViewSet):
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'manager':
            return Reservation.objects.filter(venue__manager=user)
        return Reservation.objects.filter(client=user)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        reservation = self.get_object()
        new_status = request.data.get('status')
        if reservation.venue.manager != request.user:
            return Response({'error': 'Non autorisé'}, status=403)
        if new_status not in ['confirmed', 'cancelled', 'completed']:
            return Response({'error': 'Statut invalide'}, status=400)
        reservation.status = new_status
        reservation.manager_note = request.data.get('manager_note', '')
        reservation.save()
        return Response(ReservationSerializer(reservation).data)
