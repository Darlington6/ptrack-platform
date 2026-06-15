import { useNetworkStore } from '../../stores/networkStore';

type NetworkStatus = 'online' | 'offline' | 'poor';

interface Props {
  status?: NetworkStatus;
  size?: number;
}

export function NetworkStatusDot({ status, size = 10 }: Props) {
  const storeStatus = useNetworkStore((s) => s.status);
  const s = status ?? storeStatus;
  const colors = { online: 'bg-green-500', offline: 'bg-gray-400', poor: 'bg-yellow-400' };
  return (
    <span
      className={`inline-block rounded-full ${colors[s]}`}
      style={{ width: size, height: size }}
      title={s}
    />
  );
}