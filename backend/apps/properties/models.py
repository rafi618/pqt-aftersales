from django.db import models
from common.models import TimestampedModel


class Property(TimestampedModel):
    class PropertyType(models.TextChoices):
        RESIDENTIAL = 'residential', 'Residential'
        COMMERCIAL = 'commercial', 'Commercial'
        MIXED = 'mixed', 'Mixed Use'

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'

    name = models.CharField(max_length=200)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, default='UAE')
    property_type = models.CharField(max_length=20, choices=PropertyType.choices, default=PropertyType.RESIDENTIAL)
    total_units = models.PositiveIntegerField(default=1)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    image = models.ImageField(upload_to='properties/', blank=True, null=True)

    class Meta:
        verbose_name_plural = 'properties'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def occupied_units(self):
        return self.units.filter(status='occupied').count()

    @property
    def vacant_units(self):
        return self.units.filter(status='vacant').count()

    @property
    def occupancy_rate(self):
        total = self.units.count()
        if total == 0:
            return 0
        return round(self.units.filter(status='occupied').count() / total * 100, 1)


class Unit(TimestampedModel):
    class Status(models.TextChoices):
        VACANT = 'vacant', 'Vacant'
        OCCUPIED = 'occupied', 'Occupied'
        MAINTENANCE = 'maintenance', 'Under Maintenance'

    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='units')
    unit_number = models.CharField(max_length=50)
    floor = models.CharField(max_length=20, blank=True)
    bedrooms = models.PositiveIntegerField(default=0)
    bathrooms = models.PositiveIntegerField(default=0)
    area_sqft = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    rent_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.VACANT)
    description = models.TextField(blank=True)

    class Meta:
        unique_together = ('property', 'unit_number')
        ordering = ['property', 'unit_number']

    def __str__(self):
        return f"{self.property.name} - Unit {self.unit_number}"
