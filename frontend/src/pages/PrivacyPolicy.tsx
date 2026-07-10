import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
      <div className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
}

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="px-4 pt-4 pb-24 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-slate-400">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
          <p className="text-xs text-gray-400 dark:text-slate-500">Effective: 1 June 2026</p>
        </div>
      </div>

      <Section title="1. Who we are">
        <p>
          pTrack ("we", "us", "our") is a plastic waste tracking application developed as an ALU
          capstone project, currently piloting in the Kimironko sector of Kigali, Rwanda.
        </p>
        <p>Data controller: Desmond Tunyinko · d.tunyinko@alustudent.com</p>
      </Section>

      <Section title="2. Data we collect">
        <p>
          <strong>Account data:</strong> full name, email address, phone number, sector, profile
          picture, and role.
        </p>
        <p>
          <strong>Activity data:</strong> waste reports (photo, description, GPS coordinates, waste
          type), recycling logs (type, date), and reward points history.
        </p>
        <p>
          <strong>Technical data:</strong> IP address and user-agent string, collected only for
          administrator accounts and used exclusively for audit logging and accountability. Users
          are informed of this collection before being granted administrator access.
        </p>
        <p>
          <strong>Preferences:</strong> language, theme, notification settings, and leaderboard
          visibility choice.
        </p>
      </Section>

      <Section title="3. How we use your data">
        <p>We use collected data to:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Authenticate and manage your account.</li>
          <li>Display your activity and points on the leaderboard (opt-in).</li>
          <li>Compile anonymised community impact statistics.</li>
          <li>Send push/email notifications you have opted into.</li>
          <li>Identify and prevent fraudulent activity.</li>
        </ul>
        <p>
          We do <strong>not</strong> sell your data to third parties or use it for advertising.
        </p>
      </Section>

      <Section title="4. Data storage and security">
        <p>
          Data is stored on Neon's PostgreSQL (AWS US East 1 (N. Virginia)) and media files on
          Cloudinary (served over HTTPS). JWT access tokens expire after 60 minutes; refresh tokens
          after 7 days.
        </p>
        <p>
          We apply encryption in transit (TLS 1.2+), input sanitisation, and rate-limiting on all
          API endpoints. Passwords are hashed with PBKDF2-SHA256.
        </p>
      </Section>

      <Section title="5. Your rights">
        <p>You may at any time:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Request a copy of all data we hold about you.</li>
          <li>Request correction of inaccurate information.</li>
          <li>Request deletion of your account and all associated data.</li>
          <li>Opt out of the leaderboard in Settings → Privacy.</li>
          <li>Withdraw consent for notifications in Settings → Notifications.</li>
        </ul>
        <p>
          To exercise these rights email{' '}
          <a href="mailto:support@ptrack.rw" className="text-green-600 dark:text-green-400">
            support@ptrack.rw
          </a>
          . We respond within 7 days.
        </p>
      </Section>

      <Section title="6. Third-party services">
        <p>
          <strong>Cloudinary</strong> stores uploaded images. Images are publicly accessible via
          their URL; do not upload photos containing sensitive personal information.
        </p>
        <p>
          <strong>Render</strong> hosts our backend. See Render's DPA for their data-handling
          obligations.
        </p>
        <p>
          <strong>Google Maps</strong> is linked to for directions (opens externally). We do not
          share user data with Google Maps proactively.
        </p>
      </Section>

      <Section title="7. Children">
        <p>
          pTrack is not directed to children under 16. We do not knowingly collect data from minors.
          If you believe a minor has created an account, contact us and we will delete it.
        </p>
      </Section>

      <Section title="8. Changes to this policy">
        <p>
          We may update this policy to reflect changes in the app or legal requirements. Material
          changes will be notified via an in-app nudge. Continued use after 30 days constitutes
          acceptance.
        </p>
      </Section>

      <p className="text-xs text-gray-400 dark:text-slate-400 text-center pt-2">
        Questions? Email{' '}
        <a href="mailto:support@ptrack.rw" className="underline">
          support@ptrack.rw
        </a>
      </p>
    </div>
  );
}
