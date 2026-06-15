interface Props {
  src?: string | null | undefined;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  statusDot?: 'online' | 'offline' | 'poor' | null;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function Avatar({ src, name, size = 'md', statusDot }: Props) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-14 h-14 text-xl' };
  const dotColors = { online: 'bg-green-500', offline: 'bg-gray-400', poor: 'bg-yellow-400' };
  return (
    <div className="relative inline-flex">
      {src ? (
        <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} />
      ) : (
        <div
          className={`${sizes[size]} rounded-full bg-green-600 text-white flex items-center justify-center font-semibold`}
        >
          {getInitials(name)}
        </div>
      )}
      {statusDot && (
        <span
          className={`absolute bottom-0 right-0 block w-2.5 h-2.5 rounded-full border-2 border-white ${dotColors[statusDot]}`}
        />
      )}
    </div>
  );
}