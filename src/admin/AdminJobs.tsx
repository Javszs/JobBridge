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
  IonToast,
  IonButtons,
  IonBackButton,
  IonAvatar,
  IonAlert,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
} from '@ionic/react';
import { trashOutline, closeCircleOutline } from 'ionicons/icons';
import { supabase } from '../supabaseClient';

const AdminJobs: React.FC = () => {
  const history = useHistory();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; color: 'success' | 'danger' } | null>(null);

  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showCloseAlert, setShowCloseAlert] = useState(false);
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
    const { data, error } = await supabase
      .from('jobs')
      .select('job_id, position, company, location, status, quantity, created_at')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching jobs:', error);
    else setJobs(data || []);

    setLoading(false);
  };

  // Close Job
  const closeJob = async () => {
    if (!selectedJobId) return;

    const { error } = await supabase
      .from('jobs')
      .update({ status: 'closed' })
      .eq('job_id', selectedJobId);

    if (error) {
      setToast({ message: 'Failed to close job', color: 'danger' });
    } else {
      setToast({ message: 'Job closed successfully', color: 'success' });
      fetchJobs();
    }

    setShowCloseAlert(false);
    setSelectedJobId(null);
  };

  // Delete Job
  const deleteJob = async () => {
    if (!selectedJobId) return;

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('job_id', selectedJobId);

    if (error) {
      setToast({ message: 'Failed to delete job', color: 'danger' });
    } else {
      setToast({ message: 'Job deleted successfully', color: 'success' });
      fetchJobs();
    }

    setShowDeleteAlert(false);
    setSelectedJobId(null);
  };

  const openActionAlert = (jobId: string, action: 'delete' | 'close') => {
    setSelectedJobId(jobId);
    if (action === 'delete') {
      setShowDeleteAlert(true);
    } else {
      setShowCloseAlert(true);
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
      await fetchJobs();
      event.detail.complete();
    };
  

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/admin-dashboard" />
          </IonButtons>
          <IonTitle>Manage Jobs</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <h2 style={{ margin: '10px 0 20px', color: '#ffffff', textAlign: 'center', fontSize: '1.8rem' }}>
          All Posted Jobs
        </h2>

        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent />
        </IonRefresher>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
            <IonSpinner />
          </div>
        ) : (
          <IonList className="Chats-List">
            {jobs.map((job) => (
              <IonItem key={job.job_id} className="Chat-Item">
                <IonAvatar slot="start">
                  <div className="avatar-placeholder">
                    {job.company?.charAt(0) || 'J'}
                  </div>
                </IonAvatar>

                <IonLabel className="Chats-label">
                  <h2>{job.position}</h2>
                  <p>{job.company} • {job.location}</p>
                  <p style={{ marginTop: '6px', fontWeight: 'bold' }}>
                    Status:{' '}
                    <span style={{ color: job.status === 'closed' ? 'red' : 'green'}}>
                      {job.status ? job.status.toUpperCase() : 'ACTIVE'}
                    </span>
                  </p>
                </IonLabel>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <IonButton 
                    color="warning" 
                    size="small"
                    onClick={() => openActionAlert(job.job_id, 'close')}
                  >
                    <IonIcon icon={closeCircleOutline} />
                  </IonButton>

                  <IonButton 
                    color="danger" 
                    size="small"
                    onClick={() => openActionAlert(job.job_id, 'delete')}
                  >
                    <IonIcon icon={trashOutline} />
                  </IonButton>
                </div>
              </IonItem>
            ))}
          </IonList>
        )}

        {/* Close Job Alert - Positioned at bottom */}
        <IonAlert
          isOpen={showCloseAlert}
          onDidDismiss={() => setShowCloseAlert(false)}
          header="Close Job"
          message="Change this job status to 'closed'? It will no longer appear as active for users."
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Close Job', role: 'destructive', handler: closeJob },
          ]}
          cssClass="ion-alert-bottom"   // Helps position at bottom
        />

        {/* Delete Job Alert - Positioned at bottom */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Delete Job"
          message="This action cannot be undone. Permanently delete this job from the database?"
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Delete', role: 'destructive', handler: deleteJob },
          ]}
          cssClass="ion-alert-bottom"
        />

        {/* Toast Feedback */}
        <IonToast
          isOpen={!!toast}
          message={toast?.message}
          color={toast?.color}
          duration={2800}
          position="bottom"
          onDidDismiss={() => setToast(null)}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminJobs;