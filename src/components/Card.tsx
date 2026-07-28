import { IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/react';
import TinderCard from 'react-tinder-card';

export type SwipeDecision = 'like' | 'pass';

interface CardProps {
  index: number;
  onDecision?: (decision: SwipeDecision) => void;
}

const Card: React.FC<CardProps> = ({ index, onDecision }) => (
  <TinderCard
    className="swipe-card"
    preventSwipe={['up', 'down']}
    onSwipe={(direction) => onDecision?.(direction === 'right' ? 'like' : 'pass')}
  >
    <IonCard>
      <img src="themepic.webp" alt="" />
      <IonCardHeader>
        <IonCardTitle>Friend {index + 1}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>This is friend number {index + 1}.</IonCardContent>
    </IonCard>
  </TinderCard>
);

export default Card;
