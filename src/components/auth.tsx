import React, { useState } from 'react';
import {
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonToast,
  IonItem,
  IonNote,
} from '@ionic/react';
import { eye, eyeOff, mailOutline, lockClosedOutline } from 'ionicons/icons';
import { supabase } from '../supabaseClient'; // adjust path

interface AuthProps {
  onSignUpClick?: () => void;
  onLogin?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onSignUpClick, onLogin }) => {
  const [view, setView] = useState<'seeker-login' | 'recruiter-login' | 'signup'>('seeker-login');

  // Shared login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'seeker' | 'recruiter' | null>(null);

  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');
  const [showToast, setShowToast] = useState(false);

  // ─── Login Handlers ────────────────────────────────────────────────
  const handleLogin = async (role: 'seeker' | 'recruiter') => {
    if (!email || !password) return showError('Please enter email and password');

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return showError(error.message);

    showSuccess(`Logged in as ${role === 'seeker' ? 'Job Seeker' : 'Recruiter'}`);
    onLogin?.();
  };

  // ─── Signup Handler ────────────────────────────────────────────────
  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      return showError('Please fill all fields');
    }
    if (password !== confirmPassword) return showError('Passwords do not match');
    if (!selectedRole) return showError('Please choose your role');

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return showError(error.message);

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        phone,
        role: selectedRole,
      });
    }

    showSuccess('Sign up successful — please check your email');
    onSignUpClick?.();
    setView('seeker-login');
  };

  // ─── Helpers ───────────────────────────────────────────────────────
  const showError = (msg: string) => {
    setToastMsg(msg);
    setToastColor('danger');
    setShowToast(true);
  };

  const showSuccess = (msg: string) => {
    setToastMsg(msg);
    setToastColor('success');
    setShowToast(true);
  };

  const resetLoginForm = () => {
    setEmail('');
    setPassword('');
  };

  const resetSignupForm = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setSelectedRole(null);
  };

  // ─── Render Logic ──────────────────────────────────────────────────
  const isLoginView = view === 'seeker-login' || view === 'recruiter-login';
  const currentRole = view === 'seeker-login' ? 'seeker' : 'recruiter';

  return (
    <IonContent fullscreen className="auth-gradient-bg" scrollX={false} scrollY={false}>
      <div className="auth-container">
        {isLoginView ? (
          // ─── LOGIN FORM ───────────────────────────────────────────────
          <div className="auth-panel">
            <div className="auth-panel-header">
              <h2 className="auth-panel-title">Welcome Back!</h2>
              <p>Sign in as a {view === 'seeker-login' ? 'Job Seeker' : 'Recruiter'}</p>
            </div>

            <IonItem className="auth-input-item">
              <IonIcon icon={mailOutline} slot="start" />
              <IonInput
                type="email"
                placeholder="Email"
                value={email}
                onIonChange={e => setEmail(e.detail.value ?? '')}
              />
            </IonItem>

            <IonItem className="auth-input-item">
              <IonIcon icon={lockClosedOutline} slot="start" />
              <IonInput
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onIonChange={e => setPassword(e.detail.value ?? '')}
              />
              <IonButton fill="clear" slot="end" onClick={() => setShowPassword(!showPassword)}>
                <IonIcon icon={showPassword ? eye : eyeOff} />
              </IonButton>
            </IonItem>

            <IonNote className="auth-forgot-link">Forgot Password?</IonNote>

            <IonButton
              expand="block"
              className="auth-btn"
              onClick={() => handleLogin(currentRole)}
            >
              Login
            </IonButton>

            <div className="auth-divider"><span>OR</span></div>

            <IonButton expand="block" fill="outline" className="auth-google-btn">
              Login with Google
            </IonButton>

            <p className="auth-switch-link" onClick={() => {
              setView(view === 'seeker-login' ? 'recruiter-login' : 'seeker-login');
              resetLoginForm();
            }}>
              ← Change Role
            </p>

            <p className="auth-signup-prompt" onClick={() => {
              setView('signup');
              resetSignupForm();
            }}>
              Don't have an account? <strong>Signup!</strong>
            </p>
          </div>
        ) : (
          // ─── SIGNUP FORM ─────────────────────────────────────────────
          <div className="auth-panel">
            <div className="auth-panel-header">
              <h2 className="auth-panel-title">Let's get started!</h2>
            </div>

            <IonItem className="auth-input-item">
              <IonInput
                placeholder="First Name"
                value={firstName}
                onIonChange={e => setFirstName(e.detail.value ?? '')}
              />
            </IonItem>

            <IonItem className="auth-input-item">
              <IonInput
                placeholder="Last Name"
                value={lastName}
                onIonChange={e => setLastName(e.detail.value ?? '')}
              />
            </IonItem>

            <IonItem className="auth-input-item">
              <IonInput
                type="email"
                placeholder="Email"
                value={email}
                onIonChange={e => setEmail(e.detail.value ?? '')}
              />
            </IonItem>

            <IonItem className="auth-input-item">
              <IonInput
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onIonChange={e => setPassword(e.detail.value ?? '')}
              />
            </IonItem>

            <IonItem className="auth-input-item">
              <IonInput
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={confirmPassword}
                onIonChange={e => setConfirmPassword(e.detail.value ?? '')}
              />
            </IonItem>

            <div className="auth-role-selection">
              <IonButton
                fill={selectedRole === 'seeker' ? 'solid' : 'outline'}
                onClick={() => setSelectedRole('seeker')}
              >
                Job Seeker
              </IonButton>
              <IonButton
                fill={selectedRole === 'recruiter' ? 'solid' : 'outline'}
                onClick={() => setSelectedRole('recruiter')}
              >
                Recruiter
              </IonButton>
            </div>

            <IonButton expand="block" className="auth-btn auth-signup-btn" onClick={handleSignUp}>
              Signup
            </IonButton>

            <p className="auth-signup-prompt" onClick={() => {
              setView('seeker-login');
              resetLoginForm();
            }}>
              Already have an account? <strong>Login</strong>
            </p>
          </div>
        )}
      </div>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMsg}
        duration={2800}
        color={toastColor}
        position="top"
      />
    </IonContent>
  );
};

export default Auth;