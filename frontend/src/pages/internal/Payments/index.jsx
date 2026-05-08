import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, DatePicker, Typography, Space, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getPayments, createPayment, getInvoices, getTenants } from '../../../api/endpoints';

export default function PaymentsPage() {
  const [data, setData] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetch = () => {
    setLoading(true);
    Promise.all([getPayments({ page_size: 200 }), getInvoices({ page_size: 500 }), getTenants({ page_size: 500 })])
      .then(([p, i, t]) => {
        setData(p.data.results || p.data);
        setInvoices(i.data.results || i.data);
        setTenants(t.data.results || t.data);
      }).finally(() => setLoading(false));
  };
  useEffect(fetch, []);

  const onSave = async (values) => {
    const payload = { ...values, payment_date: values.payment_date.format('YYYY-MM-DD') };
    try {
      await createPayment(payload);
      message.success('Payment recorded');
      setModalOpen(false); form.resetFields(); fetch();
    } catch { message.error('Save failed'); }
  };

  const columns = [
    { title: 'Invoice', render: (_, r) => r.invoice },
    { title: 'Tenant', render: (_, r) => r.tenant },
    { title: 'Amount', dataIndex: 'amount', render: v => `AED ${v}` },
    { title: 'Date', dataIndex: 'payment_date' },
    { title: 'Method', dataIndex: 'payment_method', render: v => <Tag>{v?.replace('_', ' ')}</Tag> },
    { title: 'Reference', dataIndex: 'reference_number' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4}>Payments</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>Record Payment</Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      <Modal title="Record Payment" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={onSave}>
          <Form.Item name="invoice" label="Invoice" rules={[{ required: true }]}>
            <Select options={invoices.map(i => ({ value: i.id, label: `${i.invoice_number} - AED ${i.amount}` }))} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="tenant" label="Tenant" rules={[{ required: true }]}>
            <Select options={tenants.map(t => ({ value: t.id, label: `${t.first_name} ${t.last_name}` }))} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="amount" label="Amount (AED)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="payment_date" label="Payment Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="payment_method" label="Method" initialValue="bank_transfer">
            <Select options={[{ value: 'cash', label: 'Cash' }, { value: 'bank_transfer', label: 'Bank Transfer' }, { value: 'check', label: 'Check' }, { value: 'online', label: 'Online' }, { value: 'card', label: 'Card' }]} />
          </Form.Item>
          <Form.Item name="reference_number" label="Reference #"><Input /></Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
