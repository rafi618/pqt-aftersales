from django.conf import settings
from django.db import models
from common.models import TimestampedModel


class Owner(TimestampedModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='owner_profile',
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    company_name = models.CharField(max_length=200, blank=True)
    nationality = models.CharField(max_length=100, blank=True)
    id_number = models.CharField(max_length=50, blank=True, help_text='Passport or Emirates ID')
    tax_id = models.CharField(max_length=50, blank=True, help_text='TRN / Tax Registration Number')
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class OwnerProperty(TimestampedModel):
    owner = models.ForeignKey(Owner, on_delete=models.CASCADE, related_name='owner_properties')
    property = models.ForeignKey(
        'properties.Property', on_delete=models.CASCADE, related_name='owner_properties',
    )
    ownership_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    acquired_date = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = ('owner', 'property')
        verbose_name = 'Owner-Property Link'

    def __str__(self):
        return f"{self.owner} - {self.property} ({self.ownership_percentage}%)"


class Tenant(TimestampedModel):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    emergency_contact = models.CharField(max_length=100, blank=True)
    emergency_phone = models.CharField(max_length=20, blank=True)
    id_number = models.CharField(max_length=50, blank=True, help_text='Passport or Emirates ID')
    nationality = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
