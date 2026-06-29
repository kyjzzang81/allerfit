interface FoodFallbackProps {
  label: string;
  tone?: 'green' | 'warm' | 'red';
  size?: 'sm' | 'md' | 'lg';
}

export function FoodFallback({
  label,
  tone = 'green',
  size = 'md',
}: FoodFallbackProps) {
  return (
    <span className={`food-fallback food-fallback--${tone} food-fallback--${size}`}>
      <span aria-hidden="true">{label}</span>
    </span>
  );
}
