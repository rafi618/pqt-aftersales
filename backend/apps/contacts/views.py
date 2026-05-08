from django.db.models import Count
from rest_framework import viewsets
from common.permissions import IsStaff, IsStaffOrReadOnlyClient
from .models import Owner, OwnerProperty, Tenant
from .serializers import OwnerSerializer, OwnerListSerializer, OwnerPropertySerializer, TenantSerializer


class OwnerViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffOrReadOnlyClient]
    filterset_fields = ['nationality']
    search_fields = ['first_name', 'last_name', 'email', 'company_name']

    def get_queryset(self):
        qs = Owner.objects.annotate(property_count=Count('owner_properties'))
        if self.request.user.is_client:
            qs = qs.filter(user=self.request.user)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return OwnerListSerializer
        return OwnerSerializer


class OwnerPropertyViewSet(viewsets.ModelViewSet):
    queryset = OwnerProperty.objects.select_related('owner', 'property').all()
    serializer_class = OwnerPropertySerializer
    permission_classes = [IsStaff]
    filterset_fields = ['owner', 'property']


class TenantViewSet(viewsets.ModelViewSet):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [IsStaff]
    filterset_fields = ['status']
    search_fields = ['first_name', 'last_name', 'email', 'phone']
