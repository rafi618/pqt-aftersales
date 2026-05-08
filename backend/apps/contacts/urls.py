from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('owners', views.OwnerViewSet, basename='owner')
router.register('owner-properties', views.OwnerPropertyViewSet, basename='owner-property')
router.register('tenants', views.TenantViewSet, basename='tenant')

urlpatterns = [
    path('', include(router.urls)),
]
