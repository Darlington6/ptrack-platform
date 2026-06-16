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

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="px-4 pt-4 pb-24 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-slate-400">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Terms of Service</h1>
          <p className="text-xs text-gray-400 dark:text-slate-500">Effective: 1 June 2025</p>
        </div>
      </div>

      <Section title="1. Acceptance">
        <p>
          By creating an account or using pTrack, you agree to these Terms of Service. If you do not
          agree, you must stop using the app immediately.
        </p>
      </Section>

      <Section title="2. Eligibility">
        <p>
          You must be at least 16 years old to use pTrack. By registering, you represent that you
          meet this requirement.
        </p>
      </Section>

      <Section title="3. Acceptable use">
        <p>You agree to:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Submit only genuine waste reports with accurate GPS locations.</li>
          <li>Upload only photos you took yourself or have rights to share.</li>
          <li>Not submit false, misleading, or duplicate reports.</li>
          <li>Not attempt to game the points system through automated or fraudulent activity.</li>
          <li>Treat other community members respectfully.</li>
        </ul>
        <p>
          Violations may result in point resets, account suspension, or permanent bans at our sole
          discretion.
        </p>
      </Section>

      <Section title="4. Account responsibility">
        <p>
          You are responsible for maintaining the confidentiality of your password and for all
          activity that occurs under your account. Notify us immediately at{' '}
          <a href="mailto:support@ptrack.rw" className="text-green-600 dark:text-green-400">
            support@ptrack.rw
          </a>{' '}
          if you suspect unauthorised access.
        </p>
      </Section>

      <Section title="5. Content you submit">
        <p>
          You retain ownership of content (photos, descriptions) you upload. By submitting, you
          grant pTrack a non-exclusive, royalty-free licence to store and display your content for
          the purpose of community impact reporting.
        </p>
        <p>
          Do not upload content that is offensive, defamatory, or that violates the rights of
          others. We reserve the right to remove any content at our discretion.
        </p>
      </Section>

      <Section title="6. Points and rewards">
        <p>
          Points have no monetary value and cannot be exchanged for cash. We reserve the right to
          adjust, revoke, or reset points at any time, including in cases of fraudulent activity or
          system errors.
        </p>
        <p>
          Future reward redemption features (if introduced) will be governed by additional terms
          published at that time.
        </p>
      </Section>

      <Section title="7. Availability and changes">
        <p>
          pTrack is provided "as is." We do not guarantee uninterrupted availability. We may update,
          suspend, or discontinue features at any time. Material changes to these Terms will be
          notified via in-app banner 14 days in advance.
        </p>
      </Section>

      <Section title="8. Limitation of liability">
        <p>
          To the fullest extent permitted by law, pTrack and its contributors are not liable for any
          indirect, incidental, or consequential damages arising from your use of the platform,
          including data loss or service interruptions.
        </p>
      </Section>

      <Section title="9. Governing law">
        <p>
          These Terms are governed by the laws of the Republic of Rwanda. Any disputes shall be
          resolved in the courts of Kigali, Rwanda.
        </p>
      </Section>

      <Section title="10. Contact">
        <p>
          For questions about these Terms, email{' '}
          <a href="mailto:support@ptrack.rw" className="text-green-600 dark:text-green-400">
            support@ptrack.rw
          </a>
          .
        </p>
      </Section>

      <p className="text-xs text-gray-400 dark:text-slate-600 text-center pt-2">
        © {new Date().getFullYear()} pTrack · MIT License
      </p>
    </div>
  );
}
