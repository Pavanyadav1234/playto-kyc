from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from .models import KYCSubmission, UserProfile, NotificationEvent
from .serializers import (
    RegisterSerializer, KYCSubmissionSerializer,
    NotificationEventSerializer, UserSerializer
)


def log_notification(merchant, event_type, payload={}):
    NotificationEvent.objects.create(
        merchant=merchant,
        event_type=event_type,
        payload=payload
    )


class IsMerchant(permissions.BasePermission):
    def has_permission(self, request, view):
        try:
            return request.user.userprofile.role == 'merchant'
        except:
            return False


class IsReviewer(permissions.BasePermission):
    def has_permission(self, request, view):
        try:
            return request.user.userprofile.role == 'reviewer'
        except:
            return False


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'username': user.username}, status=201)
    return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user:
        token, _ = Token.objects.get_or_create(user=user)
        try:
            role = user.userprofile.role
        except:
            role = 'merchant'
        return Response({'token': token.key, 'username': user.username, 'role': role})
    return Response({'error': 'Invalid credentials'}, status=400)


@api_view(['GET'])
def me(request):
    try:
        role = request.user.userprofile.role
    except:
        role = 'merchant'
    return Response({'username': request.user.username, 'role': role})


class KYCSubmissionListCreate(generics.ListCreateAPIView):
    serializer_class = KYCSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated, IsMerchant]

    def get_queryset(self):
        return KYCSubmission.objects.filter(merchant=self.request.user)

    def perform_create(self, serializer):
        serializer.save(merchant=self.request.user)


class KYCSubmissionDetail(generics.RetrieveUpdateAPIView):
    serializer_class = KYCSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated, IsMerchant]

    def get_queryset(self):
        return KYCSubmission.objects.filter(merchant=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsMerchant])
def submit_kyc(request, pk):
    try:
        submission = KYCSubmission.objects.get(pk=pk, merchant=request.user)
    except KYCSubmission.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    try:
        submission.transition_to('submitted')
        submission.submitted_at = timezone.now()
        submission.save()
        log_notification(request.user, 'kyc_submitted', {'submission_id': pk})
        return Response({'message': 'Submitted successfully', 'state': submission.state})
    except ValueError as e:
        return Response({'error': str(e)}, status=400)


class ReviewerQueueView(generics.ListAPIView):
    serializer_class = KYCSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated, IsReviewer]

    def get_queryset(self):
        return KYCSubmission.objects.filter(
            state__in=['submitted', 'under_review']
        ).order_by('submitted_at')


class ReviewerSubmissionDetail(generics.RetrieveAPIView):
    serializer_class = KYCSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated, IsReviewer]
    queryset = KYCSubmission.objects.all()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsReviewer])
def review_action(request, pk):
    try:
        submission = KYCSubmission.objects.get(pk=pk)
    except KYCSubmission.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    action = request.data.get('action')
    note = request.data.get('note', '')

    valid_actions = ['under_review', 'approved', 'rejected', 'more_info_requested']
    if action not in valid_actions:
        return Response({'error': f'Invalid action. Choose from: {valid_actions}'}, status=400)

    try:
        submission.transition_to(action)
        submission.reviewer_note = note
        submission.save()
        log_notification(submission.merchant, f'kyc_{action}', {
            'submission_id': pk, 'note': note
        })
        return Response({'message': f'Moved to {action}', 'state': submission.state})
    except ValueError as e:
        return Response({'error': str(e)}, status=400)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsReviewer])
def reviewer_metrics(request):
    now = timezone.now()
    seven_days_ago = now - timedelta(days=7)

    in_queue = KYCSubmission.objects.filter(state__in=['submitted', 'under_review'])
    total_in_queue = in_queue.count()

    submitted = in_queue.filter(submitted_at__isnull=False)
    if submitted.exists():
        avg_hours = sum(
            (now - s.submitted_at).total_seconds() / 3600
            for s in submitted
        ) / submitted.count()
    else:
        avg_hours = 0

    recent = KYCSubmission.objects.filter(updated_at__gte=seven_days_ago)
    approved = recent.filter(state='approved').count()
    total_decided = recent.filter(state__in=['approved', 'rejected']).count()
    approval_rate = round((approved / total_decided * 100), 1) if total_decided > 0 else 0

    at_risk = in_queue.filter(
        submitted_at__lt=now - timedelta(hours=24)
    ).count()

    return Response({
        'total_in_queue': total_in_queue,
        'avg_hours_in_queue': round(avg_hours, 1),
        'approval_rate_7days': approval_rate,
        'at_risk_count': at_risk,
    })