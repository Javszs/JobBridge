import React from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
} from '@ionic/react';
import { Logout } from '../components/Logout';
import './Profile.css';

interface ProfileProps {
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onLogout }) => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">

        {/* Styled Update Profile Button */}
        <div className="update-profile-wrapper">
          <div className="update-profile-btn-container">
            <IonButton
              routerLink="/profile/edit"
              fill="clear"
              className="update-profile-btn"
            >
              Update Profile
            </IonButton>
          </div>
        </div>

        {/* Logout Button */}
        <Logout onLogout={onLogout} />

      </IonContent>
    </IonPage>
  );
};

export default Profile;