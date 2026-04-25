from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    ROLE_CHOICES = [('merchant', 'Merchant'), ('reviewer', 'Reviewer')]
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='merchant')
    phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"


class KYCSubmission(models.Model):
    STATE_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('more_info_requested', 'More Info Requested'),
    ]

    VALID_TRANSITIONS = {
        'draft': ['submitted'],
        'submitted': ['under_review'],
        'under_review': ['approved', 'rejected', 'more_info_requested'],
        'more_info_requested': ['submitted'],
        'approved': [],
        'rejected': [],
    }

    merchant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submissions')
    
    # Personal details
    full_name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    
    # Business details
    business_name = models.CharField(max_length=200, blank=True)
    business_type = models.CharField(max_length=100, blank=True)
    monthly_volume = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Documents
    pan_document = models.FileField(upload_to='documents/', null=True, blank=True)
    aadhaar_document = models.FileField(upload_to='documents/', null=True, blank=True)
    bank_statement = models.FileField(upload_to='documents/', null=True, blank=True)
    
    # State
    state = models.CharField(max_length=30, choices=STATE_CHOICES, default='draft')
    reviewer_note = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    def can_transition_to(self, new_state):
        return new_state in self.VALID_TRANSITIONS.get(self.state, [])

    def transition_to(self, new_state):
        if not self.can_transition_to(new_state):
            raise ValueError(
                f"Cannot move from '{self.state}' to '{new_state}'. "
                f"Allowed: {self.VALID_TRANSITIONS.get(self.state, [])}"
            )
        self.state = new_state

    def __str__(self):
        return f"{self.merchant.username} - {self.state}"


class NotificationEvent(models.Model):
    merchant = models.ForeignKey(User, on_delete=models.CASCADE)
    event_type = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    payload = models.JSONField(default=dict)

    def __str__(self):
        return f"{self.merchant.username} - {self.event_type}"