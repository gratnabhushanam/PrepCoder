import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FeatureManagement() {
  const { token } = useContext(AppContext);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'Code',
    isActive: true,
    order: 0
  });

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/admin/cms/features`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeatures(res.data);
    } catch (err) {
      toast.error('Failed to fetch features');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ title: '', description: '', icon: 'Code', isActive: true, order: 0 });
    setShowModal(true);
  };

  const openEditModal = (feature) => {
    setEditingId(feature._id);
    setFormData({
      title: feature.title,
      description: feature.description,
      icon: feature.icon,
      isActive: feature.isActive,
      order: feature.order
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_BASE}/admin/cms/features/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Feature updated');
      } else {
        await axios.post(`${API_BASE}/admin/cms/features`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Feature created');
      }
      setShowModal(false);
      fetchFeatures();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving feature');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feature?')) return;
    try {
      await axios.delete(`${API_BASE}/admin/cms/features/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Feature deleted');
      fetchFeatures();
    } catch (err) {
      toast.error('Failed to delete feature');
    }
  };

  return (
    <div className="animation-fade-in" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Feature Management</h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage landing page features.</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Add Feature
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="trending-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Order</th>
              <th>Icon</th>
              <th>Title</th>
              <th>Description</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
            ) : features.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No features found. Add one!</td></tr>
            ) : (
              features.map((f) => (
                <tr key={f._id}>
                  <td>{f.order}</td>
                  <td><span style={{ padding: '0.3rem 0.6rem', background: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.85rem' }}>{f.icon}</span></td>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{f.title}</td>
                  <td style={{ color: 'var(--text-secondary)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.description}</td>
                  <td>
                    {f.isActive ? <span className="diff-badge diff-easy">Active</span> : <span className="diff-badge diff-hard">Inactive</span>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => openEditModal(f)} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }}>
                        <Edit2 size={16} color="var(--text-secondary)" />
                      </button>
                      <button onClick={() => handleDelete(f._id)} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }}>
                        <Trash2 size={16} color="var(--color-danger)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{editingId ? 'Edit Feature' : 'Add Feature'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="form-input" required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} className="form-input" rows="3" required></textarea>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Icon Name (Lucide)</label>
                  <input type="text" name="icon" value={formData.icon} onChange={handleInputChange} className="form-input" required />
                </div>
                <div style={{ width: '100px' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Order</label>
                  <input type="number" name="order" value={formData.order} onChange={handleInputChange} className="form-input" required />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} id="isActive" />
                <label htmlFor="isActive" style={{ color: 'var(--text-secondary)' }}>Active (Visible on Homepage)</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Add Feature'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
