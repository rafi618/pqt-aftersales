from rest_framework import serializers
from .models import Contract


class ContractSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenant.full_name', read_only=True)
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    unit_label = serializers.CharField(source='unit.__str__', read_only=True)
    annual_rent = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    monthly_management_fee = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    monthly_net_to_owner = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Contract
        fields = '__all__'


class ContractListSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenant.full_name', read_only=True)
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    unit_label = serializers.CharField(source='unit.__str__', read_only=True)
    property_name = serializers.CharField(source='unit.property.name', read_only=True)

    class Meta:
        model = Contract
        fields = ('id', 'contract_number', 'tenant_name', 'owner_name', 'unit_label',
                  'property_name', 'start_date', 'end_date', 'monthly_rent', 'status')
