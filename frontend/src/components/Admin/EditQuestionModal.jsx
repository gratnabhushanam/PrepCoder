import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

export default function EditQuestionModal({ question, onClose, onRefresh }) {
  const { API_BASE, token } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  
  // MCQ state
  const [mcqData, setMcqData] = useState({});
  
  // Coding state
  const [codingData, setCodingData] = useState({});

  useEffect(() => {
    const fetchFullData = async () => {
      try {
        if (question.type === 'MCQ') {
          // MCQ has full raw data in question.raw usually, but let's fetch to be safe or use raw
          setMcqData(question.raw);
        } else {
          // For Coding, need to fetch full details including test cases
          const res = await axios.get(`${API_BASE}/admin/coding/questions/${question.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setCodingData(res.data);
        }
      } catch (err) {
        toast.error('Failed to load full question data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFullData();
  }, [question, API_BASE, token]);

  const handleSaveMcq = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE}/admin/mcqs/${question.id}`, mcqData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('MCQ updated successfully');
      onRefresh();
      onClose();
    } catch (err) {
      toast.error('Failed to update MCQ');
    }
  };

  const handleSaveCoding = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE}/admin/coding/questions/${question.id}`, codingData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Coding question updated successfully');
      onRefresh();
      onClose();
    } catch (err) {
      toast.error('Failed to update coding question');
    }
  };

  if (loading) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: '12px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: '12px', maxWidth: '900px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Edit {question.type} Question</h3>
          <button type="button" onClick={onClose} className="btn btn-secondary">Close</button>
        </div>

        {question.type === 'MCQ' ? (
          <form onSubmit={handleSaveMcq}>
            <div className="form-group">
              <label className="form-label">Question</label>
              <textarea className="form-control" rows="3" required value={mcqData.question || ''} onChange={e => setMcqData({...mcqData, question: e.target.value})} />
            </div>
            
            <div className="form-group">
              <label className="form-label">Description / Code Snippet</label>
              <textarea className="form-control" rows="3" value={mcqData.description || ''} onChange={e => setMcqData({...mcqData, description: e.target.value})} />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Option A</label>
                <input type="text" className="form-control" required value={mcqData.optionA || ''} onChange={e => setMcqData({...mcqData, optionA: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Option B</label>
                <input type="text" className="form-control" required value={mcqData.optionB || ''} onChange={e => setMcqData({...mcqData, optionB: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Option C</label>
                <input type="text" className="form-control" required value={mcqData.optionC || ''} onChange={e => setMcqData({...mcqData, optionC: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Option D</label>
                <input type="text" className="form-control" required value={mcqData.optionD || ''} onChange={e => setMcqData({...mcqData, optionD: e.target.value})} />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Correct Answer</label>
                <select className="form-control" required value={mcqData.correctAnswer || 'A'} onChange={e => setMcqData({...mcqData, correctAnswer: e.target.value})}>
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <select className="form-control" value={mcqData.difficulty || 'Medium'} onChange={e => setMcqData({...mcqData, difficulty: e.target.value})}>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Save Changes</button>
          </form>
        ) : (
          <form onSubmit={handleSaveCoding}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input type="text" className="form-control" required value={codingData.title || ''} onChange={e => setCodingData({...codingData, title: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select className="form-control" value={codingData.difficulty || 'Medium'} onChange={e => setCodingData({...codingData, difficulty: e.target.value})}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Statement</label>
              <textarea className="form-control" rows="4" required value={codingData.statement || ''} onChange={e => setCodingData({...codingData, statement: e.target.value})} />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Input Format</label>
                <textarea className="form-control" rows="2" value={codingData.input_format || ''} onChange={e => setCodingData({...codingData, input_format: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Output Format</label>
                <textarea className="form-control" rows="2" value={codingData.output_format || ''} onChange={e => setCodingData({...codingData, output_format: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Constraints</label>
              <textarea className="form-control" rows="2" value={codingData.constraints || ''} onChange={e => setCodingData({...codingData, constraints: e.target.value})} />
            </div>

            <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
              <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Public Test Cases</h4>
              {(codingData.public_testcases || []).map((tc, idx) => (
                <div key={idx} className="grid-2" style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Input</label>
                    <textarea className="form-control" rows="2" value={tc.input} onChange={e => {
                      const newArr = [...(codingData.public_testcases || [])]; newArr[idx].input = e.target.value; setCodingData({...codingData, public_testcases: newArr});
                    }}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expected Output</label>
                    <textarea className="form-control" rows="2" value={tc.expected_output} onChange={e => {
                      const newArr = [...(codingData.public_testcases || [])]; newArr[idx].expected_output = e.target.value; setCodingData({...codingData, public_testcases: newArr});
                    }}/>
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    const newArr = [...codingData.public_testcases];
                    newArr.splice(idx, 1);
                    setCodingData({...codingData, public_testcases: newArr});
                  }}>Remove</button>
                </div>
              ))}
              <button type="button" className="btn btn-secondary" onClick={() => {
                setCodingData({...codingData, public_testcases: [...(codingData.public_testcases || []), {input: '', expected_output: ''}]})
              }}>+ Add Public Test Case</button>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Hidden Test Cases</h4>
              {(codingData.hidden_testcases || []).map((tc, idx) => (
                <div key={idx} className="grid-2" style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Input</label>
                    <textarea className="form-control" rows="2" value={tc.input} onChange={e => {
                      const newArr = [...(codingData.hidden_testcases || [])]; newArr[idx].input = e.target.value; setCodingData({...codingData, hidden_testcases: newArr});
                    }}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expected Output</label>
                    <textarea className="form-control" rows="2" value={tc.expected_output} onChange={e => {
                      const newArr = [...(codingData.hidden_testcases || [])]; newArr[idx].expected_output = e.target.value; setCodingData({...codingData, hidden_testcases: newArr});
                    }}/>
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    const newArr = [...codingData.hidden_testcases];
                    newArr.splice(idx, 1);
                    setCodingData({...codingData, hidden_testcases: newArr});
                  }}>Remove</button>
                </div>
              ))}
              <button type="button" className="btn btn-secondary" onClick={() => {
                setCodingData({...codingData, hidden_testcases: [...(codingData.hidden_testcases || []), {input: '', expected_output: ''}]})
              }}>+ Add Hidden Test Case</button>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Save Changes</button>
          </form>
        )}
      </div>
    </div>
  );
}
