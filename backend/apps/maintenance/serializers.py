from rest_framework import serializers
from .models import Ticket, TicketComment


class TicketCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)

    class Meta:
        model = TicketComment
        fields = '__all__'
        read_only_fields = ('author',)


class TicketSerializer(serializers.ModelSerializer):
    unit_label = serializers.CharField(source='unit.__str__', read_only=True)
    property_name = serializers.CharField(source='unit.property.name', read_only=True)
    tenant_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True, default='')
    comments = TicketCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = '__all__'

    def get_tenant_name(self, obj):
        if obj.reported_by_tenant:
            return obj.reported_by_tenant.full_name
        return ''


class TicketListSerializer(serializers.ModelSerializer):
    unit_label = serializers.CharField(source='unit.__str__', read_only=True)
    property_name = serializers.CharField(source='unit.property.name', read_only=True)

    class Meta:
        model = Ticket
        fields = ('id', 'title', 'unit_label', 'property_name', 'priority', 'status',
                  'category', 'cost', 'created_at', 'resolved_at')
