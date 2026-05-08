from rest_framework import serializers
from .models import Property, Unit


class UnitSerializer(serializers.ModelSerializer):
    property_name = serializers.CharField(source='property.name', read_only=True)

    class Meta:
        model = Unit
        fields = '__all__'


class PropertyListSerializer(serializers.ModelSerializer):
    occupied_units = serializers.IntegerField(read_only=True)
    vacant_units = serializers.IntegerField(read_only=True)
    occupancy_rate = serializers.FloatField(read_only=True)

    class Meta:
        model = Property
        fields = '__all__'


class PropertyDetailSerializer(PropertyListSerializer):
    units = UnitSerializer(many=True, read_only=True)
