interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: Props) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div
      className={`animate-spin rounded-full border-b-2 border-green-600 ${sizes[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
