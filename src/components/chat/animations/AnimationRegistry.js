import React from 'react';
import ThrowHeartEffect from './effects/ThrowHeartEffect';
import ShootWebEffect from './effects/ShootWebEffect';
import LoveLetterEffect from './effects/LoveLetterEffect';
import SparklesEffect from './effects/SparklesEffect';
import RoseTossEffect from './effects/RoseTossEffect';

/**
 * Animation Registry
 * Maps effect IDs to their respective React components.
 * To add a new animation, simply drop it into the `effects/` folder and map it here.
 */
const REGISTRY = {
  heart: ThrowHeartEffect,
  web: ShootWebEffect,
  letter: LoveLetterEffect,
  sparkles: SparklesEffect,
  rose: RoseTossEffect,
};

export default function AnimationRegistry({ effectId, onComplete }) {
  const EffectComponent = REGISTRY[effectId];

  if (!EffectComponent) {
    console.warn(`[AnimationRegistry] No animation found for effect: ${effectId}`);
    return null;
  }

  return <EffectComponent onComplete={onComplete} />;
}
