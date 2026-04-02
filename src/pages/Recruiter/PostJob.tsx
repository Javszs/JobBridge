import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonInput,
  IonLabel,
  IonItem,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonList,
  IonCard,
  IonCardContent,
  IonSpinner,
  IonToast,
  IonButtons,
  IonBackButton,
  IonIcon,
  useIonLoading
} from '@ionic/react';
import { locate } from 'ionicons/icons';
import { supabase } from '../../supabaseClient';
import { Geolocation } from '@capacitor/geolocation';
import './PostJob.css';

const PostJob: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; color: 'success' | 'danger' } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [presentLoading, dismissLoading] = useIonLoading();
  
  const [formData, setFormData] = useState({
    position: '',
    company: '',
    salary: '',
    location: '',
    'full_location': '',
    quantity: 1,
    typeJobTime: 'full-time',     // New field
    description: '',
  });

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    if (field === 'location') {
      setFormData(prev => ({ ...prev, location: value as string, 'full_location': value as string }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handlePostJob = async () => {
    if (!formData.position || !formData.company || !formData.location) {
      setToast({ message: 'Position, Company, and Location are required', color: 'danger' });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setToast({ message: 'You must be logged in', color: 'danger' });
        return;
      }

      const { error } = await supabase
        .from('jobs')
        .insert({
          recruiter_id: user.id,
          position: formData.position.trim(),
          company: formData.company.trim(),
          salary: formData.salary.trim() || null,
          location: formData.location.trim(),
          'full_location': formData['full_location'].trim(),
          quantity: Number(formData.quantity) || 1,
          typeJobTime: formData.typeJobTime,        // New
          status: 'active',                         // Always active on post
          description: formData.description.trim() || null,
        });

      if (error) {
        console.error('Post job error:', error);
        setToast({ message: error.message || 'Failed to post job', color: 'danger' });
      } else {
        setToast({ message: 'Job posted successfully!', color: 'success' });

        // Reset form
        setFormData({
          position: '',
          company: '',
          salary: '',
          location: '',
          'full_location': '',
          quantity: 1,
          typeJobTime: 'full-time',
          description: '',
        });

        setTimeout(() => window.history.back(), 1800);
      }
    } catch {
      setToast({ message: 'Something went wrong', color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const getLocation = async () => {
  try {
    // STEP 1: Check if the app already has permission
    const check = await Geolocation.checkPermissions();
    
    // STEP 2: If not granted, trigger the NATIVE Android Popup
    if (check.location !== 'granted') {
      const request = await Geolocation.requestPermissions();
      if (request.location !== 'granted') {
        setToast({ message: "Permission denied by user.", color: 'danger' });
        return;
      }
    }

    // STEP 3: Now that we have permission, start the loading UI
    setGettingLocation(true);
    await presentLoading({ message: 'Accessing GPS...', spinner: 'crescent' });

    // STEP 4: Get coordinates with a longer timeout
    const coordinates = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true, // Uses GPS satellites (Best for Manggahan)
      timeout: 15000,           // Give it 15 seconds to find a signal
      maximumAge: 3000          // Use a location no older than 3 seconds
    });

    const { latitude, longitude } = coordinates.coords;

    // STEP 5: Reverse Geocode (Nominatim)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );
    const data = await response.json();
    const addr = data.address;

    // Get city for location field
    const city = addr?.city || addr?.municipality || addr?.town || 'Unknown City';
    
    // Get full address for full_location field
    const fullAddress = data.display_name || [city, addr?.country].filter(Boolean).join(', ');

    setFormData(prev => ({ ...prev, location: city, 'full_location': fullAddress }));
    setToast({ message: "Location updated!", color: 'success' });

  } catch {
    console.error("GPS Error occurred");
    // This usually triggers if the phone is indoors or GPS hardware is busy
    setToast({ 
      message: "GPS Timeout. Try moving near a window or check App Permissions in Settings.", 
      color: 'danger' 
    });
  } finally {
    setGettingLocation(false);
    await dismissLoading();
  }
};

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary" style={{'color': 'white'}}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/home" />
          </IonButtons>
          <IonTitle style={{'color': 'white'}}>Post New Job</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen style={{ '--background': '#f8fafc' }}>
        <div className="post-job-container">
          <IonCard className="post-job-card">
            <IonCardContent>
              <IonList className="post-job-form">
                <IonItem className="form-item" lines='none'>
                  <IonLabel position="stacked" className="form-label">Position / Job Title *</IonLabel>
                  <IonInput
                    value={formData.position}
                    onIonInput={e => handleChange('position', e.detail.value!)}
                    placeholder="e.g. Senior Software Engineer"
                    clearInput
                  />
                </IonItem>

                <IonItem className="form-item" lines='none'>
                  <IonLabel position="stacked" className="form-label">Company Name *</IonLabel>
                  <IonInput
                    value={formData.company}
                    onIonInput={e => handleChange('company', e.detail.value!)}
                    placeholder="e.g. TechNova Inc."
                    clearInput
                  />
                </IonItem>

                <IonItem className="form-item" lines='none'>
                  <IonLabel position="stacked" className="form-label">Salary Per Day</IonLabel>
                  <IonInput
                    value={formData.salary}
                    onIonInput={e => handleChange('salary', e.detail.value!)}
                    placeholder="e.g. ₱1000 / day"
                    clearInput
                  />
                </IonItem>

                <IonItem className="form-item" lines='none'>
                  <IonLabel position="stacked" className="form-label">Location *</IonLabel>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <IonInput
                      value={formData.location}
                      onIonInput={e => handleChange('location', e.detail.value!)}
                      placeholder="e.g. Quezon City, Manila"
                      clearInput
                    />
                    <IonButton 
                      fill="clear" 
                      onClick={getLocation}
                      disabled={gettingLocation}
                      className='form-locate-icon'
                      >
                      <IonIcon icon={locate} />
                    </IonButton>
                  </div>
                </IonItem>

                <IonItem className="form-item" lines='none'>
                  <IonLabel position="stacked" className="form-label">Job Type</IonLabel>
                  <IonSelect
                    label="Select Job Type"
                    value={formData.typeJobTime}
                    onIonChange={e => handleChange('typeJobTime', e.detail.value!)}
                    placeholder="Job Type"
                  >
                    <IonSelectOption value="Full-time">Full-time</IonSelectOption>
                    <IonSelectOption value="Part-time">Part-time</IonSelectOption>
                    <IonSelectOption value="Contract">Contract</IonSelectOption>
                    <IonSelectOption value="Internship">Internship</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem className="form-item" lines='none'>
                  <IonLabel position="stacked" className="form-label">Number of Open Positions</IonLabel>
                  <IonInput
                    type="number"
                    value={formData.quantity}
                    onIonInput={e => handleChange('quantity', parseInt(e.detail.value!) || 1)}
                    min="1"
                  />
                </IonItem>

                <IonItem className="form-item" lines='none'>
                  <IonLabel position="stacked" className="form-label">Job Description (Optional)</IonLabel>
                  <IonTextarea
                    value={formData.description}
                    onIonInput={e => handleChange('description', e.detail.value!)}
                    placeholder="Describe the role, responsibilities, requirements, and benefits..."
                    rows={7}
                  />
                </IonItem>
              </IonList>

              <IonButton
                expand="block"
                onClick={handlePostJob}
                disabled={loading}
                className="post-job-btn"
              >
                {loading ? <IonSpinner name="crescent" /> : 'POST JOB'}
              </IonButton>
            </IonCardContent>
          </IonCard>
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

export default PostJob;