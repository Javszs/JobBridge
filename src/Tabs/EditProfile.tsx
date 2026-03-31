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
  IonAvatar,
  IonIcon,
  useIonLoading
} from '@ionic/react';
import { supabase } from '../supabaseClient';
import { personCircle, locateOutline } from 'ionicons/icons';
import { Geolocation } from '@capacitor/geolocation';
import './EditProfile.css';


const EditProfile: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; color: 'success' | 'danger' } | null>(null);
  const [presentLoading, dismissLoading] = useIonLoading();

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    phone: '',
    gender: '',
    city: '',
    role: '',
  });

  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(''); // For live preview
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string>(''); // Current saved photo
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    fetchProfile();

    return () => {
      // Clean up object URL on unmount
      if (previewUrl && previewUrl.startsWith('blob:') && previewUrl !== currentPhotoUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('users')
      .select('firstname, lastname, phone, gender, city, role, profile_photo')
      .eq('id', user.id)
      .single();

    if (data) {
      setFormData({
        firstname: data.firstname || '',
        lastname: data.lastname || '',
        phone: data.phone || '',
        gender: data.gender || '',
        city: data.city || '',
        role: data.role || '',
      });

      if (data.profile_photo) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.profile_photo);
        setCurrentPhotoUrl(urlData.publicUrl);
        setPreviewUrl(urlData.publicUrl);
      } else {
        setCurrentPhotoUrl('');
        setPreviewUrl('');
      }
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Get Current Location using Geolocation API
 const getLocation = async () => {
  try {
    // STEP 1: Check if the app already has permission
    let check = await Geolocation.checkPermissions();
    
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

    // Format: "Manggahan, Pasig, Philippines"
    const subdistrict = addr?.suburb || addr?.neighbourhood || addr?.village || addr?.quarter;
    const city = addr?.city || addr?.municipality || addr?.town;
    const country = addr?.country;

    const displayLocation = [subdistrict, city, country].filter(Boolean).join(', ');

    setFormData(prev => ({ ...prev, city: displayLocation }));
    setToast({ message: "Location updated!", color: 'success' });

  } catch (error: any) {
    console.error("GPS Error:", error);
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
  
  // Handle image selection and show preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Please select an image file', color: 'danger' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Image must be less than 5MB', color: 'danger' });
      return;
    }

    // Revoke previous object URL if it exists and is not the current photo
    if (previewUrl && previewUrl !== currentPhotoUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setProfilePhotoFile(file);

    // Create new preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSave = async () => {
  setLoading(true);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setToast({ message: 'You must be logged in', color: 'danger' });
      return;
    }

    let photoPath = null;

    // Upload profile photo if selected
    if (profilePhotoFile) {
      const fileExt = profilePhotoFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, profilePhotoFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      photoPath = fileName;
    }   

    // Use upsert with explicit id
    const updateData: any = {
      id: user.id,
      firstname: formData.firstname.trim() || null,
      lastname: formData.lastname.trim() || null,
      phone: formData.phone.trim() || null,
      gender: formData.gender || null,
      city: formData.city.trim() || null,
      role: formData.role || null,
      updated_at: new Date().toISOString(),
    };

    if (photoPath) {
      updateData.profile_photo = photoPath;
    }

    const { error } = await supabase
      .from('users')
      .upsert(updateData, { 
        onConflict: 'id' 
      });

    if (error) {
      console.error('Save error:', error);
      setToast({ message: error.message || 'Failed to save profile', color: 'danger' });
    } else {
      // Update current photo URL if new photo was uploaded
      if (photoPath) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(photoPath);
        setCurrentPhotoUrl(urlData.publicUrl);
        setPreviewUrl(urlData.publicUrl);
        setProfilePhotoFile(null);
      }
      setToast({ message: 'Profile saved successfully!', color: 'success' });
      setTimeout(() => window.history.back(), 1400);
    }
  } catch (err: any) {
    console.error('Error:', err);
    setToast({ message: err.message || 'Something went wrong', color: 'danger' });
  } finally {
    setLoading(false);
  }
};

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start" style={{'color': 'white'}}>
            <IonBackButton defaultHref="/tabs/profile" />
          </IonButtons>
          <IonTitle style={{'color': 'white'}}>Edit Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen style={{ '--background': '#3168B9' }}>
        <div className="edit-profile-container">
          <IonCard className="edit-card">
            <IonCardHeader>
              <IonCardTitle>Personal Information</IonCardTitle>
            </IonCardHeader>

            <IonCardContent>
              {/* Image Preview + Upload */}
              <div className="avatar-upload-section">
                <IonAvatar className="avatar-preview">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile Preview" />
                  ) : (
                    <IonIcon icon={personCircle} className="placeholder-icon" />
                  )}
                </IonAvatar>

                <IonButton 
                  fill="outline" 
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  Choose New Photo
                </IonButton>

                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Form Fields */}
              <IonList className="form-list">
                <IonItem className="custom-item" lines='none'>
                  <IonLabel position="stacked" className="input-label">First Name</IonLabel>
                  <IonInput
                    value={formData.firstname}
                    onIonInput={e => handleChange('firstname', e.detail.value!)}
                    placeholder="Enter first name"
                    clearInput
                  />
                </IonItem>

                <IonItem className="custom-item" lines='none'>
                  <IonLabel position="stacked" className="input-label">Last Name</IonLabel>
                  <IonInput
                    value={formData.lastname}
                    onIonInput={e => handleChange('lastname', e.detail.value!)}
                    placeholder="Enter last name"
                    clearInput
                  />
                </IonItem>

                <IonItem className="custom-item" lines='none'>
                  <IonLabel position="stacked" className="input-label">Phone Number</IonLabel>
                  <IonInput
                    type="tel"
                    value={formData.phone}
                    onIonInput={e => handleChange('phone', e.detail.value!)}
                    placeholder="09123456789"
                    clearInput
                  />
                </IonItem>

                <IonItem className="custom-item" lines='none'>
                  <IonLabel position="stacked" className="input-label">Gender</IonLabel>
                  <IonSelect
                    label="Select Gender"
                    value={formData.gender}
                    onIonChange={e => handleChange('gender', e.detail.value!)}
                    placeholder="Select gender"
                  >
                    <IonSelectOption value="male">Male</IonSelectOption>
                    <IonSelectOption value="female">Female</IonSelectOption>
                    <IonSelectOption value="">Prefer not to say</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem className="locations-item" lines='none'>
                  <IonLabel position="stacked" className="input-label">City / Address</IonLabel>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} className="location-item">
                    <IonInput
                      value={formData.city}
                      onIonInput={e => handleChange('city', e.detail.value!)}
                      placeholder="e.g. Quezon City, Philippines"
                      clearInput
                      style={{ flex: 1 }}
                    />
                    <IonButton 
                      fill="clear" 
                      onClick={getLocation}
                      disabled={gettingLocation}
                    >
                      <IonIcon icon={locateOutline} />
                    </IonButton>
                  </div>
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
          duration={3000}
          onDidDismiss={() => setToast(null)}
        />
      </IonContent>
    </IonPage>
  );
};

export default EditProfile;