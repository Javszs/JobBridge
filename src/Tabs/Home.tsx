import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { supabase } from '../supabaseClient';
import SeekerHome from '../pages/homes/SeekerHome';
import RecruiterHome from '../pages/homes/RecruiterHome';
import {
  IonPage,
  IonContent,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
} from '@ionic/react';

const Home: React.FC = () => {
  const history = useHistory();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        history.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching role:', error);
      }

      const userRole = (data?.role || 'seeker').toLowerCase().trim();
      setRole(userRole);

      // Admin uses history.push / replace
      if (userRole === 'admin') {
        history.replace('/admin-dashboard');   // or history.push if you want to keep back button
        return;
      }

      // Seeker and Recruiter render as components
      if (userRole === 'recruiter') {
        // Recruiter renders component
      } else {
        // Default: Seeker renders component
      }
    } catch (err) {
      console.error('Role check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    setLoading(true);
    await checkUserRole();
    event.detail.complete();
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent fullscreen className="ion-padding">
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent />
          </IonRefresher>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Admin is already redirected above, so we only reach here for non-admins
  if (role === 'recruiter') {
    return <RecruiterHome />;
  }

  // Default to SeekerHome for seeker or any other role
  return <SeekerHome />;
};

export default Home;