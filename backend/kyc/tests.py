from django.test import TestCase
from django.contrib.auth.models import User
from kyc.models import KYCSubmission, UserProfile

class StateMachineTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testmerchant', password='test123')
        UserProfile.objects.create(user=self.user, role='merchant')
        self.submission = KYCSubmission.objects.create(
            merchant=self.user,
            full_name='Test User',
            email='test@test.com',
            phone='1234567890',
            state='draft'
        )

    def test_illegal_transition_raises_error(self):
        with self.assertRaises(ValueError):
            self.submission.transition_to('approved')

    def test_legal_transition_works(self):
        self.submission.transition_to('submitted')
        self.assertEqual(self.submission.state, 'submitted')

    def test_approved_cannot_go_back_to_draft(self):
        self.submission.state = 'approved'
        with self.assertRaises(ValueError):
            self.submission.transition_to('draft')