import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, Typography, Space, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getUnits, createUnit, updateUnit, deleteUnit, getProperties } from '../../../api/endpoints';

export default function UnitsPage() {
  const [data, setData] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const fetch = () => {
    setLoading(true);
    Promise.all([getUnits({ page_size: 200 }), getProperties({ page_size: 200 })])
      .then(([u, p]) => { setData(u.data.results || u.data); setProperties(p.data.results || p.data); })
      .finally(() => setLoading(false));
  };
  useEffect(fetch, []);

  const onSave = async (values) => {
    try {
      if (editing) await updateUnit(editing.id, values);
      else await createUnit(values);
      message.success(editing ? 'Unit updated' : 'Unit created');
      setModalOpen(false); setEditing(null); form.resetFields(); fetch();
    } catch { message.error('Save failed'); }
  };

  const statusColor = { vacant: 'green', occupied: 'blue', maintenance: 'orange' };
  const columns = [
    { title: 'Unit #', dataIndex: 'unit_number' },
    { title: 'Property', dataIndex: 'property_name' },
    { title: 'Floor', dataIndex: 'floor' },
    { title: 'Beds', dataIndex: 'bedrooms' },
    { title: 'Baths', dataIndex: 'bathrooms' },
    { title: 'Area (sqft)', dataIndex: 'area_sqft' },
    { title: 'Rent', dataIndex: 'rent_amount', render: v => `AED ${v}` },
    { title: 'Status', dataIndex: 'status', render: v => <Tag color={statusColor[v]}>{v}</Tag> },
    {
      title: 'Actions', render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue(r); setModalOpen(true); }} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => Modal.confirm({ title: 'Delete unit?', onOk: () => deleteUnit(r.id).then(fetch) })} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4}>Units</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>Add Unit</Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      <Modal title={editing ? 'Edit Unit' : 'New Unit'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={onSave}>
          <Form.Item name="property" label="Property" rules={[{ required: true }]}>
            <Select options={properties.map(p => ({ value: p.id, label: p.name }))} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="unit_number" label="Unit Number" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="floor" label="Floor"><Input /></Form.Item>
          <Form.Item name="bedrooms" label="Bedrooms" initialValue={0}><InputNumber min={0} /></Form.Item>
          <Form.Item name="bathrooms" label="Bathrooms" initialValue={0}><InputNumber min={0} /></Form.Item>
          <Form.Item name="area_sqft" label="Area (sqft)"><InputNumber min={0} /></Form.Item>
          <Form.Item name="rent_amount" label="Rent Amount (AED)" initialValue={0}><InputNumber min={0} /></Form.Item>
          <Form.Item name="status" label="Status" initialValue="vacant">
            <Select options={[{ value: 'vacant', label: 'Vacant' }, { value: 'occupied', label: 'Occupied' }, { value: 'maintenance', label: 'Under Maintenance' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
