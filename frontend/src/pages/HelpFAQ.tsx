import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Mail, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FaqItem {
  q: string;
  a: string;
}

const FAQ_EN: FaqItem[] = [
  {
    q: 'What is pTrack?',
    a: 'pTrack is a plastic waste tracking platform for Kigali, Rwanda. Citizens can report illegal dumping, log recycling activities, and earn reward points that drive community accountability.',
  },
  {
    q: 'How do I report a waste dump?',
    a: 'Tap "Report Waste" on the dashboard, allow location access, take or upload a photo, choose the waste type, and submit. Your report is visible to local administrators immediately.',
  },
  {
    q: 'How are points calculated?',
    a: 'Point values are set by administrators and can be adjusted over time. You earn points when you submit a waste report, additional bonus points when an admin verifies your report, and separate points for logging recycling activities. Your running total is always visible on your profile.',
  },
  {
    q: 'What are badges?',
    a: 'Badges are milestone rewards. Each badge has a required points threshold — once you reach it, the badge unlocks automatically. View them on the Rewards page.',
  },
  {
    q: 'How does the weekly goal work?',
    a: 'Your weekly goal tracks how many waste reports you submit in a given week, resetting every Monday. The default is 5 reports per week. You can adjust your personal goal in Settings → Account.',
  },
  {
    q: 'Is my personal information visible to other users?',
    a: 'Only your display name and sector appear on the leaderboard. Your email, phone, and exact location are never shown publicly. You can opt out of the leaderboard in Settings → Privacy.',
  },
  {
    q: 'How do I log a recycling activity?',
    a: 'Tap "Log Recycling" on the dashboard, select the activity type (drop-off, pickup, exchange, or other), and optionally add a note. Points are credited instantly — the exact amount is configured by administrators.',
  },
  {
    q: 'Can I delete a report I submitted?',
    a: 'Yes — open the report from My Activity or the Map, scroll to the bottom, and tap "Delete Report." Only your own reports can be deleted.',
  },
  {
    q: 'What does "Verified" mean on a report?',
    a: 'An administrator has reviewed and confirmed the report. Verified reports count towards community impact statistics and award a bonus to the reporter.',
  },
  {
    q: 'How do I change the app language?',
    a: 'Go to Settings → Language and select English or Kinyarwanda. The app restarts the language immediately without a page reload.',
  },
  {
    q: 'Who can I contact for support?',
    a: 'Send an email to support@ptrack.rw and we will respond within 48 hours. For urgent issues, use the feedback link below.',
  },
  {
    q: 'Is pTrack free to use?',
    a: 'Yes. pTrack is a free public-good application funded as part of the ALU capstone project. There are no subscriptions or hidden fees.',
  },
];

