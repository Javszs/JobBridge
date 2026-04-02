import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { supabase } from '../supabaseClient';
import SeekerHome from '../pages/homes/SeekerHome';
import RecruiterHome from '../pages/homes/RecruiterHome';
import { IonPage, IonContent, IonSpinner, IonRefresher, IonRefresherContent, RefresherEventDetail } from '@ionic/react';

const Home: React.FC = () => {
  const history = useHistory();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkUserRole = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          if (isMounted) history.replace('/login');
          return;
        }

        const { data, error: dbError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (dbError && dbError.code !== 'PGRST116') {
          console.error('Database error:', dbError);
          if (isMounted) setError('Failed to load user role');
          return;
        }

        if (isMounted) {
          if (data && data.role) {
            console.log('Setting role to:', data.role);
            setRole(data.role);
          } else {
            // No role found → default to seeker
            console.log('No role found, defaulting to seeker');
            setRole('seeker');
          }
        }
      } catch (err) {
        console.error('Role check failed:', err);
        if (isMounted) setError('Something went wrong');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkUserRole();

    return () => {
      isMounted = false;
    };
  }, [history]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    setLoading(true);
    setError(null);
    setRole(null);
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        history.replace('/login');
        return;
      }

      const { data, error: dbError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (dbError && dbError.code !== 'PGRST116') {
        console.error('Database error:', dbError);
        setError('Failed to load user role');
      } else if (data && data.role) {
        setRole(data.role);
      } else {
        setRole('seeker');
      }
    } catch (err) {
      console.error('Role check failed:', err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
    
    event.detail.complete();
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent fullscreen className="ion-padding">
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent></IonRefresherContent>
          </IonRefresher>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage>
        <IonContent>
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent></IonRefresherContent>
          </IonRefresher>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Error</h2>
            <p>{error}</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Role-based rendering
  if (role === 'recruiter') {
    return <RecruiterHome />;
  }

  return <SeekerHome />;
};

export default Home;