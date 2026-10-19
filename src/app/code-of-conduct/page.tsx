import type { Metadata } from "next";
import { buildMetadata } from "@/lib/zeropaye/seo";
import { PageLayout, PageHero, SectionHeading, Prose } from "@/components/zeropaye/page-layout";

export const metadata: Metadata = buildMetadata({
  title: "Code of Conduct — ZeroPaye Community Standards",
  description:
    "ZeroPaye Code of Conduct: be respectful, be welcoming, be harassment-free. Hindi/English/all languages welcome. Beginners-friendly. Inclusive community for Bharat's fintech builders.",
  path: "/code-of-conduct",
});

export default function CodeOfConductPage() {
  return (
    <PageLayout breadcrumbs={[{ name: "Community", href: "/" }, { name: "Code of Conduct", href: "/code-of-conduct" }]}>
      <PageHero
        badge="Community"
        title="Code of Conduct — sabke liye safe space"
        subtitle="Respectful, welcoming, harassment-free. Hindi/English/sab languages. Beginners-friendly. Inclusive community."
      />

      <SectionHeading eyebrow="Our pledge" title="Hamara vada" />
      <Prose>
        <p>
          ZeroPaye community mein har insaan ko bina discrimination participate karne ka adhikaar hai.
          Hum age, gender, sexual orientation, disability, physical appearance, body size, race,
          ethnicity, religion (ya lack of religion), caste, ya socioeconomic status ke aadhar par
          koi discrimination nahi karte.
        </p>
        <p>
          Bharat ke sabhi regions, languages, aur backgrounds ke log welcome hain. Hindi-English
          mix use kar sakte hain, ya apni regional language (Marathi, Tamil, Bengali, Punjabi, etc.).
        </p>
      </Prose>

      <SectionHeading eyebrow="Standards" title="Achha behavior" />
      <Prose>
        <ul>
          <li>✅ <strong>Respectful language</strong> — personal attacks, insults, ya trolling nahi</li>
          <li>✅ <strong>Constructive feedback</strong> — criticism welcome, lekin specific + actionable do</li>
          <li>✅ <strong>Beginner-friendly</strong> — koi bhi question puch sakte ho, bina judgement</li>
          <li>✅ <strong>Help others</strong> — agar aap jante ho toh reply karo</li>
          <li>✅ <strong>Respect privacy</strong> — dusro ki personal info share na karo</li>
          <li>✅ <strong>Credit others</strong> — dusro ka work acknowledge karo</li>
          <li>✅ <strong>Patient</strong> — maintainers volunteers hain, time do</li>
        </ul>
      </Prose>

      <SectionHeading eyebrow="Unacceptable" title="Anuchit behavior" />
      <Prose>
        <ul>
          <li>❌ Sexual language, imagery, ya advances</li>
          <li>❌ Trolling, insulting, ya derogatory comments</li>
          <li>❌ Personal ya political attacks</li>
          <li>❌ Public ya private harassment</li>
          <li>❌ Dusre ki physical address bina permission share karna</li>
          <li>❌ Doxxing</li>
          <li>❌ Spam, self-promotion (except Show & Tell discussions)</li>
          <li>❌ Mansplaining, condescension, especially towards beginners</li>
        </ul>
      </Prose>

      <SectionHeading eyebrow="Scope" title="Kahan apply hota hai?" />
      <Prose>
        <p>
          Yeh Code of Conduct apply hota hai:
        </p>
        <ul>
          <li>GitHub issues, PRs, discussions</li>
          <li>Code + commit messages</li>
          <li>Documentation, README, comments</li>
          <li>Social media jab ZeroPaye context mein ho</li>
          <li>Community events, meetups, conferences</li>
        </ul>
      </Prose>

      <SectionHeading eyebrow="Enforcement" title="Violation report kaise karein?" />
      <Prose>
        <p>
          Agar koi yeh Code of Conduct violate karta hai, toh report karein:
        </p>
        <ul>
          <li>Email: <a href="mailto:zeropaye@example.com">zeropaye@example.com</a> (coming soon)</li>
          <li>GitHub: privately message <a href="https://github.com/DKUMARGUPTA">@DKUMARGUPTA</a></li>
          <li>Facebook: <a href="https://www.facebook.com/ideepakkumargread">Deepak Kumar</a></li>
        </ul>
        <p>
          Sab reports confidential treat hote hain. 48 hours mein acknowledge, 1 week mein action.
        </p>
      </Prose>

      <SectionHeading eyebrow="Consequences" title="Violation par kya hoga?" />
      <Prose>
        <ol>
          <li><strong>First offense:</strong> Private warning + behavior correction request</li>
          <li><strong>Second offense:</strong> Public warning + temporary ban (1-7 days)</li>
          <li><strong>Third offense:</strong> Permanent ban from all community spaces</li>
        </ol>
        <p>
          Severe violations (harassment, threats, doxxing) pe immediate permanent ban.
        </p>
      </Prose>

      <SectionHeading eyebrow="Attribution" title="Inspiration" />
      <Prose>
        <p>
          Yeh Code of Conduct <a href="https://contributor-covenant.org/version/2/1/code_of_conduct/">Contributor Covenant 2.1</a>{" "}
          se inspired hai, Bharat context ke liye adapted.
        </p>
      </Prose>
    </PageLayout>
  );
}
