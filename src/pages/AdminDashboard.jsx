import { useState, useEffect } from 'react';
import '../styles/Dashboard.css';
import '../styles/AdminDashboard.css';
import { authService } from '../services/authService';
import { supabaseService } from '../services/supabaseService';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';

/**
 * AdminDashboard Component
 * 
 * Admin interface for managing organization users and signup requests.
 * Shows all users, their roles, and pending signup requests.
 * 
 * @component
 */
function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'requests'
  const [declineReason, setDeclineReason] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    organization: '',
    role: 'security_man',
    status: 'approved'
  });
  const [deleteSuccess, setDeleteSuccess] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [selectedOrganization, setSelectedOrganization] = useState('all'); // 'all' or specific org
  const [allOrganizations, setAllOrganizations] = useState([]);

  const handleLogout = () => {
    authService.signout();
    navigate('/login');
  };

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser || currentUser.email !== 'admin@smartguard.com') {
        navigate('/login');
      } else {
        setCurrentUser(currentUser);
        if (currentUser.organization) {
          setCurrentOrg(currentUser.organization);
        }
        loadData();
      }
    };
    checkUser();
  }, [navigate]);

  const loadData = async (silent = false) => {
    try {
      console.log('🔄 Starting data load, silent:', silent);
      
      if (!silent) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      
      console.log('🔄 Loading data from Supabase...');
      
      // Load all users directly from Supabase
      const usersList = await supabaseService.getAllUsers();
      const validatedUsers = Array.isArray(usersList) ? usersList : [];
      console.log('🔍 Loaded users from Supabase:', validatedUsers.length, 'users');
      
      // Extract all unique organizations
      const orgs = [...new Set(validatedUsers.map(u => u.organization).filter(Boolean))];
      setAllOrganizations(orgs);
      console.log('🏢 Available organizations:', orgs);
      
      // Update users state immediately for manual refresh
      setUsers(validatedUsers);
      
      // Load pending signup requests via backend API (which falls back to local DB if Supabase fails)
      let requests = await authService.getPendingSignups();
      const validatedRequests = Array.isArray(requests) ? requests : [];
      console.log('🔍 Loaded pending requests from API:', validatedRequests.length, 'requests');
      
      // Update pending requests state immediately for manual refresh
      setPendingRequests(validatedRequests);
      
      console.log('✅ Data load completed successfully');
      console.log('📊 Final data summary:', {
        users: validatedUsers.length,
        pendingRequests: validatedRequests.length
      });
    } catch (err) {
      console.error('❌ Error loading data from Supabase:', err);
      setError(`فشل تحميل البيانات: ${err.message || 'يرجى المحاولة لاحقاً'}`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      console.log('🔄 Loading states reset');
    }
  };

  const handleApproveSignup = async (request) => {
    try {
      const requestId = request.id;
      const userEmail = request.email;
      console.log('🔍 Approving request:', requestId, 'Email:', userEmail);
      const requestIdStr = String(requestId);
      
      // Check if this is a local test request
      if (requestIdStr.startsWith('local_test_')) {
        // ... (rest of local test logic)
        console.log('🔍 Approving local test request');
        setPendingRequests(prev => prev.filter(r => r.id !== requestId));
        const approvedUser = {
          id: requestId,
          email: userEmail || 'test.pending@example.com',
          full_name: request.full_name || 'مستخدم تجريبي معلق',
          organization: request.organization || 'منظمة اختبار',
          role: request.role || 'security_man',
          status: 'approved',
          created_at: new Date().toISOString()
        };
        setUsers(prev => [...prev, approvedUser]);
        setError(null);
        console.log('✅ Local test request approved');
        return;
      }
      
      // Update user status via backend API for real requests (syncs local DB and Supabase)
      await authService.approveSignup(requestId, userEmail);
      
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      
      // Reload users from Supabase
      const usersList = await supabaseService.getAllUsers();
      console.log('🔍 After approval - reloaded users from Supabase:', usersList.length, 'users');
      setUsers(usersList);
      
      // Show success message
      setError(null);
      console.log('✅ Request approved successfully');
    } catch (err) {
      console.error('Error approving request:', err);
      const errorMessage = err.message || 'فشل الموافقة على الطلب';
      setError(errorMessage);
    }
  };

  const handleDeclineSignup = async (requestId) => {
    try {
      console.log('🔍 Declining request:', requestId, 'with reason:', declineReason);
      const requestIdStr = String(requestId);
      
      // Check if this is a local test request
      if (requestIdStr.startsWith('local_test_')) {
        console.log('🔍 Declining local test request');
        // Just remove from local pending requests
        setPendingRequests(prev => prev.filter(r => r.id !== requestId));
        // Add to users list as declined
        const declinedUser = {
          id: requestId,
          email: 'test.pending@example.com',
          full_name: 'مستخدم تجريبي معلق',
          organization: 'منظمة اختبار',
          role: 'security_man',
          status: 'declined',
          created_at: new Date().toISOString()
        };
        setUsers(prev => [...prev, declinedUser]);
        setDeclineReason('');
        setSelectedRequest(null);
        setError(null);
        console.log('✅ Local test request declined');
        return;
      }
      
      // Update user status via backend API for real requests (syncs local DB and Supabase)
      await authService.declineSignup(requestId, declineReason);
      
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      setDeclineReason('');
      setSelectedRequest(null);
      
      // Reload users from Supabase to update declined count
      const usersList = await supabaseService.getAllUsers();
      console.log('🔍 After decline - reloaded users from Supabase:', usersList.length, 'users');
      setUsers(usersList);
      setError(null);
      
      // Show success message
      console.log('✅ Request declined successfully');
    } catch (err) {
      console.error('Error declining request:', err);
      setError('فشل رفض الطلب: ' + (err.message || 'يرجى المحاولة مرة أخرى'));
    }
  };

  const handleEditUser = (user) => {
    console.log('🔍 Opening edit modal for user:', user);
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name,
      email: user.email,
      organization: user.organization,
      role: user.role,
      status: user.status
    });
  };

  const handleSaveEdit = async () => {
    try {
      setIsSaving(true);
      console.log('🔄 Saving user edits:', editForm);
      
      // Check if this is a local test user
      const userIdStr = String(editingUser.id);
      if (userIdStr.startsWith('local_test_')) {
        console.log('🔍 Updating local test user');
        setUsers(prev => prev.map(u => 
          u.id === editingUser.id ? { ...u, ...editForm } : u
        ));
        setEditingUser(null);
        setError(null);
        console.log('✅ Local test user updated');
        return;
      }
      
      // Update real user in Supabase and Local DB via backend
      await authService.updateUser(editingUser.id, editForm);
      
      setUsers(prev => prev.map(u => 
        u.id === editingUser.id ? { ...u, ...editForm } : u
      ));
      
      // If the admin edited themselves, update the local user profile too
      const currentUser = await authService.getCurrentUser();
      if (currentUser && currentUser.id === editingUser.id) {
        console.log('🔄 Admin updated their own profile, refreshing local data...');
        // This will trigger a refresh of the profile in the UI if needed
      }
      
      setEditingUser(null);
      setError(null);
      console.log('✅ User updated successfully in both databases');
    } catch (err) {
      console.error('❌ Error updating user:', err);
      setError('فشل تحديث المستخدم: ' + (err.message || 'يرجى المحاولة مرة أخرى'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    console.log('❌ Canceling edit');
    setEditingUser(null);
    setEditForm({
      full_name: '',
      email: '',
      organization: '',
      role: 'security_man',
      status: 'approved'
    });
  };

  const handleDeleteUser = (user) => {
    console.log('🔍 Delete button clicked for user:', user);
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setIsDeleting(true);
      console.log('🔄 Starting deletion process...');
      console.log('🔄 Calling authService.deleteUser with ID:', userToDelete.id);
      
      // Call the delete function via backend for sync
      await authService.deleteUser(userToDelete.id);
      
      console.log('🔄 Delete function completed, updating users state...');
      
      // Update the users state locally by filtering out the deleted user
      setUsers(prevUsers => {
        const filtered = prevUsers.filter(u => u.id !== userToDelete.id);
        console.log('🔄 Updated users list length:', filtered.length);
        return filtered;
      });
      
      // Show beautiful success notification
      setDeleteSuccess({
        userName: userToDelete.full_name,
        userId: userToDelete.id,
        timestamp: new Date()
      });
      
      // Hide success notification after 3 seconds
      setTimeout(() => {
        setDeleteSuccess(null);
      }, 3000);
      
      setError(null);
      console.log('✅ User deletion process completed successfully');
      
      // Close the modal and reset state
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('❌ Error in delete process:', err);
      console.error('❌ Error details:', JSON.stringify(err, null, 2));
      setError('فشل حذف المستخدم: ' + (err.message || 'يرجى المحاولة مرة أخرى'));
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    console.log('❌ User cancelled deletion');
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  const getRoleDisplay = (role) => {
    return role === 'admin' ? 'مسؤول' : 'موظف أمن';
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return '#4CAF50';
      case 'pending': return '#FFC107';
      case 'rejected': return '#F44336';
      default: return '#757575';
    }
  };

  const getStatusDisplay = (status) => {
    switch(status) {
      case 'approved': return 'موافق عليه';
      case 'declined': return 'مرفوض';
      case 'pending': return 'معلق';
      default: return status;
    }
  };

  // Calculate user statistics
  const filteredUsers = selectedOrganization === 'all' 
    ? users 
    : users.filter(user => user.organization === selectedOrganization);
    
  const userStats = {
    total: Array.isArray(filteredUsers) ? filteredUsers.length : 0,
    approved: Array.isArray(filteredUsers) ? filteredUsers.filter(u => u && u.status === 'approved').length : 0,
    declined: Array.isArray(filteredUsers) ? filteredUsers.filter(u => u && u.status === 'declined').length : 0,
    pending: Array.isArray(filteredUsers) ? filteredUsers.filter(u => u && u.status === 'pending').length : 0,
    admins: Array.isArray(filteredUsers) ? filteredUsers.filter(u => u && u.role === 'admin').length : 0,
    security: Array.isArray(filteredUsers) ? filteredUsers.filter(u => u && u.role === 'security_man').length : 0
  };
  
  // Debug userStats
  console.log('🔍 UserStats calculation:', userStats);

  if (isLoading) {
    return (
      <div className="loading-container" dir="rtl" lang="ar">
        <div className="loading-content">
          <div className="loading-icon"></div>
          <div className="loading-text">جاري تحميل لوحة تحكم المسؤول</div>
          <div className="loading-subtext">يتم الآن جلب بيانات المستخدمين والطلبات الجديدة</div>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page" dir="rtl" lang="ar">
      <Navbar currentPage="admin-dashboard" />

      {/* Header */}
      <header className="dashboard-hero">
        <div className="dashboard-content">
          <h1 className="dashboard-hero__title">لوحة تحكم المسؤول</h1>
          <p className="dashboard-hero__subtitle">إدارة المستخدمين والطلبات الجديدة</p>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Error Message */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError(null)}>إغلاق</button>
          </div>
        )}

        {/* Manual Refresh Button */}
        <div className="refresh-section">
          <h3>لوحة تحكم المسؤول</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={() => {
                console.log('🔄 Manual refresh button clicked');
                console.log('🔄 Current states:', { isLoading, isRefreshing });
                loadData(false);
              }}
              disabled={isLoading || isRefreshing}
              className={`save-btn refresh-btn${(isLoading || isRefreshing) ? ' disabled' : ''}`}
            >
              {isRefreshing ? '🔄 جاري التحديث...' : '🔄 تحديث الآن'}
            </button>
            
          </div>
        </div>

        {/* Statistics Cards */}
        <div className={`org-stats-grid${isRefreshing ? ' refreshing' : ''}`}>
          {isRefreshing && (
            <div className="refresh-indicator">
              جاري التحديث...
            </div>
          )}
          
          <div className={`quick-btn stat-card${isRefreshing ? ' refreshing' : ''}`}>
            <span className="stat-icon">👥</span>
            <span className="stat-label">
              إجمالي المستخدمين
            </span>
            <span className="stat-value">{userStats.total}</span>
          </div>
          
          <div className={`quick-btn stat-card${isRefreshing ? ' refreshing' : ''}`}>
            <span className="stat-icon">✅</span>
            <span className="stat-label">
              المستخدمون الموافق عليهم
            </span>
            <span className="stat-value approved">{userStats.approved}</span>
          </div>
          
          <div className={`quick-btn stat-card${isRefreshing ? ' refreshing' : ''}`}>
            <span className="stat-icon">❌</span>
            <span className="stat-label">
              المستخدمون المرفوضون
            </span>
            <span className="stat-value declined">{userStats.declined}</span>
          </div>
          
          <div className={`quick-btn stat-card${isRefreshing ? ' refreshing' : ''}`}>
            <span className="stat-icon">⏳</span>
            <span className="stat-label">
              المستخدمون المعلقون
            </span>
            <span className="stat-value pending">{userStats.pending}</span>
          </div>
          
          <div className={`quick-btn stat-card${isRefreshing ? ' refreshing' : ''}`}>
            <span className="stat-icon">📝</span>
            <span className="stat-label">
              الطلبات المعلقة
            </span>
            <span className="stat-value pending">{Array.isArray(pendingRequests) ? pendingRequests.length : 0}</span>
          </div>
          
          <div className={`quick-btn stat-card${isRefreshing ? ' refreshing' : ''}`}>
            <span className="stat-icon">👨‍💼</span>
            <span className="stat-label">
              المسؤولون
            </span>
            <span className="stat-value admins">{userStats.admins}</span>
          </div>
          
          <div className={`quick-btn stat-card${isRefreshing ? ' refreshing' : ''}`}>
            <span className="stat-icon">👮</span>
            <span className="stat-label">
              موظفو الأمن
            </span>
            <span className="stat-value security">{userStats.security}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button 
            className={`quick-btn admin-tab-btn${activeTab === 'users' ? ' active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            المستخدمون ({Array.isArray(filteredUsers) ? filteredUsers.length : 0})
          </button>
          <button 
            className={`quick-btn admin-tab-btn${activeTab === 'requests' ? ' active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            الطلبات المعلقة ({Array.isArray(pendingRequests) ? pendingRequests.length : 0})
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="tab-content tab-content-animated">
            <section className="events-section">
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="section-title">جميع المستخدمين</h2>
                  
                  {/* Organization Filter - ONLY Smart Guard can access all organizations */}
                  {currentUser && currentUser.email === 'admin@smartguard.com' && allOrganizations.length > 1 && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span className="sorting-label">المنظمة:</span>
                      <select 
                        value={selectedOrganization}
                        onChange={(e) => setSelectedOrganization(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          fontSize: '14px',
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <option value="all">جميع المنظمات</option>
                        {allOrganizations.map(org => (
                          <option key={org} value={org}>{org}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              
              {(!Array.isArray(filteredUsers) || filteredUsers.length === 0) ? (
                <p className="empty-state">لا توجد مستخدمون حالياً</p>
              ) : (
                <div className={`table-container${isRefreshing ? ' refreshing' : ''}`}>
                  <table className="events-table">
                    <thead>
                      <tr>
                        <th>الاسم</th>
                        <th>البريد الإلكتروني</th>
                        <th>المنظمة</th>
                        <th>الدور</th>
                        <th>الحالة</th>
                        <th>تاريخ الإنشاء</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user, index) => (
                        <tr key={user.id} className="table-row-animated" style={{ animationDelay: `${index * 0.05}s` }}>
                          <td>{user.full_name}</td>
                          <td>{user.email}</td>
                          <td>{user.organization}</td>
                          <td>{getRoleDisplay(user.role)}</td>
                          <td>
                            <span 
                              className={`status-badge status-badge--${(!user.status || user.status === 'approved') ? 'resolved' : user.status === 'pending' ? 'pending' : 'emergency'}`}
                            >
                              {getStatusDisplay(user.status)}
                            </span>
                          </td>
                          <td>{new Date(user.created_at).toLocaleDateString('ar-EG')}</td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="user-edit-btn"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('🔍🔍🔍 EDIT BUTTON CLICKED! User:', user);
                                  console.log('🔍🔍🔍 Event object:', e);
                                  console.log('🔍🔍🔍 User ID type:', typeof user.id);
                                  handleEditUser(user);
                                }}
                                title="تعديل المستخدم"
                              >
                                تعديل
                              </button>
                              <button 
                                className="user-delete-btn"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('🔍🔍🔍🔍 DELETE BUTTON CLICKED! User:', user);
                                  console.log('🔍🔍🔍🔍 Event object:', e);
                                  console.log('🔍🔍🔍🔍 User ID value:', user.id);
                                  handleDeleteUser(user);
                                }}
                                title="حذف المستخدم"
                              >
                                حذف
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="tab-content">
            <section className="events-section">
              <h2 className="section-title">طلبات التسجيل المعلقة</h2>
              {(!Array.isArray(pendingRequests) || pendingRequests.length === 0) ? (
                <p className="empty-state">لا توجد طلبات معلقة</p>
              ) : (
                <div className="requests-list">
                  {pendingRequests.map(request => (
                    <div key={request.id} className="settings-card request-card">
                      <div className="request-info">
                        <h3>{request.full_name}</h3>
                        <p className="request-email">{request.email}</p>
                        <p className="request-org">المنظمة: {request.organization}</p>
                        <p className="request-role">الدور المطلوب: {getRoleDisplay(request.role)}</p>
                        <p className="request-date">
                          تاريخ الطلب: {new Date(request.created_at).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                      
                      <div className="request-actions">
                        <button 
                          className="save-btn request-action-btn"
                          onClick={() => {
                            console.log('🔍 Approve button clicked for request:', request.id);
                            handleApproveSignup(request);
                          }}
                        >
                          ✓ الموافقة
                        </button>
                        
                        <button 
                          className="save-btn request-action-btn decline"
                          onClick={() => {
                            console.log('🔍 Quick decline button clicked for request:', request.id);
                            handleDeclineSignup(request.id);
                          }}
                        >
                          ✕ رفض سريع
                        </button>
                        
                        
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">
              ✏️ تعديل المستخدم
            </h3>
            
            <div className="modal-form">
              <div>
                <label className="form-label">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                  className="form-input"
                />
              </div>
              
              <div>
                <label className="form-label">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="form-input"
                />
              </div>
              
              <div>
                <label className="form-label">
                  المنظمة
                </label>
                <input
                  type="text"
                  value={editForm.organization}
                  onChange={(e) => setEditForm(prev => ({ ...prev, organization: e.target.value }))}
                  className="form-input"
                />
              </div>
              
              <div>
                <label className="form-label">
                  الدور
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                  className="form-select"
                >
                  <option value="admin">مسؤول</option>
                  <option value="security_man">موظف أمن</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">
                  الحالة
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  className="form-select"
                >
                  <option value="approved">موافق عليه</option>
                  <option value="pending">معلق</option>
                  <option value="declined">مرفوض</option>
                </select>
              </div>
            </div>
            
            <div className="modal-actions">
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className={`modal-save-btn modal-btn${isSaving ? ' disabled' : ''}`}
              >
                {isSaving ? (
                  <>
                    <div className="loading-spinner"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    💾 حفظ التغييرات
                  </>
                )}
              </button>
              <button
                onClick={handleCancelEdit}
                className="modal-cancel-btn"
              >
                ❌ إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && userToDelete && (
        <div className="delete-modal-overlay">
          <div className="delete-modal-content">
            {/* Warning Icon */}
            <div className="warning-icon">
              ⚠️
            </div>

            {/* Title */}
            <h3 className="delete-modal-title">
              تأكيد الحذف
            </h3>

            {/* User Info */}
            <div className="user-info-card">
              <div className="user-info-header">
                <div className="user-avatar">
                  {userToDelete.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="user-info-details">
                  <div className="user-name">
                    {userToDelete.full_name}
                  </div>
                  <div className="user-email">
                    {userToDelete.email}
                  </div>
                </div>
              </div>
              
              <div className="user-badges">
                <span className="user-badge">
                  {getRoleDisplay(userToDelete.role)}
                </span>
                <span className="user-badge">
                  {userToDelete.status === 'approved' ? 'موافق عليه' : 
                   userToDelete.status === 'pending' ? 'معلق' : 'مرفوض'}
                </span>
              </div>
            </div>

            {/* Warning Message */}
            <p className="warning-message">
              هل أنت متأكد من حذف هذا المستخدم؟
              <br />
              <span className="warning-text">
                هذا الإجراء لا يمكن التراجع عنه
              </span>
            </p>

            {/* Action Buttons */}
            <div className="delete-modal-actions">
              <button
                className="cancel-btn"
                onClick={cancelDelete}
                disabled={isDeleting}
              >
                إلغاء
              </button>
              <button
                className={`delete-btn${isDeleting ? ' loading' : ''}`}
                onClick={confirmDeleteUser}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="loading-spinner"></div>
                    جاري الحذف...
                  </>
                ) : (
                  'حذف المستخدم'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default AdminDashboard;
