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
import { ellipse, square, triangle } from 'ionicons/icons';

import Tab1 from './pages/Tab1';
import Tab2 from './pages/Tab2';
import Tab3 from './pages/Tab3';
import Login from './pages/Login';
import Signup from './pages/Signup';

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
              <Redirect to="/tab1" />
            ) : (
              <Login onLogin={() => setIsLoggedIn(true)} />
            )}
          </Route>
          
          {/* Signup Route */}
          <Route exact path="/signup">
            {isLoggedIn ? (
              <Redirect to="/tab1" />
            ) : (
              <Signup onLogin={() => setIsLoggedIn(true)} />
            )}
          </Route>

          {/* Tabs Routes – only accessible when logged in */}
          <Route path="/tabs">
            {isLoggedIn ? (
              <IonTabs>
                <IonRouterOutlet>
                  <Route exact path="/tabs/tab1">
                    <Tab1 />
                  </Route>
                  <Route exact path="/tabs/tab2">
                    <Tab2 />
                  </Route>
                  <Route exact path="/tabs/tab3">
                    <Tab3 />
                  </Route>
                  <Route exact path="/tabs/">
                    <Redirect to="/tabs/tab1" />
                  </Route>
                </IonRouterOutlet>

                <IonTabBar slot="bottom">
                  <IonTabButton tab="tab1" href="/tabs/tab1">
                    <IonIcon aria-hidden="true" icon={triangle} />
                    <IonLabel>Tab 1</IonLabel>
                  </IonTabButton>
                  <IonTabButton tab="tab2" href="/tabs/tab2">
                    <IonIcon aria-hidden="true" icon={ellipse} />
                    <IonLabel>Tab 2</IonLabel>
                  </IonTabButton>
                  <IonTabButton tab="tab3" href="/tabs/tab3">
                    <IonIcon aria-hidden="true" icon={square} />
                    <IonLabel>Tab 3</IonLabel>
                  </IonTabButton>
                </IonTabBar>
              </IonTabs>
            ) : (
              <Redirect to="/login" />
            )}
          </Route>

          {/* Default route – go to login if not logged in */}
          <Route exact path="/">
            <Redirect to={isLoggedIn ? "/tabs/tab1" : "/login"} />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;