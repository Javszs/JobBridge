import React, { useState, useEffect } from 'react';
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
  IonSelect,
  IonSelectOption,
  IonList,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonToast,
  IonButtons,
  IonBackButton,
} from '@ionic/react';
import { supabase } from '../supabaseClient';
import './EditProfile.css';

const EditProfile: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; color: 'success' | 'danger' } | null>(null);

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    phone: '',
    gender: undefined as string | undefined,
    city: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('users')
    .select('firstname, lastname, phone, gender, city')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    // Don't show error toast here - it's normal if user has no profile row yet
    return;
  }

  if (data) {
    setFormData({
      firstname: data.firstname || '',
      lastname: data.lastname || '',
      phone: data.phone || '',
      gender: data.gender ? data.gender : undefined,
      city: data.city || '',
    });
  }
};

  const handleChange = (field: keyof typeof formData, value: string | null | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
  setLoading(true);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setToast({ message: 'You must be logged in', color: 'danger' });
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({
        firstname: formData.firstname.trim() || null,
        lastname: formData.lastname.trim() || null,
        phone: formData.phone.trim() || null,
        gender: formData.gender || null,
        city: formData.city.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error("Save failed:", error);
      setToast({ message: error.message || "Failed to save profile", color: 'danger' });
    } else {
      setToast({ message: "Profile saved successfully!", color: 'success' });
      setTimeout(() => window.history.back(), 1500);
    }
  } catch (err) {
    console.error(err);
    setToast({ message: "Something went wrong", color: 'danger' });
  } finally {
    setLoading(false);
  }
};

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/profile" />
          </IonButtons>
          <IonTitle>Edit Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen style={{ '--background': '#3168B9' }}>
        <div className="edit-profile-container">
          <IonCard className="edit-card">
            <IonCardHeader>
              <IonCardTitle>Personal Information</IonCardTitle>
            </IonCardHeader>

            <IonCardContent className="form-container">
              <IonList className="form-list">

                <IonItem className="custom-item">
                  <IonLabel position="stacked" className="input-label">First Name</IonLabel>
                  <IonInput
                    value={formData.firstname}
                    onIonChange={e => handleChange('firstname', e.detail.value!)}
                    placeholder="Enter first name"
                    clearInput
                  />
                </IonItem>

                <IonItem className="custom-item">
                  <IonLabel position="stacked" className="input-label">Last Name</IonLabel>
                  <IonInput
                    value={formData.lastname}
                    onIonChange={e => handleChange('lastname', e.detail.value!)}
                    placeholder="Enter last name"
                    clearInput
                  />
                </IonItem>

                <IonItem className="custom-item">
                  <IonLabel position="stacked" className="input-label">Phone Number</IonLabel>
                  <IonInput
                    type="tel"
                    value={formData.phone}
                    onIonChange={e => handleChange('phone', e.detail.value!)}
                    placeholder="09123456789"
                    clearInput
                  />
                </IonItem>

                <IonItem className="custom-item">
                  <IonLabel position="stacked" className="input-label">Gender</IonLabel>
                  <IonSelect
                    value={formData.gender}
                    onIonChange={e => handleChange('gender', e.detail.value!)}
                    placeholder="Select gender"
                  >
                    <IonSelectOption value="male">Male</IonSelectOption>
                    <IonSelectOption value="female">Female</IonSelectOption>
                    <IonSelectOption value={null}>Prefer not to say</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem className="custom-item">
                  <IonLabel position="stacked" className="input-label">City / Address</IonLabel>
                  <IonInput
                    value={formData.city}
                    onIonChange={e => handleChange('city', e.detail.value!)}
                    placeholder="e.g. Quezon City"
                    clearInput
                  />
                </IonItem>

              </IonList>

              <IonButton
                expand="block"
                onClick={handleSave}
                disabled={loading}
                className="save-btn"
              >
                {loading ? <IonSpinner name="crescent" /> : 'SAVE CHANGES'}
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>

        <IonToast
          isOpen={!!toast}
          message={toast?.message}
          color={toast?.color}
          duration={2500}
          onDidDismiss={() => setToast(null)}
        />
      </IonContent>
    </IonPage>
  );
};

export default EditProfile;