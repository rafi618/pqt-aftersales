import { Layout, Menu, Avatar, Dropdown, Typography } from 'antd';
import {
  DashboardOutlined, HomeOutlined, FileTextOutlined,
  DollarOutlined, SendOutlined, LogoutOutlined, UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/client', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/client/properties', icon: <HomeOutlined />, label: 'My Properties' },
  { key: '/client/contracts', icon: <FileTextOutlined />, label: 'Contracts' },
  { key: '/client/invoices', icon: <DollarOutlined />, label: 'Invoices' },
  { key: '/client/payouts', icon: <SendOutlined />, label: 'My Payouts' },
];

export default function ClientLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const userMenu = {
    items: [
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: () => { logout(); navigate('/login'); } },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" breakpoint="lg" collapsedWidth={0}>
        <div style={{ padding: '16px', textAlign: 'center', color: '#fff' }}>
          <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
            PQT Client Portal
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.first_name || user?.email}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 8, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
