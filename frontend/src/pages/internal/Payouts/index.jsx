import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, DatePicker, Typography, Space, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getPayouts, createPayout, updatePayout, getOwners } from '../../../api/endpoints';

export default function PayoutsPage() {
  const [data, setData] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const fetch = () => {
    setLoading(true);
    Promise.all([getPayouts({ page_size: 200 }), getOwners({ page_size: 500 })])
      .then(([p, o]) => { setData(p.data.results || p.data); setOwners(o.data.results || o.data); })
      .finally(() => setLoading(false));
  };
  useEffect(fetch, []);

  const onSave = async (values) => {
    const payload = {
      ...values,
      period_start: values.period_start.format('YYYY-MM-DD'),
      period_end: values.period_end.format('YYYY-MM-DD'),
      paid_date: values.paid_date?.format('YYYY-MM-DD') || null,
    };
    try {
      if (editing) await updatePayout(editing.id, payload);
      else await createPayout(payload);
      message.success(editing ? 'Payout updated' : 'Payout created');
      setModalOpen(false); setEditing(null); form.resetFields(); fetch();
    } catch { message.error('Save failed'); }
  };

  const statusColor = { pending: 'orange', processed: 'blue', paid: 'green' };
  const columns = [
    { title: 'Owner', dataIndex: 'owner_name' },
    { title: 'Period', render: (_, r) => `${r.period_start} to ${r.period_end}` },
    { title: 'Gross Rental', dataIndex: 'gross_rental_income', render: v => `AED ${v}` },
    { title: 'Mgmt Fee', dataIndex: 'management_fee', render: v => `AED ${v}` },
    { title: 'Maintenance', dataIndex: 'maintenance_costs', render: v => `AED ${v}` },
    { title: 'Tax', dataIndex: 'tax_amount', render: v => `AED ${v}` },
    { title: 'Other Deductions', dataIndex: 'other_deductions', render: v => `AED ${v}` },
    { title: 'Net Payout', dataIndex: 'net_payout', render: v => <strong>AED {v}</strong> },
    { title: 'Status', dataIndex: 'status', render: v => <Tag color={statusColor[v]}>{v}</Tag> },
    {
      title: 'Actions', render: (_, r) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => {
          setEditing(r);
          form.setFieldsValue({
            ...r, period_start: dayjs(r.period_start), period_end: dayjs(r.period_end),
            paid_date: r.paid_date ? dayjs(r.paid_date) : null,
          });
          setModalOpen(true);
        }} />
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4}>Owner Payouts</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>New Payout</Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: true }} />
      <Modal title={editing ? 'Edit Payout' : 'New Payout'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose width={700}>
        <Form form={form} layout="vertical" onFinish={onSave}>
          <Form.Item name="owner" label="Owner" rules={[{ required: true }]}>
            <Select options={owners.map(o => ({ value: o.id, label: `${o.first_name} ${o.last_name}` }))} showSearch optionFilterProp="label" />
          </Form.Item>
          <Space>
            <Form.Item name="period_start" label="Period Start" rules={[{ required: true }]}><DatePicker /></Form.Item>
            <Form.Item name="period_end" label="Period End" rules={[{ required: true }]}><DatePicker /></Form.Item>
          </Space>
          <Form.Item name="gross_rental_income" label="Gross Rental Income (AED)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="management_fee" label="Management Fee (AED)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="maintenance_costs" label="Maintenance Costs (AED)" initialValue={0}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="tax_amount" label="Tax (AED)" initialValue={0}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="other_deductions" label="Other Deductions (AED)" initialValue={0}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="deduction_notes" label="Deduction Notes"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="net_payout" label="Net Payout (AED)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="status" label="Status" initialValue="pending">
            <Select options={[{ value: 'pending', label: 'Pending' }, { value: 'processed', label: 'Processed' }, { value: 'paid', label: 'Paid' }]} />
          </Form.Item>
          <Form.Item name="paid_date" label="Paid Date"><DatePicker /></Form.Item>
          <Form.Item name="reference_number" label="Reference #"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
