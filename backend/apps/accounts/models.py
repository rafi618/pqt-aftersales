from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        MANAGER = 'manager', 'Manager'
        STAFF = 'staff', 'Staff'
        CLIENT = 'client', 'Client'

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STAFF)
    phone = models.CharField(max_length=20, blank=True)
    company = models.CharField(max_length=200, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    @property
    def is_pqt_staff(self):
        return self.role in (self.Role.ADMIN, self.Role.MANAGER, self.Role.STAFF)

    @property
    def is_client(self):
        return self.role == self.Role.CLIENT
