from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Venue, VenueCategory, VenueImage
from .serializers import (VenueListSerializer, VenueDetailSerializer,
                           VenueWriteSerializer, VenueCategorySerializer, VenueImageSerializer)
from .filters import VenueFilter

class IsManagerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.manager == request.user

class VenueViewSet(viewsets.ModelViewSet):
    queryset = Venue.objects.filter(status='active').select_related('category', 'manager').prefetch_related('images', 'reviews')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = VenueFilter
    search_fields = ['name', 'description', 'city', 'district', 'address']
    ordering_fields = ['price_per_day', 'capacity_max', 'views_count', 'created_at']
    ordering = ['-is_featured', '-created_at']
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.action == 'list':
            return VenueListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return VenueWriteSerializer
        return VenueDetailSerializer

    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsManagerOrReadOnly()]
        return [permissions.AllowAny()]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        qs = self.queryset.filter(is_featured=True)[:6]
        serializer = VenueListSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_venues(self, request):
        qs = Venue.objects.filter(manager=request.user)
        serializer = VenueListSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def upload_image(self, request, slug=None):
        venue = self.get_object()
        if venue.manager != request.user:
            return Response({'error': 'Non autorisé'}, status=403)
        image = request.FILES.get('image')
        if not image:
            return Response({'error': 'Image requise'}, status=400)
        vi = VenueImage.objects.create(venue=venue, image=image, caption=request.data.get('caption',''))
        return Response(VenueImageSerializer(vi).data, status=201)

class VenueCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = VenueCategory.objects.all()
    serializer_class = VenueCategorySerializer
    permission_classes = [permissions.AllowAny]