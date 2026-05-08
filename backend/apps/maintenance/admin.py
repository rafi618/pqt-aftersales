from django.contrib import admin
from .models import Ticket, TicketComment


class CommentInline(admin.TabularInline):
    model = TicketComment
    extra = 0


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('title', 'unit', 'priority', 'status', 'category', 'cost', 'created_at')
    list_filter = ('status', 'priority', 'category')
    search_fields = ('title', 'description')
    inlines = [CommentInline]
