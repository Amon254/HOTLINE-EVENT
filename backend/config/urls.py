from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/venues/', include('venues.urls')),
    path('api/spaces/', include('spaces.urls')),
    path('api/reservations/', include('reservations.urls')),
    path('api/reviews/', include('reviews.urls')),
    path('api/messaging/', include('messaging.urls')),
    path('api/subscriptions/', include('subscriptions.urls')),
    path('api/admin-panel/', include('accounts.admin_urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)