import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, DatePicker, Typography, Space, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getInvoices, createInvoice, updateInvoice, markInvoicePaid, getUnits, getTenants, getOwners, getContracts } from '../../../api/endpoints';

export default function InvoicesPage() {
  const [data, setData] = useState([]);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [owners, setOwners] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const fetch = () => {
    setLoading(true);
    Promise.all([
      getInvoices({ page_size: 200 }), getUnits({ page_size: 500 }),
      getTenants({ page_size: 500 }), getOwners({ page_size: 500 }),
      getContracts({ page_size: 500 }),
    ]).then(([inv, u, t, o, c]) => {
      setData(inv.data.results || inv.data);
      setUnits(u.data.results || u.data);
      setTenants(t.data.results || t.data);
      setOwners(o.data.results || o.data);
      setContracts(c.data.results || c.data);
    }).finally(() => setLoading(false));
  };
  useEffect(fetch, []);

  const onSave = async (values) => {
    const payload = {
      ...values,
      issued_date: values.issued_date.format('YYYY-MM-DD'),
      due_date: values.due_date.format('YYYY-MM-DD'),
      period_start: values.period_start?.format('YYYY-MM-DD') || null,
      period_end: values.period_end?.format('YYYY-MM-DD') || null,
    };
    try {
      if (editing) await updateInvoice(editing.id, payload);
      else await createInvoice(payload);
      message.success(editing ? 'Invoice updated' : 'Invoice created');
      setModalOpen(false); setEditing(null); form.resetFields(); fetch();
    } catch { message.error('Save failed'); }
  };

  const statusColor = { draft: 'default', pending: 'blue', paid: 'green', overdue: 'red', cancelled: 'default' };
  const columns = [
    { title: 'Invoice #', dataIndex: 'invoice_number' },
    { title: 'Type', dataIndex: 'invoice_type', render: v => <Tag>{v?.replace('_', ' ')}</Tag> },
    { title: 'Property', dataIndex: 'property_name' },
    { title: 'Tenant', dataIndex: 'tenant_name' },
    { title: 'Owner', dataIndex: 'owner_name' },
    { title: 'Amount', dataIndex: 'amount', render: v => `AED ${v}` },
    { title: 'Tax', dataIndex: 'tax_amount', render: v => `AED ${v}` },
    { title: 'Mgmt Fee', dataIndex: 'management_fee', render: v => `AED ${v}` },
    { title: 'Net to Owner', dataIndex: 'net_to_owner', render: v => `AED ${v}` },
    { title: 'Due', dataIndex: 'due_date' },
    { title: 'Status', dataIndex: 'status', render: v => <Tag color={statusColor[v]}>{v}</Tag> },
    {
      title: 'Actions', render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => {
            setEditing(r);
            form.setFieldsValue({
              ...r,
              issued_date: dayjs(r.issued_date), due_date: dayjs(r.due_date),
              period_start: r.period_start ? dayjs(r.period_start) : null,
              period_end: r.period_end ? dayjs(r.period_end) : null,
            });
            setModalOpen(true);
          }} />
          {r.status !== 'paid' && (
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => markInvoicePaid(r.id).then(() => { message.success('Marked paid'); fetch(); })} />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4}>Invoices</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>New Invoice</Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: true }} />
      <Modal title={editing ? 'Edit Invoice' : 'New Invoice'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose width={700}>
        <Form form={form} layout="vertical" onFinish={onSave}>
          <Form.Item name="invoice_number" label="Invoice Number" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="invoice_type" label="Type" initialValue="rent">
            <Select options={[{ value: 'rent', label: 'Rent' }, { value: 'management_fee', label: 'Management Fee' }, { value: 'maintenance', label: 'Maintenance' }, { value: 'other', label: 'Other' }]} />
          </Form.Item>
          <Form.Item name="contract" label="Contract">
            <Select allowClear options={contracts.map(c => ({ value: c.id, label: c.contract_number }))} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="unit" label="Unit" rules={[{ required: true }]}>
            <Select options={units.map(u => ({ value: u.id, label: `${u.property_name} - ${u.unit_number}` }))} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="tenant" label="Tenant" rules={[{ required: true }]}>
            <Select options={tenants.map(t => ({ value: t.id, label: `${t.first_name} ${t.last_name}` }))} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="owner" label="Owner" rules={[{ required: true }]}>
            <Select options={owners.map(o => ({ value: o.id, label: `${o.first_name} ${o.last_name}` }))} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="amount" label="Rent Amount (AED)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="tax_amount" label="Tax / VAT (AED)" initialValue={0}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="management_fee" label="Management Fee (AED)" initialValue={0}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="net_to_owner" label="Net to Owner (AED)" initialValue={0}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Space>
            <Form.Item name="period_start" label="Period Start"><DatePicker /></Form.Item>
            <Form.Item name="period_end" label="Period End"><DatePicker /></Form.Item>
          </Space>
          <Space>
            <Form.Item name="issued_date" label="Issued Date" rules={[{ required: true }]}><DatePicker /></Form.Item>
            <Form.Item name="due_date" label="Due Date" rules={[{ required: true }]}><DatePicker /></Form.Item>
          </Space>
          <Form.Item name="status" label="Status" initialValue="pending">
            <Select options={[{ value: 'draft', label: 'Draft' }, { value: 'pending', label: 'Pending' }, { value: 'paid', label: 'Paid' }, { value: 'overdue', label: 'Overdue' }, { value: 'cancelled', label: 'Cancelled' }]} />
          </Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
