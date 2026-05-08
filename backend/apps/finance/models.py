from django.db import models
from common.models import TimestampedModel


class Invoice(TimestampedModel):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PENDING = 'pending', 'Pending'
        PAID = 'paid', 'Paid'
        OVERDUE = 'overdue', 'Overdue'
        CANCELLED = 'cancelled', 'Cancelled'

    class InvoiceType(models.TextChoices):
        RENT = 'rent', 'Rent'
        MANAGEMENT_FEE = 'management_fee', 'Management Fee'
        MAINTENANCE = 'maintenance', 'Maintenance'
        OTHER = 'other', 'Other'

    invoice_number = models.CharField(max_length=50, unique=True)
    invoice_type = models.CharField(max_length=20, choices=InvoiceType.choices, default=InvoiceType.RENT)
    contract = models.ForeignKey(
        'contracts.Contract', on_delete=models.CASCADE, related_name='invoices', null=True, blank=True,
    )
    tenant = models.ForeignKey('contacts.Tenant', on_delete=models.CASCADE, related_name='invoices')
    owner = models.ForeignKey('contacts.Owner', on_delete=models.CASCADE, related_name='invoices')
    unit = models.ForeignKey('properties.Unit', on_delete=models.CASCADE, related_name='invoices')
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text='VAT or applicable tax')
    management_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_to_owner = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    issued_date = models.DateField()
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    class Meta:
        ordering = ['-issued_date']

    def __str__(self):
        return f"{self.invoice_number} - {self.tenant}"

    @property
    def total_amount(self):
        return self.amount + self.tax_amount

    @property
    def balance_due(self):
        paid = self.payments.aggregate(total=models.Sum('amount'))['total'] or 0
        return self.total_amount - paid


class Payment(TimestampedModel):
    class Method(models.TextChoices):
        CASH = 'cash', 'Cash'
        BANK_TRANSFER = 'bank_transfer', 'Bank Transfer'
        CHECK = 'check', 'Check'
        ONLINE = 'online', 'Online Payment'
        CARD = 'card', 'Credit/Debit Card'

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    tenant = models.ForeignKey('contacts.Tenant', on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=Method.choices, default=Method.BANK_TRANSFER)
    reference_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-payment_date']

    def __str__(self):
        return f"Payment {self.amount} for {self.invoice.invoice_number}"


class OwnerPayout(TimestampedModel):
    """Tracks disbursements to property owners after deducting fees and taxes."""
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSED = 'processed', 'Processed'
        PAID = 'paid', 'Paid'

    owner = models.ForeignKey('contacts.Owner', on_delete=models.CASCADE, related_name='payouts')
    period_start = models.DateField()
    period_end = models.DateField()
    gross_rental_income = models.DecimalField(max_digits=12, decimal_places=2)
    management_fee = models.DecimalField(max_digits=12, decimal_places=2)
    maintenance_costs = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deduction_notes = models.TextField(blank=True)
    net_payout = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    paid_date = models.DateField(null=True, blank=True)
    reference_number = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['-period_end']

    def __str__(self):
        return f"Payout to {self.owner} for {self.period_start} - {self.period_end}"
