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
]
