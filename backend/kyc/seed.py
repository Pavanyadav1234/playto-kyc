import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from django.contrib.auth.models import User
from kyc.models import UserProfile, KYCSubmission
from django.utils import timezone

print("Clearing old data...")
KYCSubmission.objects.all().delete()
UserProfile.objects.all().delete()
User.objects.filter(is_superuser=False).delete()

reviewer_user = User.objects.create_user(
    username='reviewer1',
    email='reviewer@playto.com',
    password='reviewer123'
)
UserProfile.objects.create(user=reviewer_user, role='reviewer')
print("Reviewer created: reviewer1 / reviewer123")

merchant1 = User.objects.create_user(
    username='merchant1',
    email='merchant1@example.com',
    password='merchant123'
)
UserProfile.objects.create(user=merchant1, role='merchant')
KYCSubmission.objects.create(
    merchant=merchant1,
    full_name='Rahul Sharma',
    email='rahul@example.com',
    phone='9876543210',
    business_name='Rahul Designs',
    business_type='Freelancer',
    monthly_volume=5000,
    state='draft'
)
print("Merchant1 created: merchant1 / merchant123 (draft)")

merchant2 = User.objects.create_user(
    username='merchant2',
    email='merchant2@example.com',
    password='merchant123'
)
UserProfile.objects.create(user=merchant2, role='merchant')
KYCSubmission.objects.create(
    merchant=merchant2,
    full_name='Priya Patel',
    email='priya@example.com',
    phone='9123456780',
    business_name='Priya Agency',
    business_type='Agency',
    monthly_volume=15000,
    state='under_review',
    submitted_at=timezone.now()
)
print("Merchant2 created: merchant2 / merchant123 (under_review)")

print("\nSeed complete!")
print("  Reviewer  -> reviewer1 / reviewer123")
print("  Merchant1 -> merchant1 / merchant123 (draft)")
print("  Merchant2 -> merchant2 / merchant123 (under_review)")