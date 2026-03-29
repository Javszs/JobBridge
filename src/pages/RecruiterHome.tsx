import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonSpinner,
  IonToast,
} from '@ionic/react';
import { addOutline, notificationsOutline, heartOutline } from 'ionicons/icons';
import { supabase } from '../supabaseClient';
import './RecruiterHome.css';

const RecruiterHome: React.FC = () => {
  const history = useHistory();
  const [userName, setUserName] = useState<string>("Recruiter");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; color: 'success' | 'danger' } | null>(null);

  useEffect(() => {
    fetchUserAndJobs();
  }, []);

  const fetchUserAndJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user firstname
      const { data: userData } = await supabase
        .from('users')
        .select('firstname')
        .eq('id', user.id)
        .single();

      if (userData?.firstname) {
        setUserName(userData.firstname);
      }

      // Fetch jobs posted by this recruiter
      const { data: jobData, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('recruiter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
      } else {
        setJobs(jobData || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddJob = () => {
  history.push('/recruiter/post-job');  
  };

  

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <div className="recruiter-header-content recruiter-home-header">
            <div>
              <h1 className="recruiter-greeting">Hi, {userName}!</h1>
              <p className="recruiter-sub-greeting">Recruit the best talent! 🔝</p>
            </div>
            <IonButton fill="clear" className="recruiter-notification-btn">
              <IonIcon icon={notificationsOutline} size="large" />
            </IonButton>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="recruiter-home-content">

        {/* Posted Jobs Header + Add Button */}
        <div className="recruiter-section-header" style={{ marginTop: '10px' }}>
          <h2>Posted Jobs</h2>
          
        </div>

        <IonButton 
            color="primary" 
            onClick={handleAddJob}
            className="add-job-btn"
            >
            <IonIcon icon={addOutline} slot="start" />
            Add Job
          </IonButton>

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <IonSpinner />
          </div>
        ) : jobs.length === 0 ? (
          <div className="no-jobs">
            <p>You haven't posted any jobs yet.</p>
            <IonButton onClick={handleAddJob} color="primary" className='no-job-button'>
              Post Your First Job
            </IonButton>
          </div>
        ) : (
          <div className="recruiter-job-list" style={{ marginTop: '30px'}}>
            {jobs.map((job) => (
              <div key={job.job_id} className="recruiter-job-card">
                <div className="recruiter-job-header">
                  <div className="recruiter-company-logo">
                    <div className="recruiter-logo-circle">
                      {job.company?.charAt(0) || 'J'}
                    </div>
                  </div>
                </div>
                <div className="recruiter-job-info">
                  <h3>{job.position}</h3>
                  <span className="recruiter-company-name">{job.company}</span>
                </div>
                <IonIcon icon={heartOutline} className="recruiter-save-icon" />


                <div className="recruiter-job-info2">
                  <div className="recruiter-job-meta">
                    <span>📍 {job.location || 'Not specified'}</span>
                    <span>💲 {job.salary + ' / day' || 'Salary not specified'}</span>
                    <span>🕒 {new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="recruiter-job-tags">
                    <span className="recruiter-tag">{job.status || 'Active'}</span>
                    <span className="recruiter-tag">Qty: {job.quantity || 1}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </IonContent>

      <IonToast
        isOpen={!!toast}
        message={toast?.message}
        color={toast?.color}
        duration={2500}
        onDidDismiss={() => setToast(null)}
      />
    </IonPage>
  );
};

export default RecruiterHome;