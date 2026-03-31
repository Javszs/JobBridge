import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSearchbar,
  IonButton,
  IonIcon,
  IonChip,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  useIonViewWillEnter
} from '@ionic/react';
import { 
  notificationsOutline, 
  filterOutline, 
  heartOutline, 
  heart, 
  locationOutline, 
  timeOutline 
} from 'ionicons/icons';
import { supabase } from '../supabaseClient';
import './SeekerHome.css';

const SeekerHome: React.FC = () => {
  const history = useHistory();
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [filteredSavedJobs, setFilteredSavedJobs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'Full-time' | 'Part-time' | 'nearby'>('all');
  const [userCity, setUserCity] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");

  useIonViewWillEnter(() => {
    fetchUserDataAndSavedJobs();  
  });

  useEffect(() => {
    fetchUserDataAndSavedJobs();
  }, []);

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
          typeJobTime, created_at, status, quantity, recruiter_id
        )
      `)
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false });

    const formattedJobs = data?.map(item => item.jobs) || [];
    setSavedJobs(formattedJobs);
    setFilteredSavedJobs(formattedJobs);
    setLoading(false);
  };

  // Live filtering
  useEffect(() => {
    let result = [...savedJobs];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(job =>
        job.position?.toLowerCase().includes(term) ||
        job.company?.toLowerCase().includes(term) ||
        job.location?.toLowerCase().includes(term)
      );
    }

    if (activeFilter === 'Full-time') {
      result = result.filter(job => job.typeJobTime === 'Full-time');
    } else if (activeFilter === 'Part-time') {
      result = result.filter(job => job.typeJobTime === 'Part-time');
    } else if (activeFilter === 'nearby' && userCity) {
      const cityLower = userCity.toLowerCase();
      result = result.filter(job =>
        job.location?.toLowerCase().includes(cityLower) ||
        cityLower.includes(job.location?.toLowerCase() || '')
      );
    }

    setFilteredSavedJobs(result);
  }, [searchTerm, activeFilter, savedJobs, userCity]);

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

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchUserDataAndSavedJobs();
    event.detail.complete();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className='seeker-home-header'>
          <div className="seeker-header-content">
            <div>
              <h1 className="seeker-greeting">Hi, {userName}!</h1>
              <p className="seeker-sub-greeting">Find your next opportunity 👋</p>
            </div>
            <IonButton fill="clear" className="seeker-notification-btn">
              <IonIcon icon={notificationsOutline} size="large" />
            </IonButton>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="seeker-home-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
            <IonSpinner />
          </div>
        ) : (
          <>
            {/* Search Bar */}
            <div className="seeker-search-container" style={{ marginTop: '20px' }}>
              <IonSearchbar
                placeholder="Search saved jobs..."
                value={searchTerm}
                onIonInput={e => setSearchTerm(e.detail.value ?? '')}
                className="seeker-custom-searchbar"
              />
            </div>

            {/* Filters */}
            <div className="seeker-filters">
              <IonChip 
                color={activeFilter === 'all' ? "primary" : undefined}
                onClick={() => setActiveFilter('all')}
                className={activeFilter === 'all' ? "active-chip" : ""}
              >
                All Jobs
              </IonChip>
              <IonChip 
                color={activeFilter === 'Full-time' ? "primary" : undefined}
                onClick={() => setActiveFilter('Full-time')}
                className={activeFilter === 'Full-time' ? "active-chip" : ""}
              >
                Full-time
              </IonChip>
              <IonChip 
                color={activeFilter === 'Part-time' ? "primary" : undefined}
                onClick={() => setActiveFilter('Part-time')}
                className={activeFilter === 'Part-time' ? "active-chip" : ""}
              >
                Part-time
              </IonChip>
              <IonChip 
                color={activeFilter === 'nearby' ? "primary" : undefined}
                onClick={() => setActiveFilter('nearby')}
                className={activeFilter === 'nearby' ? "active-chip" : ""}
              >
                Nearby
              </IonChip>
            </div>

            {/* Saved Jobs List */}
            <div className="seeker-section-header">
              <h2>Saved Opportunities</h2>
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
                          onClick={() => history.push(`/message/${job.job_id}?recipient=${job.recruiter_id}`)}
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
    </IonPage>
  );
};

export default SeekerHome;