import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import HouseListings from '../components/HouseListings';
import RoommateFinder from '../components/RoommateFinder';
import './ListingsPage.css';

const ListingsPage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Listings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Listings</IonTitle>
          </IonToolbar>
        </IonHeader>
        <HouseListings />
        <RoommateFinder></RoommateFinder>
      </IonContent>
    </IonPage>
  );
};

export default ListingsPage;
