import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonText } from '@ionic/react';

const MatchesPage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Matches</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Matches</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonText color="medium">
          <p>Matches and chat land with Phase 2 (see docs/PLAN.md).</p>
        </IonText>
      </IonContent>
    </IonPage>
  );
};

export default MatchesPage;
