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
  IonButton,
  IonIcon,
  IonSpinner,
} from '@ionic/react';
import { 
  peopleOutline, 
  briefcaseOutline, 
  analyticsOutline, 
  logOutOutline 
} from 'ionicons/icons';
import { supabase } from '../supabaseClient';
import { useHistory } from 'react-router';

const AdminDashboard: React.FC = () => {
  const history = useHistory();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalRecruiters: 0,
    totalSeekers: 0,
  });
  const [loading, setLoading] = useState(true);

  // Add this at the top of AdminDashboard.tsx
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
        history.replace('/tabs/home');   // Redirect non-admins
        }
    };

    checkAdmin();
    }, [history]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Total Users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Total Jobs
      const { count: totalJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true });

      // Recruiters & Seekers
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    history.replace('/login');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Admin Dashboard</IonTitle>
          <IonButton slot="end" fill="clear" onClick={handleLogout}>
            <IonIcon icon={logOutOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
            <IonSpinner name="crescent" />
          </div>
        ) : (
          <>
            <h2 style={{ margin: '0 0 20px 10px', color: '#333' }}>Overview</h2>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle style={{ fontSize: '1.8rem', color: '#3168b9' }}>
                    {stats.totalUsers}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonLabel>Total Users</IonLabel>
                </IonCardContent>
              </IonCard>

              <IonCard>
                <IonCardHeader>
                  <IonCardTitle style={{ fontSize: '1.8rem', color: '#3168b9' }}>
                    {stats.totalJobs}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonLabel>Total Jobs Posted</IonLabel>
                </IonCardContent>
              </IonCard>

              <IonCard>
                <IonCardHeader>
                  <IonCardTitle style={{ fontSize: '1.8rem', color: '#3168b9' }}>
                    {stats.totalRecruiters}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonLabel>Recruiters</IonLabel>
                </IonCardContent>
              </IonCard>

              <IonCard>
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
            <IonCard style={{ marginTop: '30px' }}>
              <IonCardHeader>
                <IonCardTitle>Quick Actions</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList>
                  <IonItem button onClick={() => history.push('/admin/users')}>
                    <IonIcon icon={peopleOutline} slot="start" />
                    <IonLabel>Manage Users</IonLabel>
                  </IonItem>

                  <IonItem button onClick={() => history.push('/admin/jobs')}>
                    <IonIcon icon={briefcaseOutline} slot="start" />
                    <IonLabel>Manage All Jobs</IonLabel>
                  </IonItem>

                  <IonItem button onClick={() => history.push('/admin/analytics')}>
                    <IonIcon icon={analyticsOutline} slot="start" />
                    <IonLabel>View Analytics</IonLabel>
                  </IonItem>
                </IonList>
              </IonCardContent>
            </IonCard>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;