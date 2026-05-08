import { useState, useEffect } from 'react';
import { Table, Typography, Tag, Spin, Card, Descriptions } from 'antd';
import { getPayouts } from '../../../api/endpoints';

export default function ClientPayouts() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPayouts({ page_size: 200 }).then(r => setData(r.data.results || r.data)).finally(() => setLoading(false));
  }, []);

  const statusColor = { pending: 'orange', processed: 'blue', paid: 'green' };
  const columns = [
    { title: 'Period', render: (_, r) => `${r.period_start} to ${r.period_end}` },
    { title: 'Gross Rental', dataIndex: 'gross_rental_income', render: v => `AED ${v}` },
    { title: 'Mgmt Fee', dataIndex: 'management_fee', render: v => <span style={{ color: '#cf1322' }}>- AED {v}</span> },
    { title: 'Maintenance', dataIndex: 'maintenance_costs', render: v => v > 0 ? <span style={{ color: '#cf1322' }}>- AED {v}</span> : '-' },
    { title: 'Tax', dataIndex: 'tax_amount', render: v => v > 0 ? <span style={{ color: '#cf1322' }}>- AED {v}</span> : '-' },
    { title: 'Other Deductions', dataIndex: 'other_deductions', render: v => v > 0 ? <span style={{ color: '#cf1322' }}>- AED {v}</span> : '-' },
    { title: 'Net Payout', dataIndex: 'net_payout', render: v => <strong style={{ color: '#3f8600' }}>AED {v}</strong> },
    { title: 'Status', dataIndex: 'status', render: v => <Tag color={statusColor[v]}>{v}</Tag> },
    { title: 'Paid Date', dataIndex: 'paid_date', render: v => v || '-' },
    { title: 'Reference', dataIndex: 'reference_number' },
  ];

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const paidPayouts = data.filter(d => d.status === 'paid');
  const totalPaid = paidPayouts.reduce((s, d) => s + parseFloat(d.net_payout || 0), 0);
  const totalGross = data.reduce((s, d) => s + parseFloat(d.gross_rental_income || 0), 0);
  const totalDeductions = data.reduce((s, d) =>
    s + parseFloat(d.management_fee || 0) + parseFloat(d.maintenance_costs || 0) +
    parseFloat(d.tax_amount || 0) + parseFloat(d.other_deductions || 0), 0);

  return (
    <div>
      <Typography.Title level={4}>My Payouts</Typography.Title>
      <Card style={{ marginBottom: 24 }}>
        <Descriptions bordered column={{ xs: 1, sm: 3 }}>
          <Descriptions.Item label="Total Gross Income"><strong>AED {totalGross.toLocaleString()}</strong></Descriptions.Item>
          <Descriptions.Item label="Total Deductions"><span style={{ color: '#cf1322' }}>AED {totalDeductions.toLocaleString()}</span></Descriptions.Item>
          <Descriptions.Item label="Total Paid Out"><span style={{ color: '#3f8600', fontWeight: 'bold', fontSize: 16 }}>AED {totalPaid.toLocaleString()}</span></Descriptions.Item>
        </Descriptions>
      </Card>
      <Table columns={columns} dataSource={data} rowKey="id" scroll={{ x: true }} />
    </div>
  );
}
