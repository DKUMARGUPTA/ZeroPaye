import type { Metadata } from "next";
import { buildMetadata } from "@/lib/zeropaye/seo";
import { PageLayout, PageHero, SectionHeading, Prose } from "@/components/zeropaye/page-layout";

export const metadata: Metadata = buildMetadata({
  title: "Community Discussions — Q&A, Ideas, Show & Tell",
  description:
    "Join ZeroPaye GitHub Discussions: ask questions, share ideas, showcase your ZeroPaye deployment, connect with other Indian merchants and developers building zero-fee UPI payments.",
  path: "/discussions",
});

export default function DiscussionsPage() {
  return (
    <PageLayout breadcrumbs={[{ name: "Community", href: "/" }, { name: "Discussions", href: "/discussions" }]}>
      <PageHero
        badge="Community"
        title="ZeroPaye Discussions — sab ek saath"
        subtitle="Sawaal poochhein, ideas share karein, apne deployment dikhaayein. Bharat ke merchants aur developers se connect karein."
      />

      <SectionHeading eyebrow="Categories" title="Discussion categories" />
      <Prose>
        <h3>💬 Q&A</h3>
        <p>
          Koi sawaal ho — setup, integration, configuration, deployment. Community + maintainers
          reply karte hain.
        </p>
        <h3>💡 Ideas</h3>
        <p>
          Naya feature soocha? Yahan propose karein. Community upvote karti hai, hum roadmap mein add karte hain.
        </p>
        <h3>📢 Show & Tell</h3>
        <p>
          Apna ZeroPaye deployment dikhao! Kaunsa merchant use kar rahe ho, custom branding kaisa
          lagta hai, kya-kya features use kar rahe ho — sab share karo.
        </p>
        <h3>📌 Announcements</h3>
        <p>
          Releases, security advisories, breaking changes, community events — yahan announce hote hain.
        </p>
      </Prose>

      <SectionHeading eyebrow="Guidelines" title="Discussion etiquette" />
      <Prose>
        <ul>
          <li>Respectful raho — Hindi, English, ya koi bhi language welcome.</li>
          <li>Specific sawaal poochho — context + code + screenshot provide karo.</li>
          <li>Existing discussions mein search karo pehle.</li>
          <li>Help others — agar aap jante ho toh reply karo. Yahi community strong banti hai.</li>
          <li>No spam, no self-promotion (except Show & Tell category).</li>
        </ul>
      </Prose>

      <div className="mt-10 rounded-2xl border border-border/60 glass p-6 text-center">
        <h3 className="text-lg font-bold">Discussion join karne ke liye</h3>
        <p className="mt-2 text-sm text-muted-foreground">GitHub account chahiye (free).</p>
        <a href="https://github.com/DKUMARGUPTA/ZeroPaye/discussions" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-medium text-white shadow-md glow-teal">
          Discussions join karein →
        </a>
      </div>

      <SectionHeading eyebrow="Why discuss" title="Discussion kyun important hai?" />
      <Prose>
        <p>
          Open-source projects ki strength community mein hoti hai. Jab aap discuss karte ho:
        </p>
        <ul>
          <li>✅ Dusre merchants ko help karte ho (jo shuru mein hain)</li>
          <li>✅ Humain real-world use cases samajh aate hain</li>
          <li>✅ Feature requests community-driven hote hain</li>
          <li>✅ Bugs faster discover hote hain (community testing)</li>
          <li>✅ Best practices share hote hain</li>
        </ul>
      </Prose>
    </PageLayout>
  );
}
