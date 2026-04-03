import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonToast,
  IonItem,
  IonSpinner,
  IonButtons,
  IonBackButton,
} from '@ionic/react';
import { lockClosedOutline, eye, eyeOff } from 'ionicons/icons';
import { supabase } from '../supabaseClient';
import { useHistory } from 'react-router';

const ResetPassword: React.FC = () => {
  const history = useHistory();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; color: 'success' | 'danger' } | null>(null);

  // Check if we have a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setToast({ message: 'Invalid or expired reset link. Please request a new one.', color: 'danger' });
        setTimeout(() => history.replace('/login'), 3000);
      }
    };
    checkSession();
  }, [history]);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      return setToast({ message: 'Please fill in both password fields', color: 'danger' });
    }

    if (password !== confirmPassword) {
      return setToast({ message: 'Passwords do not match', color: 'danger' });
    }

    if (password.length < 6) {
      return setToast({ message: 'Password must be at least 6 characters', color: 'danger' });
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (error) {
      setToast({ message: error.message, color: 'danger' });
    } else {
      setToast({ 
        message: 'Password updated successfully! Redirecting to login...', 
        color: 'success' 
      });
      
      // Sign out and redirect to login
      setTimeout(async () => {
        await supabase.auth.signOut();
        history.replace('/login');
      }, 2500);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/login" />
          </IonButtons>
          <IonTitle>Reset Password</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <div style={{ maxWidth: '400px', margin: '40px auto 0' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '8px', color: '#ffffff' }}>Create New Password</h1>
            <p style={{ color: '#ffffff' }}>Your new password must be different from previous ones.</p>
          </div>

          <IonItem lines="none" className="auth-input-item">
            <IonIcon icon={lockClosedOutline} slot="start" />
            <IonInput
              type={showPassword ? 'text' : 'password'}
              placeholder="New Password"
              value={password}
              onIonInput={e => setPassword(e.detail.value ?? '')}
            />
            <IonButton fill="clear" slot="end" onClick={() => setShowPassword(!showPassword)}>
              <IonIcon icon={showPassword ? eye : eyeOff} />
            </IonButton>
          </IonItem>

          <IonItem lines="none" className="auth-input-item" style={{ marginTop: '12px' }}>
            <IonIcon icon={lockClosedOutline} slot="start" />
            <IonInput
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onIonInput={e => setConfirmPassword(e.detail.value ?? '')}
            />
            <IonButton fill="clear" slot="end" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              <IonIcon icon={showConfirmPassword ? eye : eyeOff} />
            </IonButton>
          </IonItem>

          <IonButton
            expand="block"
            className="auth-btn"
            onClick={handleResetPassword}
            disabled={loading}
            style={{ marginTop: '30px' }}
          >
            {loading ? <IonSpinner name="crescent" /> : 'Update Password'}
          </IonButton>

          <p style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>
            Remember your password?{' '}
            <span 
              style={{ color: '#3168b9', cursor: 'pointer', fontWeight: 'bold' }}
              onClick={() => history.replace('/login')}
            >
              Login here
            </span>
          </p>
        </div>

        <IonToast
          isOpen={!!toast}
          message={toast?.message}
          color={toast?.color}
          duration={4000}
          position="top"
          onDidDismiss={() => setToast(null)}
        />
      </IonContent>
    </IonPage>
  );
};

export default ResetPassword;