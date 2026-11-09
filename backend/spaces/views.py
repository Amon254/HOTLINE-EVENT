from django.db.models import Q
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import VenueSpace, VenueSpaceImage
from .serializers import SpaceSerializer, SpaceImageSerializer, can_manage

MAX_IMAGES_PER_SPACE = 10


class IsSpaceManagerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return can_manage(request.user, obj.venue)


class SpaceViewSet(viewsets.ModelViewSet):
    serializer_class = SpaceSerializer
    pagination_class = None          # liste simple, sans pagination
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsSpaceManagerOrReadOnly]

    def get_queryset(self):
        qs = VenueSpace.objects.select_related('venue').prefetch_related('images')
        user = self.request.user
        public = Q(venue__status='active', is_active=True)
        if user.is_authenticated:
            if user.is_staff or user.is_superuser or getattr(user, 'role', '') == 'admin':
                pass
            else:
                qs = qs.filter(public | Q(venue__manager=user))
        else:
            qs = qs.filter(public)
        venue = self.request.query_params.get('venue')
        slug = self.request.query_params.get('venue_slug')
        if venue:
            qs = qs.filter(venue_id=venue)
        if slug:
            qs = qs.filter(venue__slug=slug)
        return qs

    def perform_create(self, serializer):
        venue = serializer.validated_data['venue']
        if 'order' not in serializer.validated_data:
            serializer.save(order=venue.spaces.count())
        else:
            serializer.save()

    @action(detail=True, methods=['post'], url_path='upload_image')
    def upload_image(self, request, pk=None):
        space = self.get_object()
        if not can_manage(request.user, space.venue):
            return Response({'error': 'Non autorisé'}, status=403)
        image = request.FILES.get('image')
        if not image:
            return Response({'error': 'Image requise'}, status=400)
        count = VenueSpaceImage.objects.filter(space=space).count()
        if count >= MAX_IMAGES_PER_SPACE:
            return Response({'error': f'Maximum {MAX_IMAGES_PER_SPACE} photos par espace'}, status=400)
        primary = request.data.get('is_primary') in ('true', 'True', '1', True) or count == 0
        if primary:
            VenueSpaceImage.objects.filter(space=space).update(is_primary=False)
        img = VenueSpaceImage.objects.create(
            space=space, image=image, caption=request.data.get('caption', ''),
            is_primary=primary, order=count)
        return Response(SpaceImageSerializer(img, context={'request': request}).data, status=201)

    @action(detail=True, methods=['delete'], url_path=r'images/(?P<image_id>[0-9]+)')
    def delete_image(self, request, pk=None, image_id=None):
        space = self.get_object()
        if not can_manage(request.user, space.venue):
            return Response({'error': 'Non autorisé'}, status=403)
        qs = VenueSpaceImage.objects.filter(space=space)
        deleted, _ = qs.filter(pk=image_id).delete()
        if not deleted:
            return Response({'error': 'Photo introuvable'}, status=404)
        if not qs.filter(is_primary=True).exists():
            first = qs.first()
            if first:
                first.is_primary = True
                first.save(update_fields=['is_primary'])
        return Response(status=204)