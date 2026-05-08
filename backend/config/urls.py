from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from .frontend import FrontendAppView, FrontendAssetView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/properties/', include('apps.properties.urls')),
    path('api/v1/contacts/', include('apps.contacts.urls')),
    path('api/v1/contracts/', include('apps.contracts.urls')),
    path('api/v1/maintenance/', include('apps.maintenance.urls')),
    path('api/v1/finance/', include('apps.finance.urls')),
    path('api/v1/dashboard/', include('apps.dashboard.urls')),
    # API docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # Frontend static assets (built by Vite into frontend/dist/assets)
    re_path(r'^assets/(?P<path>.*)$', serve, {'document_root': settings.FRONTEND_DIST / 'assets'}),
    # Frontend public files (favicon, etc.)
    re_path(r'^(?P<path>(favicon\.svg|icons\.svg|vite\.svg))$', FrontendAssetView.as_view()),
    # SPA catch-all - must be LAST. Serves React app for all other routes.
    re_path(r'^.*$', FrontendAppView.as_view(), name='frontend'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
