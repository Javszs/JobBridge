import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonIcon,
  IonLabel,
  IonList,
  IonAvatar,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  useIonViewWillEnter
} from '@ionic/react';
import { supabase } from '../supabaseClient';
import { personCircle, person, help, create, logOut } from 'ionicons/icons';
import './Profile.css';

interface ProfileProps {
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    fullname: '',
    email: '',
    city: '',
    role: '',
    profile_photo: '',
  });

   useIonViewWillEnter(() => {
      fetchProfile();   // ← Your refresh function
    });

  // Fetch profile data when component mounts
  useEffect(() => {
    fetchProfile();
  }, []);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchProfile();
    event.detail.complete();
  };

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('firstname, lastname, city, role, profile_photo')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        let profilePhotoUrl = '';
        if (data.profile_photo) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.profile_photo);
          profilePhotoUrl = urlData.publicUrl;
        }
        setProfileData({
          fullname: `${data.firstname || ''} ${data.lastname || ''}`.trim(),
          email: user.email || '',
          city: data.city || '',
          role: data.role || '',
          profile_photo: profilePhotoUrl,
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>My Profile</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding" style={{ '--background': '#3168B9' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar  color="primary">
          <IonTitle style={{ textAlign: 'center' }}>My Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding" style={{ '--background': '#3168B9' }}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {/* Profile Card */}
        <div className="profile-card">
          <div className="avatar-container">
            <IonAvatar className="profile-avatar">
              {profileData.profile_photo ? (
                <img alt="Profile" src={profileData.profile_photo} />
              ) : (
                <IonIcon icon={personCircle} className='placeholder-icon' />
              )}
            </IonAvatar>
          </div>

          <h1 className="profile-name">{profileData.fullname || 'No Name'}</h1>
  
          <p className="profile-email">{profileData.email}</p>
  
          {profileData.city && (
            <p className="profile-location">
              📍 {profileData.city}
            </p>
          )}

          {profileData.role && (
            <p className="profile-role">
              Role: <span className="role-badge">{profileData.role === 'seeker' ? 'Job Seeker' : 'Recruiter'}</span>
            </p>
          )}
        </div>

        {/* Action Menu */}
        <IonList className="profile-menu">
          <IonItem routerLink="/profile/edit" lines="full">
            <IonIcon icon={create} slot="start" />
            <IonLabel>Edit Profile</IonLabel>
          </IonItem>

          <IonItem routerLink="/profile/about" lines="full">
            <IonIcon icon={help} slot="start" />
            <IonLabel>About the App</IonLabel>
          </IonItem>

          <IonItem routerLink="/profile/developers" lines="full">
            <IonIcon icon={person} slot="start" />
            <IonLabel>About the Developers</IonLabel>
          </IonItem>

          <IonItem button onClick={onLogout} lines="none" className="logout-item">
            <IonIcon icon={logOut} slot="start" color="danger" />
            <IonLabel className="logout-text">Logout</IonLabel>
          </IonItem>
        </IonList>

      </IonContent>
    </IonPage>
  );
};

export default Profile;