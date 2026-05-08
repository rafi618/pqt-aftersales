from django.contrib import admin
from .models import Owner, OwnerProperty, Tenant


class OwnerPropertyInline(admin.TabularInline):
    model = OwnerProperty
    extra = 0


@admin.register(Owner)
class OwnerAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'email', 'phone', 'company_name')
    search_fields = ('first_name', 'last_name', 'email')
    inlines = [OwnerPropertyInline]


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'email', 'phone', 'status')
    list_filter = ('status',)
    search_fields = ('first_name', 'last_name', 'email')
