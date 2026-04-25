from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def home(request):
    return JsonResponse({
        'message': 'Playto KYC API is running!',
        'endpoints': {
            'login': '/api/v1/auth/login/',
            'register': '/api/v1/auth/register/',
            'submissions': '/api/v1/submissions/',
            'reviewer_queue': '/api/v1/reviewer/queue/',
        }
    })

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
    path('api/v1/', include('kyc.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)