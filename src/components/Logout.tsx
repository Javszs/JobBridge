import { IonButton } from '@ionic/react';
import { supabase } from '../supabaseClient';
import { useHistory } from 'react-router';
import '../tabs/Profile.css';

interface LogoutProps {
  onLogout: () => void;
}

export const Logout = ({ onLogout }: LogoutProps) => {
  const history = useHistory();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
    history.replace('/login');
  };

  return (
    <div className="logout-wrapper">
      <div className="logout-btn-container">
        <IonButton
          fill="clear"
          onClick={handleLogout}
          className="logout-btn"
        >
          LOGOUT
        </IonButton>
      </div>
    </div>
  );
};