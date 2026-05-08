import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin } from 'antd';
import {
  HomeOutlined, TeamOutlined, ToolOutlined, DollarOutlined,
  WarningOutlined, FileTextOutlined, UserOutlined,
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getInternalSummary, getRevenueChart } from '../../../api/endpoints';

export default function InternalDashboard() {
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getInternalSummary(), getRevenueChart()])
      .then(([s, c]) => { setSummary(s.data); setChartData(c.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const s = summary;
  return (
    <div>
      <Typography.Title level={4}>Internal Dashboard</Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} lg={4}>
          <Card><Statistic title="Properties" value={s.properties.total} prefix={<HomeOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card><Statistic title="Occupancy" value={s.properties.occupancy_rate} suffix="%" valueStyle={{ color: s.properties.occupancy_rate > 80 ? '#3f8600' : '#cf1322' }} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card><Statistic title="Occupied / Total" value={`${s.properties.occupied} / ${s.properties.total_units}`} prefix={<HomeOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card><Statistic title="Active Contracts" value={s.contracts.active} prefix={<FileTextOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card><Statistic title="Expiring (90d)" value={s.contracts.expiring_soon} prefix={<WarningOutlined />} valueStyle={{ color: s.contracts.expiring_soon > 0 ? '#faad14' : undefined }} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card><Statistic title="Open Tickets" value={s.maintenance.open_tickets} prefix={<ToolOutlined />} /></Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} sm={8} lg={4}>
          <Card><Statistic title="Monthly Revenue" value={s.finance.monthly_revenue} prefix={<DollarOutlined />} precision={2} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card><Statistic title="Mgmt Fees (Month)" value={s.finance.monthly_management_fees} prefix={<DollarOutlined />} precision={2} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card><Statistic title="Overdue Invoices" value={s.finance.overdue_invoices} prefix={<WarningOutlined />} valueStyle={{ color: s.finance.overdue_invoices > 0 ? '#cf1322' : undefined }} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card><Statistic title="Owners" value={s.contacts.total_owners} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card><Statistic title="Active Tenants" value={s.contacts.active_tenants} prefix={<UserOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card><Statistic title="Urgent Tickets" value={s.maintenance.urgent_tickets} prefix={<ToolOutlined />} valueStyle={{ color: s.maintenance.urgent_tickets > 0 ? '#cf1322' : undefined }} /></Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 24 }} title="Revenue & Management Fees (12 Months)">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#1890ff" name="Revenue" />
            <Line type="monotone" dataKey="management_fees" stroke="#52c41a" name="Management Fees" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
