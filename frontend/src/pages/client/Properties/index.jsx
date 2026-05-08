import { useState, useEffect } from 'react';
import { Table, Card, Typography, Tag, Spin } from 'antd';
import { getProperties, getUnits } from '../../../api/endpoints';

export default function ClientProperties() {
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProperties({ page_size: 200 }), getUnits({ page_size: 500 })])
      .then(([p, u]) => {
        setProperties(p.data.results || p.data);
        setUnits(u.data.results || u.data);
      }).finally(() => setLoading(false));
  }, []);

  const statusColor = { vacant: 'green', occupied: 'blue', maintenance: 'orange' };

  const propColumns = [
    { title: 'Property', dataIndex: 'name' },
    { title: 'City', dataIndex: 'city' },
    { title: 'Type', dataIndex: 'property_type', render: v => <Tag>{v}</Tag> },
    { title: 'Total Units', dataIndex: 'total_units' },
    { title: 'Occupancy', dataIndex: 'occupancy_rate', render: v => v !== undefined ? `${v}%` : '-' },
    { title: 'Status', dataIndex: 'status', render: v => <Tag color={v === 'active' ? 'green' : 'red'}>{v}</Tag> },
  ];

  const unitColumns = [
    { title: 'Unit', dataIndex: 'unit_number' },
    { title: 'Property', dataIndex: 'property_name' },
    { title: 'Floor', dataIndex: 'floor' },
    { title: 'Beds', dataIndex: 'bedrooms' },
    { title: 'Rent (AED)', dataIndex: 'rent_amount' },
    { title: 'Status', dataIndex: 'status', render: v => <Tag color={statusColor[v]}>{v}</Tag> },
  ];

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <Typography.Title level={4}>My Properties</Typography.Title>
      <Card title="Properties" style={{ marginBottom: 24 }}>
        <Table columns={propColumns} dataSource={properties} rowKey="id" pagination={false} />
      </Card>
      <Card title="Units">
        <Table columns={unitColumns} dataSource={units} rowKey="id" />
      </Card>
    </div>
  );
}
