import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonInfiniteScroll, IonInfiniteScrollContent } from '@ionic/react';
import { useState } from 'react';
import Card from '../components/Card';
import './DiscoverPage.css';

const DiscoverPage: React.FC = () => {
  const [items, setItems] = useState(Array.from({ length: 20 }));

  const loadMore = (event: CustomEvent<void>) => {
    setTimeout(() => {
      setItems([...items, ...Array.from({ length: 20 })]);
      (event.target as HTMLIonInfiniteScrollElement).complete();
    }, 500);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Discover</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Discover</IonTitle>
          </IonToolbar>
        </IonHeader>
        <div className="swipe-deck">
          {items.map((_, index) => (
            <Card key={index} index={index} />
          ))}
        </div>
        <IonInfiniteScroll onIonInfinite={loadMore}>
          <IonInfiniteScrollContent loadingText="Loading more friends..."></IonInfiniteScrollContent>
        </IonInfiniteScroll>
      </IonContent>
    </IonPage>
  );
};

export default DiscoverPage;
