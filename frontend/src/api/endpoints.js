import API from './axios';

// Auth
export const login = (email, password) =>
  API.post('/auth/login/', { email, password });
export const getMe = () => API.get('/auth/me/');
export const getUsers = (params) => API.get('/auth/users/', { params });

// Properties
export const getProperties = (params) => API.get('/properties/', { params });
export const getProperty = (id) => API.get(`/properties/${id}/`);
export const createProperty = (data) => API.post('/properties/', data);
export const updateProperty = (id, data) => API.put(`/properties/${id}/`, data);
export const deleteProperty = (id) => API.delete(`/properties/${id}/`);

// Units
export const getUnits = (params) => API.get('/properties/units/', { params });
export const getUnit = (id) => API.get(`/properties/units/${id}/`);
export const createUnit = (data) => API.post('/properties/units/', data);
export const updateUnit = (id, data) => API.put(`/properties/units/${id}/`, data);
export const deleteUnit = (id) => API.delete(`/properties/units/${id}/`);

// Owners
export const getOwners = (params) => API.get('/contacts/owners/', { params });
export const getOwner = (id) => API.get(`/contacts/owners/${id}/`);
export const createOwner = (data) => API.post('/contacts/owners/', data);
export const updateOwner = (id, data) => API.put(`/contacts/owners/${id}/`, data);

// Owner-Property
export const getOwnerProperties = (params) => API.get('/contacts/owner-properties/', { params });
export const createOwnerProperty = (data) => API.post('/contacts/owner-properties/', data);

// Tenants
export const getTenants = (params) => API.get('/contacts/tenants/', { params });
export const getTenant = (id) => API.get(`/contacts/tenants/${id}/`);
export const createTenant = (data) => API.post('/contacts/tenants/', data);
export const updateTenant = (id, data) => API.put(`/contacts/tenants/${id}/`, data);

// Contracts
export const getContracts = (params) => API.get('/contracts/', { params });
export const getContract = (id) => API.get(`/contracts/${id}/`);
export const createContract = (data) => API.post('/contracts/', data);
export const updateContract = (id, data) => API.put(`/contracts/${id}/`, data);

// Maintenance
export const getTickets = (params) => API.get('/maintenance/tickets/', { params });
export const getTicket = (id) => API.get(`/maintenance/tickets/${id}/`);
export const createTicket = (data) => API.post('/maintenance/tickets/', data);
export const updateTicket = (id, data) => API.put(`/maintenance/tickets/${id}/`, data);
export const addTicketComment = (id, data) => API.post(`/maintenance/tickets/${id}/add_comment/`, data);

// Invoices
export const getInvoices = (params) => API.get('/finance/invoices/', { params });
export const getInvoice = (id) => API.get(`/finance/invoices/${id}/`);
export const createInvoice = (data) => API.post('/finance/invoices/', data);
export const updateInvoice = (id, data) => API.put(`/finance/invoices/${id}/`, data);
export const markInvoicePaid = (id) => API.post(`/finance/invoices/${id}/mark_paid/`);

// Payments
export const getPayments = (params) => API.get('/finance/payments/', { params });
export const createPayment = (data) => API.post('/finance/payments/', data);

// Payouts
export const getPayouts = (params) => API.get('/finance/payouts/', { params });
export const createPayout = (data) => API.post('/finance/payouts/', data);
export const updatePayout = (id, data) => API.put(`/finance/payouts/${id}/`, data);

// Dashboard
export const getInternalSummary = () => API.get('/dashboard/internal/summary/');
export const getRevenueChart = () => API.get('/dashboard/internal/revenue-chart/');
export const getClientSummary = () => API.get('/dashboard/client/summary/');
export const getClientIncomeBreakdown = () => API.get('/dashboard/client/income-breakdown/');
