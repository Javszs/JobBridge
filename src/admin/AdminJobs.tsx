import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonSpinner,
  IonAlert,
  IonBackButton,
  IonButtons
} from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import { supabase } from '../supabaseClient';

const AdminJobs: React.FC = () => {
  const history = useHistory();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return history.replace('/login');

      const { data } = await supabase.from('users').select('role').eq('id', user.id).single();
      if (data?.role?.toLowerCase() !== 'admin') history.replace('/tabs/home');
    };
    checkAdmin();
    fetchJobs();
  }, [history]);

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('job_id, position, company, location, created_at')
      .order('created_at', { ascending: false });
    setJobs(data || []);
    setLoading(false);
  };

  const deleteJob = async () => {
    if (!selectedJobId) return;
    await supabase.from('jobs').delete().eq('job_id', selectedJobId);
    setShowDeleteAlert(false);
    fetchJobs();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
            <IonButtons slot="start">
                <IonBackButton defaultHref="/admin-dashboard" style={{ color: 'white' }} />
            </IonButtons>
          <IonTitle style={{ color: 'white' }}>Manage Jobs</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <h2 style={{ margin: '10px 0 20px', color: '#ffffff', textAlign: 'center', fontSize: '2rem' }}>Manage Jobs</h2>

        {loading ? <IonSpinner /> : (
          <IonList>
            {jobs.map((job) => (
              <IonItem key={job.job_id}>
                <IonLabel>
                  <h2>{job.position}</h2>
                  <p>{job.company} • {job.location}</p>
                </IonLabel>
                <IonButton color="danger" onClick={() => {
                  setSelectedJobId(job.job_id);
                  setShowDeleteAlert(true);
                }}>
                  <IonIcon icon={trashOutline} />
                </IonButton>
              </IonItem>
            ))}
          </IonList>
        )}

        <IonAlert
          isOpen={showDeleteAlert}
          header="Delete Job"
          message="Are you sure you want to delete this job?"
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Delete', role: 'destructive', handler: deleteJob },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminJobs;