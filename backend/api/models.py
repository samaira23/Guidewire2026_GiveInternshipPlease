from django.db import models
from django.contrib.auth.models import User
import random


class Worker(models.Model):
    ROLE_CHOICES = [('worker', 'Worker'), ('admin', 'Admin')]
    RISK_CHOICES = [('Low', 'Low'), ('Medium', 'Medium'), ('High', 'High')]

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='worker', null=True, blank=True
    )
    phone = models.CharField(max_length=15, unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='worker')

    # Profile
    name = models.CharField(max_length=100, default='Raj Kumar')
    occupation = models.CharField(max_length=100, default='Delivery Partner')
    zone = models.CharField(max_length=100, default='Chennai - Medium Risk')

    # Stats
    safety_score = models.IntegerField(default=82)
    risk_level = models.CharField(max_length=10, choices=RISK_CHOICES, default='Medium')
    earnings_protected = models.DecimalField(max_digits=10, decimal_places=2, default=3240.00)
    confidence_score = models.IntegerField(default=87)
    ai_insight = models.TextField(
        default=(
            'Based on recent weather patterns, there is a 68% probability '
            'of work disruption this week. Premium adjusted accordingly.'
        )
    )

    # OTP (stored temporarily; clear after use in production)
    otp = models.CharField(max_length=6, blank=True)

    def generate_otp(self):
        self.otp = str(random.randint(1000, 9999))
        self.save(update_fields=['otp'])
        return self.otp

    def __str__(self):
        return f"{self.phone} ({self.role})"


class Policy(models.Model):
    worker = models.OneToOneField(Worker, on_delete=models.CASCADE, related_name='policy')
    name = models.CharField(max_length=100, default='WorkerShield Gold')
    policy_id = models.CharField(max_length=50, default='SN-9920-X')
    coverage_amount = models.DecimalField(max_digits=12, decimal_places=2, default=500000)
    daily_premium = models.DecimalField(max_digits=8, decimal_places=2, default=14)

    def __str__(self):
        return f"{self.name} ({self.policy_id})"


class Claim(models.Model):
    STATUS_CHOICES = [
        ('Submitted', 'Submitted'),
        ('Processing', 'Processing'),
        ('Approved', 'Approved'),
        ('Paid', 'Paid'),
        ('Disputed', 'Disputed'),
        ('Rejected', 'Rejected'),
    ]

    worker = models.ForeignKey(Worker, on_delete=models.CASCADE, related_name='claims')
    reason = models.CharField(max_length=200, default='Rain Disruption')
    duration_hours = models.IntegerField(default=3)
    payout_amount = models.DecimalField(max_digits=8, decimal_places=2, default=120)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Submitted')
    
    dispute_reason = models.TextField(blank=True, null=True)
    admin_response = models.TextField(blank=True, null=True)
    checkout_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Claim #{self.id} — {self.reason} ({self.status})"


class AlertMessage(models.Model):
    TYPE_CHOICES = [
        ('weather', 'Weather'),
        ('traffic', 'Traffic'),
        ('work', 'Work'),
        ('system', 'System'),
    ]
    message = models.CharField(max_length=300)
    alert_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='system')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.message


class ActivityEvent(models.Model):
    worker = models.ForeignKey(
        Worker, on_delete=models.CASCADE, related_name='activities',
        null=True, blank=True
    )
    description = models.CharField(max_length=300)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.description


class PremiumHistory(models.Model):
    worker = models.ForeignKey(Worker, on_delete=models.CASCADE, related_name='premium_history')
    month = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"{self.month}: ₹{self.amount}"


class RiskZone(models.Model):
    RISK_CHOICES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High')]
    name = models.CharField(max_length=50)
    risk = models.CharField(max_length=10, choices=RISK_CHOICES)

    def __str__(self):
        return f"{self.name} ({self.risk})"
