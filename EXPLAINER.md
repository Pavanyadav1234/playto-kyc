# EXPLAINER.md

## 1. The State Machine

The state machine lives in `backend/kyc/models.py` in the `KYCSubmission` class.

VALID_TRANSITIONS = {
    'draft': ['submitted'],
    'submitted': ['under_review'],
    'under_review': ['approved', 'rejected', 'more_info_requested'],
    'more_info_requested': ['submitted'],
    'approved': [],
    'rejected': [],
}

def can_transition_to(self, new_state):
    return new_state in self.VALID_TRANSITIONS.get(self.state, [])

def transition_to(self, new_state):
    if not self.can_transition_to(new_state):
        raise ValueError(
            f"Cannot move from '{self.state}' to '{new_state}'. "
            f"Allowed: {self.VALID_TRANSITIONS.get(self.state, [])}"
        )
    self.state = new_state

Illegal transitions raise a ValueError which the API catches and returns as a 400 error with a clear message.

## 2. The Upload

File validation lives in `backend/kyc/serializers.py`:

ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def validate_document(file):
    if file:
        ext = os.path.splitext(file.name)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                f"Only PDF, JPG, PNG files allowed. You uploaded: {ext}"
            )
        if file.size > MAX_FILE_SIZE:
            raise serializers.ValidationError(
                f"File too large. Max size is 5MB."
            )
    return file

If someone sends a 50MB file, the size check catches it and returns a 400 error. The check happens server-side so the client cannot bypass it.

## 3. The Queue

The reviewer queue query lives in `backend/kyc/views.py`:

class ReviewerQueueView(generics.ListAPIView):
    def get_queryset(self):
        return KYCSubmission.objects.filter(
            state__in=['submitted', 'under_review']
        ).order_by('submitted_at')

The SLA flag is computed dynamically in the serializer:

def get_is_at_risk(self, obj):
    from django.utils import timezone
    from datetime import timedelta
    if obj.state in ['submitted', 'under_review'] and obj.submitted_at:
        return timezone.now() > obj.submitted_at + timedelta(hours=24)
    return False

I ordered by submitted_at so oldest submissions appear first. The at_risk flag is never stored, it is always computed fresh so it never goes stale.

## 4. The Auth

Merchants cannot see other merchants submissions because of this check in views.py:

class KYCSubmissionListCreate(generics.ListCreateAPIView):
    def get_queryset(self):
        return KYCSubmission.objects.filter(merchant=self.request.user)

class KYCSubmissionDetail(generics.RetrieveUpdateAPIView):
    def get_queryset(self):
        return KYCSubmission.objects.filter(merchant=self.request.user)

Every query filters by merchant=self.request.user. If merchant A tries to access merchant B's submission by guessing the ID, Django returns 404 because the queryset only contains their own submissions.

## 5. The AI Audit

When I asked AI to write the file upload validation, it originally gave me this:

def validate_document(file):
    if file.content_type in ['application/pdf', 'image/jpeg', 'image/png']:
        return file
    raise ValidationError("Invalid file type")

The problem: this trusts the content_type header sent by the client. A malicious user can upload a .exe file but set content_type to image/jpeg and it would pass validation.

I replaced it with server-side extension checking:

ext = os.path.splitext(file.name)[1].lower()
if ext not in ALLOWED_EXTENSIONS:
    raise serializers.ValidationError(...)

This checks the actual file extension server-side. I also added file size validation which the AI completely forgot.