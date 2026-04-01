import React, { useState, useEffect, useCallback } from 'react';
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
  useIonViewWillEnter,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import { 
  filterOutline, 
  heartOutline, 
  heart, 
} from 'ionicons/icons';
import { supabase } from '../supabaseClient';
import './Jobs.css';

const Jobs: React.FC = () => {
  const history = useHistory();

  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'Full-time' | 'Part-time' | 'nearby'>('all');

  // New filter states
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [minSalary, setMinSalary] = useState<string>('');
  const [maxSalary, setMaxSalary] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [userCity, setUserCity] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Refresh on tab focus
  useIonViewWillEnter(() => {
    fetchUserCityAndJobs();
  });

  useEffect(() => {
    fetchUserCityAndJobs();
  }, []);

  const fetchUserCityAndJobs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // User's city
    const { data: userData } = await supabase
      .from('users')
      .select('city')
      .eq('id', user.id)
      .single();
    if (userData?.city) setUserCity(userData.city);

    // All jobs
    const { data: jobData } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    setJobs(jobData || []);
    setFilteredJobs(jobData || []);

    // Saved jobs
    const { data: savedData } = await supabase
      .from('saved_jobs')
      .select('job_id')
      .eq('user_id', user.id);

    if (savedData) {
      setSavedJobIds(new Set(savedData.map(item => item.job_id)));
    }

    setLoading(false);
  };

  // Live filtering (includes new sort + salary range)
  useEffect(() => {
    let result = [...jobs];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(job =>
        job.position?.toLowerCase().includes(term) ||
        job.company?.toLowerCase().includes(term) ||
        job.location?.toLowerCase().includes(term)
      );
    }

    // Type filter
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

    // Salary range filter
    if (minSalary) {
      const min = parseFloat(minSalary);
      result = result.filter(job => {
        const salary = parseFloat(job.salary) || 0;
        return salary >= min;
      });
    }
    if (maxSalary) {
      const max = parseFloat(maxSalary);
      result = result.filter(job => {
        const salary = parseFloat(job.salary) || 0;
        return salary <= max;
      });
    }

    // Sort by date
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredJobs(result);
  }, [searchTerm, activeFilter, jobs, userCity, sortOrder, minSalary, maxSalary]);

  const toggleSaveJob = async (jobId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isSaved = savedJobIds.has(jobId);

    if (isSaved) {
      await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', user.id)
        .eq('job_id', jobId);
      setSavedJobIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    } else {
      await supabase
        .from('saved_jobs')
        .insert({ user_id: user.id, job_id: jobId });
      setSavedJobIds(prev => new Set(prev).add(jobId));
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchUserCityAndJobs();
    event.detail.complete();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle className='Chat-Title'>All Available Jobs</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="jobs-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Search + Filter Button */}
        <div className="search-container" style={{ marginTop: '20px' }}>
          <IonSearchbar
            placeholder="Search jobs, companies, location..."
            value={searchTerm}
            onIonInput={e => setSearchTerm(e.detail.value ?? '')}
            className="custom-searchbar"
          />
          <IonButton 
            fill="clear" 
            className="filter-btn"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <IonIcon icon={filterOutline} />
          </IonButton>
        </div>

        {/* Advanced Filters Panel (toggled by filter button) */}
        {showAdvancedFilters && (
          <div style={{ 
            padding: '0 16px 12px', 
            backgroundColor: 'white', 
            background: 'white',
             }}>
            <IonList className='filter-mainlist'>
              {/* Sort Order */}
              <IonItem className='filters-list' lines='none'>
                <IonLabel>Sort by Date</IonLabel>
                <IonSelect value={sortOrder} onIonChange={e => setSortOrder(e.detail.value)}>
                  <IonSelectOption value="newest">Newest First</IonSelectOption>
                  <IonSelectOption value="oldest">Oldest First</IonSelectOption>
                </IonSelect>
              </IonItem>

              {/* Salary Range */}
              <IonItem className='filters-list' lines='none'>
                <IonLabel>Min Salary: </IonLabel>
                <IonLabel className='peso-label'> ₱ </IonLabel>
                <IonInput
                  type="number"
                  value={minSalary}
                  onIonInput={e => setMinSalary(e.detail.value ?? '')}
                  placeholder="0"
                />
              </IonItem>
              <IonItem className='filters-list' lines='none'>
                <IonLabel>Max Salary: </IonLabel>
                <IonLabel className='peso-label'> ₱ </IonLabel>
                <IonInput
                  type="number"
                  value={maxSalary}
                  onIonInput={e => setMaxSalary(e.detail.value ?? '')}
                  placeholder="1000"
                />
              </IonItem>
            </IonList>
          </div>
        )}

        {/* Basic Chips */}
        <div className="filters">
          <IonChip color={activeFilter === 'all' ? "primary" : undefined} onClick={() => setActiveFilter('all')}>
            All Jobs
          </IonChip>
          <IonChip color={activeFilter === 'Full-time' ? "primary" : undefined} onClick={() => setActiveFilter('Full-time')}>
            Full-time
          </IonChip>
          <IonChip color={activeFilter === 'Part-time' ? "primary" : undefined} onClick={() => setActiveFilter('Part-time')}>
            Part-time
          </IonChip>
          <IonChip color={activeFilter === 'nearby' ? "primary" : undefined} onClick={() => setActiveFilter('nearby')}>
            Nearby
          </IonChip>
        </div>

        {/* Job List */}
        <div className="job-list">
          {filteredJobs.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              No jobs found.
            </p>
          ) : (
            filteredJobs.map((job) => {
              const isSaved = savedJobIds.has(job.job_id);
              return (
                <div key={job.job_id} className="job-card">
                  <div className="company-logo">
                    <div className="logo-circle">
                      {job.company?.charAt(0) || 'J'}
                    </div>
                  </div>

                  <div className="job-info">
                    <h3>{job.position}</h3>
                    <span className="company-name">{job.company}</span>
                  </div>

                  <IonIcon 
                    icon={isSaved ? heart : heartOutline} 
                    className={`save-icon ${isSaved ? 'saved' : ''}`}
                    onClick={() => toggleSaveJob(job.job_id)}
                  />

                  <div className="job-info2">
                    <div className="job-meta">
                      <span>📍 {job.location || 'Not specified'}</span>
                      <span>💲₱ {job.salary + ' / day' || 'Not specified'}</span>
                      <span>🕒 {new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="job-tags">
                      <IonButton 
                        fill="clear" 
                        className="seeker-quick-apply"
                        onClick={() => history.push(`/job/${job.job_id}`)} 
                      >
                        View
                      </IonButton>
                      <span className="tag">{job.typeJobTime}</span>
                      <IonButton 
                        fill="clear" 
                        className="seeker-quick-apply"
                        onClick={() => history.push(`/message/${job.recruiter_id}?chat_id=${job.job_id}`)}
                      >
                        Quick Message
                      </IonButton>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Jobs;