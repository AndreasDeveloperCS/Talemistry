import type { Metadata } from "next"
import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How Nomado Innovations collects, uses, shares and protects personal data on talemistry.com and the Talemistry recruitment platform.",
  alternates: { canonical: "/privacy" },
}

const LAST_UPDATED = "23 October 2026"
const CONTACT_EMAIL = "privacy@talemistry.com"

const SECTIONS = [
  { id: "who-we-are", title: "1. Who we are" },
  { id: "our-role", title: "2. Our role: controller or processor" },
  { id: "data-we-collect", title: "3. Personal data we collect" },
  { id: "how-we-use", title: "4. How we use personal data and our legal bases" },
  { id: "ai", title: "5. AI features and human oversight" },
  { id: "sharing", title: "6. Who we share data with" },
  { id: "transfers", title: "7. International transfers" },
  { id: "retention", title: "8. How long we keep data" },
  { id: "security", title: "9. Security" },
  { id: "rights", title: "10. Your rights" },
  { id: "cookies", title: "11. Cookies and local storage" },
  { id: "children", title: "12. Children" },
  { id: "changes", title: "13. Changes to this policy" },
  { id: "contact", title: "14. Contact us" },
]

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      {children}
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
        <header className="border-b border-border pb-8">
          <p className="text-sm font-medium text-primary">Legal</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Privacy policy</h1>
          <p className="mt-4 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
          <p className="mt-6 leading-relaxed text-muted-foreground">
            This policy explains how Nomado Innovations collects, uses, shares and protects personal data
            when you visit talemistry.com, use the Talemistry recruitment platform, or take part in a hiring
            process run on Talemistry. We wrote it to be read, not skimmed past. If anything is unclear,
            write to us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-primary hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </header>

        <nav aria-label="Contents" className="my-10 rounded-xl border border-border bg-muted/50 p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">Contents</h2>
          <ol className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-muted-foreground transition-colors hover:text-primary">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-12 leading-relaxed text-muted-foreground [&_li]:pl-1 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          <Section {...SECTIONS[0]}>
            <p>
              Talemistry is a full-cycle recruitment platform operated by <strong>Nomado Innovations</strong>{" "}
              (&ldquo;Nomado&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). In this policy, &ldquo;you&rdquo; may be
              a visitor to our website, a user of the platform working for one of our customers (such as a
              recruiter, hiring manager or HR director), or a candidate whose application is managed through
              Talemistry.
            </p>
          </Section>

          <Section {...SECTIONS[1]}>
            <p>Our responsibilities depend on whose data it is and why we hold it:</p>
            <ul>
              <li>
                <strong>We are the controller</strong> for data about website visitors, people who contact us,
                and the account and billing data of our customers&apos; users. We decide how and why this data
                is used.
              </li>
              <li>
                <strong>We are a processor</strong> for candidate and recruitment data that our customers
                (employers and agencies) upload to or collect through Talemistry. The employer is the controller
                and decides how that data is used; we process it only on their documented instructions and under
                a data processing agreement.
              </li>
            </ul>
            <p>
              If you are a candidate and want to access, correct or delete your application data, the quickest
              route is to contact the employer you applied to. You can also contact us and we will pass your
              request on and help them respond.
            </p>
          </Section>

          <Section {...SECTIONS[2]}>
            <h3 className="font-semibold text-foreground">Data you give us</h3>
            <ul>
              <li>
                <strong>Account data:</strong> your name, work email address, password (stored only as a salted
                hash) and role in your organisation.
              </li>
              <li>
                <strong>Candidate data:</strong> information in CVs, cover letters and application forms, such as
                contact details, work history, education, skills, portfolio links and any other information the
                candidate chooses to share.
              </li>
              <li>
                <strong>Evaluation data:</strong> assessment results, interview notes, scorecards, comments,
                hiring decisions and offer details created by recruiters and interviewers.
              </li>
              <li>
                <strong>Communications:</strong> messages you send us or send through the platform, and
                interview scheduling details.
              </li>
              <li>
                <strong>Billing data:</strong> billing contact and company details. Card payments are handled by
                our payment provider; we never see or store full card numbers.
              </li>
            </ul>
            <h3 className="font-semibold text-foreground">Data collected automatically</h3>
            <ul>
              <li>
                <strong>Technical data:</strong> IP address, browser and device type, pages requested, and
                timestamps, recorded in server logs.
              </li>
              <li>
                <strong>Usage and audit data:</strong> actions taken in the platform (for example, moving a
                candidate between stages or exporting data), kept as an audit trail for security and compliance.
              </li>
              <li>
                <strong>Interview data:</strong> when video interview rooms are used, connection metadata needed to
                establish the call. We do not record interviews unless the employer turns on recording and all
                participants are informed first.
              </li>
            </ul>
            <h3 className="font-semibold text-foreground">Data from third parties</h3>
            <ul>
              <li>
                Professional profile information from services such as LinkedIn, when a candidate or recruiter
                chooses to connect or import it.
              </li>
              <li>Calendar availability, when you connect a calendar such as Google Calendar for scheduling.</li>
            </ul>
            <p>
              We ask employers not to collect special-category data (such as health, ethnicity, religion or
              sexual orientation) through Talemistry unless the law requires or permits it. Where diversity data is
              collected for equal-opportunity monitoring, it is voluntary, kept separate from evaluation data and
              reported only in aggregate.
            </p>
          </Section>

          <Section {...SECTIONS[3]}>
            <ul>
              <li>
                <strong>To provide the platform</strong>, including creating accounts, managing jobs, pipelines,
                assessments, interviews and offers. Legal basis: performance of our contract with you or your
                organisation.
              </li>
              <li>
                <strong>To keep Talemistry secure</strong>, prevent fraud and abuse, and maintain audit trails.
                Legal basis: our legitimate interests in running a secure service, and legal obligations.
              </li>
              <li>
                <strong>To support and communicate with you</strong>, including service emails, security notices
                and responses to your requests. Legal basis: contract and legitimate interests.
              </li>
              <li>
                <strong>To improve the product</strong> using aggregated or de-identified usage data. Legal basis:
                legitimate interests. We do not use customers&apos; candidate data to train general-purpose AI
                models.
              </li>
              <li>
                <strong>To send marketing</strong> about Talemistry, only where you have agreed or where the law
                otherwise allows. You can unsubscribe at any time. Legal basis: consent or legitimate interests.
              </li>
              <li>
                <strong>To meet legal obligations</strong>, such as tax, accounting and responding to lawful
                requests from authorities.
              </li>
            </ul>
            <p>For candidate data we process as a processor, the employer determines the legal basis.</p>
          </Section>

          <Section {...SECTIONS[4]}>
            <p>
              Talemistry uses AI to help recruiters understand candidates, for example by summarising
              applications, highlighting relevant skills and suggesting matches between candidates and roles.
              Some of these features are powered by third-party AI model providers acting as our sub-processors.
            </p>
            <ul>
              <li>
                <strong>Humans make the decisions.</strong> AI outputs are recommendations to support recruiters.
                Talemistry does not make hiring decisions based solely on automated processing, and every score
                can be reviewed and overridden by a person.
              </li>
              <li>
                <strong>Transparency.</strong> Recruiters can see the factors behind an AI suggestion, and
                candidates can ask the employer for an explanation and for human review.
              </li>
              <li>
                <strong>Fairness.</strong> We monitor for adverse impact across hiring stages and design features
                to avoid relying on protected characteristics.
              </li>
              <li>
                <strong>No training on your data.</strong> Our agreements with AI providers prohibit them from using
                data we send them to train their models.
              </li>
            </ul>
          </Section>

          <Section {...SECTIONS[5]}>
            <p>We do not sell personal data. We share it only as follows:</p>
            <ul>
              <li>
                <strong>Within a customer&apos;s workspace:</strong> candidate data is visible to the users the
                employer authorises.
              </li>
              <li>
                <strong>Service providers (sub-processors)</strong> who help us run Talemistry under contracts
                that require them to protect the data and use it only for our instructions. These include providers
                of cloud hosting and storage (such as Amazon Web Services), database hosting (MongoDB), email
                delivery (such as SendGrid), payments (Stripe), calendar and video integrations (such as Google
                and Zoom), and AI model services (such as OpenAI and Google). A current list is available on
                request.
              </li>
              <li>
                <strong>Integrations you choose to connect</strong>, such as job boards or professional networks.
                Their own privacy policies apply to what they do with the data.
              </li>
              <li>
                <strong>Legal and safety reasons:</strong> where required by law, or to protect the rights, safety
                and property of our users, the public or Nomado.
              </li>
              <li>
                <strong>Business transfers:</strong> if Nomado is involved in a merger, acquisition or sale of
                assets, subject to this policy continuing to apply.
              </li>
            </ul>
          </Section>

          <Section {...SECTIONS[6]}>
            <p>
              We aim to store customer data in the European Union. Some of our service providers may process data
              in other countries, including the United States. Where personal data leaves the EEA, UK or
              Switzerland, we rely on an adequacy decision (such as the EU–US Data Privacy Framework) or the
              European Commission&apos;s Standard Contractual Clauses, together with additional safeguards where
              needed.
            </p>
          </Section>

          <Section {...SECTIONS[7]}>
            <ul>
              <li>
                <strong>Account data:</strong> for as long as the account is active, then deleted or anonymised
                within 90 days of closure, unless we must keep it longer by law.
              </li>
              <li>
                <strong>Candidate data:</strong> according to the employer&apos;s retention settings. By default,
                Talemistry flags candidate records for review after 24 months and can anonymise rejected candidates
                automatically.
              </li>
              <li>
                <strong>Server logs:</strong> up to 12 months.
              </li>
              <li>
                <strong>Billing records:</strong> as long as tax and accounting law requires.
              </li>
            </ul>
          </Section>

          <Section {...SECTIONS[8]}>
            <p>
              We protect personal data with encryption in transit (TLS), hashed passwords, role-based access
              controls, secure HTTP-only session cookies, audit logging and regular reviews of our systems and
              suppliers. No system is perfectly secure, so if you believe your account has been compromised,
              contact us immediately. We will notify affected customers and authorities of personal data breaches
              as the law requires.
            </p>
          </Section>

          <Section {...SECTIONS[9]}>
            <p>Depending on where you live, you may have the right to:</p>
            <ul>
              <li>access the personal data we hold about you and receive a copy;</li>
              <li>correct inaccurate or incomplete data;</li>
              <li>have your data deleted;</li>
              <li>restrict or object to certain processing, including processing based on legitimate interests;</li>
              <li>receive your data in a portable format;</li>
              <li>withdraw consent at any time, where we rely on it;</li>
              <li>not be subject to a decision based solely on automated processing that significantly affects you;</li>
              <li>
                lodge a complaint with your local data protection authority. California residents also have the
                right to know, delete and correct personal information, and not to be discriminated against for
                exercising these rights. We do not sell or share personal information for cross-context
                behavioural advertising.
              </li>
            </ul>
            <p>
              To exercise your rights, email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-primary hover:underline">
                {CONTACT_EMAIL}
              </a>
              . We will respond within one month and may need to verify your identity first. For candidate data we
              process for an employer, we will forward your request to them.
            </p>
          </Section>

          <Section {...SECTIONS[10]}>
            <p>We keep cookies to a minimum. talemistry.com currently uses:</p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Purpose</th>
                    <th className="px-4 py-3 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">tal_session</td>
                    <td className="px-4 py-3">Strictly necessary cookie</td>
                    <td className="px-4 py-3">Keeps you signed in securely</td>
                    <td className="px-4 py-3">7 days</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">theme</td>
                    <td className="px-4 py-3">Local storage</td>
                    <td className="px-4 py-3">Remembers your light or dark mode choice</td>
                    <td className="px-4 py-3">Until cleared</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              These are essential or preference items and do not track you across other websites. We do not use
              advertising cookies. If we add analytics or other non-essential cookies, we will update this table
              and ask for your consent where required.
            </p>
          </Section>

          <Section {...SECTIONS[11]}>
            <p>
              Talemistry is a professional tool and is not directed at children. We do not knowingly collect
              personal data from anyone under 16. If you believe a child has provided us with personal data,
              contact us and we will delete it.
            </p>
          </Section>

          <Section {...SECTIONS[12]}>
            <p>
              We may update this policy as our product and the law change. We will post the new version here with
              a new &ldquo;Last updated&rdquo; date and, for significant changes, notify account holders by email
              or in the platform before the changes take effect.
            </p>
          </Section>

          <Section {...SECTIONS[13]}>
            <p>
              Questions, requests or complaints about privacy can be sent to{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-primary hover:underline">
                {CONTACT_EMAIL}
              </a>
              . We will do our best to resolve any concern directly before you need to contact a regulator.
            </p>
            <p>
              <strong>Nomado Innovations</strong>
              <br />
              talemistry.com
            </p>
          </Section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
