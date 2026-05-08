import { useState, useEffect } from 'react';
import { Table, Typography, Tag, Spin, Card, Descriptions } from 'antd';
import { getInvoices } from '../../../api/endpoints';

export default function ClientInvoices() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInvoices({ page_size: 200 }).then(r => setData(r.data.results || r.data)).finally(() => setLoading(false));
  }, []);

  const statusColor = { draft: 'default', pending: 'blue', paid: 'green', overdue: 'red', cancelled: 'default' };
  const columns = [
    { title: 'Invoice #', dataIndex: 'invoice_number' },
    { title: 'Type', dataIndex: 'invoice_type', render: v => <Tag>{v?.replace('_', ' ')}</Tag> },
    { title: 'Property', dataIndex: 'property_name' },
    { title: 'Tenant', dataIndex: 'tenant_name' },
    { title: 'Rent Amount', dataIndex: 'amount', render: v => `AED ${v}` },
    { title: 'Tax', dataIndex: 'tax_amount', render: v => `AED ${v}` },
    { title: 'Mgmt Fee', dataIndex: 'management_fee', render: v => `AED ${v}` },
    { title: 'Net to You', dataIndex: 'net_to_owner', render: v => <strong>AED {v}</strong> },
    { title: 'Due', dataIndex: 'due_date' },
    { title: 'Status', dataIndex: 'status', render: v => <Tag color={statusColor[v]}>{v}</Tag> },
  ];

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const paid = data.filter(d => d.status === 'paid');
  const totalCollected = paid.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
  const totalFees = paid.reduce((s, d) => s + parseFloat(d.management_fee || 0), 0);
  const totalTax = paid.reduce((s, d) => s + parseFloat(d.tax_amount || 0), 0);
  const totalNet = paid.reduce((s, d) => s + parseFloat(d.net_to_owner || 0), 0);

  return (
    <div>
      <Typography.Title level={4}>Invoices & Income</Typography.Title>
      <Card style={{ marginBottom: 24 }}>
        <Descriptions bordered column={{ xs: 1, sm: 2, lg: 4 }}>
          <Descriptions.Item label="Total Collected"><strong>AED {totalCollected.toLocaleString()}</strong></Descriptions.Item>
          <Descriptions.Item label="Management Fees"><span style={{ color: '#cf1322' }}>AED {totalFees.toLocaleString()}</span></Descriptions.Item>
          <Descriptions.Item label="Tax"><span style={{ color: '#cf1322' }}>AED {totalTax.toLocaleString()}</span></Descriptions.Item>
          <Descriptions.Item label="Net to You"><span style={{ color: '#3f8600', fontWeight: 'bold' }}>AED {totalNet.toLocaleString()}</span></Descriptions.Item>
        </Descriptions>
      </Card>
      <Table columns={columns} dataSource={data} rowKey="id" scroll={{ x: true }} />
    </div>
  );
}
