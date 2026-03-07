-- Seed data for PQT After-Sales Management System

-- Customers
INSERT INTO Customer (id, name, email, phone, company, city, country, createdAt, updatedAt) VALUES
('cust_001', 'Ahmed Al-Rashid', 'ahmed@techcorp.com', '+966 50 123 4567', 'TechCorp Industries', 'Riyadh', 'Saudi Arabia', datetime('now'), datetime('now')),
('cust_002', 'Sara Khan', 'sara.khan@buildmax.com', '+971 55 987 6543', 'BuildMax Construction', 'Dubai', 'UAE', datetime('now'), datetime('now')),
('cust_003', 'Mohammed Al-Farsi', 'm.alfarsi@oilfield.com', '+968 99 456 7890', 'Oilfield Services LLC', 'Muscat', 'Oman', datetime('now'), datetime('now'));

-- Products
INSERT INTO Product (id, name, sku, category, description, warrantyMonths, createdAt, updatedAt) VALUES
('prod_001', 'PQT Industrial Pump X200', 'PQT-PUMP-X200', 'Pumps', 'High-performance industrial pump for heavy-duty applications', 24, datetime('now'), datetime('now')),
('prod_002', 'PQT Compressor C500', 'PQT-COMP-C500', 'Compressors', 'Heavy-duty air compressor for industrial use', 18, datetime('now'), datetime('now')),
('prod_003', 'PQT Generator G1000', 'PQT-GEN-G1000', 'Generators', '1000W industrial power generator', 12, datetime('now'), datetime('now'));

-- Tickets
INSERT INTO Ticket (id, ticketNo, subject, description, status, priority, category, customerId, productId, assignedTo, createdAt, updatedAt) VALUES
('tkt_001', 'TKT-001', 'Pump X200 vibration issue', 'Customer reports unusual vibration at high RPM. Unit has been in service for 6 months.', 'open', 'high', 'repair', 'cust_001', 'prod_001', 'Ali Hassan', datetime('now'), datetime('now')),
('tkt_002', 'TKT-002', 'Compressor C500 installation request', 'New unit purchased. Customer needs on-site installation and commissioning.', 'in-progress', 'medium', 'installation', 'cust_002', 'prod_002', 'Yousef Ahmed', datetime('now'), datetime('now')),
('tkt_003', 'TKT-003', 'Generator maintenance schedule', 'Annual maintenance due for 3 generator units.', 'open', 'low', 'maintenance', 'cust_003', 'prod_003', NULL, datetime('now'), datetime('now')),
('tkt_004', 'TKT-004', 'Pump leaking from seal', 'Oil leak detected at the main shaft seal. Needs urgent replacement.', 'open', 'critical', 'repair', 'cust_003', 'prod_001', 'Ali Hassan', datetime('now'), datetime('now')),
('tkt_005', 'TKT-005', 'Compressor noise complaint', 'Customer says unit is louder than specified in manual.', 'resolved', 'medium', 'complaint', 'cust_001', 'prod_002', NULL, datetime('now'), datetime('now'));

-- Warranty Claims
INSERT INTO WarrantyClaim (id, claimNo, status, issueDescription, resolution, purchaseDate, expiryDate, customerId, productId, createdAt, updatedAt) VALUES
('wrc_001', 'WRC-001', 'pending', 'Motor burned out within warranty period', NULL, '2025-06-15', '2027-06-15', 'cust_001', 'prod_001', datetime('now'), datetime('now')),
('wrc_002', 'WRC-002', 'approved', 'Control panel malfunction', 'Replacement panel to be shipped', '2025-09-01', '2027-03-01', 'cust_002', 'prod_002', datetime('now'), datetime('now')),
('wrc_003', 'WRC-003', 'rejected', 'Generator fuel tank damage', 'Damage caused by improper handling - not covered under warranty', '2025-03-20', '2026-03-20', 'cust_003', 'prod_003', datetime('now'), datetime('now'));

-- Parts
INSERT INTO Part (id, name, partNo, description, quantity, minStock, unitPrice, location, productId, createdAt, updatedAt) VALUES
('prt_001', 'Shaft Seal Assembly', 'PRT-SEAL-001', 'Main shaft seal for X200 pump series', 15, 5, 245.00, 'Warehouse A - Shelf 2', 'prod_001', datetime('now'), datetime('now')),
('prt_002', 'Impeller Blade Set', 'PRT-IMPL-002', 'Replacement impeller blades for pump X200', 8, 3, 520.00, 'Warehouse A - Shelf 3', 'prod_001', datetime('now'), datetime('now')),
('prt_003', 'Air Filter Element', 'PRT-FILT-003', 'Replacement air filter for C500 compressor', 25, 10, 85.00, 'Warehouse B - Shelf 1', 'prod_002', datetime('now'), datetime('now')),
('prt_004', 'Control Board PCB', 'PRT-PCB-004', 'Main control board for C500 compressor', 3, 5, 890.00, 'Warehouse B - Shelf 5', 'prod_002', datetime('now'), datetime('now')),
('prt_005', 'Spark Plug Set', 'PRT-SPRK-005', 'Spark plug set for G1000 generator', 20, 8, 45.00, 'Warehouse C - Shelf 1', 'prod_003', datetime('now'), datetime('now')),
('prt_006', 'Fuel Pump Assembly', 'PRT-FUEL-006', 'Fuel pump for G1000 generator', 2, 3, 375.00, 'Warehouse C - Shelf 3', 'prod_003', datetime('now'), datetime('now'));
