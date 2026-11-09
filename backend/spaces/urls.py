from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SpaceViewSet

router = DefaultRouter()
router.register(r'', SpaceViewSet, basename='space')

urlpatterns = [path('', include(router.urls))]