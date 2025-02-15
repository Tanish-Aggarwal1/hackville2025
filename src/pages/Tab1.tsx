import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonInfiniteScroll, IonInfiniteScrollContent } from '@ionic/react';
import { useState } from 'react';
import Card from '../components/Card';
import './Tab1.css';

const Tab1: React.FC = () => {
  const [items, setItems] = useState(Array.from({ length: 20 }));

  const loadMore = (event: CustomEvent<void>) => {
    setTimeout(() => {
      setItems([...items, ...Array.from({ length: 20 })]);
      (event.target as HTMLIonInfiniteScrollElement).complete();
    }, 500);
  };

  function getInitialState() {
    return {
      x: 0,
      y: 0,
      initialX: 0,
      initialY: 0,
      dragging: "none"
    }
  };

  

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Find Friends</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Find Friends</IonTitle>
          </IonToolbar>
        </IonHeader>
        {items.map((_, index) => (
          <Card index={index}></Card>
          // <IonCard key={index}>
          //     <img src="themepic.webp" alt="" />
          //   <IonCardHeader>
          //     <IonCardTitle>Friend {index + 1}</IonCardTitle>
          //   </IonCardHeader>
          //   <IonCardContent>
          //     This is friend number {index + 1}.
          //   </IonCardContent>
          // </IonCard>
        ))}
        <IonInfiniteScroll onIonInfinite={loadMore}>
          <IonInfiniteScrollContent loadingText="Loading more friends..."></IonInfiniteScrollContent>
        </IonInfiniteScroll>
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
