from django.urls import path
from .admin_views import (
    AdminStatsView, AdminUsersView, AdminVenuesView, AdminPaymentsView,
    AdminReservationsView, AdminChartsView, AdminReviewsView,
    AdminCategoriesView, AdminPlansView,
)

urlpatterns = [
    path('stats/',                                  AdminStatsView.as_view()),
    path('charts/',                                 AdminChartsView.as_view()),
    path('users/',                                  AdminUsersView.as_view()),
    path('users/<int:user_id>/',                    AdminUsersView.as_view()),
    path('users/<int:user_id>/<str:action>/',       AdminUsersView.as_view()),
    path('venues/',                                 AdminVenuesView.as_view()),
    path('venues/<int:venue_id>/',                  AdminVenuesView.as_view()),
    path('payments/',                               AdminPaymentsView.as_view()),
    path('payments/<int:payment_id>/',              AdminPaymentsView.as_view()),
    path('payments/<int:payment_id>/<str:action>/', AdminPaymentsView.as_view()),
    path('reservations/',                           AdminReservationsView.as_view()),
    path('reservations/<int:res_id>/',              AdminReservationsView.as_view()),
    path('reviews/',                                AdminReviewsView.as_view()),
    path('reviews/<int:review_id>/',                AdminReviewsView.as_view()),
    path('categories/',                             AdminCategoriesView.as_view()),
    path('categories/<int:cat_id>/',                AdminCategoriesView.as_view()),
    path('plans/',                                  AdminPlansView.as_view()),
    path('plans/<int:plan_id>/',                    AdminPlansView.as_view()),
]