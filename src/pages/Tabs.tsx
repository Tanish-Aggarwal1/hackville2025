import { Redirect, Route } from 'react-router-dom';
import { IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/react';
import { chatbubbles, heart, home, person } from 'ionicons/icons';
import DiscoverPage from './DiscoverPage';
import ListingsPage from './ListingsPage';
import MatchesPage from './MatchesPage';
import ProfilePage from './ProfilePage';

const Tabs: React.FC = () => (
  <IonTabs>
    <IonRouterOutlet>
      <Route exact path="/discover">
        <DiscoverPage />
      </Route>
      <Route exact path="/listings">
        <ListingsPage />
      </Route>
      <Route exact path="/matches">
        <MatchesPage />
      </Route>
      <Route exact path="/profile">
        <ProfilePage />
      </Route>
      <Route exact path="/">
        <Redirect to="/discover" />
      </Route>
    </IonRouterOutlet>
    <IonTabBar slot="bottom">
      <IonTabButton tab="discover" href="/discover">
        <IonIcon aria-hidden="true" icon={heart} />
        <IonLabel>Discover</IonLabel>
      </IonTabButton>
      <IonTabButton tab="listings" href="/listings">
        <IonIcon aria-hidden="true" icon={home} />
        <IonLabel>Listings</IonLabel>
      </IonTabButton>
      <IonTabButton tab="matches" href="/matches">
        <IonIcon aria-hidden="true" icon={chatbubbles} />
        <IonLabel>Matches</IonLabel>
      </IonTabButton>
      <IonTabButton tab="profile" href="/profile">
        <IonIcon aria-hidden="true" icon={person} />
        <IonLabel>Profile</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>
);

export default Tabs;
