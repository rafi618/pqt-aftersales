"""Seed the database with realistic demo data for the PQT After-Sales preview."""
import random
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.properties.models import Property, Unit
from apps.contacts.models import Owner, OwnerProperty, Tenant
from apps.contracts.models import Contract
from apps.maintenance.models import Ticket
from apps.finance.models import Invoice, Payment, OwnerPayout

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with demo data'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write('Seeding demo data...')

        # Ensure admin
        admin, _ = User.objects.get_or_create(
            email='admin@pqt.com',
            defaults={'username': 'admin', 'first_name': 'PQT', 'last_name': 'Admin', 'role': 'admin', 'is_staff': True, 'is_superuser': True},
        )
        if not admin.has_usable_password():
            admin.set_password('admin123'); admin.save()

        # Client user (links to first owner)
        client_user, _ = User.objects.get_or_create(
            email='owner@example.com',
            defaults={'username': 'owner1', 'first_name': 'Ahmed', 'last_name': 'Al-Mansoori', 'role': 'client'},
        )
        client_user.set_password('client123'); client_user.save()

        # Properties
        prop_data = [
            ('Marina Heights Tower', 'Dubai Marina, JBR Walk', 'Dubai', 'residential', 24),
            ('Business Bay Plaza', 'Sheikh Zayed Road', 'Dubai', 'commercial', 12),
            ('Palm Jumeirah Villas', 'Palm Jumeirah, Frond C', 'Dubai', 'residential', 8),
            ('Downtown Lofts', 'Downtown Dubai, Burj Khalifa District', 'Dubai', 'mixed', 16),
        ]
        properties = []
        for name, addr, city, ptype, units in prop_data:
            p, _ = Property.objects.get_or_create(
                name=name,
                defaults={'address': addr, 'city': city, 'country': 'UAE', 'property_type': ptype, 'total_units': units, 'status': 'active'},
            )
            properties.append(p)

        # Units
        units = []
        for prop in properties:
            for i in range(1, prop.total_units + 1):
                u, _ = Unit.objects.get_or_create(
                    property=prop, unit_number=f'{prop.name[:3].upper()}-{i:03d}',
                    defaults={
                        'floor': str((i // 4) + 1),
                        'bedrooms': random.choice([1, 2, 2, 3, 3, 4]),
                        'bathrooms': random.choice([1, 2, 2, 3]),
                        'area_sqft': Decimal(random.choice([850, 1200, 1500, 1800, 2200])),
                        'rent_amount': Decimal(random.choice([6000, 8000, 10000, 12000, 15000])),
                        'status': random.choices(['occupied', 'vacant', 'maintenance'], weights=[7, 2, 1])[0],
                    },
                )
                units.append(u)

        # Owners
        owner_data = [
            ('Ahmed', 'Al-Mansoori', 'owner@example.com', '+971 50 123 4567', 'Mansoori Holdings'),
            ('Fatima', 'Al-Hashimi', 'fatima@hashimi.ae', '+971 55 987 6543', 'Hashimi Investments'),
            ('John', 'Smith', 'john.smith@example.com', '+971 50 111 2222', ''),
            ('Sara', 'Khan', 'sara@khan.ae', '+971 56 333 4444', 'Khan Properties LLC'),
        ]
        owners = []
        for fn, ln, email, phone, company in owner_data:
            user_link = client_user if email == 'owner@example.com' else None
            o, _ = Owner.objects.get_or_create(
                email=email,
                defaults={'first_name': fn, 'last_name': ln, 'phone': phone, 'company_name': company,
                          'nationality': 'UAE' if email != 'john.smith@example.com' else 'UK',
                          'tax_id': f'1000{random.randint(10000, 99999)}', 'user': user_link},
            )
            owners.append(o)

        # Owner-Property links (Ahmed owns 2 properties)
        OwnerProperty.objects.get_or_create(owner=owners[0], property=properties[0], defaults={'ownership_percentage': Decimal('100'), 'acquired_date': date(2020, 1, 15)})
        OwnerProperty.objects.get_or_create(owner=owners[0], property=properties[2], defaults={'ownership_percentage': Decimal('100'), 'acquired_date': date(2021, 6, 1)})
        OwnerProperty.objects.get_or_create(owner=owners[1], property=properties[1], defaults={'ownership_percentage': Decimal('100'), 'acquired_date': date(2019, 3, 10)})
        OwnerProperty.objects.get_or_create(owner=owners[2], property=properties[3], defaults={'ownership_percentage': Decimal('100'), 'acquired_date': date(2022, 9, 20)})

        # Tenants
        tenant_data = [
            ('Mohammed', 'Hassan', 'mhassan@example.com', '+971 50 555 1111'),
            ('Priya', 'Sharma', 'priya@example.com', '+971 55 555 2222'),
            ('David', 'Lee', 'dlee@example.com', '+971 56 555 3333'),
            ('Aisha', 'Ali', 'aisha@example.com', '+971 50 555 4444'),
            ('James', 'Brown', 'jbrown@example.com', '+971 55 555 5555'),
            ('Layla', 'Ibrahim', 'layla@example.com', '+971 56 555 6666'),
            ('Chen', 'Wei', 'chenwei@example.com', '+971 50 555 7777'),
            ('Maria', 'Garcia', 'mgarcia@example.com', '+971 55 555 8888'),
        ]
        tenants = []
        for fn, ln, email, phone in tenant_data:
            t, _ = Tenant.objects.get_or_create(
                email=email,
                defaults={'first_name': fn, 'last_name': ln, 'phone': phone, 'status': 'active'},
            )
            tenants.append(t)

        # Contracts (one per occupied unit, capped at len(tenants))
        contracts = []
        occupied_units = [u for u in units if u.status == 'occupied'][:len(tenants)]
        for i, unit in enumerate(occupied_units):
            owner = next((op.owner for op in unit.property.owner_properties.all()), owners[0])
            start = date.today() - timedelta(days=random.randint(60, 400))
            c, _ = Contract.objects.get_or_create(
                contract_number=f'PQT-2024-{1000 + i}',
                defaults={
                    'unit': unit, 'tenant': tenants[i], 'owner': owner,
                    'start_date': start, 'end_date': start + timedelta(days=365),
                    'monthly_rent': unit.rent_amount,
                    'security_deposit': unit.rent_amount * 2,
                    'management_fee_percentage': Decimal('5.00'),
                    'status': 'active',
                },
            )
            contracts.append(c)

        # Invoices & payments — last 12 months
        today = date.today()
        for c in contracts:
            for m_offset in range(11, -1, -1):
                m = today.month - m_offset
                y = today.year
                while m <= 0:
                    m += 12; y -= 1
                period_start = date(y, m, 1)
                if m == 12:
                    period_end = date(y + 1, 1, 1) - timedelta(days=1)
                else:
                    period_end = date(y, m + 1, 1) - timedelta(days=1)

                if c.start_date > period_start:
                    continue

                rent = c.monthly_rent
                tax = round(rent * Decimal('0.05'), 2)  # 5% VAT
                mgmt_fee = round(rent * c.management_fee_percentage / 100, 2)
                net_to_owner = rent - mgmt_fee
                inv_status = 'paid' if m_offset > 1 else random.choice(['pending', 'paid', 'paid'])

                inv, created = Invoice.objects.get_or_create(
                    invoice_number=f'INV-{c.contract_number}-{y}{m:02d}',
                    defaults={
                        'invoice_type': 'rent', 'contract': c, 'unit': c.unit,
                        'tenant': c.tenant, 'owner': c.owner,
                        'amount': rent, 'tax_amount': tax,
                        'management_fee': mgmt_fee, 'net_to_owner': net_to_owner,
                        'period_start': period_start, 'period_end': period_end,
                        'issued_date': period_start, 'due_date': period_start + timedelta(days=14),
                        'paid_date': period_start + timedelta(days=random.randint(0, 13)) if inv_status == 'paid' else None,
                        'status': inv_status,
                        'description': f'Monthly rent for {c.unit}',
                    },
                )
                if created and inv_status == 'paid':
                    Payment.objects.create(
                        invoice=inv, tenant=c.tenant,
                        amount=inv.amount + inv.tax_amount,
                        payment_date=inv.paid_date,
                        payment_method=random.choice(['bank_transfer', 'online', 'check']),
                        reference_number=f'TXN{random.randint(100000, 999999)}',
                    )

        # Maintenance tickets
        ticket_data = [
            ('AC not cooling properly', 'Living room AC unit not blowing cold air', 'high', 'hvac', 'in_progress'),
            ('Leaking kitchen faucet', 'Slow drip from main kitchen tap', 'medium', 'plumbing', 'open'),
            ('Light fixture flickering', 'Bedroom ceiling light flickers intermittently', 'low', 'electrical', 'resolved'),
            ('Broken washing machine', 'Washing machine wont start', 'high', 'appliance', 'closed'),
            ('Wall paint peeling', 'Bathroom wall paint chipping near window', 'low', 'general', 'open'),
            ('Front door lock stuck', 'Cannot turn key in door lock', 'urgent', 'general', 'in_progress'),
            ('Cracked window glass', 'Living room window has small crack', 'medium', 'structural', 'open'),
            ('Drain blockage', 'Bathroom sink draining very slowly', 'medium', 'plumbing', 'closed'),
        ]
        for i, (title, desc, prio, cat, status) in enumerate(ticket_data):
            unit = random.choice(units)
            tenant = random.choice(tenants) if status != 'closed' else None
            cost = Decimal(random.choice([0, 150, 300, 500, 750, 1200])) if status in ('resolved', 'closed') else Decimal('0')
            t, _ = Ticket.objects.get_or_create(
                title=title,
                defaults={
                    'description': desc, 'unit': unit, 'reported_by_tenant': tenant,
                    'assigned_to': admin if status != 'open' else None,
                    'priority': prio, 'category': cat, 'status': status, 'cost': cost,
                    'resolved_at': today - timedelta(days=random.randint(1, 30)) if status in ('resolved', 'closed') else None,
                },
            )

        # Owner payouts (last 6 months for the linked client owner)
        for m_offset in range(5, -1, -1):
            m = today.month - m_offset
            y = today.year
            while m <= 0:
                m += 12; y -= 1
            period_start = date(y, m, 1)
            if m == 12:
                period_end = date(y + 1, 1, 1) - timedelta(days=1)
            else:
                period_end = date(y, m + 1, 1) - timedelta(days=1)

            owner_invoices = Invoice.objects.filter(
                owner=owners[0], status='paid',
                paid_date__gte=period_start, paid_date__lte=period_end,
            )
            gross = sum((i.amount for i in owner_invoices), Decimal('0'))
            mgmt = sum((i.management_fee for i in owner_invoices), Decimal('0'))
            tax = sum((i.tax_amount for i in owner_invoices), Decimal('0'))
            maint = Decimal(random.choice([0, 200, 500, 800]))
            net = gross - mgmt - tax - maint

            if gross > 0:
                OwnerPayout.objects.get_or_create(
                    owner=owners[0], period_start=period_start, period_end=period_end,
                    defaults={
                        'gross_rental_income': gross, 'management_fee': mgmt,
                        'maintenance_costs': maint, 'tax_amount': tax,
                        'other_deductions': Decimal('0'), 'net_payout': net,
                        'status': 'paid' if m_offset > 0 else 'processed',
                        'paid_date': period_end + timedelta(days=5) if m_offset > 0 else None,
                        'reference_number': f'PAY-{y}{m:02d}-{random.randint(1000, 9999)}',
                    },
                )

        self.stdout.write(self.style.SUCCESS(f'Seeded: {len(properties)} properties, {len(units)} units, '
                                              f'{len(owners)} owners, {len(tenants)} tenants, '
                                              f'{len(contracts)} contracts'))
        self.stdout.write(self.style.SUCCESS('Login: admin@pqt.com / admin123  (PQT internal)'))
        self.stdout.write(self.style.SUCCESS('Login: owner@example.com / client123  (Client portal)'))
