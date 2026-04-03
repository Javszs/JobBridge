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
import { eye, eyeOff, mailOutline, lockClosedOutline, logoGoogle } from 'ionicons/icons';
import { supabase } from '../supabaseClient';

interface AuthProps {
  onSignUpClick?: () => void;
  onLogin?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onSignUpClick, onLogin }) => {
  const [view, setView] = useState<'login' | 'signup' | 'verify' | 'forgot-password'>('login');

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [otpToken, setOtpToken] = useState('');

  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');
  const [showToast, setShowToast] = useState(false);

  // ─── Login ─────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email || !password) return showError('Please enter email and password');

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return showError(error.message);

    showSuccess('Login successful!');
    onLogin?.();
  };

  // ─── Google Login ──────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/tabs/home`,
      },
    });

    if (error) showError(error.message);
  };

  // ─── Forgot Password ───────────────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!email) return showError('Please enter your email');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) showError(error.message);
    else {
      showSuccess('Password reset link sent! Check your email.');
      setView('login');
    }
  };

  // ─── Signup ────────────────────────────────────────────────────────
  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return showError('Please fill all required fields');
    }
    if (password !== confirmPassword) return showError('Passwords do not match');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstname: firstName.trim(),
          lastname: lastName.trim(),
        },
      },
    });

    if (error) return showError(error.message);

    showSuccess('Verification code sent! Check your email.');
    setView('verify');
  };

  // ─── Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpToken,
      type: 'signup',
    });

    if (error) return showError(error.message);

    showSuccess('Email confirmed successfully!');
    onLogin?.();
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

  const resetForms = () => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setConfirmPassword('');
    setOtpToken('');
  };

  // ─── Panels ────────────────────────────────────────────────────────
  const loginPanel = (
    <div className="auth-panel">
      <div className="auth-panel-header">
        <h2 className="auth-panel-title">Welcome Back!</h2>
        <p>Sign in to continue</p>
      </div>

      <IonItem className="auth-input-item" lines="none">
        <IonIcon icon={mailOutline} slot="start" />
        <IonInput
          type="email"
          placeholder="Email"
          value={email}
          onIonInput={e => setEmail(e.detail.value ?? '')}
        />
      </IonItem>

      <IonItem className="auth-input-item" lines="none">
        <IonIcon icon={lockClosedOutline} slot="start" />
        <IonInput
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={password}
          onIonInput={e => setPassword(e.detail.value ?? '')}
        />
        <IonButton fill="clear" slot="end" onClick={() => setShowPassword(!showPassword)}>
          <IonIcon icon={showPassword ? eye : eyeOff} />
        </IonButton>
      </IonItem>

      <IonNote 
        className="auth-forgot-link" 
        onClick={() => setView('forgot-password')}
        style={{ cursor: 'pointer' }}
      >
        Forgot Password?
      </IonNote>

      <IonButton expand="block" className="auth-btn" onClick={handleLogin}>
        Login
      </IonButton>

      <div className="auth-divider"><span>OR</span></div>

      <IonButton 
        expand="block" 
        fill="outline" 
        className="auth-google-btn"
        onClick={handleGoogleLogin}
      >
        <IonIcon icon={logoGoogle} slot="start" />
        Continue with Google
      </IonButton>

      <p className="auth-signup-prompt" onClick={() => {
        setView('signup');
        resetForms();
      }}>
        Don't have an account? <strong>Sign up</strong>
      </p>
    </div>
  );

  const signupPanel = (
    <div className="auth-panel">
      <div className="auth-panel-header">
        <h2 className="auth-panel-title">Create Account</h2>
      </div>

      <IonItem className="auth-input-item" lines="none">
        <IonInput placeholder="First Name" value={firstName} onIonInput={e => setFirstName(e.detail.value ?? '')} />
      </IonItem>

      <IonItem className="auth-input-item" lines="none">
        <IonInput placeholder="Last Name" value={lastName} onIonInput={e => setLastName(e.detail.value ?? '')} />
      </IonItem>

      <IonItem className="auth-input-item" lines="none">
        <IonInput type="email" placeholder="Email" value={email} onIonInput={e => setEmail(e.detail.value ?? '')} />
      </IonItem>

      <IonItem className="auth-input-item" lines="none">
        <IonInput 
          type={showPassword ? 'text' : 'password'} 
          placeholder="Password" 
          value={password} 
          onIonInput={e => setPassword(e.detail.value ?? '')} 
        />
        <IonButton fill="clear" slot="end" onClick={() => setShowPassword(!showPassword)}>
          <IonIcon icon={showPassword ? eye : eyeOff} />
        </IonButton>
      </IonItem>

      {/* Confirm Password with Eye Toggle */}
      <IonItem className="auth-input-item" lines="none">
        <IonInput
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="Confirm Password"
          value={confirmPassword}
          onIonInput={e => setConfirmPassword(e.detail.value ?? '')}
        />
        <IonButton 
          fill="clear" 
          slot="end" 
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <IonIcon icon={showConfirmPassword ? eye : eyeOff} />
        </IonButton>
      </IonItem>

      <IonButton expand="block" className="auth-btn auth-signup-btn" onClick={handleSignUp}>
        Create Account
      </IonButton>

      <p className="auth-signup-prompt" onClick={() => {
        setView('login');
        resetForms();
      }}>
        Already have an account? <strong>Login</strong>
      </p>
    </div>
  );

  const forgotPasswordPanel = (
    <div className="auth-panel">
      <div className="auth-panel-header">
        <h2 className="auth-panel-title">Forgot Password?</h2>
        <p>We'll send a reset link to your email.</p>
      </div>

      <IonItem className="auth-input-item" lines="none">
        <IonIcon icon={mailOutline} slot="start" />
        <IonInput
          type="email"
          placeholder="Email address"
          value={email}
          onIonInput={e => setEmail(e.detail.value ?? '')}
        />
      </IonItem>

      <IonButton expand="block" className="auth-btn" onClick={handleForgotPassword}>
        Send Reset Link
      </IonButton>

      <p className="auth-switch-link" onClick={() => setView('login')}>
        ← Back to Login
      </p>
    </div>
  );

  const verifyPanel = (
    <div className="auth-panel">
      <div className="auth-panel-header">
        <h2 className="auth-panel-title">Verify Email</h2>
        <p>Enter the 6-digit code sent to <strong>{email}</strong></p>
      </div>
      <IonItem className="auth-input-item" lines="none">
        <IonInput
          type="text"
          inputmode="numeric"
          maxlength={6}
          placeholder="000000"
          value={otpToken}
          onIonInput={e => setOtpToken(e.detail.value ?? '')}
        />
      </IonItem>
      <IonButton expand="block" className="auth-btn" onClick={handleVerifyOTP}>
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
        {view === 'login' && loginPanel}
        {view === 'signup' && signupPanel}
        {view === 'forgot-password' && forgotPasswordPanel}
        {view === 'verify' && verifyPanel}
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