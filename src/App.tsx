import React, { useState } from 'react';
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
import { ellipse, square, triangle, home, briefcase, person } from 'ionicons/icons';

import Home from './Tabs/Home';
import Tab2 from './Tabs/Tab2';
import Tab3 from './Tabs/Tab3';
import LoginPage from './pages/Login';

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

setupIonicReact();

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          {/* Login Route */}
          <Route exact path="/login">
            {isLoggedIn ? (
              <Redirect to="/tabs/Home" />
            ) : (
              <LoginPage onLogin={() => setIsLoggedIn(true)} />
            )}
          </Route>
          


          {/* Tabs Routes – only accessible when logged in */}
          <Route path="/tabs">
            {isLoggedIn ? (
              <IonTabs>
                <IonRouterOutlet>
                  <Route exact path="/tabs/Home">
                    <Home />
                  </Route>
                  <Route exact path="/tabs/Jobs">
                    <Tab2 />
                  </Route>
                  <Route exact path="/tabs/Profile">
                    <Tab3 />
                  </Route>
                  <Route exact path="/tabs/">
                    <Redirect to="/tabs/Home" />
                  </Route>
                </IonRouterOutlet>

                <IonTabBar slot="bottom">
                  <IonTabButton tab="Home" href="/tabs/Home">
                    <IonIcon aria-hidden="true" icon={home} />
                    <IonLabel>Home</IonLabel>
                  </IonTabButton>
                  <IonTabButton tab="Jobs" href="/tabs/Jobs">
                    <IonIcon aria-hidden="true" icon={briefcase} />
                    <IonLabel>Jobs</IonLabel>
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

          {/* Default route – go to login if not logged in */}
          <Route exact path="/">
            <Redirect to={isLoggedIn ? "/tabs/Home" : "/login"} />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;