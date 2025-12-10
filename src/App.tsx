import { Redirect, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
import { 
  library, 
  people, 
  desktop, 
  camera,
  person,
  flashlight
} from 'ionicons/icons';
import Tab1 from './pages/Tab1';
import Tab2 from './pages/Tab2';
import Tab3 from './pages/Tab3';
import Tab4 from './pages/Tab4';
import Tab5 from './pages/Tab5';
import Tab6 from './pages/Tab6';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyCode from './pages/VerifyCode';
import VerifyEmail from './pages/VerifyEmail';
import ProtectedRoute from './components/ProtectedRoute';
import authService from './services/authService';
import { initNotifications } from './services/notificationService';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const AppContent: React.FC = () => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  // Actualizar el estado de autenticación cuando cambie la ruta
  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
  }, [location.pathname]);

  // También verificar cuando cambia el localStorage (logout/login)
  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(authService.isAuthenticated());
    };

    // Escuchar cambios en localStorage (para cambios entre ventanas)
    window.addEventListener('storage', handleStorageChange);
    
    // Escuchar eventos personalizados para cambios en la misma ventana
    const handleCustomStorage = () => {
      setIsAuthenticated(authService.isAuthenticated());
    };
    window.addEventListener('auth-changed', handleCustomStorage);
    
    // También verificar periódicamente (para cambios en la misma ventana)
    const interval = setInterval(() => {
      const currentAuth = authService.isAuthenticated();
      if (currentAuth !== isAuthenticated) {
        setIsAuthenticated(currentAuth);
      }
    }, 50); // Reducido a 50ms para detectar cambios más rápido

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-changed', handleCustomStorage);
    };
  }, [isAuthenticated]);

  return (
    <>
      {isAuthenticated ? (
          <IonTabs>
            <IonRouterOutlet>
              <Route exact path="/tab1">
                <Tab1 />
              </Route>
              <Route exact path="/tab2">
                <Tab2 />
              </Route>
              <Route path="/tab3">
                <Tab3 />
              </Route>
              <Route path="/tab4">
                <Tab4 />
              </Route>
              <Route path="/tab5">
                <Tab5 />
              </Route>
              <Route path="/tab6">
                <Tab6 />
              </Route>
              <Route exact path="/">
                <Redirect to="/tab1" />
              </Route>
            </IonRouterOutlet>
            <IonTabBar slot="bottom">
              <IonTabButton tab="tab1" href="/tab1">
                <IonIcon aria-hidden="true" icon={library} />
                <IonLabel>Pokédex</IonLabel>
              </IonTabButton>
              <IonTabButton tab="tab2" href="/tab2">
                <IonIcon aria-hidden="true" icon={people} />
                <IonLabel>Mi Equipo</IonLabel>
              </IonTabButton>
              <IonTabButton tab="tab3" href="/tab3">
                <IonIcon aria-hidden="true" icon={desktop} />
                <IonLabel>PC</IonLabel>
              </IonTabButton>
              <IonTabButton tab="tab4" href="/tab4">
                <IonIcon aria-hidden="true" icon={camera} />
                <IonLabel>Capturar</IonLabel>
              </IonTabButton>
              <IonTabButton tab="tab6" href="/tab6">
                <IonIcon aria-hidden="true" icon={flashlight} />
                <IonLabel>Linterna</IonLabel>
              </IonTabButton>
            </IonTabBar>
          </IonTabs>
        ) : (
          <IonRouterOutlet>
            <Route exact path="/login">
              <Login />
            </Route>
            <Route exact path="/register">
              <Register />
            </Route>
            <Route exact path="/verify-code">
              <VerifyCode />
            </Route>
            <Route exact path="/verify-email">
              <VerifyEmail />
            </Route>
            <Route exact path="/">
              <Redirect to="/login" />
            </Route>
            <Route>
              <Redirect to="/login" />
            </Route>
          </IonRouterOutlet>
        )}
    </>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    initNotifications();
  }, []);

  return (
    <IonApp>
      <IonReactRouter>
        <AppContent />
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
