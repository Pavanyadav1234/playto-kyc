from rest_framework import serializers
from django.contrib.auth.models import User
from .models import KYCSubmission, UserProfile, NotificationEvent
import os

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
                f"File too large. Max size is 5MB. Your file is {round(file.size / 1024 / 1024, 2)}MB"
            )
    return file


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=['merchant', 'reviewer'], default='merchant')

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role']

    def create(self, validated_data):
        role = validated_data.pop('role', 'merchant')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        UserProfile.objects.create(user=user, role=role)
        return user


class KYCSubmissionSerializer(serializers.ModelSerializer):
    pan_document = serializers.FileField(required=False, allow_null=True)
    aadhaar_document = serializers.FileField(required=False, allow_null=True)
    bank_statement = serializers.FileField(required=False, allow_null=True)
    is_at_risk = serializers.SerializerMethodField()
    merchant_username = serializers.CharField(source='merchant.username', read_only=True)

    class Meta:
        model = KYCSubmission
        fields = '__all__'
        read_only_fields = ['merchant', 'state', 'created_at', 'updated_at', 'submitted_at']

    def get_is_at_risk(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        if obj.state in ['submitted', 'under_review'] and obj.submitted_at:
            return timezone.now() > obj.submitted_at + timedelta(hours=24)
        return False

    def validate_pan_document(self, value):
        return validate_document(value)

    def validate_aadhaar_document(self, value):
        return validate_document(value)

    def validate_bank_statement(self, value):
        return validate_document(value)


class NotificationEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationEvent
        fields = '__all__'