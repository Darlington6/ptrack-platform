import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Camera } from 'lucide-react';
import client from '../api/client';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const WASTE_TYPES = [
  { value: 'bottles', label: 'Plastic bottles' },
  { value: 'bags', label: 'Plastic bags' },
  { value: 'mixed', label: 'Mixed plastic' },
  { value: 'other', label: 'Other' },
];

export default function ReportWaste() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [form, setForm] = useState<{
    waste_type: string;
    description: string;
    image: File | null;
  }>({
    waste_type: 'bottles',
    description: '',
    image: null,
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error(error);
      }
    );
  }, []);

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const target = e.target as HTMLInputElement;
    const { name, value } = target;
    const files = target.files;
    setForm((prev) => ({ ...prev, [name]: files ? files[0] : value }) as typeof form);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      // Kimironko centre coordinates
      if (location) {
        data.append('latitude', String(location.latitude));
        data.append('longitude', String(location.longitude));
      }
      data.append('waste_type', form.waste_type);
      data.append('description', form.description);
      if (form.image) data.append('image', form.image);

      const res = await client.post('/reports/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await refreshUser();
      setToast(`Report submitted! +10 points earned. Balance: ${res.data.new_points_balance} pts`);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch {
      setToast('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">Report Plastic Waste</h1>
      </div>

      {toast && (
        <div className="mx-4 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
          {toast}
        </div>
      )}

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-5">
        {/* Map placeholder — replace with Google Maps / Leaflet in production */}
        <div className="rounded-lg overflow-hidden border border-gray-200 bg-green-50 h-52 flex flex-col items-center justify-center relative">
          <MapPin size={36} className="text-green-600 mb-1" />
          <p className="text-sm font-medium text-gray-700">Kimironko, Kigali</p>
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin size={14} className="text-green-600" />
              <span>Location auto-detected — Kimironko, Kigali</span>
            </div>
            <button type="button" className="text-sm text-green-600 font-medium">
              Change
            </button>
          </div>
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
            {form.image ? (
              <p className="text-sm text-green-700 font-medium px-4 text-center">
                {form.image.name}
              </p>
            ) : (
              <>
                <Camera size={28} className="text-gray-400 mb-1" />
                <p className="text-sm font-medium text-gray-600">Tap to add a photo</p>
                <p className="text-xs text-gray-400">Help us verify the waste</p>
              </>
            )}
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
              className="sr-only"
            />
          </label>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Describe what you found (optional)
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="e.g., Large pile of plastic bottles near the road..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        {/* Waste type */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Waste Type</label>
          <select
            name="waste_type"
            value={form.waste_type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            {WASTE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit Report'}
        </Button>

        {/* Points reminder */}
        <p className="text-center text-sm text-gray-500">
          You'll earn <span className="font-semibold text-green-600">+10 points</span> for this
          report
        </p>
      </form>
    </div>
  );
}
