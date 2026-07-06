import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import useAuthStore from '../../context/authStore';

export default function AdminPanel() {
  const adminLogout = useAuthStore(state => state.adminLogout);
  
  // States
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [shareViews, setShareViews] = useState([]);
  const [loginAlerts, setLoginAlerts] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('users');

  // Detailed Inspector Modal
  const [inspectUser, setInspectUser] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Fetch stats and lists on mount
  useEffect(() => {
    fetchStats();
    fetchGrowth();
    fetchShareViews();
    fetchLoginAlerts();
  }, []);

  // Fetch users when page or search query changes
  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      toast.error('Failed to load stats dashboard.');
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?page=${page}&search=${search}&limit=8`);
      setUsers(res.data.users);
      setTotalPages(res.data.pagination.pages || 1);
    } catch (err) {
      toast.error('Failed to load user list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGrowth = async () => {
    try {
      const res = await api.get('/admin/growth');
      setGrowthData(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchShareViews = async () => {
    try {
      const res = await api.get('/admin/share-views');
      setShareViews(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLoginAlerts = async () => {
    try {
      const res = await api.get('/admin/login-alerts');
      setLoginAlerts(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUser = async (userId) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/toggle`);
      toast.success(res.data.message);
      
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: res.data.isActive ? 1 : 0 } : u));
      
      if (inspectUser && inspectUser.user.id === userId) {
        setInspectUser({
          ...inspectUser,
          user: { ...inspectUser.user, is_active: res.data.isActive ? 1 : 0 }
        });
      }
      
      fetchStats();
    } catch (err) {
      toast.error('Failed to change user status.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this user? This action is permanent and cascades to their CV and all views.')) return;
    
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User profile removed.');
      setUsers(users.filter(u => u.id !== userId));
      setInspectUser(null);
      fetchStats();
    } catch (err) {
      toast.error('Failed to delete user.');
    }
  };

  const handleInspect = async (userId) => {
    setInspectLoading(true);
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setInspectUser(res.data);
    } catch (err) {
      toast.error('Failed to fetch user details.');
    } finally {
      setInspectLoading(false);
    }
  };

  // Render SVG Growth graph
  const renderGrowthChart = () => {
    if (!growthData || growthData.length === 0) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
          No user growth registration log records found for the last 30 days.
        </div>
      );
    }

    const maxCount = Math.max(...growthData.map(d => d.count), 5);
    const height = 150;
    const width = 600;
    const padding = 30;

    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = growthData.map((d, index) => {
      const x = padding + (index / (growthData.length - 1 || 1)) * chartWidth;
      const y = height - padding - (d.count / maxCount) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div style={{ width: '100%', overflowX: 'auto', marginTop: '10px' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: '500px', height: 'auto' }}>
          <defs>
            <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--neon-purple)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--neon-blue)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
          <line x1={padding} y1={height - padding - chartHeight / 2} x2={width - padding} y2={height - padding - chartHeight / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.15)" />

          {/* Area fill */}
          {growthData.length > 1 && (
            <polygon
              points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
              fill="url(#chart-glow)"
            />
          )}

          {/* Line path */}
          <polyline
            fill="none"
            stroke="var(--neon-purple)"
            strokeWidth="3"
            points={points}
            style={{ filter: 'drop-shadow(0 0 4px var(--neon-purple-glow))' }}
          />

          {/* Dots on points */}
          {growthData.map((d, index) => {
            const x = padding + (index / (growthData.length - 1 || 1)) * chartWidth;
            const y = height - padding - (d.count / maxCount) * chartHeight;
            return (
              <g key={index}>
                <circle cx={x} cy={y} r="4" fill="var(--neon-blue)" />
                <title>{`${d.date}: ${d.count} users`}</title>
              </g>
            );
          })}

          {/* Date Labels */}
          <text x={padding} y={height - 8} fill="var(--text-muted)" fontSize="9" textAnchor="start">
            {growthData[0]?.date}
          </text>
          <text x={width - padding} y={height - 8} fill="var(--text-muted)" fontSize="9" textAnchor="end">
            {growthData[growthData.length - 1]?.date}
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 20px 60px 20px' }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 className="glow-text-purple" style={{ fontSize: '24px' }}>ADMIN CONTROL PANEL</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px' }}>
            System operations, metrics, database logs and security controls
          </p>
        </div>
        <button onClick={adminLogout} className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '10px' }}>
          ADMIN LOGOUT
        </button>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '30px'
        }}>
          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: "'Orbitron', sans-serif" }}>
              Total Users
            </span>
            <div className="glow-text-blue" style={{ fontSize: '28px', marginTop: '8px' }}>{stats.totalUsers}</div>
          </div>
          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: "'Orbitron', sans-serif" }}>
              Active Sessions
            </span>
            <div className="glow-text-purple" style={{ fontSize: '28px', marginTop: '8px' }}>{stats.activeUsers}</div>
          </div>
          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: "'Orbitron', sans-serif" }}>
              Banned Users
            </span>
            <div className="glow-text-blue" style={{ color: 'var(--neon-pink)', fontSize: '28px', marginTop: '8px' }}>
              {stats.totalUsers - stats.activeUsers}
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: "'Orbitron', sans-serif" }}>
              Compiled CVs
            </span>
            <div className="glow-text-purple" style={{ fontSize: '28px', marginTop: '8px' }}>{stats.totalCVs}</div>
          </div>
          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: "'Orbitron', sans-serif" }}>
              CV Share Views
            </span>
            <div className="glow-text-blue" style={{ fontSize: '28px', marginTop: '8px' }}>{stats.totalShareViews}</div>
          </div>
        </div>
      )}

      {/* Main Grid: Graph + Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '30px' }}>
        <div className="glass-panel">
          <h3 className="glow-text-purple" style={{ fontSize: '13px', letterSpacing: '1px', marginBottom: '16px' }}>
            REGISTRATION GROWTH (LAST 30 DAYS)
          </h3>
          {renderGrowthChart()}
        </div>
      </div>

      {/* Tables/Tabs Grid */}
      <div className="glass-panel" style={{ padding: 0 }}>
        {/* Navigation tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(124, 58, 237, 0.2)',
          background: 'rgba(10, 10, 34, 0.4)',
          borderRadius: '12px 12px 0 0'
        }}>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              flex: 1,
              padding: '16px',
              background: activeTab === 'users' ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
              color: activeTab === 'users' ? '#fff' : 'var(--text-secondary)',
              borderBottom: activeTab === 'users' ? '2px solid var(--neon-purple)' : 'none',
              borderRadius: '12px 0 0 0',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '11px',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none'
            }}
          >
            User Administration
          </button>
          <button
            onClick={() => setActiveTab('views')}
            style={{
              flex: 1,
              padding: '16px',
              background: activeTab === 'views' ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
              color: activeTab === 'views' ? '#fff' : 'var(--text-secondary)',
              borderBottom: activeTab === 'views' ? '2px solid var(--neon-purple)' : 'none',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '11px',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none'
            }}
          >
            CV View Audits
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            style={{
              flex: 1,
              padding: '16px',
              background: activeTab === 'alerts' ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
              color: activeTab === 'alerts' ? '#fff' : 'var(--text-secondary)',
              borderBottom: activeTab === 'alerts' ? '2px solid var(--neon-purple)' : 'none',
              borderRadius: '0 12px 0 0',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '11px',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none'
            }}
          >
            Login Alert Logs
          </button>
        </div>

        {/* Tab 1: User Administration */}
        {activeTab === 'users' && (
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Search user email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'rgba(5, 5, 16, 0.8)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  color: '#fff',
                  outline: 'none'
                }}
              />
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading user list...</div>
            ) : users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No accounts registered yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(124, 58, 237, 0.2)', color: 'var(--neon-blue)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 8px' }}>EMAIL ADDRESS</th>
                      <th style={{ padding: '12px 8px' }}>DATE REGISTERED</th>
                      <th style={{ padding: '12px 8px' }}>LAST LOGIN</th>
                      <th style={{ padding: '12px 8px' }}>STATUS</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right' }}>OPERATIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 8px', color: '#fff', fontWeight: 500 }}>{u.email}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>
                          {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never logged in'}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '10px',
                            background: u.is_active === 1 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(236, 72, 153, 0.1)',
                            color: u.is_active === 1 ? 'var(--neon-blue)' : 'var(--neon-pink)',
                            border: '1px solid ' + (u.is_active === 1 ? 'rgba(59, 130, 246, 0.3)' : 'rgba(236, 72, 153, 0.3)')
                          }}>
                            {u.is_active === 1 ? 'ACTIVE' : 'BANNED'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleInspect(u.id)}
                              style={{ padding: '4px 10px', fontSize: '10px', background: 'rgba(124, 58, 237, 0.1)', color: '#fff', border: '1px solid rgba(124, 58, 237, 0.4)', borderRadius: '4px' }}
                            >
                              INSPECT
                            </button>
                            <button
                              onClick={() => handleToggleUser(u.id)}
                              style={{
                                padding: '4px 10px',
                                fontSize: '10px',
                                background: u.is_active === 1 ? 'rgba(236, 72, 153, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                color: u.is_active === 1 ? 'var(--neon-pink)' : 'var(--neon-blue)',
                                border: '1px solid ' + (u.is_active === 1 ? 'rgba(236, 72, 153, 0.4)' : 'rgba(59, 130, 246, 0.4)'),
                                borderRadius: '4px'
                              }}
                            >
                              {u.is_active === 1 ? 'BAN' : 'ACTIVATE'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              style={{ padding: '4px 10px', fontSize: '10px', background: 'transparent', color: 'var(--neon-pink)', border: '1px solid var(--neon-pink)', borderRadius: '4px' }}
                            >
                              DELETE
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '10px' }}
                >
                  PREVIOUS
                </button>
                <span style={{ color: 'var(--text-secondary)', alignSelf: 'center', fontSize: '12px' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '10px' }}
                >
                  NEXT
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Share View Audit */}
        {activeTab === 'views' && (
          <div style={{ padding: '24px' }}>
            {shareViews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No shared CV views logged yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(124, 58, 237, 0.2)', color: 'var(--neon-blue)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 8px' }}>VIEW TIMESTAMP</th>
                      <th style={{ padding: '12px 8px' }}>CV OWNER</th>
                      <th style={{ padding: '12px 8px' }}>CV NAME NAME</th>
                      <th style={{ padding: '12px 8px' }}>ANONYMIZED IP ADDRESS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shareViews.map(sv => (
                      <tr key={sv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 8px', color: '#fff' }}>{new Date(sv.viewed_at).toLocaleString()}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{sv.user_email}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{sv.cv_name || '(Empty Name)'}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--neon-purple)', fontFamily: "'Orbitron', sans-serif" }}>{sv.ip_address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Login Alert Audit */}
        {activeTab === 'alerts' && (
          <div style={{ padding: '24px' }}>
            {loginAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No security alerts logged yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(124, 58, 237, 0.2)', color: 'var(--neon-blue)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 8px' }}>ALERT TIMESTAMP</th>
                      <th style={{ padding: '12px 8px' }}>ACCOUNT</th>
                      <th style={{ padding: '12px 8px' }}>ANONYMIZED IP</th>
                      <th style={{ padding: '12px 8px' }}>DEVICE/AGENT</th>
                      <th style={{ padding: '12px 8px' }}>SUSPICIOUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginAlerts.map(alert => (
                      <tr key={alert.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 8px', color: '#fff' }}>{new Date(alert.alerted_at).toLocaleString()}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{alert.email}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--neon-purple)', fontFamily: "'Orbitron', sans-serif" }}>{alert.ip_address}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-secondary)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {alert.user_agent}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '9px',
                            background: alert.is_new_device === 1 ? 'rgba(236, 72, 153, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                            color: alert.is_new_device === 1 ? 'var(--neon-pink)' : 'var(--neon-blue)',
                            border: '1px solid ' + (alert.is_new_device === 1 ? 'rgba(236, 72, 153, 0.3)' : 'rgba(59, 130, 246, 0.3)')
                          }}>
                            {alert.is_new_device === 1 ? 'YES (NEW DEV/IP)' : 'NO'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Inspector Modal Overlay */}
      {inspectUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(5, 5, 16, 0.9)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid var(--neon-purple)',
            boxShadow: '0 0 20px var(--neon-purple-glow)',
            padding: '30px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="glow-text-purple" style={{ fontSize: '18px' }}>INSPECT ACCOUNT RECORDS</h3>
              <button
                onClick={() => setInspectUser(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--neon-pink)', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
              >
                [× CLOSE]
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '9px', fontFamily: "'Orbitron', sans-serif" }}>Account Email</p>
                <p style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>{inspectUser.user.email}</p>
                <p style={{ color: 'var(--text-muted)', marginTop: '10px', textTransform: 'uppercase', fontSize: '9px', fontFamily: "'Orbitron', sans-serif" }}>Date Registered</p>
                <p style={{ color: '#fff', marginTop: '4px' }}>{new Date(inspectUser.user.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '9px', fontFamily: "'Orbitron', sans-serif" }}>Activation Status</p>
                <p style={{ color: inspectUser.user.is_active === 1 ? 'var(--neon-blue)' : 'var(--neon-pink)', fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
                  {inspectUser.user.is_active === 1 ? 'ACTIVE SESSION ENABLED' : 'BANNED / DEACTIVATED'}
                </p>
                <p style={{ color: 'var(--text-muted)', marginTop: '10px', textTransform: 'uppercase', fontSize: '9px', fontFamily: "'Orbitron', sans-serif" }}>Last Login Credentials</p>
                <p style={{ color: '#fff', marginTop: '4px' }}>
                  {inspectUser.user.last_login_ip || 'None'} ({inspectUser.user.last_login_at ? new Date(inspectUser.user.last_login_at).toLocaleDateString() : 'Never'})
                </p>
              </div>
            </div>

            {/* Inspect User CV */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: 'var(--neon-blue)', fontSize: '12px', fontFamily: "'Orbitron', sans-serif", borderBottom: '1px solid rgba(59,130,246,0.15)', paddingBottom: '6px', marginBottom: '10px' }}>
                CV PROFILE INFO
              </h4>
              {inspectUser.cv ? (
                <div style={{ background: 'rgba(5,5,16,0.5)', padding: '12px', borderRadius: '6px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p><strong>Name:</strong> {inspectUser.cv.name || '(Not Filled)'}</p>
                  <p><strong>Address:</strong> {inspectUser.cv.address || '(Not Filled)'}</p>
                  <p><strong>Phone:</strong> {inspectUser.cv.phone || '(Not Filled)'}</p>
                  <p><strong>Bio:</strong> {inspectUser.cv.bio || '(Not Filled)'}</p>
                  <p>
                    <strong>Socials:</strong> {inspectUser.cv.github_url ? 'GitHub ' : ''} {inspectUser.cv.linkedin_url ? 'LinkedIn' : ''}
                    {!inspectUser.cv.github_url && !inspectUser.cv.linkedin_url ? 'None' : ''}
                  </p>
                  <p><strong>Skills Added:</strong> {inspectUser.cv.skills?.join(', ') || 'None'}</p>
                  <p><strong>Work Count:</strong> {inspectUser.cv.experience?.length || 0} items</p>
                  <p><strong>Education Count:</strong> {inspectUser.cv.education?.length || 0} items</p>
                  <p><strong>Projects Count:</strong> {inspectUser.cv.projects?.length || 0} items</p>
                  <p><strong>Share Token:</strong> {inspectUser.cv.share_token} (Status: {inspectUser.cv.share_enabled === 1 ? 'SHARING ACTIVE' : 'PRIVATE'})</p>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>No CV dataset created for this account yet.</p>
              )}
            </div>

            {/* Inspect Security Alerts */}
            <div>
              <h4 style={{ color: 'var(--neon-pink)', fontSize: '12px', fontFamily: "'Orbitron', sans-serif", borderBottom: '1px solid rgba(236,72,153,0.15)', paddingBottom: '6px', marginBottom: '10px' }}>
                RECENT SECURITY LOGIN ALERTS
              </h4>
              {inspectUser.alerts && inspectUser.alerts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                  {inspectUser.alerts.map(a => (
                    <div key={a.id} style={{ background: 'rgba(236, 72, 153, 0.03)', border: '1px solid rgba(236, 72, 153, 0.1)', borderRadius: '4px', padding: '8px', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ color: '#fff' }}>IP: {a.ip_address}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '10px' }}>UA: {a.user_agent.substring(0, 40)}...</span>
                      </div>
                      <span style={{ color: 'var(--neon-pink)' }}>{new Date(a.alerted_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>No suspicious device or IP login alert logs recorded.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
