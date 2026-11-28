// ============================================================
// Legal pages — Terms of Service, Privacy Policy, Disclaimer
// Public URLs (no login needed): /terms  /privacy-policy
// These are solid starting drafts, not legal advice — have them
// reviewed (or run through Termly / iubenda) before charging money.
// ============================================================

const UPDATED = 'November 27, 2026'
const COMPANY = 'ArtifactAI Productions'
const APP     = 'Co-Pilot'
const SITE    = 'drivercopilot.app'
const EMAIL   = 'support@drivercopilot.app'
const STATE   = 'Pennsylvania'

export const LEGAL_PATHS = { '/terms': 'terms', '/privacy-policy': 'privacy' }

export default function LegalScreen({ page = 'terms', onBack }) {
  const doc = page === 'privacy' ? PRIVACY : TERMS
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--text-primary)' }}>
      <div style={{ maxWidth:720, margin:'0 auto', padding:'24px 20px 60px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <button onClick={onBack || (() => { window.location.href = '/' })} style={{ background:'none', border:'1px solid var(--border)', borderRadius:10, padding:'6px 12px', cursor:'pointer', color:'var(--text-primary)', fontSize:13 }}>← Back to {APP}</button>
          <div style={{ display:'flex', gap:14, fontSize:13 }}>
            <a href="/terms" style={linkStyle(page==='terms')}>Terms</a>
            <a href="/privacy-policy" style={linkStyle(page==='privacy')}>Privacy</a>
          </div>
        </div>
        <h1 style={{ fontSize:28, fontWeight:700, letterSpacing:'-0.4px', marginBottom:4 }}>{doc.title}</h1>
        <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:24 }}>Last updated {UPDATED}</div>
        {doc.sections.map(([heading, ...paras]) => (
          <section key={heading} style={{ marginBottom:22 }}>
            <h2 style={{ fontSize:17, fontWeight:600, marginBottom:8 }}>{heading}</h2>
            {paras.map((p, i) => Array.isArray(p)
              ? <ul key={i} style={{ margin:'0 0 10px 18px', padding:0 }}>{p.map(li => <li key={li} style={paraStyle}>{li}</li>)}</ul>
              : <p key={i} style={paraStyle}>{p}</p>)}
          </section>
        ))}
      </div>
    </div>
  )
}

const paraStyle = { fontSize:14, lineHeight:1.65, color:'var(--text-secondary)', margin:'0 0 10px' }
const linkStyle = (on) => ({ color: on ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: on ? 600 : 400, textDecoration:'none' })

// ── Terms of Service ─────────────────────────────────────────
const TERMS = {
  title: 'Terms of Service',
  sections: [
    ['1. Who we are',
      `${APP} (${SITE}) is operated by ${COMPANY}, based in ${STATE}, USA ("we", "us"). By creating an account or using ${APP}, you agree to these Terms and our Privacy Policy. If you don't agree, please don't use the app.`],
    ['2. Who can use it',
      `You must be at least 18 years old and legally able to agree to these Terms. You're responsible for keeping your password safe and for everything that happens under your account. Tell us right away at ${EMAIL} if you think someone else has access.`],
    ['3. What the app does — and doesn\'t',
      `${APP} helps rideshare and delivery drivers plan their work: it estimates earnings, demand areas, costs, mileage and taxes, and offers AI suggestions.`,
      [
        'Everything shown is an estimate. Demand zones are based on time of day and the kinds of places nearby; they are not live data from Uber, Lyft, DoorDash or any other platform.',
        'We can\'t guarantee you will earn any particular amount, hit any goal, or find surge pricing anywhere.',
        `${APP} is not affiliated with, endorsed by or sponsored by Uber, Lyft, DoorDash, Uber Eats, Grubhub or any other gig platform. Their names are trademarks of their owners and are used only to describe which apps you drive for.`,
      ]],
    ['4. Drive safely — always',
      `Never type, read or interact with ${APP} while your vehicle is moving. Pull over safely first. Follow all traffic laws and the rules of the platforms you drive for. You are solely responsible for how and where you drive. Don't rely on ${APP} for navigation decisions that could put you or others at risk.`],
    ['5. Not tax, financial or legal advice',
      `Tax estimates, deduction suggestions, mileage figures and AI answers are general information for planning only. They are not tax, accounting, financial or legal advice, and they may be incomplete or wrong. Talk to a qualified tax professional before filing or making financial decisions.`],
    ['6. The AI assistant',
      `The AI assistant is powered by a third-party AI provider (currently Google Gemini). AI answers can be inaccurate, out of date or simply wrong — check anything important. Don't enter sensitive personal information (such as your Social Security number or bank details) into the chat. We may limit how many questions you can ask per day.`],
    ['7. Your content',
      `You own the information you enter (shifts, trips, expenses, photos, reports). You give us permission to store and process it only to run ${APP} for you. If you submit surge or demand reports, you allow us to show them, without your name, to other drivers.`],
    ['8. Things you agree not to do',
      [
        'Break the law or the terms of any gig platform.',
        'Submit fake surge reports or try to manipulate the data other drivers see.',
        'Try to access other people\'s accounts or data, probe or attack our systems, or get around usage limits.',
        'Copy, resell or scrape the app or its data.',
      ]],
    ['9. Paid plans',
      `Some features may require a paid "Pro" plan. When paid plans are available, the price, billing period, renewal and cancellation terms will be shown before you pay, and payments will be handled by a third-party payment provider. You can cancel at any time; you keep Pro access until the end of the period you paid for. Unless the law requires otherwise, payments are non-refundable.`],
    ['10. Ending your account',
      `You can delete your account at any time in the app (More → Privacy & Data → Delete account). We may suspend or close accounts that break these Terms or put other users or our systems at risk.`],
    ['11. No warranties',
      `${APP} is provided "as is" and "as available". To the fullest extent the law allows, we disclaim all warranties, express or implied, including fitness for a particular purpose, accuracy and uninterrupted availability.`],
    ['12. Limits on our liability',
      `To the fullest extent the law allows, ${COMPANY} won't be liable for lost earnings, missed trips, deactivation by a gig platform, tax penalties, traffic tickets, accidents, or any indirect, incidental or consequential damages. Our total liability for any claim is limited to the greater of the amount you paid us in the 12 months before the claim or US $50.`],
    ['13. Indemnity',
      `You agree to cover our reasonable costs if a claim is brought against us because of how you used ${APP} or because you broke these Terms or the law.`],
    ['14. Governing law',
      `These Terms are governed by the laws of the Commonwealth of ${STATE}, USA, without regard to conflict-of-law rules. Any dispute will be handled in the state or federal courts located in ${STATE}, unless the law where you live requires otherwise.`],
    ['15. Changes',
      `We may update these Terms. If the changes are significant, we'll tell you in the app or by email before they take effect. Continuing to use ${APP} after that means you accept the new Terms.`],
    ['16. Contact', `Questions? Email ${EMAIL}.`],
  ],
}

