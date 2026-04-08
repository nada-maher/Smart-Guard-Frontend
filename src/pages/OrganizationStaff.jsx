import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer/Footer';
import { authService } from '../services/authService';
import { supabaseClient, supabase } from '../config/supabaseConfig';
import { supabaseService } from '../services/supabaseService';
import '../styles/Dashboard.css';
import Navbar from '../components/Navbar/Navbar';

function OrganizationStaff() {
  const navigate = useNavigate();
  const [organizationUsers, setOrganizationUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isVerifying, setIsVerifying] = useState(true);
  
  // Edit & Delete State
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    role: 'security_man',
    status: 'approved'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!user) {
          navigate('/login');
          return;
        }

        // Force a re-fetch of the user profile from Supabase to get the latest organization
        if (user.email) {
          const userData = await supabaseClient.request(`/users?email=eq.${encodeURIComponent(user.email)}`, 'GET');
          if (userData && userData.length > 0) {
            const latestUser = userData[0];
            // Update current user with the absolute latest data from Supabase
            setCurrentUser(latestUser);
            
            // Check role after updating with latest data
            const role = String(latestUser.role || '').toLowerCase();
            if (role !== 'admin') {
              console.warn('Access denied: Unauthorized role', role);
              navigate('/Dashboard');  // Changed from '/dashboard' to '/Dashboard' for "نظام المراقبة"
              return;
            }
          } else {
            setCurrentUser(user);
          }
        } else {
          setCurrentUser(user);
        }
      } catch (err) {
        console.error('Verification failed:', err);
        navigate('/login');
      } finally {
        setIsVerifying(false);
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    if (currentUser && String(currentUser.role).toLowerCase() === 'admin') {
      const org = currentUser.organization;
      
      if (!org) {
        console.warn('No organization found for current user');
        return;
      }

      const fetchStaff = async () => {
        try {
          console.log(`🔄 Fetching staff for organization: "${org}" directly from Supabase`);
          
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('organization', org)
            .order('created_at', { ascending: false });
          
          if (error) {
            console.error('❌ Supabase fetch error:', error);
            // Fallback to authService if direct Supabase fails
            const fallbackData = await authService.getOrganizationUsers(org);
            updateUsersList(fallbackData);
            return;
          }

          if (data) {
            console.log(`✅ Supabase found ${data.length} users in organization ${org}`);
            updateUsersList(data);
          }
        } catch (err) {
          console.error('Error in fetchStaff:', err);
        }
      };

      const updateUsersList = (data) => {
        if (!data || !Array.isArray(data)) return;
        
        // Ensure uniqueness by email and filter out current user
        const uniqueUsers = [];
        const seenEmails = new Set();
        
        for (const user of data) {
          if (user.email !== currentUser.email && !seenEmails.has(user.email)) {
            uniqueUsers.push(user);
            seenEmails.add(user.email);
          }
        }
        
        console.log(`✨ Updated users list: ${uniqueUsers.length} unique users`);
        setOrganizationUsers(uniqueUsers);
      };

      fetchStaff();
      
      // Set up real-time subscription for immediate updates
      console.log(`📡 Subscribing to real-time updates for organization: ${org}`);
      const channel = supabase
        .channel(`org-staff-changes-${org}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users',
            filter: `organization=eq.${org}`
          },
          (payload) => {
            console.log('⚡ Real-time event received:', payload.eventType, payload.new, payload.old);
            
            if (payload.eventType === 'DELETE') {
              // For DELETE events, update UI immediately
              const deletedId = payload.old.id;
              console.log(`🗑️ Processing real-time DELETE for ID: ${deletedId}`);
              setOrganizationUsers(prev => prev.filter(user => user.id !== deletedId));
            } else {
              // For other events (INSERT, UPDATE), re-fetch the list
              fetchStaff();
            }
          }
        )
        .subscribe((status) => {
          console.log(`📡 Subscription status for ${org}:`, status);
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser]);

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status
    });
  };

  const handleSaveEdit = async () => {
     try {
       setIsSaving(true);
       setError(null);
       
       await supabaseService.updateUser(editingUser.id, {
         full_name: editForm.full_name,
         email: editForm.email,
         role: editForm.role,
         status: editForm.status
       });
       
       setEditingUser(null);
      setSuccess('تم تحديث المستخدم بنجاح');
      setTimeout(() => setSuccess(null), 3000);
      console.log('✅ User updated successfully');
     } catch (err) {
       console.error('❌ Error updating user:', err);
       setError('فشل تحديث المستخدم: ' + (err.message || 'يرجى المحاولة مرة أخرى'));
     } finally {
       setIsSaving(false);
     }
   };

   const handleDeleteUser = (user) => {
     setUserToDelete(user);
     setShowDeleteConfirm(true);
   };

   const confirmDeleteUser = async () => {
     if (!userToDelete) return;
     
     try {
       setIsDeleting(true);
       setError(null);
       
       await supabaseService.deleteUser(userToDelete.id);
      
      // Update UI immediately for a better user experience
      setOrganizationUsers(prev => prev.filter(user => user.id !== userToDelete.id));
      
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      setSuccess('تم حذف المستخدم بنجاح');
      setTimeout(() => setSuccess(null), 3000);
      console.log('✅ User deleted successfully');
     } catch (err) {
       console.error('❌ Error deleting user:', err);
       setError('فشل حذف المستخدم: ' + (err.message || 'يرجى المحاولة مرة أخرى'));
     } finally {
       setIsDeleting(false);
     }
   };

  if (isVerifying) {
    return (
      <div className="loading-screen" dir="rtl" lang="ar">
        <div className="loading-screen-content">
          <div className="loading-screen-icon"></div>
          <div className="loading-screen-text">
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            جاري التحقق من الصلاحيات
          </div>
          <div className="loading-screen-subtext">يتم الآن التحقق من صلاحياتك للوصول إلى صفحة موظفي الأمن</div>
        </div>
      </div>
    );
  }

  // Final safety check
  if (!currentUser || currentUser.role?.toLowerCase() !== 'admin') {
    return null;
  }

  return (
    <div className="dashboard-page">
      <Navbar currentPage="organization-staff" />

      {/* --- Hero Section --- */}
      <section className="dashboard-hero">
        <h1 className="dashboard-hero__title">
          موظفو الأمن
        </h1>
        <p className="dashboard-hero__subtitle">
          إدارة وتتبع جميع موظفي الأمن التابعين لمنظمة
        </p>
      </section>
      
      <div className="dashboard-content">
        {/* Success Message */}
        {success && (
          <div className="success-message" style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #bbf7d0' }}>
            <p>{success}</p>
            <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}>إغلاق</button>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="error-message" style={{ background: 'var(--status-emergency-bg)', color: 'var(--status-emergency-text)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p>{error}</p>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}>إغلاق</button>
          </div>
        )}
        
        <div className="org-stats-grid" style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <div className="quick-btn stat-card" style={{ 
            padding: '2rem', 
            cursor: 'default',
            minWidth: '250px',
            maxWidth: '350px',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            boxShadow: 'var(--card-shadow)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            transition: 'all 0.3s ease'
          }}>
            <span style={{ 
              fontSize: '1rem', 
              color: 'var(--text-secondary)',
              marginBottom: '0.75rem',
              fontWeight: '500'
            }}>
              إجمالي موظفي الأمن
            </span>
            <span style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold',
              color: 'var(--accent-primary)',
              lineHeight: '1'
            }}>
              {organizationUsers.length}
            </span>
          </div>
        </div>

        <div className="events-section">
          <table className="events-table">
            <thead>
              <tr>
                  <th>الاسم</th>
                  <th>البريد الإلكتروني</th>
                  <th>الدور</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {organizationUsers.length > 0 ? organizationUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.full_name}</td>
                    <td>{user.email}</td>
                    <td>{user.role === 'admin' ? 'مسؤول' : 'موظف أمن'}</td>
                    <td>
                      <span className={`status-badge status-badge--${user.status === 'approved' ? 'resolved' : user.status === 'pending' ? 'pending' : 'emergency'}`}>
                        {user.status === 'approved' ? 'موافق عليه' : user.status === 'declined' ? 'مرفوض' : 'معلق'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button 
                          className="action-btn-edit" 
                          style={{ 
                            padding: '8px 16px', 
                            fontSize: '14px', 
                            borderRadius: '12px',
                            backgroundColor: '#5c5cf1',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontWeight: '600'
                          }}
                          onClick={() => handleEditUser(user)}
                        >
                          تعديل 
                        </button>
                        <button 
                          className="action-btn-delete" 
                          style={{ 
                            padding: '8px 16px', 
                            fontSize: '14px', 
                            borderRadius: '12px',
                            backgroundColor: '#ef5350',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontWeight: '600'
                          }}
                          onClick={() => handleDeleteUser(user)}
                        >
                          حذف 
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    لا يوجد موظفون في هذه المنظمة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '24px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            border: 'none',
            animation: 'fadeIn 0.3s ease-out',
            textAlign: 'right',
            direction: 'rtl'
          }}>
            <h3 style={{ 
              marginBottom: '1.5rem', 
              color: '#1e293b',
              textAlign: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              تعديل المستخدم 
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>الاسم الكامل</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#1e293b', fontSize: '1rem' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>البريد الإلكتروني</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#1e293b', fontSize: '1rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>المنظمة</label>
                <input
                  type="text"
                  value={currentUser?.organization}
                  disabled
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#1e293b', fontSize: '1rem', cursor: 'not-allowed' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>الدور</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#1e293b', fontSize: '1rem' }}
                >
                  <option value="admin">مسؤول</option>
                  <option value="security_man">موظف أمن</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>الحالة</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#1e293b', fontSize: '1rem' }}
                >
                  <option value="approved">موافق عليه</option>
                  <option value="pending">معلق</option>
                  <option value="declined">مرفوض</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', justifyContent: 'center' }}>
              <button 
                className="save-changes-btn" 
                onClick={handleSaveEdit}
                disabled={isSaving}
                style={{ 
                  flex: 1, 
                  padding: '12px 24px', 
                  borderRadius: '12px', 
                  backgroundColor: '#5c5cf1', 
                  color: 'white', 
                  border: 'none', 
                  fontWeight: 'bold', 
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                {isSaving ? '...جاري الحفظ' : <>حفظ التغييرات 💾</>}
              </button>
              <button 
                className="cancel-btn" 
                onClick={() => setEditingUser(null)}
                style={{ 
                  flex: 1, 
                  padding: '12px 24px', 
                  borderRadius: '12px', 
                  backgroundColor: '#f1f5f9', 
                  color: '#1e293b', 
                  border: 'none', 
                  fontWeight: 'bold', 
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                إلغاء ❌
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '24px',
            width: '90%',
            maxWidth: '450px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            border: 'none',
            textAlign: 'center',
            animation: 'fadeIn 0.3s ease-out',
            direction: 'rtl'
          }}>
            <div style={{ 
              backgroundColor: '#fee2e2', 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.5rem',
              fontSize: '2.5rem'
            }}>
              ⚠️
            </div>
            <h3 style={{ marginBottom: '1.5rem', color: '#1e293b', fontSize: '1.75rem', fontWeight: 'bold' }}>تأكيد الحذف</h3>
            
            <div style={{ 
              backgroundColor: 'white', 
              border: '1px solid #e2e8f0', 
              borderRadius: '16px', 
              padding: '1rem', 
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              textAlign: 'right'
            }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                backgroundColor: '#5c5cf1', 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '1.25rem',
                fontWeight: 'bold'
              }}>
                {userToDelete?.full_name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{userToDelete?.full_name}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{userToDelete?.email}</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#64748b' }}>
                    {userToDelete?.role === 'admin' ? 'مسؤول' : 'موظف أمن'}
                  </span>
                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#64748b' }}>
                    موافق عليه
                  </span>
                </div>
              </div>
            </div>

            <p style={{ color: '#64748b', marginBottom: '0.5rem', fontSize: '1rem' }}>
              هل أنت متأكد من حذف هذا المستخدم؟
            </p>
            <p style={{ color: '#ef5350', marginBottom: '2rem', fontWeight: 'bold', fontSize: '1rem' }}>
              هذا الإجراء لا يمكن التراجع عنه
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                className="confirm-delete-btn" 
                onClick={confirmDeleteUser}
                disabled={isDeleting}
                style={{ 
                  flex: 1, 
                  padding: '12px 24px', 
                  borderRadius: '12px', 
                  backgroundColor: '#ef5350', 
                  color: 'white', 
                  border: 'none', 
                  fontWeight: 'bold', 
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239, 83, 80, 0.2)'
                }}
              >
                {isDeleting ? '...جاري الحذف' : 'حذف المستخدم'}
              </button>
              <button 
                className="cancel-btn" 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setUserToDelete(null);
                }}
                style={{ 
                  flex: 1, 
                  padding: '12px 24px', 
                  borderRadius: '12px', 
                  backgroundColor: '#f1f5f9', 
                  color: '#1e293b', 
                  border: 'none', 
                  fontWeight: 'bold', 
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default OrganizationStaff;
