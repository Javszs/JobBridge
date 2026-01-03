import { IonButton } from '@ionic/react';
import { supabase } from '../supabaseClient';
import { useHistory } from 'react-router';

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
    // Logout button component for reusing maybe for sidebar
    <div style={{display: 'flex', justifyContent: 'center', marginTop: '20px', marginBottom: '20px'}}>
      <div style={{backgroundColor: 'red', border: '1px solid black', padding: '5px 70px', borderRadius: '5px'}}>
        <IonButton fill="clear" onClick={handleLogout} style={{color: 'white',fontWeight: 'bold', fontSize: '20px'}}>
          Logout
        </IonButton>
      </div>
    </div>
  );
};