// ── Privacy Policy ──────────────────────────────────────────
const PRIVACY = {
  title: 'Privacy Policy',
  sections: [
    ['The short version',
      [
        'We collect only what we need to run the app.',
        'We never sell your data, and we never share your earnings with Uber, Lyft, DoorDash or any gig platform.',
        'You can download or delete everything at any time in the app.',
      ]],
    ['1. Information you give us',
      [
        'Account: email address, first name and password (stored scrambled by our login provider — we can\'t see it).',
        'Profile: city, weekly goal, which gig apps you drive for, vehicle details, and an optional profile photo.',
        'Work records you enter: shifts, trips, payouts, tips, expenses, mileage and offer evaluations.',
        'Surge or demand reports you choose to submit (including the location you report).',
        'Questions you ask the AI assistant.',
      ]],
    ['2. Information collected automatically',
      [
        'Location: only while the map is open and only if you allow it in your browser. Your live location is shown on your own screen; we don\'t track you in the background.',
        'Basic technical data our hosting provider records, such as IP address, browser type and the time of each request.',
        'Data saved on your device (browser storage) to keep you signed in and remember settings like dark mode and your active shift.',
      ]],
    ['3. How we use it',
      [
        'To run the app: show your earnings, goals, maps, tax estimates and AI answers.',
        'To keep your account secure and prevent abuse (for example, limiting AI questions per day).',
        'To send account emails such as sign-up confirmation and password resets.',
        'To show anonymous, combined surge reports to other drivers in your city.',
      ],
      'We do not use your data for advertising, and we do not sell or rent it.'],
    ['4. Services we use',
      'We share data with these providers only so they can do their job for us:',
      [
        'Supabase — database, login and file storage (account, profile, work records, photo).',
        'Vercel — hosts the website (technical request logs).',
        'Google (Gemini API) — powers the AI assistant. Your question and a short summary of your earnings context are sent to Google to generate an answer. While we use Google\'s free tier, Google may use these prompts and answers to improve its products, and they may be reviewed by people. Please don\'t put sensitive personal details in the chat. We will update this notice when we move to a paid plan with different terms.',
        'OpenStreetMap and its Overpass and Nominatim services — map tiles, city search and nearby places (these receive the map area or city you look at, not your account details).',
        'Resend — delivers account emails (your email address).',
        'A payment provider — only if you buy a paid plan, to process your payment. We never see or store your full card number.',
      ]],
    ['5. How long we keep it',
      'We keep your information while your account is open. When you delete your account, we delete your profile and work records from our database. Backups and provider logs are removed on their normal schedule, usually within 30 days. We may keep limited records if the law requires it (for example, payment records).'],
    ['6. Your choices and rights',
      [
        'Download your data: More → Privacy & Data → Export.',
        'Delete your account and data: More → Privacy & Data → Delete account.',
        'Correct your information: edit your profile in the app.',
        'Location: you can block location access in your browser at any time.',
      ],
      `Depending on where you live (for example California under the CCPA/CPRA, or other US states with privacy laws), you may have additional rights to know, correct or delete your data and to not be discriminated against for using them. We don't sell or "share" personal information for cross-context advertising. To make a request, email ${EMAIL}; we'll respond within 45 days.`],
    ['7. Security',
      'Data is sent over encrypted connections (HTTPS) and stored with our providers using encryption at rest. Database rules ensure each driver can only read and change their own records. No system is perfectly secure, so please use a strong, unique password.'],
    ['8. Children',
      `${APP} is for adults aged 18 and over. We don't knowingly collect information from anyone under 18. If you believe a minor has created an account, email us and we'll delete it.`],
    ['9. Changes to this policy',
      'If we make significant changes, we\'ll tell you in the app or by email before they take effect.'],
    ['10. Contact', `${COMPANY}, ${STATE}, USA — ${EMAIL}`],
  ],
}
