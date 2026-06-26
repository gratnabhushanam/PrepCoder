import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { Search, Filter, Edit, Trash2, Copy, Eye, EyeOff, CheckSquare, Square } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import EditQuestionModal from './EditQuestionModal';

export default function QuestionManagement() {
  const { API_BASE, token } = useContext(AppContext);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters and Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modals
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [viewingQuestion, setViewingQuestion] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // Fetch MCQs (MongoDB)
      const mcqRes = await axios.get(`${API_BASE}/admin/mcqs`, { headers: { Authorization: `Bearer ${token}` } });
      const mcqs = mcqRes.data.map(m => ({
        id: m._id,
        type: 'MCQ',
        title: m.question,
        category: m.category,
        difficulty: m.difficulty,
        status: m.status || 'Active',
        createdAt: m.createdAt,
        updatedAt: m.updatedAt || m.createdAt,
        raw: m
      }));

      // Fetch Coding Problems (MySQL)
      const codingRes = await axios.get(`${API_BASE}/admin/coding/questions`, { headers: { Authorization: `Bearer ${token}` } });
      const codings = codingRes.data.map(c => ({
        id: c.id,
        type: 'Coding',
        title: c.title,
        category: c.concept_name || 'Uncategorized',
        difficulty: c.difficulty,
        status: c.status || 'Active',
        createdAt: c.created_at,
        updatedAt: c.updated_at || c.created_at,
        raw: c
      }));

      const combined = [...mcqs, ...codings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setQuestions(combined);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase()) || q.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiff = filterDifficulty === 'All' || q.difficulty === filterDifficulty;
    const matchesType = filterType === 'All' || q.type === filterType;
    const matchesStatus = filterStatus === 'All' || q.status === filterStatus;
    return matchesSearch && matchesDiff && matchesType && matchesStatus;
  });

  const paginatedQuestions = filteredQuestions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);

  const toggleSelection = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === paginatedQuestions.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedQuestions.map(q => q.id)));
  };

  // Actions
  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      if (type === 'MCQ') await axios.delete(`${API_BASE}/admin/mcqs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      else await axios.delete(`${API_BASE}/admin/coding/questions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Deleted successfully');
      fetchQuestions();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleToggleStatus = async (q) => {
    try {
      const newStatus = q.status === 'Active' ? 'Hidden' : 'Active';
      if (q.type === 'MCQ') {
        await axios.put(`${API_BASE}/admin/mcqs/${q.id}`, { ...q.raw, status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        const res = await axios.get(`${API_BASE}/admin/coding/questions/${q.id}`, { headers: { Authorization: `Bearer ${token}` } });
        await axios.put(`${API_BASE}/admin/coding/questions/${q.id}`, { ...res.data, status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      }
      toast.success(`Status updated to ${newStatus}`);
      fetchQuestions();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDuplicate = async (q) => {
    try {
      if (q.type === 'MCQ') {
        const raw = q.raw;
        await axios.post(`${API_BASE}/admin/mcqs`, {
          ...raw,
          question: `${raw.question} (Copy)`
        }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        const raw = q.raw;
        // Fetch full coding question to duplicate testcases
        const res = await axios.get(`${API_BASE}/admin/coding/questions/${raw.id}`, { headers: { Authorization: `Bearer ${token}` } });
        const fullQ = res.data;
        await axios.post(`${API_BASE}/admin/coding/questions`, {
          ...fullQ,
          title: `${fullQ.title} (Copy)`
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      toast.success('Duplicated successfully');
      fetchQuestions();
    } catch (err) {
      toast.error('Failed to duplicate');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.size === 0) return;
    if (action === 'delete' && !window.confirm(`Delete ${selectedIds.size} questions?`)) return;

    try {
      const promises = Array.from(selectedIds).map(id => {
        const q = questions.find(q => q.id === id);
        if (action === 'delete') {
          return q.type === 'MCQ' 
            ? axios.delete(`${API_BASE}/admin/mcqs/${id}`, { headers: { Authorization: `Bearer ${token}` } })
            : axios.delete(`${API_BASE}/admin/coding/questions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        } else if (action === 'hide' || action === 'activate') {
          const status = action === 'hide' ? 'Hidden' : 'Active';
          if (q.type === 'MCQ') {
            return axios.put(`${API_BASE}/admin/mcqs/${id}`, { ...q.raw, status }, { headers: { Authorization: `Bearer ${token}` } });
          } else {
            return axios.get(`${API_BASE}/admin/coding/questions/${id}`, { headers: { Authorization: `Bearer ${token}` } })
              .then(res => axios.put(`${API_BASE}/admin/coding/questions/${id}`, { ...res.data, status }, { headers: { Authorization: `Bearer ${token}` } }));
          }
        }
      });
      await Promise.all(promises);
      toast.success(`Bulk ${action} successful`);
      setSelectedIds(new Set());
      fetchQuestions();
    } catch (err) {
      toast.error(`Bulk ${action} failed`);
    }
  };

  return (
    <div className="admin-q-management">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Question Management</h2>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div className="search-box" style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--surface-color)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <Search size={18} style={{ marginRight: '0.5rem', color: 'var(--text-secondary)' }} />
          <input type="text" placeholder="Search by title or topic..." value={searchTerm} onChange={handleSearch} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-primary)' }} />
        </div>
        
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}>
          <option value="All">All Types</option>
          <option value="MCQ">MCQ</option>
          <option value="Coding">Coding</option>
        </select>
        
        <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}>
          <option value="All">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}>
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Hidden">Hidden</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div style={{ padding: '1rem', background: 'var(--surface-color)', borderRadius: '8px', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span>{selectedIds.size} selected</span>
          <button onClick={() => handleBulkAction('delete')} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Delete Selected</button>
          <button onClick={() => handleBulkAction('hide')} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Hide</button>
          <button onClick={() => handleBulkAction('activate')} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Activate</button>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-color)' }}>
              <th style={{ padding: '1rem' }}><div onClick={toggleAll} style={{ cursor: 'pointer' }}>{selectedIds.size === paginatedQuestions.length && paginatedQuestions.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}</div></th>
              <th style={{ padding: '1rem' }}>Title</th>
              <th style={{ padding: '1rem' }}>Type & Category</th>
              <th style={{ padding: '1rem' }}>Difficulty</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Last Updated</th>
              <th style={{ padding: '1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading questions...</td></tr>
            ) : paginatedQuestions.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No questions found.</td></tr>
            ) : paginatedQuestions.map((q) => (
              <tr key={q.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}><div onClick={() => toggleSelection(q.id)} style={{ cursor: 'pointer' }}>{selectedIds.has(q.id) ? <CheckSquare size={18} color="var(--color-primary)"/> : <Square size={18} color="var(--text-secondary)"/>}</div></td>
                <td style={{ padding: '1rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{q.title}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: q.type === 'MCQ' ? '#e0e7ff' : '#dcfce7', color: q.type === 'MCQ' ? '#3730a3' : '#166534', marginRight: '0.5rem', fontWeight: 600 }}>{q.type}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{q.category}</span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ color: q.difficulty === 'Easy' ? '#10b981' : q.difficulty === 'Medium' ? '#f59e0b' : '#ef4444', fontWeight: 600, fontSize: '0.85rem' }}>{q.difficulty}</span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: q.status === 'Active' ? '#dcfce7' : '#fee2e2', color: q.status === 'Active' ? '#166534' : '#991b1b' }}>{q.status}</span>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {q.updatedAt ? format(new Date(q.updatedAt), 'MMM dd, yyyy HH:mm') : '-'}
                </td>
                <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setViewingQuestion(q)} className="action-btn" title="View"><Eye size={16} /></button>
                  <button onClick={() => handleToggleStatus(q)} className="action-btn" title={q.status === 'Active' ? 'Disable' : 'Enable'}>{q.status === 'Active' ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  <button onClick={() => setEditingQuestion(q)} className="action-btn" title="Edit"><Edit size={16} /></button>
                  <button onClick={() => handleDuplicate(q)} className="action-btn" title="Duplicate"><Copy size={16} /></button>
                  <button onClick={() => handleDelete(q.id, q.type)} className="action-btn text-danger" title="Delete"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem', gap: '0.5rem' }}>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)} className="btn btn-secondary">Prev</button>
          <span style={{ padding: '0.5rem 1rem' }}>Page {currentPage} of {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)} className="btn btn-secondary">Next</button>
        </div>
      )}

      <style>{`
        .action-btn { background: transparent; border: none; cursor: pointer; color: var(--text-secondary); padding: 0.2rem; transition: color 0.2s; }
        .action-btn:hover { color: var(--color-primary); }
        .action-btn.text-danger:hover { color: #ef4444; }
      `}</style>

      {/* View Modal */}
      {viewingQuestion && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: '12px', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{viewingQuestion.title}</h3>
              <button onClick={() => setViewingQuestion(null)} className="btn btn-secondary">Close</button>
            </div>
            {viewingQuestion.type === 'MCQ' ? (
              <div>
                <p><strong>Description:</strong> {viewingQuestion.raw.description}</p>
                <ul style={{ margin: '1rem 0' }}>
                  <li><strong>A:</strong> {viewingQuestion.raw.optionA}</li>
                  <li><strong>B:</strong> {viewingQuestion.raw.optionB}</li>
                  <li><strong>C:</strong> {viewingQuestion.raw.optionC}</li>
                  <li><strong>D:</strong> {viewingQuestion.raw.optionD}</li>
                </ul>
                <p><strong>Correct Answer:</strong> {viewingQuestion.raw.correctAnswer}</p>
              </div>
            ) : (
              <div>
                <p><strong>Statement:</strong> {viewingQuestion.raw.statement}</p>
                <p><strong>Constraints:</strong> {viewingQuestion.raw.constraints}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingQuestion && (
        <EditQuestionModal
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onRefresh={fetchQuestions}
        />
      )}
    </div>
  );
}
