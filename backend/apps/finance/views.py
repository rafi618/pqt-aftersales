from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from common.permissions import IsStaff, IsStaffOrReadOnlyClient
from .models import Invoice, Payment, OwnerPayout
from .serializers import (
    InvoiceSerializer, InvoiceListSerializer,
    PaymentSerializer, OwnerPayoutSerializer,
)


class InvoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffOrReadOnlyClient]
    filterset_fields = ['status', 'invoice_type', 'owner', 'tenant', 'unit__property']
    search_fields = ['invoice_number', 'description']
    ordering_fields = ['issued_date', 'due_date', 'amount']

    def get_queryset(self):
        qs = Invoice.objects.select_related('tenant', 'owner', 'unit__property').all()
        if self.request.user.is_client:
            qs = qs.filter(owner__user=self.request.user)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceSerializer

    @action(detail=True, methods=['post'], permission_classes=[IsStaff])
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()
        invoice.status = Invoice.Status.PAID
        invoice.paid_date = timezone.now().date()
        invoice.save()
        return Response({'detail': 'Invoice marked as paid.'})


class PaymentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffOrReadOnlyClient]
    filterset_fields = ['invoice', 'tenant', 'payment_method']
    ordering_fields = ['payment_date', 'amount']

    def get_queryset(self):
        qs = Payment.objects.select_related('invoice__owner', 'tenant').all()
        if self.request.user.is_client:
            qs = qs.filter(invoice__owner__user=self.request.user)
        return qs

    def get_serializer_class(self):
        return PaymentSerializer


class OwnerPayoutViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffOrReadOnlyClient]
    filterset_fields = ['owner', 'status']
    ordering_fields = ['period_end', 'net_payout']

    def get_queryset(self):
        qs = OwnerPayout.objects.select_related('owner').all()
        if self.request.user.is_client:
            qs = qs.filter(owner__user=self.request.user)
        return qs

    def get_serializer_class(self):
        return OwnerPayoutSerializer
