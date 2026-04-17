from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/send-otp/', views.send_otp, name='send_otp'),
    path('auth/verify-otp/', views.verify_otp, name='verify_otp'),

    # Worker
    path('worker/dashboard/', views.worker_dashboard, name='worker_dashboard'),
    path('worker/alerts/', views.worker_alerts, name='worker_alerts'),

    # Claims
    path('claims/', views.claims_list, name='claims_list'),
    path('claims/<int:pk>/', views.claim_detail, name='claim_detail'),

    # Premium
    path('premium/', views.premium_view, name='premium'),
    path('premium/calculate/', views.calculate_premium, name='calculate_premium'),

    # Admin
    path('admin/dashboard/', views.admin_dashboard, name='admin_dashboard'),
    path('admin/disputes/', views.admin_disputes, name='admin_disputes'),
    path('admin/disputes/<int:pk>/resolve/', views.admin_resolve_dispute, name='admin_resolve_dispute'),

    # Spoof-detection
    path('crosscheck/', views.api_crosscheck, name='api_crosscheck'),
    path('air-quality/', views.api_air_quality, name='api_air_quality'),
    path('weather/', views.api_weather, name='api_weather'),
    path('', views.spoof_index, name='spoof_index'),
]
