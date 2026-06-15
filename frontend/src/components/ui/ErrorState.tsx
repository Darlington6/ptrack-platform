interface Props {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong.', onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <p className="text-red-600 font-medium">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 text-sm text-green-600 hover:underline">
          Try again
        </button>
      )}
    </div>
  );
}