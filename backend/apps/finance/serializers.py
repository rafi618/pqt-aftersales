from rest_framework import serializers
from .models import Invoice, Payment, OwnerPayout


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'


class InvoiceSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenant.full_name', read_only=True)
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    unit_label = serializers.CharField(source='unit.__str__', read_only=True)
    property_name = serializers.CharField(source='unit.property.name', read_only=True)
    total_amount = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    balance_due = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'


class InvoiceListSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenant.full_name', read_only=True)
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    property_name = serializers.CharField(source='unit.property.name', read_only=True)
    total_amount = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    balance_due = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = Invoice
        fields = ('id', 'invoice_number', 'invoice_type', 'tenant_name', 'owner_name',
                  'property_name', 'amount', 'tax_amount', 'management_fee', 'net_to_owner',
                  'total_amount', 'balance_due', 'issued_date', 'due_date', 'status')


class OwnerPayoutSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)

    class Meta:
        model = OwnerPayout
        fields = '__all__'
