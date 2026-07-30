import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonText } from '@ionic/react';

const OnboardingPage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Get set up</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonText color="medium">
          <p>The onboarding quiz lands with Phase 1 (see docs/PLAN.md).</p>
        </IonText>
      </IonContent>
    </IonPage>
  );
};

export default OnboardingPage;
