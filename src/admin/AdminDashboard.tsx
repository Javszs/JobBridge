import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonSpinner,
  IonButton,
} from '@ionic/react';
import { 
  people, 
  briefcase, 
  logOut
} from 'ionicons/icons';
import { supabase } from '../supabaseClient';
import { useHistory } from 'react-router';
import './AdminDashboard.css';

interface AdminDashboardProps {
  onLogout?: () => void;   // Optional: to match Profile style
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const history = useHistory();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalRecruiters: 0,
    totalSeekers: 0,
  });
  const [loading, setLoading] = useState(true);

  // Admin Protection
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        history.replace('/login');
        return;
      }

      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (data?.role?.toLowerCase() !== 'admin') {
        history.replace('/tabs/home');
      }
    };

    checkAdmin();
  }, [history]);

  // Fetch Stats
  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: totalJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true });

      const { data: roleData } = await supabase
        .from('users')
        .select('role');

      const totalRecruiters = roleData?.filter(u => u.role?.toLowerCase() === 'recruiter').length || 0;
      const totalSeekers = roleData?.filter(u => u.role?.toLowerCase() === 'seeker').length || 0;

      setStats({
        totalUsers: totalUsers || 0,
        totalJobs: totalJobs || 0,
        totalRecruiters,
        totalSeekers,
      });
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Logout - Based on your App.tsx + Profile.tsx pattern
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      
      // Clear app login state (important!)
      localStorage.removeItem('isLoggedIn');
      
      // Call parent logout if passed
      if (onLogout) onLogout();

      // Redirect to login
      history.replace('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      // Fallback
      history.replace('/login');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle className='Chat-Title'>Admin Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
            <IonSpinner name="crescent" />
          </div>
        ) : (
          <>
            <h2 style={{ margin: '10px 0 20px', color: '#ffffff', textAlign: 'center', fontSize: '2rem' }}>Overview</h2>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <IonCard className='admin-card'>
                <IonCardHeader>
                  <IonCardTitle style={{ fontSize: '1.8rem', color: '#3168b9' }}>
                    {stats.totalUsers}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonLabel>Total Users</IonLabel>
                </IonCardContent>
              </IonCard>

              <IonCard className='admin-card'>
                <IonCardHeader>
                  <IonCardTitle style={{ fontSize: '1.8rem', color: '#3168b9' }}>
                    {stats.totalJobs}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonLabel>Total Jobs Posted</IonLabel>
                </IonCardContent>
              </IonCard>

              <IonCard className='admin-card'>
                <IonCardHeader>
                  <IonCardTitle style={{ fontSize: '1.8rem', color: '#3168b9' }}>
                    {stats.totalRecruiters}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonLabel>Recruiters</IonLabel>
                </IonCardContent>
              </IonCard>

              <IonCard className='admin-card'>
                <IonCardHeader>
                  <IonCardTitle style={{ fontSize: '1.8rem', color: '#3168b9' }}>
                    {stats.totalSeekers}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonLabel>Job Seekers</IonLabel>
                </IonCardContent>
              </IonCard>
            </div>

            {/* Quick Actions */}
                <IonList className='admin-list'>
                  <IonItem button onClick={() => history.push('/admin/users')} lines="full">
                    <IonIcon icon={people} slot="start" />
                    <IonLabel>Manage Users</IonLabel>
                  </IonItem>

                  <IonItem button onClick={() => history.push('/admin/jobs')} lines="full">
                    <IonIcon icon={briefcase} slot="start" />
                    <IonLabel>Manage All Jobs</IonLabel>
                  </IonItem>

                  {/* Logout - Consistent with Profile.tsx */}
                  <IonItem 
                    button 
                    onClick={handleLogout} 
                    lines="none" 
                    style={{ marginTop: '12px' }}
                  >
                    <IonIcon icon={logOut} slot="start" color="danger" />
                    <IonLabel style={{fontWeight: 'bold' }}>
                      Logout
                    </IonLabel>
                  </IonItem>
                </IonList>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;