import React from 'react';
import { LayoutDashboard, Users, Code, Terminal, Layers, Trophy, BarChart3, FileText, Bell, Settings, Wrench, Activity, LogOut, FolderPlus, FileCode2, ClipboardList } from 'lucide-react';
import { AppContext } from '../../context/AppContext';

export default function AdminSidebar({ activeTab, setActiveTab }) {
  const { logout } = React.useContext(AppContext);

  const menuGroups = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
      ]
    },
    {
      title: 'Management',
      items: [
        { id: 'users', label: 'Users', icon: <Users size={18} /> },
        { id: 'manage_questions', label: 'Manage Questions', icon: <FileText size={18} /> },
        { id: 'submissions', label: 'Submissions', icon: <Layers size={18} /> },
        { id: 'contests', label: 'Contests', icon: <Trophy size={18} /> },
      ]
    },
    {
      title: 'Content Creation',
      items: [
        { id: 'add_concept', label: 'Add Concept', icon: <FolderPlus size={18} /> },
        { id: 'add_prob', label: 'Add Coding Problem', icon: <FileCode2 size={18} /> },
        { id: 'add_mcq', label: 'Add MCQ Test', icon: <ClipboardList size={18} /> },
      ]
    },
    {
      title: 'System',
      items: [
        { id: 'compiler_status', label: 'Online Compiler', icon: <Terminal size={18} /> },
        { id: 'system_health', label: 'System Health', icon: <Activity size={18} /> },
        { id: 'compiler_config', label: 'Compiler Config', icon: <Wrench size={18} /> },
        { id: 'logs', label: 'Logs', icon: <FileText size={18} /> },
      ]
    },
    {
      title: 'Communication',
      items: [
        { id: 'reports', label: 'Reports', icon: <FileText size={18} /> },
        { id: 'announcements', label: 'Announcements', icon: <Bell size={18} /> },
      ]
    }
  ];

  return (
    <div style={{
      width: '260px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      minHeight: 'calc(100vh - 65px)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 1rem',
      overflowY: 'auto'
    }}>
      {menuGroups.map((group, idx) => (
        <div key={idx} style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            color: 'var(--text-muted)', 
            marginBottom: '0.75rem',
            paddingLeft: '0.5rem',
            letterSpacing: '0.5px'
          }}>
            {group.title}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 0.75rem',
                  background: activeTab === item.id ? 'var(--color-primary)' : 'transparent',
                  color: activeTab === item.id ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  textAlign: 'left',
                  transition: 'var(--transition-fast)',
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      
      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem',
            background: activeTab === 'settings' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'settings' ? '#fff' : 'var(--text-secondary)',
            border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', width: '100%',
            fontWeight: 500, fontSize: '0.9rem', textAlign: 'left', transition: 'var(--transition-fast)'
          }}
        >
          <Settings size={18} /> Settings
        </button>
        <button
          onClick={logout}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem',
            background: 'transparent', color: 'var(--color-danger)', border: 'none', 
            borderRadius: 'var(--radius-sm)', cursor: 'pointer', width: '100%', marginTop: '0.2rem',
            fontWeight: 500, fontSize: '0.9rem', textAlign: 'left', transition: 'var(--transition-fast)'
          }}
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
}
