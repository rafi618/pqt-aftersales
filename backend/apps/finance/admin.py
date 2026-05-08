from django.contrib import admin
from .models import Invoice, Payment, OwnerPayout


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'invoice_type', 'tenant', 'owner', 'amount',
                    'tax_amount', 'management_fee', 'net_to_owner', 'status', 'due_date')
    list_filter = ('status', 'invoice_type')
    search_fields = ('invoice_number',)
    inlines = [PaymentInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('invoice', 'tenant', 'amount', 'payment_date', 'payment_method')
    list_filter = ('payment_method',)


@admin.register(OwnerPayout)
class OwnerPayoutAdmin(admin.ModelAdmin):
    list_display = ('owner', 'period_start', 'period_end', 'gross_rental_income',
                    'management_fee', 'maintenance_costs', 'tax_amount', 'net_payout', 'status')
    list_filter = ('status',)
