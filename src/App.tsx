import React, { useState, useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { home, briefcase, person, chatbubbleEllipses } from 'ionicons/icons';

import Home from './Tabs/Home';
import Jobs from './Tabs/Jobs';
import Profile from './Tabs/Profile';
import LoginPage from './pages/Login';
import About from './pages/profile/About';
import Contacts from './pages/profile/contact';
import Splash from './pages/splashScreen';  
import EditProfile from './pages/profile/EditProfile';
import PostJob from './pages/Recruiter/PostJob';
import Notification from './pages/functionalPages/Notifications';

/* Core CSS ... (keep all your existing CSS imports exactly as they are) */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.system.css';
import './theme/variables.css';
import EditJob from './pages/Recruiter/EditJob';
import Job from './pages/functionalPages/Job';
import Messages from './Tabs/Chats';
import Message from './pages/functionalPages/Message';
import AdminDashboard from './admin/AdminDashboard';
import AdminJobs from './admin/AdminJobs';
import AdminUsers from './admin/AdminUsers';
import ResetPassword from './pages/ResetPassword';
import { supabase } from './supabaseClient';


setupIonicReact();

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        localStorage.setItem('isLoggedIn', 'true');
      } else {
        setIsLoggedIn(false);
        localStorage.removeItem('isLoggedIn');
      }
      setIsLoading(false);
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsLoggedIn(true);
        localStorage.setItem('isLoggedIn', 'true');
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        localStorage.removeItem('isLoggedIn');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
  };

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <IonApp>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}>
          Loading...
        </div>
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          {/* Login Route */}
          <Route exact path="/login">
            {isLoggedIn ? (
              <Redirect to="/tabs/Home" />
            ) : (
              <LoginPage onLogin={() => {
                setIsLoggedIn(true);
              }} />
            )}
          </Route>

          <Route exact path="/Splash" component={Splash} />
          <Route path="/reset-password" component={ResetPassword} exact />
          <Route path="/profile/edit" component={EditProfile} exact />
          <Route path="/profile/about" component={About} exact />
          <Route path="/profile/developers" component={Contacts} exact />
          <Route path="/recruiter/post-job" component={PostJob} exact />
          <Route path="/recruiter/edit-job/:jobId" component={EditJob} exact />
          <Route path="/job/:jobId" component={Job} exact />
          <Route path="/messages" component={Messages} exact />
          <Route path="/message/:chatId" component={Message} exact />
          <Route path="/notifications" component={Notification} exact />
          <Route 
            path="/admin-dashboard" 
            render={() => <AdminDashboard onLogout={handleLogout} />} 
          />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/jobs" component={AdminJobs} />

          {/* Tabs Routes – only accessible when logged in */}
          <Route path="/tabs">
            {isLoggedIn ? (
              <IonTabs className='main-tab'>
                <IonRouterOutlet>
                  <Route exact path="/tabs/Home">
                    <Home />
                  </Route>
                  <Route exact path="/tabs/Jobs">
                    <Jobs />
                  </Route>
                  <Route exact path="/tabs/Chats">
                    <Messages />
                  </Route>
                  <Route exact path="/tabs/Profile" render={() => <Profile onLogout={handleLogout} />} />
                  <Route exact path="/tabs/">
                    <Redirect to="/tabs/Home" />
                  </Route>
                </IonRouterOutlet>

                <IonTabBar slot="bottom" className='tab-bar'>
                  <IonTabButton tab="Home" href="/tabs/Home">
                    <IonIcon aria-hidden="true" icon={home} />
                    <IonLabel>Home</IonLabel>
                  </IonTabButton>
                  <IonTabButton tab="Jobs" href="/tabs/Jobs">
                    <IonIcon aria-hidden="true" icon={briefcase} />
                    <IonLabel>Jobs</IonLabel>
                  </IonTabButton>
                  <IonTabButton tab="Chats" href="/tabs/Chats">
                    <IonIcon aria-hidden="true" icon={chatbubbleEllipses} />
                    <IonLabel>Chats</IonLabel>
                  </IonTabButton>
                  <IonTabButton tab="Profile" href="/tabs/Profile">
                    <IonIcon aria-hidden="true" icon={person} />
                    <IonLabel>Profile</IonLabel>
                  </IonTabButton>
                </IonTabBar>
              </IonTabs>
            ) : (
              <Redirect to="/login" />
            )}
          </Route>

          {/*first screen */}
          <Redirect exact from="/" to="/splash" />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;