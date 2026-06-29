import { FoodFallback } from './FoodFallback';

interface FoodVisualProps {
  imageUrl?: string | null;
  label: string;
  tone?: 'green' | 'warm' | 'red';
  size?: 'sm' | 'md' | 'lg';
}

export function FoodVisual({
  imageUrl,
  label,
  tone = 'green',
  size = 'md',
}: FoodVisualProps) {
  if (imageUrl) {
    return (
      <span className={`food-visual food-visual--${size}`}>
        <img src={imageUrl} alt="" loading="lazy" />
      </span>
    );
  }

  return <FoodFallback label={label} tone={tone} size={size} />;
}
