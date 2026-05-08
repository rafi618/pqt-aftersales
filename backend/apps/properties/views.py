from rest_framework import viewsets
from common.permissions import IsStaffOrReadOnlyClient
from .models import Property, Unit
from .serializers import PropertyListSerializer, PropertyDetailSerializer, UnitSerializer


class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.all()
    permission_classes = [IsStaffOrReadOnlyClient]
    filterset_fields = ['property_type', 'status', 'city']
    search_fields = ['name', 'address', 'city']
    ordering_fields = ['name', 'created_at']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PropertyDetailSerializer
        return PropertyListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_client:
            qs = qs.filter(owner_properties__owner__user=self.request.user)
        return qs


class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.select_related('property').all()
    serializer_class = UnitSerializer
    permission_classes = [IsStaffOrReadOnlyClient]
    filterset_fields = ['property', 'status', 'bedrooms']
    search_fields = ['unit_number', 'property__name']
    ordering_fields = ['unit_number', 'rent_amount']

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_client:
            qs = qs.filter(property__owner_properties__owner__user=self.request.user)
        return qs
