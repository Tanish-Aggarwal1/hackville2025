import { GestureConfig, IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/react';
import React, { useState } from 'react';

interface CardProps {
  index: number;
}

const Card: React.FC<CardProps> = ({ index }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ initialX: 0, initialY: 0 });
  const [dragging, setDragging] = useState<string>("none");

  const moveCardInit = (e: React.TouchEvent) => {
    setInitialPosition({
      initialX: e.touches[0].pageX,
      initialY: e.touches[0].pageY,
    });
    setDragging("none");
  };

  const moveCard = (e: React.TouchEvent) => {
    const deltaX = e.touches[0].pageX - initialPosition.initialX;
    const deltaY = e.touches[0].pageY - initialPosition.initialY;
    setPosition({ x: deltaX, y: deltaY });
  };

  const moveCardEnd = () => {
    setPosition({ x: 0, y: 0 });
    setDragging("all 0.5s ease");
  };

  const options: GestureConfig = {
    el: this.hostElement,
    gestureName: 'tinder-swipe',
    onStart: () => {
      // do something as the gesture begins
    },
    onMove: (ev) => {
      // do something in response to movement
    },
    onEnd: (ev) => {
      // do something when the gesture ends
    },
  };
  
  const gesture: Gesture = await createGesture(options);
  
  gesture.enable();

  return (
    <div
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: dragging,
      }}
      onTouchStart={moveCardInit}
      onTouchMove={moveCard}
      onTouchEnd={moveCardEnd}
    >
      <IonCard key={index}>
        <img src="themepic.webp" alt="" />
        <IonCardHeader>
          <IonCardTitle>Friend {index + 1}</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          This is friend number {index + 1}.
        </IonCardContent>
      </IonCard>
    </div>
  );
};

export default Card;
