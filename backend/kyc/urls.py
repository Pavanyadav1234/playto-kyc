from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/me/', views.me, name='me'),

    # Merchant
    path('submissions/', views.KYCSubmissionListCreate.as_view(), name='submission-list'),
    path('submissions/<int:pk>/', views.KYCSubmissionDetail.as_view(), name='submission-detail'),
    path('submissions/<int:pk>/submit/', views.submit_kyc, name='submit-kyc'),

    # Reviewer
    path('reviewer/queue/', views.ReviewerQueueView.as_view(), name='reviewer-queue'),
    path('reviewer/queue/<int:pk>/', views.ReviewerSubmissionDetail.as_view(), name='reviewer-detail'),
    path('reviewer/queue/<int:pk>/action/', views.review_action, name='review-action'),
    path('reviewer/metrics/', views.reviewer_metrics, name='reviewer-metrics'),
]