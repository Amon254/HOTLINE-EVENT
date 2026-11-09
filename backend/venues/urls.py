from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VenueViewSet, VenueCategoryViewSet

router = DefaultRouter()
router.register(r'', VenueViewSet, basename='venue')
router.register(r'categories/list', VenueCategoryViewSet, basename='category')

urlpatterns = [
    path('', include(router.urls)),
]
