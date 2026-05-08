from rest_framework import viewsets
from common.permissions import IsStaffOrReadOnlyClient
from .models import Contract
from .serializers import ContractSerializer, ContractListSerializer


class ContractViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffOrReadOnlyClient]
    filterset_fields = ['status', 'owner', 'tenant', 'unit__property']
    search_fields = ['contract_number', 'tenant__first_name', 'tenant__last_name']
    ordering_fields = ['start_date', 'end_date', 'monthly_rent']

    def get_queryset(self):
        qs = Contract.objects.select_related('unit__property', 'tenant', 'owner').all()
        if self.request.user.is_client:
            qs = qs.filter(owner__user=self.request.user)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return ContractListSerializer
        return ContractSerializer
