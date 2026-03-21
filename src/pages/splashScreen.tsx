import { IonPage, IonContent } from '@ionic/react';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import './splashScreen.css';

const Splash: React.FC = () => {
  const history = useHistory();
  const [fadeIn, setFadeIn] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const inTimer = setTimeout(() => setFadeIn(true), 100); // small delay to trigger fade in
    const outTimer = setTimeout(() => setFadeOut(true), 3000); // fade out after ~3s
    const homeTimer = setTimeout(() => history.replace('/tabs/login'), 3250); // navigate after fade

    return () => {
      clearTimeout(inTimer);
      clearTimeout(outTimer);
      clearTimeout(homeTimer);
    };
  }, [history]);

  return (
    <IonPage>
      <IonContent fullscreen>
        
        <div className={`logo-screen splash-screen ${fadeOut ? 'fade-out' : ''}`}>
          <img src="src/assets/Logo.png" alt="Logo" style={{ width: '300px', height: 'auto' }} />
          
      
          <h1>Welcome to Job Bridge</h1>
          <p>Loading opportunities things...</p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Splash;