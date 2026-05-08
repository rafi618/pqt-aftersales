from django.db import models
from common.models import TimestampedModel


class Contract(TimestampedModel):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        EXPIRED = 'expired', 'Expired'
        TERMINATED = 'terminated', 'Terminated'
        PENDING = 'pending', 'Pending'

    contract_number = models.CharField(max_length=50, unique=True)
    unit = models.ForeignKey('properties.Unit', on_delete=models.CASCADE, related_name='contracts')
    tenant = models.ForeignKey('contacts.Tenant', on_delete=models.CASCADE, related_name='contracts')
    owner = models.ForeignKey('contacts.Owner', on_delete=models.CASCADE, related_name='contracts')
    start_date = models.DateField()
    end_date = models.DateField()
    monthly_rent = models.DecimalField(max_digits=12, decimal_places=2)
    security_deposit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    management_fee_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=5.00,
        help_text='PQT management fee as percentage of rent',
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    terms = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.contract_number} - {self.tenant}"

    @property
    def annual_rent(self):
        return self.monthly_rent * 12

    @property
    def monthly_management_fee(self):
        return round(self.monthly_rent * self.management_fee_percentage / 100, 2)

    @property
    def monthly_net_to_owner(self):
        return self.monthly_rent - self.monthly_management_fee
