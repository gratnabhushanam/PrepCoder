import React from 'react';
import { LayoutDashboard, List, PlusCircle, Settings, Users, BarChart3, BookOpen, Layers } from 'lucide-react';

export default function AdminSidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'manage_questions', label: 'Manage Questions', icon: <List size={20} /> },
    { id: 'add_prob', label: 'Add Question (Coding)', icon: <PlusCircle size={20} /> },
    { id: 'add_mcq', label: 'Add Question (MCQ)', icon: <PlusCircle size={20} /> },
    { id: 'add_concept', label: 'Add Concept', icon: <BookOpen size={20} /> },
    { id: 'submissions', label: 'Submissions', icon: <Layers size={20} /> },
    { id: 'users', label: 'Users', icon: <Users size={20} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <div style={{
      width: '260px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      minHeight: 'calc(100vh - 70px)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 1rem'
    }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2rem', paddingLeft: '0.5rem' }}>
        Admin Menu
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: activeTab === item.id ? 'var(--color-primary-alpha)' : 'transparent',
              color: activeTab === item.id ? 'var(--color-primary)' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              borderLeft: activeTab === item.id ? '3px solid var(--color-primary)' : '3px solid transparent'
            }}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
