from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token

from .models import Worker, Policy, Claim, AlertMessage, ActivityEvent, PremiumHistory, RiskZone


from django.shortcuts import render
from . import crosscheck_ip
from . import air_quality_check
from . import weather_check

import razorpay
import os

# ── Helpers ────────────────────────────────────────────────────────────────────

def _seed_worker_data(worker):
    """Create all default related data for a brand-new worker."""
    # Policy
    if not hasattr(worker, 'policy'):
        Policy.objects.create(worker=worker)

    # Activity timeline
    if not worker.activities.exists():
        ActivityEvent.objects.bulk_create([
            ActivityEvent(worker=worker, description="Rain detected → risk increased"),
            ActivityEvent(worker=worker, description="Safe week → discount applied"),
            ActivityEvent(worker=worker, description="Policy updated"),
        ])

    # Premium history
    if not worker.premium_history.exists():
        PremiumHistory.objects.bulk_create([
            PremiumHistory(worker=worker, month="Jan", amount=1200),
            PremiumHistory(worker=worker, month="Feb", amount=1100),
            PremiumHistory(worker=worker, month="Mar", amount=1300),
            PremiumHistory(worker=worker, month="Apr", amount=1240),
        ])

    # Past claims (demo)
    if not worker.claims.exists():
        Claim.objects.bulk_create([
            Claim(worker=worker, reason="Rain Disruption",
                  duration_hours=3, payout_amount=120, status="Paid"),
            Claim(worker=worker, reason="Traffic Disruption",
                  duration_hours=2, payout_amount=80, status="Paid"),
        ])


