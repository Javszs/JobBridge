import React from 'react';
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
} from '@ionic/react';
import { notificationsOutline, filterOutline, heartOutline, locationOutline, timeOutline } from 'ionicons/icons';
import './RecruiterHome.css';

const RecruiterHome: React.FC = () => {
  const userName = "Recruiter";   // Later: fetch from user data

  return (
    <IonPage>
      <IonHeader class="recruiter-home-header">
        <IonToolbar>
          <div className="recruiter-header-content recruiter-home-header">
            <div>
              <h1 className="recruiter-greeting">Hi, {userName}!</h1>
              <p className="recruiter-sub-greeting">Recruit the best talent! 🔝</p>
            </div>
            <IonButton fill="clear" className="recruiter-notification-btn">
              <IonIcon icon={notificationsOutline} size="large" />
            </IonButton>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="recruiter-home-content">

        {/* Latest Opportunities */}
        <div className="recruiter-section-header" style={{ paddingTop: '10px' }}>
          <h2>Posted Jobs</h2>
        </div>

        {/* Job Cards */}
        <div className="recruiter-job-list">
          {/* Job Card 1 */}
          <div className="recruiter-job-card">
            <div className="recruiter-company-logo">
              <div className="recruiter-logo-circle">C</div>
            </div>

            <div className="recruiter-job-info">
              <h3>Barista</h3>
              <span className="recruiter-company-name">Café Delight</span>
            </div>
            <IonIcon icon={heartOutline} className="recruiter-save-icon" />
            <br />

            <div className="recruiter-job-info2">
              <div className="recruiter-job-meta">
                <span>📍Quezon City</span>
                <span>💲₱700 / day</span>
                <span>🕒2 hours</span>
              </div>
              <div className="recruiter-job-tags">
                <span className="recruiter-tag">Full-time</span>
                <IonButton fill="clear" className="recruiter-quick-apply">Quick Apply</IonButton>
              </div>
            </div>

          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default RecruiterHome;