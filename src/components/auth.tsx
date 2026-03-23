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
  const [view, setView] = useState<'seeker-login' | 'recruiter-login' | 'signup' | 'verify'>('seeker-login');
  const [otpToken, setOtpToken] = useState(''); // For OTP verification step

  // Shared login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
  // 1. Validation
  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    return showError('Please fill all required fields');
  }
  if (password !== confirmPassword) return showError('Passwords do not match');
  if (!selectedRole) return showError('Please choose your role');

  // 2. Supabase Signup
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        firstname: firstName.trim(),
        lastname: lastName.trim(),
        role: selectedRole,
      },
    },
  });

  if (error) return showError(error.message);

  // 3. UI Switch
  // Instead of redirecting to login, we show the OTP input
  showSuccess('Verification code sent! Check your email.');
  setView('verify'); 
};

  // ─── Verification Handler ──────────────────────────────────────────
const handleVerifyOTP = async () => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: otpToken,
    type: 'signup',
  });

  if (error) return showError(error.message);
  
  showSuccess('Confirmed!');
  onLogin?.(); 
};

// Update your handleSignUp last line:
// From: setView('seeker-login');
// To:   setView('verify');

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
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setSelectedRole(null);
  };

  // ─── Render Logic ──────────────────────────────────────────────────
  const loginPanel = (role: 'seeker' | 'recruiter') => (
    <div className="auth-panel">
      <div className="auth-panel-header">
        <h2 className="auth-panel-title">Welcome Back!</h2>
        <p>Sign in as a {role === 'seeker' ? 'Job Seeker' : 'Recruiter'}</p>
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
        onClick={() => handleLogin(role)}
      >
        Login
      </IonButton>
      <div className="auth-divider"><span>OR</span></div>
      <IonButton expand="block" fill="outline" className="auth-google-btn">
        Login with Google
      </IonButton>
      <p className="auth-switch-link" onClick={() => {
        setView(role === 'seeker' ? 'recruiter-login' : 'seeker-login');
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
  );
  const signupPanel = (
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
  );
  const verifyPanel = (
    <div className="auth-panel">
      <div className="auth-panel-header">
        <h2 className="auth-panel-title">Verify Your Email</h2>
        <p>Enter the 6-digit code sent to <strong>{email}</strong></p>
      </div>
      <IonItem className="auth-input-item">
        <IonInput
          type="text"
          inputmode="numeric"
          maxlength={6}
          placeholder="000000"
          value={otpToken}
          onIonChange={e => setOtpToken(e.detail.value ?? '')}
        />
      </IonItem>
      <IonButton 
        expand="block" 
        className="auth-btn" 
        onClick={handleVerifyOTP}
      >
        Confirm Code
      </IonButton>
      <p className="auth-switch-link" onClick={() => setView('signup')}>
        ← Back to Signup
      </p>
    </div>
  );
  return (
    <IonContent fullscreen className="auth-gradient-bg" scrollX={false} scrollY={false}>
      <div className="auth-container">

        {view === 'verify' && verifyPanel}

        {view === 'seeker-login' && loginPanel('seeker')} {view === 'recruiter-login' && loginPanel('recruiter')} {view === 'signup' && signupPanel}
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