import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, Typography, Space, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { getTickets, createTicket, updateTicket, getUnits, getTenants, getUsers } from '../../../api/endpoints';

export default function MaintenancePage() {
  const [data, setData] = useState([]);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const fetch = () => {
    setLoading(true);
    Promise.all([getTickets({ page_size: 200 }), getUnits({ page_size: 500 }), getTenants({ page_size: 500 }), getUsers({ role: 'staff', page_size: 100 })])
      .then(([t, u, tn, s]) => {
        setData(t.data.results || t.data);
        setUnits(u.data.results || u.data);
        setTenants(tn.data.results || tn.data);
        setStaff(s.data.results || s.data);
      }).finally(() => setLoading(false));
  };
  useEffect(fetch, []);

  const onSave = async (values) => {
    try {
      if (editing) await updateTicket(editing.id, values);
      else await createTicket(values);
      message.success(editing ? 'Ticket updated' : 'Ticket created');
      setModalOpen(false); setEditing(null); form.resetFields(); fetch();
    } catch { message.error('Save failed'); }
  };

  const priorityColor = { low: 'blue', medium: 'orange', high: 'red', urgent: 'magenta' };
  const statusColor = { open: 'orange', in_progress: 'blue', resolved: 'green', closed: 'default' };

  const columns = [
    { title: 'Title', dataIndex: 'title' },
    { title: 'Property', dataIndex: 'property_name' },
    { title: 'Unit', dataIndex: 'unit_label' },
    { title: 'Priority', dataIndex: 'priority', render: v => <Tag color={priorityColor[v]}>{v}</Tag> },
    { title: 'Status', dataIndex: 'status', render: v => <Tag color={statusColor[v]}>{v?.replace('_', ' ')}</Tag> },
    { title: 'Category', dataIndex: 'category' },
    { title: 'Cost', dataIndex: 'cost', render: v => v > 0 ? `AED ${v}` : '-' },
    { title: 'Created', dataIndex: 'created_at', render: v => v?.slice(0, 10) },
    {
      title: 'Actions', render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue(r); setModalOpen(true); }} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4}>Maintenance Tickets</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>New Ticket</Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: true }} />
      <Modal title={editing ? 'Edit Ticket' : 'New Ticket'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose width={600}>
        <Form form={form} layout="vertical" onFinish={onSave}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="unit" label="Unit" rules={[{ required: true }]}>
            <Select options={units.map(u => ({ value: u.id, label: `${u.property_name} - ${u.unit_number}` }))} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="reported_by_tenant" label="Reported By (Tenant)">
            <Select allowClear options={tenants.map(t => ({ value: t.id, label: `${t.first_name} ${t.last_name}` }))} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="assigned_to" label="Assigned To">
            <Select allowClear options={staff.map(s => ({ value: s.id, label: `${s.first_name} ${s.last_name}` }))} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="priority" label="Priority" initialValue="medium">
            <Select options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]} />
          </Form.Item>
          <Form.Item name="category" label="Category" initialValue="general">
            <Select options={[{ value: 'plumbing', label: 'Plumbing' }, { value: 'electrical', label: 'Electrical' }, { value: 'hvac', label: 'HVAC' }, { value: 'structural', label: 'Structural' }, { value: 'appliance', label: 'Appliance' }, { value: 'cleaning', label: 'Cleaning' }, { value: 'general', label: 'General' }]} />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="open">
            <Select options={[{ value: 'open', label: 'Open' }, { value: 'in_progress', label: 'In Progress' }, { value: 'resolved', label: 'Resolved' }, { value: 'closed', label: 'Closed' }]} />
          </Form.Item>
          <Form.Item name="cost" label="Cost (AED)" initialValue={0}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
