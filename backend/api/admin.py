from django.contrib import admin
from .models import Worker, Policy, Claim, AlertMessage, ActivityEvent, PremiumHistory, RiskZone

admin.site.register(Worker)
admin.site.register(Policy)
admin.site.register(Claim)
admin.site.register(AlertMessage)
admin.site.register(ActivityEvent)
admin.site.register(PremiumHistory)
admin.site.register(RiskZone)
