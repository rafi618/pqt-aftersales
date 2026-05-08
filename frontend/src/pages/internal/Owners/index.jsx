import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Typography, Space, message } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { getOwners, createOwner, updateOwner } from '../../../api/endpoints';

export default function OwnersPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const fetch = () => {
    setLoading(true);
    getOwners({ page_size: 200 }).then(r => setData(r.data.results || r.data)).finally(() => setLoading(false));
  };
  useEffect(fetch, []);

  const onSave = async (values) => {
    try {
      if (editing) await updateOwner(editing.id, values);
      else await createOwner(values);
      message.success(editing ? 'Owner updated' : 'Owner created');
      setModalOpen(false); setEditing(null); form.resetFields(); fetch();
    } catch { message.error('Save failed'); }
  };

  const columns = [
    { title: 'Name', render: (_, r) => `${r.first_name} ${r.last_name}` },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Phone', dataIndex: 'phone' },
    { title: 'Company', dataIndex: 'company_name' },
    { title: 'Nationality', dataIndex: 'nationality' },
    { title: 'Properties', dataIndex: 'property_count' },
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
        <Typography.Title level={4}>Owners</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>Add Owner</Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      <Modal title={editing ? 'Edit Owner' : 'New Owner'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose width={600}>
        <Form form={form} layout="vertical" onFinish={onSave}>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="first_name" label="First Name" rules={[{ required: true }]} style={{ width: '50%' }}><Input /></Form.Item>
            <Form.Item name="last_name" label="Last Name" rules={[{ required: true }]} style={{ width: '50%' }}><Input /></Form.Item>
          </Space.Compact>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="phone" label="Phone"><Input /></Form.Item>
          <Form.Item name="company_name" label="Company"><Input /></Form.Item>
          <Form.Item name="nationality" label="Nationality"><Input /></Form.Item>
          <Form.Item name="id_number" label="ID / Passport"><Input /></Form.Item>
          <Form.Item name="tax_id" label="Tax Registration Number (TRN)"><Input /></Form.Item>
          <Form.Item name="address" label="Address"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
