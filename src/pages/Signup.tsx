import './Signup.css';
import { 
  IonPage, 
  IonContent, 
  IonItem, 
  IonLabel, 
  IonInput, 
  IonButton, 
  IonText, 
  IonCheckbox,
  IonIcon
} from '@ionic/react';
import { eye, eyeOff } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router';

interface SignupProps {
  onLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const history = useHistory();

  const handleSignup = () => {
    // In real app: validate credentials here
    if (username && password && password === confirmPassword) {
      onLogin();
      history.replace('/tab1');
    } else if (password !== confirmPassword) {
      alert('Passwords do not match');
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        <div className="login-container">
          {/* Logo Section */}
          <div className="logo-section">
            <img src="src/assets/Logo.png"  alt="Job Bridge Logo" 
            style={{ width: '250px', height: 'auto' }} />
        </div>

          {/* Login Form Card */}
          <div className="form-card">
            <h2 style={{ textAlign: 'center', marginBottom: '30px', fontWeight: '600' }}>
              SIGNUP
            </h2>

            <IonItem lines="full">
              <IonInput 
                value={username}
                onIonChange={e => setUsername(e.detail.value!)}
                placeholder="Username"
                clearInput
              />
            </IonItem>

            <IonItem lines="full" style={{ marginTop: '20px' }}>
              <IonInput 
                type={showPassword ? 'text' : 'password'}
                value={password}
                placeholder="Password"
                onIonChange={e => setPassword(e.detail.value!)}
                clearInput
              />
              <IonButton 
                slot="end" 
                fill="clear" 
                onClick={() => setShowPassword(!showPassword)}
              >
                <IonIcon icon={showPassword ? eye : eyeOff} />
              </IonButton>
            </IonItem>

            <IonItem lines="full" style={{ marginTop: '20px' }}>
              <IonInput 
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                placeholder="Confirm Password"
                onIonChange={e => setConfirmPassword(e.detail.value!)}
                clearInput
              />
            </IonItem>

            <div className="options-row">
              <IonItem lines="none">
                <IonCheckbox slot="start" color="primary" />
                <IonLabel>I agree to the terms and conditions</IonLabel>
              </IonItem>
            </div>

            <IonButton 
              expand="block" 
              shape="round" 
              style={{ 
                marginTop: '30px', 
                '--background': 'linear-gradient(135deg, #eadf66ff 0%, #ada777ff 100%)',
                '--border-radius': '50px',
                height: '50px',
                '--color': 'white',
                fontWeight: 'bold'
              }}
              onClick={handleSignup}
            >
              <strong>Sign Up</strong>
            </IonButton>
          </div>

          {/* Sign Up Text */}
          <div className="signup-text">
            <IonText color="medium">
              Already have an account? <u onClick={() => history.push('/login')}>Log In now!</u>
            </IonText>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Signup;