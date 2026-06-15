interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: Props) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-200 border-t-green-600 ${sizes[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}