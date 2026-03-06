import React from 'react';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonAvatar,
  IonLabel,
} from '@ionic/react';

import './contact.css';

const Contacts: React.FC = () => {
  return (
    <IonPage>
      <IonContent fullscreen className="contact-gradient-bg">
        <div className="contact-center-wrapper">
          <IonCard className="contact-profile-card">
            <IonCardContent className="ion-text-center">
              <IonAvatar className="contact-profile-avatar">
                <img
                  alt="Juan Dela Cruz profile"
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGiNS-LRVWW6PRC_4kZwgFr-BdYUd3PS9GWGldtd8nS-0qPrbklfVV7iEf1R3npGFDg3-A30Y8Nzd_iA-zf8vrv9yl1f9SL2sN1SLgyqoP&s=10"
                  // Replace with real image when ready
                />
              </IonAvatar>

              <IonLabel>
                <h1 className="contact-profile-name">Juan Dela Cruz</h1>
                <p className="contact-profile-email">juan.delacruz@gmail.com</p>
                <p className="contact-profile-role">Student - BSCS 3rd Year</p>
              </IonLabel>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Contacts;