const FAQ_RW: FaqItem[] = [
  {
    q: 'pTrack ni iki?',
    a: "pTrack ni urubuga rwo gukurikirana imyanda ya plastike i Kigali, Rwanda. Abaturage bashobora gutanga raporo z'imyanda, gukora ibikorwa byo gusunika, no gutunga amafaranga y'ingwate.",
  },
  {
    q: "Nshobora gute gutanga raporo y'imyanda?",
    a: 'Kanda "Gutanga Raporo" ku dashboard, emera utumiwe rw\'aho uherereye, fata cyangwa shyira ifoto, hitamo ubwoko bw\'imyanda, hanyuma wohereze.',
  },
  {
    q: 'Amanota abarwa ate?',
    a: "Umubare w'amanota ugengwa n'abayobozi kandi ushobora guhindurwa. Uhabwa amanota iyo utanze raporo, amanota yiyongera iyo raporo yawe yasuzumwe n'umuyobozi, no gusunika. Amanota yawe yose agaragara ku profilo yawe.",
  },
  {
    q: 'Badge ni iki?',
    a: "Badge ni impemba z'ibirango. Buri badge ifite umubare w'amanota asabwa — iyo ugeze ahantu hazaza, badge irakurura vuba. Reba ahantu h'Impemba.",
  },
  {
    q: "Intego y'icyumweru ikora gute?",
    a: "Intego y'icyumweru ikurikirana raporo z'imyanda utanga, itangira buri Kuwa Mbere. Default ni raporo 5 ku cyumweru. Ushobora guhindura intego yawe bwite muri Igenamigambi → Konti.",
  },
  {
    q: 'Amakuru yanjye bwite abonwa na ba mugenzi?',
    a: "Izina ryawe gusa n'akavuko byagaragara ku leaderboard. Email yawe, telefone, n'aho uri neza ntibishyikirizwa rubanda.",
  },
  {
    q: 'Nshobora gute kanda ibikorwa byo gusunika?',
    a: 'Kanda "Kanda Gusunika" ku dashboard, hitamo ubwoko bw\'ikorwa (gushyira aho bigenewe, gutwara, guhana, n\'ibindi), hanyuma wohereze. Amanota ashyirwaho vuba — umubare ni uwo abayobozi bagenga.',
  },
  {
    q: 'Nshobora gusiba raporo nashyize?',
    a: 'Yego — fungura raporo uvuye mu bikorwa byangu cyangwa ku karita, manuka hasi, hanyuma ukande "Siba Raporo."',
  },
  {
    q: '"Yasuzumwe" bisobanura iki kuri raporo?',
    a: "Umuyobozi yasuzuye no kwemeza raporo. Raporo zasuzumwe zibarwa mu mibare y'ingaruka z'umuryango.",
  },
  {
    q: "Nshobora gute guhindura ururimi rw'porogaramu?",
    a: 'Jya muri Igenamigambi → Ururimi hanyuma uhitemo Icyongereza cyangwa Ikinyarwanda.',
  },
  {
    q: "Nshobora kuvugana na nde nk'inkunga?",
    a: 'Ohereza email kuri support@ptrack.rw kandi tuzasubiza mu masaha 48.',
  },
  {
    q: 'pTrack wishyurwa?',
    a: "Oya. pTrack ni porogaramu ya rubanda itatishyurwa, yafashwe nka progaramu y'ALU capstone. Nta kwiyandikisha cyangwa amafaranga y'ibanga.",
  },
];

function AccordionItem({
  item,
  open,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-gray-100 dark:border-slate-700 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-3 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-gray-900 dark:text-white">{item.q}</span>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 mt-0.5 text-gray-400 dark:text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{item.a}</p>
      )}
    </div>
  );
}

export default function HelpFAQ() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const faqs = isRw ? FAQ_RW : FAQ_EN;
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="px-4 pt-4 pb-24 space-y-6 max-w-lg mx-auto">
      <div>
        <div className="flex items-center gap-3 mb-0.5">
          <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-slate-400">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {isRw ? 'Inkunga & Ibibazo Bikunze Kubazwa' : 'Help & FAQ'}
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 pl-8">
          {isRw ? "Inzanubwo z'ibibazo bikunze kubazwa" : 'Answers to frequently asked questions'}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 px-4">
        {faqs.map((item, i) => (
          <AccordionItem
            key={i}
            item={item}
            open={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? null : i)}
          />
        ))}
      </div>

      {/* Contact section */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-xl flex items-center justify-center flex-shrink-0">
          <Mail size={18} className="text-green-700 dark:text-green-300" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {isRw ? 'Nkenera inkunga yindi?' : 'Still need help?'}
          </p>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-0.5">
            {isRw ? 'Ohereza email' : 'Email us at'}{' '}
            <a
              href="mailto:support@ptrack.rw"
              className="text-green-600 dark:text-green-400 font-medium"
            >
              support@ptrack.rw
            </a>
            {isRw ? ' kandi tuzasubiza mu masaha 48.' : " and we'll respond within 48 hours."}
          </p>
        </div>
      </div>
    </div>
  );
}
