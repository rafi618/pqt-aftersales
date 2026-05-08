from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.properties.models import Property, Unit
from apps.contacts.models import Owner, Tenant
from apps.contracts.models import Contract
from apps.maintenance.models import Ticket
from apps.finance.models import Invoice, Payment, OwnerPayout


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def internal_summary(request):
    """PQT internal dashboard - full system overview."""
    today = date.today()
    month_start = today.replace(day=1)

    total_properties = Property.objects.filter(status='active').count()
    total_units = Unit.objects.count()
    occupied = Unit.objects.filter(status='occupied').count()
    vacant = Unit.objects.filter(status='vacant').count()
    occupancy_rate = round(occupied / total_units * 100, 1) if total_units else 0

    active_contracts = Contract.objects.filter(status='active').count()
    expiring_soon = Contract.objects.filter(
        status='active', end_date__lte=today + timedelta(days=90), end_date__gte=today,
    ).count()

    open_tickets = Ticket.objects.filter(status__in=['open', 'in_progress']).count()
    urgent_tickets = Ticket.objects.filter(status__in=['open', 'in_progress'], priority='urgent').count()

    monthly_revenue = Invoice.objects.filter(
        status='paid', paid_date__gte=month_start, paid_date__lte=today,
    ).aggregate(total=Sum('amount'))['total'] or 0

    monthly_fees = Invoice.objects.filter(
        status='paid', paid_date__gte=month_start, paid_date__lte=today,
    ).aggregate(total=Sum('management_fee'))['total'] or 0

    overdue_invoices = Invoice.objects.filter(status='overdue').count()
    overdue_amount = Invoice.objects.filter(status='overdue').aggregate(total=Sum('amount'))['total'] or 0

    total_owners = Owner.objects.count()
    total_tenants = Tenant.objects.filter(status='active').count()

    return Response({
        'properties': {
            'total': total_properties,
            'total_units': total_units,
            'occupied': occupied,
            'vacant': vacant,
            'occupancy_rate': occupancy_rate,
        },
        'contracts': {
            'active': active_contracts,
            'expiring_soon': expiring_soon,
        },
        'maintenance': {
            'open_tickets': open_tickets,
            'urgent_tickets': urgent_tickets,
        },
        'finance': {
            'monthly_revenue': monthly_revenue,
            'monthly_management_fees': monthly_fees,
            'overdue_invoices': overdue_invoices,
            'overdue_amount': overdue_amount,
        },
        'contacts': {
            'total_owners': total_owners,
            'active_tenants': total_tenants,
        },
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def revenue_chart(request):
    """Monthly revenue data for the last 12 months."""
    today = date.today()
    data = []
    for i in range(11, -1, -1):
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1
        month_start = date(y, m, 1)
        if m == 12:
            month_end = date(y + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = date(y, m + 1, 1) - timedelta(days=1)

        revenue = Invoice.objects.filter(
            status='paid', paid_date__gte=month_start, paid_date__lte=month_end,
        ).aggregate(total=Sum('amount'))['total'] or 0

        fees = Invoice.objects.filter(
            status='paid', paid_date__gte=month_start, paid_date__lte=month_end,
        ).aggregate(total=Sum('management_fee'))['total'] or 0

        data.append({
            'month': month_start.strftime('%b %Y'),
            'revenue': float(revenue),
            'management_fees': float(fees),
        })
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_summary(request):
    """Client portal dashboard - owner's property performance."""
    if not hasattr(request.user, 'owner_profile'):
        return Response({'detail': 'No owner profile linked.'}, status=400)

    owner = request.user.owner_profile
    today = date.today()
    month_start = today.replace(day=1)

    properties = Property.objects.filter(owner_properties__owner=owner)
    units = Unit.objects.filter(property__in=properties)
    total_units = units.count()
    occupied = units.filter(status='occupied').count()
    occupancy_rate = round(occupied / total_units * 100, 1) if total_units else 0

    active_contracts = Contract.objects.filter(owner=owner, status='active')
    total_monthly_rent = active_contracts.aggregate(total=Sum('monthly_rent'))['total'] or 0

    # Income & costs breakdown
    total_invoiced = Invoice.objects.filter(
        owner=owner, issued_date__year=today.year,
    ).aggregate(total=Sum('amount'))['total'] or 0

    total_collected = Invoice.objects.filter(
        owner=owner, status='paid', paid_date__year=today.year,
    ).aggregate(total=Sum('amount'))['total'] or 0

    total_management_fees = Invoice.objects.filter(
        owner=owner, status='paid', paid_date__year=today.year,
    ).aggregate(total=Sum('management_fee'))['total'] or 0

    total_tax = Invoice.objects.filter(
        owner=owner, status='paid', paid_date__year=today.year,
    ).aggregate(total=Sum('tax_amount'))['total'] or 0

    maintenance_costs = Ticket.objects.filter(
        unit__property__in=properties, status='closed',
    ).filter(
        resolved_at__year=today.year,
    ).aggregate(total=Sum('cost'))['total'] or 0

    net_income = float(total_collected) - float(total_management_fees) - float(total_tax) - float(maintenance_costs)

    overdue = Invoice.objects.filter(owner=owner, status='overdue').count()

    open_tickets = Ticket.objects.filter(
        unit__property__in=properties, status__in=['open', 'in_progress'],
    ).count()

    # Payouts
    payouts_ytd = OwnerPayout.objects.filter(
        owner=owner, status='paid', period_start__year=today.year,
    ).aggregate(total=Sum('net_payout'))['total'] or 0

    return Response({
        'portfolio': {
            'total_properties': properties.count(),
            'total_units': total_units,
            'occupied': occupied,
            'occupancy_rate': occupancy_rate,
        },
        'contracts': {
            'active': active_contracts.count(),
            'total_monthly_rent': float(total_monthly_rent),
        },
        'financials_ytd': {
            'gross_rental_income': float(total_invoiced),
            'collected': float(total_collected),
            'management_fees': float(total_management_fees),
            'tax': float(total_tax),
            'maintenance_costs': float(maintenance_costs),
            'net_income': net_income,
            'payouts': float(payouts_ytd),
        },
        'alerts': {
            'overdue_invoices': overdue,
            'open_maintenance_tickets': open_tickets,
        },
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_income_breakdown(request):
    """Monthly income/costs breakdown for the client's properties."""
    if not hasattr(request.user, 'owner_profile'):
        return Response({'detail': 'No owner profile linked.'}, status=400)

    owner = request.user.owner_profile
    today = date.today()
    properties = Property.objects.filter(owner_properties__owner=owner)
    data = []

    for i in range(11, -1, -1):
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1
        month_start = date(y, m, 1)
        if m == 12:
            month_end = date(y + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = date(y, m + 1, 1) - timedelta(days=1)

        invoices = Invoice.objects.filter(
            owner=owner, status='paid',
            paid_date__gte=month_start, paid_date__lte=month_end,
        )
        rental = invoices.aggregate(t=Sum('amount'))['t'] or 0
        fees = invoices.aggregate(t=Sum('management_fee'))['t'] or 0
        tax = invoices.aggregate(t=Sum('tax_amount'))['t'] or 0

        maint = Ticket.objects.filter(
            unit__property__in=properties, status='closed',
            resolved_at__gte=month_start, resolved_at__lte=month_end,
        ).aggregate(t=Sum('cost'))['t'] or 0

        data.append({
            'month': month_start.strftime('%b %Y'),
            'rental_income': float(rental),
            'management_fees': float(fees),
            'tax': float(tax),
            'maintenance_costs': float(maint),
            'net_income': float(rental) - float(fees) - float(tax) - float(maint),
        })

    return Response(data)
