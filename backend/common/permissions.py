from rest_framework.permissions import BasePermission


class IsStaff(BasePermission):
    """PQT internal team - full access."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ('admin', 'manager', 'staff')


class IsClient(BasePermission):
    """External client/owner - restricted view."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'client'


class IsStaffOrReadOnlyClient(BasePermission):
    """Staff can do everything; clients get read-only on their own data."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role in ('admin', 'manager', 'staff'):
            return True
        if request.user.role == 'client' and request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return False
