import { useState } from 'react';
import { FoodFallback } from './FoodFallback';

interface FoodVisualProps {
  imageUrl?: string | null;
  label: string;
  tone?: 'green' | 'warm' | 'red';
  size?: 'sm' | 'md' | 'lg';
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
}

export function FoodVisual({
  imageUrl,
  label,
  tone = 'green',
  size = 'md',
  loading = 'eager',
  fetchPriority = 'auto',
}: FoodVisualProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  if (imageUrl) {
    return (
      <span
        className={`food-visual food-visual--${size}${
          isLoaded ? ' food-visual--loaded' : ''
        }`}
      >
        {!isLoaded ? <span className="food-visual__placeholder" /> : null}
        <img
          src={imageUrl}
          alt=""
          loading={loading}
          decoding="async"
          fetchPriority={fetchPriority}
          onLoad={() => setIsLoaded(true)}
        />
      </span>
    );
  }

  return <FoodFallback label={label} tone={tone} size={size} />;
}
