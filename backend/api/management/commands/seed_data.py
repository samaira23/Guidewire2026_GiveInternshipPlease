from django.core.management.base import BaseCommand
from api.models import AlertMessage, RiskZone, ActivityEvent


class Command(BaseCommand):
    help = 'Seed the database with initial global data (alerts, risk zones, admin activity feed)'

    def handle(self, *args, **options):
        # ── Alert Messages ────────────────────────────────────────────────────
        AlertMessage.objects.all().delete()
        alert_data = [
            ('🌧️ Rain detected in your area', 'weather'),
            ('🚧 Worksite paused due to flooding', 'work'),
            ('🚗 Traffic disruption nearby', 'traffic'),
        ]
        for message, alert_type in alert_data:
            AlertMessage.objects.create(message=message, alert_type=alert_type)
        self.stdout.write('  ✔ Alert messages seeded')

        # ── Risk Zones ────────────────────────────────────────────────────────
        RiskZone.objects.all().delete()
        zone_data = [
            ('Zone 1', 'low'),
            ('Zone 2', 'medium'),
            ('Zone 3', 'high'),
        ]
        for name, risk in zone_data:
            RiskZone.objects.create(name=name, risk=risk)
        self.stdout.write('  ✔ Risk zones seeded')

        # ── Admin Activity Feed (worker=None means global/admin) ──────────────
        ActivityEvent.objects.filter(worker__isnull=True).delete()
        feed_data = [
            '✔ Claim approved for ₹120',
            '✔ Premium recalculated for Zone 3',
            '✔ Rain alert triggered system-wide',
            '✔ Worker safety score updated',
        ]
        for desc in feed_data:
            ActivityEvent.objects.create(description=desc, worker=None)
        self.stdout.write('  ✔ Admin activity feed seeded')

        self.stdout.write(self.style.SUCCESS('\n🌱 Database seeded successfully!'))
