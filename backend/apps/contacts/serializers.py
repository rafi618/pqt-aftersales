from rest_framework import serializers
from .models import Owner, OwnerProperty, Tenant


class OwnerPropertySerializer(serializers.ModelSerializer):
    property_name = serializers.CharField(source='property.name', read_only=True)

    class Meta:
        model = OwnerProperty
        fields = '__all__'


class OwnerSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    owner_properties = OwnerPropertySerializer(many=True, read_only=True)

    class Meta:
        model = Owner
        fields = '__all__'


class OwnerListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    property_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Owner
        fields = ('id', 'first_name', 'last_name', 'full_name', 'email', 'phone',
                  'company_name', 'nationality', 'property_count', 'created_at')


class TenantSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Tenant
        fields = '__all__'
