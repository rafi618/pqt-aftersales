import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography } from 'antd';
import {
  DashboardOutlined, HomeOutlined, AppstoreOutlined, TeamOutlined,
  UserOutlined, FileTextOutlined, ToolOutlined, DollarOutlined,
  WalletOutlined, SendOutlined, LogoutOutlined, MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/internal', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/internal/properties', icon: <HomeOutlined />, label: 'Properties' },
  { key: '/internal/units', icon: <AppstoreOutlined />, label: 'Units' },
  { key: '/internal/owners', icon: <TeamOutlined />, label: 'Owners' },
  { key: '/internal/tenants', icon: <UserOutlined />, label: 'Tenants' },
  { key: '/internal/contracts', icon: <FileTextOutlined />, label: 'Contracts' },
  { key: '/internal/maintenance', icon: <ToolOutlined />, label: 'Maintenance' },
  { key: '/internal/invoices', icon: <DollarOutlined />, label: 'Invoices' },
  { key: '/internal/payments', icon: <WalletOutlined />, label: 'Payments' },
  { key: '/internal/payouts', icon: <SendOutlined />, label: 'Owner Payouts' },
];

export default function InternalLayout() {
  const [collapsed, setCollapsed] = useState(false);
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
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{ padding: '16px', textAlign: 'center', color: '#fff' }}>
          <Typography.Title level={collapsed ? 5 : 4} style={{ color: '#fff', margin: 0 }}>
            {collapsed ? 'PQT' : 'PQT AfterSales'}
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
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {collapsed
            ? <MenuUnfoldOutlined onClick={() => setCollapsed(false)} style={{ fontSize: 18 }} />
            : <MenuFoldOutlined onClick={() => setCollapsed(true)} style={{ fontSize: 18 }} />
          }
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