# ── Auth ───────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    phone = request.data.get('phone', '').strip()
    role = request.data.get('role', 'worker')

    if not phone or len(phone) < 10:
        return Response({'error': 'Valid 10-digit phone required'}, status=400)

    worker, _ = Worker.objects.get_or_create(phone=phone)
    worker.role = role
    worker.save(update_fields=['role'])

    otp = worker.generate_otp()
    print(f"\n🔑  OTP for {phone}: {otp}\n")  # Visible in server console for dev

    return Response({
        'success': True,
        'message': 'OTP sent successfully',
        'otp': otp,   # Returned for demo convenience
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    phone = request.data.get('phone', '').strip()
    otp = request.data.get('otp', '').strip()

    try:
        worker = Worker.objects.get(phone=phone)
    except Worker.DoesNotExist:
        return Response({'error': 'Phone not found. Please send OTP first.'}, status=404)

    if worker.otp != otp:
        return Response({'error': 'Invalid OTP'}, status=400)

    # Link to Django User on first verify
    if worker.user is None:
        user, user_created = User.objects.get_or_create(username=phone)
        if user_created:
            user.set_unusable_password()
            user.save()
        worker.user = user
        worker.save(update_fields=['user'])
        _seed_worker_data(worker)
    else:
        user = worker.user

    token, _ = Token.objects.get_or_create(user=user)

    # Clear OTP after successful verification
    worker.otp = ''
    worker.save(update_fields=['otp'])

    return Response({
        'token': token.key,
        'role': worker.role,
        'worker_id': worker.id,
    })


# ── Worker Dashboard ───────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def worker_dashboard(request):
    worker = request.user.worker
    policy = getattr(worker, 'policy', None)
    activities = list(
        worker.activities.order_by('created_at').values_list('description', flat=True)
    )

    return Response({
        'profile': {
            'name': worker.name,
            'occupation': worker.occupation,
            'zone': worker.zone,
        },
        'safety_score': worker.safety_score,
        'risk_level': worker.risk_level,
        'earnings_protected': float(worker.earnings_protected),
        'policy': {
            'name': policy.name if policy else 'SafetyNet Gold',
            'policy_id': policy.policy_id if policy else 'SN-9920-X',
            'coverage_amount': float(policy.coverage_amount) if policy else 500000,
            'daily_premium': float(policy.daily_premium) if policy else 14,
        },
        'weekly_coverage': {
            'weekdays': 'Mon–Fri: Active',
            'weekends': 'Weekend: Limited',
        },
        'activities': activities,
        'ai_insight': worker.ai_insight,
        'explain_ai': {
            'weather': 'Heavy rainfall',
            'location': worker.zone,
            'historical': worker.risk_level,
            'decision': 'Increase premium + trigger claim',
        },
        'confidence_score': worker.confidence_score,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def worker_alerts(request):
    alerts = AlertMessage.objects.order_by('-created_at')[:10]
    return Response([
        {'message': a.message, 'type': a.alert_type}
        for a in alerts
    ])


# ── Claims ─────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def claims_list(request):
    worker = request.user.worker

    if request.method == 'GET':
        return Response([
            {
                'id': c.id,
                'reason': c.reason,
                'duration_hours': c.duration_hours,
                'payout_amount': float(c.payout_amount),
                'status': c.status,
                'created_at': c.created_at.isoformat(),
            }
            for c in worker.claims.order_by('-created_at')
        ])

    # POST — submit a new claim
    claim = Claim.objects.create(
        worker=worker,
        reason=request.data.get('reason', 'Rain Disruption'),
        duration_hours=request.data.get('duration_hours', 3),
        payout_amount=request.data.get('payout_amount', 120),
        status='Submitted',
    )
    return Response({
        'id': claim.id,
        'reason': claim.reason,
        'duration_hours': claim.duration_hours,
        'payout_amount': float(claim.payout_amount),
        'status': claim.status,
        'created_at': claim.created_at.isoformat(),
    }, status=201)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def claim_detail(request, pk):
    worker = request.user.worker
    try:
        claim = worker.claims.get(pk=pk)
    except Claim.DoesNotExist:
        return Response({'error': 'Claim not found'}, status=404)

    if request.method == 'GET':
        return Response({
            'id': claim.id,
            'reason': claim.reason,
            'duration_hours': claim.duration_hours,
            'payout_amount': float(claim.payout_amount),
            'status': claim.status,
        })

    # PATCH — update status and/or dispute_reason
    new_status = request.data.get('status')
    dispute_reason = request.data.get('dispute_reason')
    
    update_fields = []
    if new_status and new_status in dict(Claim.STATUS_CHOICES):
        claim.status = new_status
        update_fields.append('status')
    
    if dispute_reason:
        claim.dispute_reason = dispute_reason
        update_fields.append('dispute_reason')
        
    if update_fields:
        claim.save(update_fields=update_fields)
    return Response({'id': claim.id, 'status': claim.status})


# ── Premium ────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def premium_view(request):
    worker = request.user.worker
    history = list(worker.premium_history.values('month', 'amount').order_by('id'))
    current = float(history[-1]['amount']) if history else 1240

    return Response({
        'current': current,
        'history': [
            {'month': h['month'], 'premium': float(h['amount'])}
            for h in history
        ],
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculate_premium(request):
    worker = request.user.worker
    rain = request.data.get('rain', False)
    overtime = request.data.get('overtime', False)

    base = 1200
    if rain:
        base += 50
    if overtime:
        base += 40

    # Update the latest month's premium history
    latest_history = worker.premium_history.order_by('id').last()
    if latest_history:
        latest_history.amount = base
        latest_history.save(update_fields=['amount'])

    # Update daily premium on the policy
    if hasattr(worker, 'policy'):
        # Just rough math to show correlation
        worker.policy.daily_premium = round(base / 30, 2)
        worker.policy.save(update_fields=['daily_premium'])

    # Dynamically increase protected earnings based on higher premium
    worker.earnings_protected = 3240.00 + ((base - 1200) * 8.5)
    worker.save(update_fields=['earnings_protected'])

    updated_history = [
        {'month': h['month'], 'premium': float(h['amount'])}
        for h in worker.premium_history.order_by('id').values('month', 'amount')
    ]

    return Response({
        'premium': base,
        'history': updated_history
    })


# ── Payouts (Razorpay) ─────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def calculate_payout(request):
    worker = request.user.worker
    # Dynamic Pricing Engine:
    # We fetch the last premium amount or use base 500
    history = list(worker.premium_history.values('amount').order_by('id'))
    last_premium = float(history[-1]['amount']) if history else 1200
    
    # Calculate base payout proportional to premium
    base_payout = round(last_premium * 0.4)
    
    # Check recent claims or activities for hazards
    recent_claims = worker.claims.order_by('-created_at')[:3]
    recent_activities = worker.activities.order_by('-created_at')[:5]
    
    hazard_bonus = 0
    estimated_miles_bonus = 35
    
    for act in recent_activities:
        if 'Rain' in act.description or 'risk increased' in act.description:
            hazard_bonus += 60
            
    for claim in recent_claims:
        if claim.duration_hours and claim.duration_hours >= 3:
            hazard_bonus += 30

    # Ensure some minimum hazard bonus for demonstration
    if hazard_bonus == 0:
        hazard_bonus = 120
        
    total_payout = base_payout + hazard_bonus + estimated_miles_bonus
    
    return Response({
        'basePayout': base_payout,
        'hazardBonus': hazard_bonus,
        'estimatedMilesBonus': estimated_miles_bonus,
        'totalPayout': total_payout
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def payout_razorpay_order(request):
    try:
        payload = request.data if isinstance(request.data, dict) else {}
        amount_value = payload.get('amount', 0)
        amount = float(amount_value)
    except ValueError:
        return Response({'error': 'Invalid amount'}, status=400)

    purpose = request.data.get('purpose', 'payout')
    plan_name = request.data.get('plan_name', '')
    autopay = bool(request.data.get('autopay', False))

    # Razorpay expects amount in paise (1 INR = 100 paise)
    amount_in_paise = int(amount * 100)

    # Initialize Razorpay Client
    razorpay_key_id = os.environ.get('RAZORPAY_KEY_ID', 'rzp_test_mocked_key')
    razorpay_key_secret = os.environ.get('RAZORPAY_KEY_SECRET', 'mocked_secret')
    
    try:
        client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))
        
        order_data = {
            'amount': amount_in_paise,
            'currency': 'INR',
            'payment_capture': 1 # auto capture
        }
        order = client.order.create(data=order_data)
        
        return Response({
            'order_id': order['id'],
            'amount': order_data['amount'],
            'currency': order_data['currency'],
            'razorpay_key_id': razorpay_key_id,
            'purpose': purpose,
            'plan_name': plan_name,
            'autopay': autopay,
        })
    except Exception as e:
        print("[RAZORPAY ERROR]", e)
        # Fallback for testing when Razorpay credentials aren't properly set up
        # We mock the order ID structure to test frontend flow without real APIs
        return Response({
            'order_id': 'order_dummy_' + str(amount_in_paise),
            'amount': amount_in_paise,
            'currency': 'INR',
            'razorpay_key_id': razorpay_key_id,
            'purpose': purpose,
            'plan_name': plan_name,
            'autopay': autopay,
            'mocked': True
        })


# ── Admin Dashboard ────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard(request):
    try:
        worker = request.user.worker
    except Exception:
        return Response({'error': 'Worker profile not found'}, status=403)

    if worker.role != 'admin':
        return Response({'error': 'Admin access required'}, status=403)

    # Aggregate real claims per day-of-week
    from django.db.models import Count
    from django.utils import timezone
    import datetime

    day_labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    today = timezone.now().date()
    start_of_week = today - datetime.timedelta(days=today.weekday())

    claims_by_day = {label: 0 for label in day_labels}
    for i, label in enumerate(day_labels):
        day = start_of_week + datetime.timedelta(days=i)
        count = Claim.objects.filter(created_at__date=day).count()
        claims_by_day[label] = count if count else [12, 18, 10, 22, 15, 8, 5][i]  # fallback to demo

    claims_chart = [{'day': d, 'claims': claims_by_day[d]} for d in day_labels]

    risk_zones = RiskZone.objects.all()
    activities = ActivityEvent.objects.filter(worker__isnull=True).order_by('-created_at')[:6]
    
    # Load dynamic fraud alerts
    real_alerts = AlertMessage.objects.filter(alert_type='fraud').order_by('-created_at')[:5]
    if real_alerts.exists():
        fraud_alerts = [a.message for a in real_alerts]
    else:
        fraud_alerts = [
            '⚠ Multiple claims from same IP',
            '⚠ Unusual claim frequency detected',
            '⚠ Location mismatch anomaly',
        ]

    return Response({
        'claims_chart': claims_chart,
        'fraud_alerts': fraud_alerts,
        'risk_zones': [
            {'name': z.name, 'risk': z.risk} for z in risk_zones
        ],
        'activity_feed': [
            a.description for a in activities
        ] or [
            '✔ Claim approved for ₹120',
            '✔ Premium recalculated',
            '✔ Rain alert triggered',
            '✔ Worker safety score updated',
        ],
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_disputes(request):
    try:
        worker = request.user.worker
    except Exception:
        return Response({'error': 'Worker profile not found'}, status=403)

    if worker.role != 'admin':
        return Response({'error': 'Admin access required'}, status=403)

    disputed_claims = Claim.objects.filter(status='Disputed').order_by('-created_at')
    return Response([
        {
            'id': c.id,
            'reason': c.reason,
            'payout_amount': float(c.payout_amount),
            'amount_paid': float(c.checkout_amount or c.payout_amount),
            'dispute_reason': c.dispute_reason,
            'worker_name': c.worker.name,
            'worker_phone': c.worker.phone,
            'created_at': c.created_at.isoformat(),
        } for c in disputed_claims
    ])


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_resolve_dispute(request, pk):
    try:
        worker = request.user.worker
    except Exception:
        return Response({'error': 'Worker profile not found'}, status=403)

    if worker.role != 'admin':
        return Response({'error': 'Admin access required'}, status=403)

    try:
        claim = Claim.objects.get(pk=pk, status='Disputed')
    except Claim.DoesNotExist:
        return Response({'error': 'Disputed claim not found'}, status=404)

    action = request.data.get('action') # 'accept' or 'reject'
    admin_response = request.data.get('admin_response', '')
    checkout_amount = request.data.get('checkout_amount')

    if action == 'accept':
        claim.status = 'Approved'
        claim.admin_response = admin_response
        if checkout_amount:
            claim.checkout_amount = float(checkout_amount)
            claim.payout_amount = float(checkout_amount)
    elif action == 'reject':
        claim.status = 'Rejected'
        claim.admin_response = admin_response

    claim.save(update_fields=['status', 'admin_response', 'checkout_amount', 'payout_amount'])
    
    # Add activity event
    paid_amount = float(claim.checkout_amount or claim.payout_amount)
    ActivityEvent.objects.create(
        description=f"Dispute for claim #{claim.id} {action}ed for ₹{paid_amount:.2f}."
    )

    return Response({'success': True, 'status': claim.status, 'checkout_amount': claim.checkout_amount, 'amount_paid': paid_amount})


# ── Spoof-detection endpoints ─────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def spoof_index(request):
    from django.shortcuts import render
    return render(request, "index.html")


@api_view(['POST'])
@permission_classes([AllowAny])
def api_crosscheck(request):
    try:
        lat = float(request.data.get("lat"))
        lon = float(request.data.get("lon"))
    except (KeyError, TypeError, ValueError):
        return Response({"error": "lat and lon are required numeric fields"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        result = crosscheck_ip.compute_score(lat, lon)
        return Response({
            "score":   result["fraud_score"],
            "band":    result["band"],
            "reasons": result["reasons"],
            "ip":      result.get("ip", "unknown"),
        })
    except SystemExit:
        return Response({"error": "IP discovery failed — check network connection"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def api_air_quality(request):
    try:
        lat = float(request.data.get("lat"))
        lon = float(request.data.get("lon"))
    except (KeyError, TypeError, ValueError):
        return Response({"error": "lat and lon are required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        answer = air_quality_check.run(lat, lon)
        return Response({"result": answer})
    except SystemExit:
        return Response({"error": "OWM_API_KEY missing or invalid — check .env"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def api_weather(request):
    try:
        lat = float(request.data.get("lat"))
        lon = float(request.data.get("lon"))
    except (KeyError, TypeError, ValueError):
        return Response({"error": "lat and lon are required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        answer = weather_check.run(lat, lon)
        return Response({"result": answer})
    except SystemExit:
        return Response({"error": "OWM_API_KEY missing or invalid — check .env"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
