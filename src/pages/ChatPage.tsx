import { IonBackButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonText } from '@ionic/react';

const ChatPage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/matches" />
          </IonButtons>
          <IonTitle>Chat</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonText color="medium">
          <p>Realtime messaging lands with Phase 2 (see docs/PLAN.md).</p>
        </IonText>
      </IonContent>
    </IonPage>
  );
};

export default ChatPage;
