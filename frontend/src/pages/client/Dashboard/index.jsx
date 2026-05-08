import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, Descriptions, Divider } from 'antd';
import {
  HomeOutlined, DollarOutlined, ToolOutlined, WarningOutlined,
  RiseOutlined, FallOutlined, BankOutlined,
} from '@ant-design/icons';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getClientSummary, getClientIncomeBreakdown } from '../../../api/endpoints';

export default function ClientDashboard() {
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getClientSummary(), getClientIncomeBreakdown()])
      .then(([s, c]) => { setSummary(s.data); setChartData(c.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const s = summary;
  const f = s.financials_ytd;

  return (
    <div>
      <Typography.Title level={4}>My Portfolio Dashboard</Typography.Title>

      {/* Portfolio Overview */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} lg={6}>
          <Card><Statistic title="My Properties" value={s.portfolio.total_properties} prefix={<HomeOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={6}>
          <Card><Statistic title="Total Units" value={s.portfolio.total_units} prefix={<HomeOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={6}>
          <Card><Statistic title="Occupied" value={s.portfolio.occupied} suffix={`/ ${s.portfolio.total_units}`} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={6}>
          <Card><Statistic title="Occupancy Rate" value={s.portfolio.occupancy_rate} suffix="%" valueStyle={{ color: s.portfolio.occupancy_rate > 80 ? '#3f8600' : '#cf1322' }} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} sm={8} lg={6}>
          <Card><Statistic title="Active Contracts" value={s.contracts.active} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={6}>
          <Card><Statistic title="Monthly Rent" value={s.contracts.total_monthly_rent} prefix="AED" precision={2} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={6}>
          <Card><Statistic title="Overdue Invoices" value={s.alerts.overdue_invoices} prefix={<WarningOutlined />} valueStyle={{ color: s.alerts.overdue_invoices > 0 ? '#cf1322' : '#3f8600' }} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={6}>
          <Card><Statistic title="Open Tickets" value={s.alerts.open_maintenance_tickets} prefix={<ToolOutlined />} /></Card>
        </Col>
      </Row>

      {/* YTD Financial Summary */}
      <Divider />
      <Typography.Title level={5}>Year-to-Date Financial Summary</Typography.Title>
      <Card>
        <Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }}>
          <Descriptions.Item label="Gross Rental Income">
            <span style={{ color: '#3f8600', fontWeight: 'bold' }}>AED {f.gross_rental_income.toLocaleString()}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Collected">
            <span style={{ fontWeight: 'bold' }}>AED {f.collected.toLocaleString()}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Management Fees">
            <span style={{ color: '#cf1322' }}>- AED {f.management_fees.toLocaleString()}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Tax / VAT">
            <span style={{ color: '#cf1322' }}>- AED {f.tax.toLocaleString()}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Maintenance Costs">
            <span style={{ color: '#cf1322' }}>- AED {f.maintenance_costs.toLocaleString()}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Net Income">
            <span style={{ color: f.net_income >= 0 ? '#3f8600' : '#cf1322', fontWeight: 'bold', fontSize: 16 }}>
              AED {f.net_income.toLocaleString()}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Total Payouts Received">
            <span style={{ fontWeight: 'bold' }}>AED {f.payouts.toLocaleString()}</span>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Monthly Income & Cost Chart */}
      <Card style={{ marginTop: 24 }} title="Monthly Income & Costs (12 Months)">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="rental_income" fill="#1890ff" name="Rental Income" />
            <Bar dataKey="management_fees" fill="#ff4d4f" name="Management Fees" />
            <Bar dataKey="tax" fill="#faad14" name="Tax" />
            <Bar dataKey="maintenance_costs" fill="#722ed1" name="Maintenance" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card style={{ marginTop: 16 }} title="Net Income Trend">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="net_income" stroke="#52c41a" strokeWidth={2} name="Net Income" />
            <Line type="monotone" dataKey="rental_income" stroke="#1890ff" strokeDasharray="5 5" name="Gross Income" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
