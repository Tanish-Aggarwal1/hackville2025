import TinderCard from 'react-tinder-card';
import './Card.css';

export type SwipeDecision = 'like' | 'pass';

interface CardProps {
  index: number;
  onDecision?: (decision: SwipeDecision) => void;
}

const Card: React.FC<CardProps> = ({ index, onDecision }) => (
  <div className="swipe-card-wrapper" style={{ zIndex: 1000 - index }}>
    <TinderCard
      className="swipe-card"
      preventSwipe={['up', 'down']}
      onSwipe={(direction) => onDecision?.(direction === 'right' ? 'like' : 'pass')}
    >
      <div className="swipe-card-face" style={{ backgroundImage: 'url(themepic.webp)' }}>
        <div className="swipe-card-gradient" />
        <div className="swipe-card-info">
          <h2>Friend {index + 1}</h2>
          <p>This is friend number {index + 1}.</p>
        </div>
      </div>
    </TinderCard>
  </div>
);

export default Card;
