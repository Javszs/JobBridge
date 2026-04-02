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
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  useIonViewWillEnter,
  IonSearchbar,
  IonChip
} from '@ionic/react';
import { addOutline, notificationsOutline, createOutline, heart } from 'ionicons/icons';
import { supabase } from '../supabaseClient';
import './RecruiterHome.css';

const RecruiterHome: React.FC = () => {
  const history = useHistory();
  const [userName, setUserName] = useState<string>("Recruiter");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; color: 'success' | 'danger' } | null>(null);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [filteredSavedJobs, setFilteredSavedJobs] = useState<any[]>([]);
  const [userCity, setUserCity] = useState<string>('');
  
  useIonViewWillEnter(() => {
      fetchUserDataAndSavedJobs();
    });
  
  useIonViewWillEnter(() => {
      fetchUserAndJobs();
  });

  useEffect(() => {
    fetchUserAndJobs();
  }, []);

  useEffect(() => {
    fetchUserDataAndSavedJobs();
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

  const fetchUserDataAndSavedJobs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
  
      // Get user info
      const { data: userData } = await supabase
        .from('users')
        .select('firstname, city')
        .eq('id', user.id)
        .single();
  
      if (userData) {
        setUserName(userData.firstname || "User");
        setUserCity(userData.city || '');
      }
  
      // Get saved jobs with full job details
      const { data } = await supabase
        .from('saved_jobs')
        .select(`
          job_id,
          jobs!inner (
            job_id, position, company, salary, location, 
            typeJobTime, created_at, status, quantity
          )
        `)
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });
  
      const formattedJobs = data?.map(item => item.jobs) || [];
      setSavedJobs(formattedJobs);
      setFilteredSavedJobs(formattedJobs);
      setLoading(false);
    };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchUserAndJobs();
    event.detail.complete();
  };

  const handleAddJob = () => {
  history.push('/recruiter/post-job');  
  };

  const toggleSave = async (jobId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
  
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', user.id)
        .eq('job_id', jobId);
  
      if (!error) {
        // Refresh saved jobs
        fetchUserDataAndSavedJobs();
      }
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
            <IonButton fill="clear" className="recruiter-notification-btn"
              onClick={() => history.push('/notifications')}>
              <IonIcon icon={notificationsOutline} size="large" />
            </IonButton>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="recruiter-home-content">

        {/* Refresh Gesture */}
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

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
                <IonIcon 
                    icon={createOutline} 
                    className="recruiter-edit-icon"
                    onClick={() => history.push(`/recruiter/edit-job/${job.job_id}`)}
                  />

                <div className="recruiter-job-info2">
                  <div className="recruiter-job-meta">
                    <span>📍 {job.location || 'Not specified'}</span>
                    <span>💲 {job.salary + ' / day' || 'Salary not specified'}</span>
                    <span>🕒 {new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="recruiter-job-tags">
                    <span className="recruiter-tag">{job.typeJobTime}</span>
                    <span className={`recruiter-tag ${job.status === 'active' ? 'success' : 'danger'}`}>
                      {job.status || 'Closed'}
                    </span>
                    <span className="recruiter-tag">Qty: {job.quantity || 1}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
                    <IonSpinner />
                  </div>
                ) : (
                  <>
                    {/* Saved Jobs List */}
                    <div className="seeker-section-header">
                      <h2>Saved Jobs</h2>
                    </div>
        
                    <div className="seeker-job-list">
                      {filteredSavedJobs.length === 0 ? (
                        <div className="empty-state">
                          <p>No Saved Opportunity</p>
                          <IonButton 
                            onClick={() => history.push('/tabs/jobs')} 
                            className="go-to-jobs-btn"
                          >
                            Browse Jobs
                          </IonButton>
                        </div>
                      ) : (
                        filteredSavedJobs.map((job) => (
                          <div key={job.job_id} className="seeker-job-card">
                            <div className="seeker-company-logo">
                              <div className="seeker-logo-circle">
                                {job.company?.charAt(0) || 'J'}
                              </div>
                            </div>
        
                            <div className="seeker-job-info">
                              <h3>{job.position}</h3>
                              <p className="seeker-company-name">{job.company}</p>
                            </div>
        
                            {/* Clickable Heart - Unsave */}
                            <IonIcon 
                              icon={heart} 
                              className="seeker-save-icon saved"
                              onClick={() => toggleSave(job.job_id)}
                            />
        
                            <div className="seeker-job-info2">
                              <div className="seeker-job-meta">
                                <span>📍 {job.location || 'Not specified'}</span>
                                <span>💲₱ {job.salary + ' / day' || 'Not specified'}</span>
                                <span>🕒 {new Date(job.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="seeker-job-tags">
                                <IonButton 
                                  fill="clear" 
                                  className="seeker-quick-apply"
                                  onClick={() => history.push(`/job/${job.job_id}`)} >
                                  View
                                </IonButton>
                                <span className="seeker-tag">{job.typeJobTime}</span>
                                <IonButton 
                                  fill="clear" 
                                  className="seeker-quick-apply"
                                  onClick={() => history.push(`/message/${job.recruiter_id}?job=${job.job_id}`)}
                                >
                                  Quick Message
                                </IonButton>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
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