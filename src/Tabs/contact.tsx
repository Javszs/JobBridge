import React from 'react';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonAvatar,
  IonLabel,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
} from '@ionic/react';

import './contact.css';
import Jayve from '../assets/Jayve.jpg';

const Contacts: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar class="devs-header">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/profile" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="contact-gradient-bg">
        <div className="contact-center-wrapper">
          <IonCard className="contact-profile-card">
            <IonCardContent className="ion-text-center">
              <IonAvatar className="contact-profile-avatar">
                <img
                  alt="image of developer"
                  src={Jayve}
                />
              </IonAvatar>

              <IonLabel>
                <h1 className="contact-profile-name">Jayve Espira</h1>
                <div>
                  <p className="contact-profile-email">jayveespira01@gmail.com</p>
                  <p className="contact-profile-role">Student - BSCS 3rd Year</p>
                </div>
                <hr />
                <div>
                  <p className="contact-profile-contributions">Contributions:</p>
                  <p className="contact-profile-contributions">- Main Programmer</p>
                  <p className="contact-profile-contributions">- Backend, Frontend</p>
                  <p className="contact-profile-contributions">- Quality Assurance</p>
                </div>
              </IonLabel>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Contacts;