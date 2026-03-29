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
} from '@ionic/react';
import { supabase } from '../supabaseClient';
import './PostJob.css';

const PostJob: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; color: 'success' | 'danger' } | null>(null);

  const [formData, setFormData] = useState({
    position: '',
    company: '',
    salary: '',
    location: '',
    quantity: 1,
    typeJobTime: 'full-time',     // New field
    description: '',
  });

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          quantity: 1,
          typeJobTime: 'full-time',
          description: '',
        });

        setTimeout(() => window.history.back(), 1800);
      }
    } catch (err: any) {
      setToast({ message: 'Something went wrong', color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/recruiter/home" />
          </IonButtons>
          <IonTitle>Post New Job</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen style={{ '--background': '#f8fafc' }}>
        <div className="post-job-container">
          <IonCard className="post-job-card">
            <IonCardContent>
              <IonList>
                <IonItem>
                  <IonLabel position="stacked">Position / Job Title *</IonLabel>
                  <IonInput
                    value={formData.position}
                    onIonChange={e => handleChange('position', e.detail.value!)}
                    placeholder="e.g. Senior Software Engineer"
                    clearInput
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Company Name *</IonLabel>
                  <IonInput
                    value={formData.company}
                    onIonChange={e => handleChange('company', e.detail.value!)}
                    placeholder="e.g. TechNova Inc."
                    clearInput
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Salary Per Day</IonLabel>
                  <IonInput
                    value={formData.salary}
                    onIonChange={e => handleChange('salary', e.detail.value!)}
                    placeholder="e.g. ₱1000 / day"
                    clearInput
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Location *</IonLabel>
                  <IonInput
                    value={formData.location}
                    onIonChange={e => handleChange('location', e.detail.value!)}
                    placeholder="e.g. Quezon City, Manila"
                    clearInput
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Job Type</IonLabel>
                  <IonSelect
                    value={formData.typeJobTime}
                    onIonChange={e => handleChange('typeJobTime', e.detail.value!)}
                  >
                    <IonSelectOption value="Full-time">Full-time</IonSelectOption>
                    <IonSelectOption value="Part-time">Part-time</IonSelectOption>
                    <IonSelectOption value="Contract">Contract</IonSelectOption>
                    <IonSelectOption value="Internship">Internship</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Number of Open Positions</IonLabel>
                  <IonInput
                    type="number"
                    value={formData.quantity}
                    onIonChange={e => handleChange('quantity', parseInt(e.detail.value!) || 1)}
                    min="1"
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Job Description (Optional)</IonLabel>
                  <IonTextarea
                    value={formData.description}
                    onIonChange={e => handleChange('description', e.detail.value!)}
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