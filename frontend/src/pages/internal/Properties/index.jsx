import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, Typography, Space, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getProperties, createProperty, updateProperty, deleteProperty } from '../../../api/endpoints';

export default function PropertiesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const fetch = () => {
    setLoading(true);
    getProperties({ page_size: 100 }).then(r => setData(r.data.results || r.data)).finally(() => setLoading(false));
  };
  useEffect(fetch, []);

  const onSave = async (values) => {
    try {
      if (editing) await updateProperty(editing.id, values);
      else await createProperty(values);
      message.success(editing ? 'Property updated' : 'Property created');
      setModalOpen(false); setEditing(null); form.resetFields(); fetch();
    } catch { message.error('Save failed'); }
  };

  const onDelete = async (id) => {
    await deleteProperty(id); message.success('Deleted'); fetch();
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: 'City', dataIndex: 'city' },
    { title: 'Type', dataIndex: 'property_type', render: v => <Tag>{v}</Tag> },
    { title: 'Units', dataIndex: 'total_units' },
    { title: 'Occupancy', dataIndex: 'occupancy_rate', render: v => v !== undefined ? `${v}%` : '-' },
    { title: 'Status', dataIndex: 'status', render: v => <Tag color={v === 'active' ? 'green' : 'red'}>{v}</Tag> },
    {
      title: 'Actions', render: (_, r) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/internal/properties/${r.id}`)} />
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue(r); setModalOpen(true); }} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => Modal.confirm({ title: 'Delete property?', onOk: () => onDelete(r.id) })} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4}>Properties</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>Add Property</Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      <Modal title={editing ? 'Edit Property' : 'New Property'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={onSave}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="address" label="Address" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="city" label="City" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="state" label="State"><Input /></Form.Item>
          <Form.Item name="country" label="Country" initialValue="UAE"><Input /></Form.Item>
          <Form.Item name="property_type" label="Type" initialValue="residential">
            <Select options={[{ value: 'residential', label: 'Residential' }, { value: 'commercial', label: 'Commercial' }, { value: 'mixed', label: 'Mixed Use' }]} />
          </Form.Item>
          <Form.Item name="total_units" label="Total Units" initialValue={1}><InputNumber min={1} /></Form.Item>
          <Form.Item name="status" label="Status" initialValue="active">
            <Select options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
          </Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
