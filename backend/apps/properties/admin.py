from django.contrib import admin
from .models import Property, Unit


class UnitInline(admin.TabularInline):
    model = Unit
    extra = 0


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'property_type', 'total_units', 'status')
    list_filter = ('property_type', 'status', 'city')
    search_fields = ('name', 'address')
    inlines = [UnitInline]


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ('unit_number', 'property', 'status', 'rent_amount', 'bedrooms')
    list_filter = ('status', 'property')
