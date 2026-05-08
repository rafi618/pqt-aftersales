import { useState, useEffect } from 'react';
import { Table, Typography, Tag, Spin } from 'antd';
import { getContracts } from '../../../api/endpoints';

export default function ClientContracts() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContracts({ page_size: 200 }).then(r => setData(r.data.results || r.data)).finally(() => setLoading(false));
  }, []);

  const statusColor = { active: 'green', pending: 'blue', expired: 'orange', terminated: 'red' };
  const columns = [
    { title: 'Contract #', dataIndex: 'contract_number' },
    { title: 'Property', dataIndex: 'property_name' },
    { title: 'Unit', dataIndex: 'unit_label' },
    { title: 'Tenant', dataIndex: 'tenant_name' },
    { title: 'Monthly Rent', dataIndex: 'monthly_rent', render: v => `AED ${v}` },
    { title: 'Start', dataIndex: 'start_date' },
    { title: 'End', dataIndex: 'end_date' },
    { title: 'Status', dataIndex: 'status', render: v => <Tag color={statusColor[v]}>{v}</Tag> },
  ];

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <Typography.Title level={4}>My Contracts</Typography.Title>
      <Table columns={columns} dataSource={data} rowKey="id" scroll={{ x: true }} />
    </div>
  );
}
