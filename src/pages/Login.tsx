import './Login.css';
import { 
  IonPage, 
  IonContent
} from '@ionic/react';

import { useState } from 'react';
import { Auth } from '../components/auth';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [, setShowSignUp] = useState(false);

  const handleSignUpClick = () => {
    setShowSignUp(true);
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        <div className="login-container">
          {/* Logo Section */}
          <div className="logo-section">
            <img src="https://i.ibb.co/4zCFc0g/job-bridge-removebg-preview.png"  alt="Job Bridge Logo" 
            style={{ width: '250px', height: 'auto' }} />
          </div>

          {/* Auth Component */}
          <Auth onSignUpClick={handleSignUpClick} onLogin={onLogin} />

          {/* Sign Up Text */}
          <div className="signup-text">
            {/* Text integrated into Auth component */}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;