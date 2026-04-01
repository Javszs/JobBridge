import React, { useState, useEffect } from 'react';
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
  IonButtons,
  IonBackButton,
} from '@ionic/react';
import { mapOutline, chatbubbleOutline, heartOutline, heart } from 'ionicons/icons';
import { supabase } from '../supabaseClient';
import MapComponent from '../components/MapComponent'; 
import { useHistory } from 'react-router-dom';
import './Job.css';

const Job: React.FC = () => {
  const history = useHistory();
  const [job, setJob] = useState<any>(null);
  const [recruiterName, setRecruiterName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; color: 'success' | 'danger' } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const jobId = window.location.pathname.split('/').pop() || '';

  useEffect(() => {
    if (jobId) fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          users:recruiter_id (firstname, lastname)
        `)
        .eq('job_id', jobId)
        .single();

      if (error) throw error;

      if (data) {
        setJob(data);
        const fullName = `${data.users?.firstname || ''} ${data.users?.lastname || ''}`.trim();
        setRecruiterName(fullName || 'Unknown Recruiter');

        // Check if job is saved
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: savedData } = await supabase
            .from('saved_jobs')
            .select('job_id')
            .eq('user_id', user.id)
            .eq('job_id', jobId)
            .single();
          setIsSaved(!!savedData);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fixed the URL and syntax here
  const openInGoogleMaps = () => {
    const location = job?.full_location;
    if (!location) return;
    const encodedLocation = encodeURIComponent(location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank', 'noreferrer');
  };

  const toggleSaveJob = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setToast({ message: 'You must be logged in to save jobs', color: 'danger' });
      return;
    }

    try {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_jobs')
          .delete()
          .eq('user_id', user.id)
          .eq('job_id', job.job_id);
        if (error) throw error;
        setIsSaved(false);
        setToast({ message: 'Job unsaved', color: 'danger' });
      } else {
        const { error } = await supabase
          .from('saved_jobs')
          .insert({ user_id: user.id, job_id: job.job_id });
        if (error) throw error;
        setIsSaved(true);
        setToast({ message: 'Job saved', color: 'success' });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to save/unsave job', color: 'danger' });
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent fullscreen className="ion-padding">
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!job) {
    return (
      <IonPage>
        <IonContent>
          <p style={{ textAlign: 'center', marginTop: '100px' }}>Job not found</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/jobs" />
          </IonButtons>
          <IonTitle>Job Details</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="specific-job-content">
        {/* Job Card */}
        <div className="specific-job-card">
          <div className="specific-job-header">
            <div className="specific-job-logo">
              <div className="specific-job-logo-circle">
                {job.company?.charAt(0) || 'J'}
              </div>
            </div>
            <div className="specific-job-title-section">
              <h2 className="specific-job-position">{job.position}</h2>
              <p className="specific-job-company">{job.company}</p>
            </div>
            <IonIcon 
              icon={isSaved ? heart : heartOutline} 
              className={`save-icon ${isSaved ? 'saved' : ''}`}
              onClick={() => toggleSaveJob()}
            />
          </div>

          <div className="specific-job-meta">
            <div className="specific-job-meta-item">
              <span>📍</span>
              <span>{job.location || 'Not specified'}</span>
            </div>
            <div className="specific-job-meta-item">
              <span>💰</span>
              <span>{job.salary || 'Salary not specified'}</span>
            </div>
            <div className="specific-job-meta-item">
              <span>🕒</span>
              <span>{new Date(job.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="specific-job-tags">
            <span className="specific-job-tag">{job.typeJobTime}</span>
            <span className="specific-job-tag">Open Positions: {job.quantity}</span>
            <span className="specific-job-tag status">{job.status}</span>
          </div>
        </div>

        {/* Full Location + Interactive Leaflet Map */}
        <div className="specific-job-map-section">
          <h3 className="specific-job-map-title">📍 Location: <span className="specific-job-full-location">{job.location}</span></h3>
          

          <div style={{ height: '300px', width: '100%', marginBottom: '15px', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Using the logic from Option 2 here */}
            <MapComponent address={job.full_location} />
          </div>
    
          <IonButton 
            expand="block"
            onClick={openInGoogleMaps}
            className="specific-job-google-map-btn"
          >
            <IonIcon icon={mapOutline} slot="start" />
            Open in Google Maps
          </IonButton>
        </div>

        {/* Job Description */}
        <div className="specific-job-description-section">
          <h3 className="specific-job-description-title">Job Description</h3>
          <p className="specific-job-description">
            {job.description || 'No description provided.'}
          </p>
        </div>

        {/* Recruiter Info */}
        <div className="specific-job-recruiter">
          <p className="specific-job-recruiter-label">Posted by</p>
          <p className="specific-job-recruiter-name">{recruiterName}</p>
        </div>

        {/* Action Buttons */}
        <div className="specific-job-action-buttons">
          {/* Replace the old Message button with this */}
            <IonButton 
            expand="block" 
            fill="outline" 
            className="specific-job-message-btn"
            onClick={() => history.push(`/message/${job.recruiter_id}?chat_id=${job.job_id}`)}
            >
              <IonIcon icon={chatbubbleOutline} slot="start" />
              Message Recruiter
            </IonButton>
        </div>

        <IonToast
          isOpen={!!toast}
          message={toast?.message}
          color={toast?.color}
          duration={3000}
          onDidDismiss={() => setToast(null)}
        />
      </IonContent>
    </IonPage>
  );
};

export default Job;