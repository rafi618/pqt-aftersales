from django.contrib import admin
from .models import Contract


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ('contract_number', 'tenant', 'owner', 'unit', 'monthly_rent', 'status', 'start_date', 'end_date')
    list_filter = ('status',)
    search_fields = ('contract_number', 'tenant__first_name', 'tenant__last_name')
