from django.urls import path
from . import views

urlpatterns = [
    # Internal PQT team dashboard
    path('internal/summary/', views.internal_summary, name='internal_summary'),
    path('internal/revenue-chart/', views.revenue_chart, name='revenue_chart'),
    # Client/Owner portal dashboard
    path('client/summary/', views.client_summary, name='client_summary'),
    path('client/income-breakdown/', views.client_income_breakdown, name='client_income_breakdown'),
]
