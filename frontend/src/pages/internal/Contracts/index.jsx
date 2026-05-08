import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, DatePicker, Typography, Space, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getContracts, createContract, updateContract, getUnits, getTenants, getOwners } from '../../../api/endpoints';

export default function ContractsPage() {
  const [data, setData] = useState([]);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const fetch = () => {
    setLoading(true);
    Promise.all([
      getContracts({ page_size: 200 }), getUnits({ page_size: 500 }),
      getTenants({ page_size: 500 }), getOwners({ page_size: 500 }),
    ]).then(([c, u, t, o]) => {
      setData(c.data.results || c.data);
      setUnits(u.data.results || u.data);
      setTenants(t.data.results || t.data);
      setOwners(o.data.results || o.data);
    }).finally(() => setLoading(false));
  };
  useEffect(fetch, []);

  const onSave = async (values) => {
    const payload = {
      ...values,
      start_date: values.start_date.format('YYYY-MM-DD'),
      end_date: values.end_date.format('YYYY-MM-DD'),
    };
    try {
      if (editing) await updateContract(editing.id, payload);
      else await createContract(payload);
      message.success(editing ? 'Contract updated' : 'Contract created');
      setModalOpen(false); setEditing(null); form.resetFields(); fetch();
    } catch { message.error('Save failed'); }
  };

  const statusColor = { active: 'green', pending: 'blue', expired: 'orange', terminated: 'red' };
  const columns = [
    { title: 'Contract #', dataIndex: 'contract_number' },
    { title: 'Property', dataIndex: 'property_name' },
    { title: 'Unit', dataIndex: 'unit_label' },
    { title: 'Tenant', dataIndex: 'tenant_name' },
    { title: 'Owner', dataIndex: 'owner_name' },
    { title: 'Monthly Rent', dataIndex: 'monthly_rent', render: v => `AED ${v}` },
    { title: 'Start', dataIndex: 'start_date' },
    { title: 'End', dataIndex: 'end_date' },
    { title: 'Status', dataIndex: 'status', render: v => <Tag color={statusColor[v]}>{v}</Tag> },
    {
      title: 'Actions', render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => {
            setEditing(r);
            form.setFieldsValue({ ...r, start_date: dayjs(r.start_date), end_date: dayjs(r.end_date) });
            setModalOpen(true);
          }} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4}>Contracts</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>Add Contract</Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: true }} />
      <Modal title={editing ? 'Edit Contract' : 'New Contract'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose width={700}>
        <Form form={form} layout="vertical" onFinish={onSave}>
          <Form.Item name="contract_number" label="Contract Number" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="unit" label="Unit" rules={[{ required: true }]}>
            <Select options={units.map(u => ({ value: u.id, label: `${u.property_name} - ${u.unit_number}` }))} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="tenant" label="Tenant" rules={[{ required: true }]}>
            <Select options={tenants.map(t => ({ value: t.id, label: `${t.first_name} ${t.last_name}` }))} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="owner" label="Owner" rules={[{ required: true }]}>
            <Select options={owners.map(o => ({ value: o.id, label: `${o.first_name} ${o.last_name}` }))} showSearch optionFilterProp="label" />
          </Form.Item>
          <Space>
            <Form.Item name="start_date" label="Start Date" rules={[{ required: true }]}><DatePicker /></Form.Item>
            <Form.Item name="end_date" label="End Date" rules={[{ required: true }]}><DatePicker /></Form.Item>
          </Space>
          <Form.Item name="monthly_rent" label="Monthly Rent (AED)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="security_deposit" label="Security Deposit (AED)" initialValue={0}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="management_fee_percentage" label="Management Fee %" initialValue={5}><InputNumber min={0} max={100} step={0.5} /></Form.Item>
          <Form.Item name="status" label="Status" initialValue="pending">
            <Select options={[{ value: 'pending', label: 'Pending' }, { value: 'active', label: 'Active' }, { value: 'expired', label: 'Expired' }, { value: 'terminated', label: 'Terminated' }]} />
          </Form.Item>
          <Form.Item name="terms" label="Terms"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
