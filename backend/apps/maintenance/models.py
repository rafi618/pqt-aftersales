from django.conf import settings
from django.db import models
from common.models import TimestampedModel


class Ticket(TimestampedModel):
    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        URGENT = 'urgent', 'Urgent'

    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        IN_PROGRESS = 'in_progress', 'In Progress'
        RESOLVED = 'resolved', 'Resolved'
        CLOSED = 'closed', 'Closed'

    class Category(models.TextChoices):
        PLUMBING = 'plumbing', 'Plumbing'
        ELECTRICAL = 'electrical', 'Electrical'
        HVAC = 'hvac', 'HVAC'
        STRUCTURAL = 'structural', 'Structural'
        APPLIANCE = 'appliance', 'Appliance'
        CLEANING = 'cleaning', 'Cleaning'
        GENERAL = 'general', 'General'

    title = models.CharField(max_length=200)
    description = models.TextField()
    unit = models.ForeignKey('properties.Unit', on_delete=models.CASCADE, related_name='tickets')
    reported_by_tenant = models.ForeignKey(
        'contacts.Tenant', on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets',
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets',
    )
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.GENERAL)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.get_priority_display()}] {self.title}"


class TicketComment(TimestampedModel):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    comment = models.TextField()

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment on {self.ticket.title} by {self.author}"
