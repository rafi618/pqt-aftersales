from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from common.permissions import IsStaff, IsStaffOrReadOnlyClient
from .models import Ticket, TicketComment
from .serializers import TicketSerializer, TicketListSerializer, TicketCommentSerializer


class TicketViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffOrReadOnlyClient]
    filterset_fields = ['status', 'priority', 'category', 'unit__property', 'assigned_to']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'priority']

    def get_queryset(self):
        qs = Ticket.objects.select_related('unit__property', 'reported_by_tenant', 'assigned_to').all()
        if self.request.user.is_client:
            qs = qs.filter(unit__property__owner_properties__owner__user=self.request.user)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return TicketListSerializer
        return TicketSerializer

    @action(detail=True, methods=['post'], permission_classes=[IsStaff])
    def add_comment(self, request, pk=None):
        ticket = self.get_object()
        serializer = TicketCommentSerializer(data={**request.data, 'ticket': ticket.id})
        serializer.is_valid(raise_exception=True)
        serializer.save(author=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
