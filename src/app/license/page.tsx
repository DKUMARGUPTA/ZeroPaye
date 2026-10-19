import type { Metadata } from "next";
import { buildMetadata } from "@/lib/zeropaye/seo";
import { PageLayout, PageHero, Prose } from "@/components/zeropaye/page-layout";

export const metadata: Metadata = buildMetadata({
  title: "AGPL-3.0 License — ZeroPaye Open Source Terms",
  description:
    "ZeroPaye is licensed under GNU Affero General Public License v3.0 (AGPL-3.0-or-later). Free to use, modify, distribute, self-host. Network copyleft: modified code must be publicly available.",
  path: "/license",
  keywords: ["AGPL-3.0", "GNU Affero license", "ZeroPaye license", "open source license"],
});

export default function LicensePage() {
  return (
    <PageLayout breadcrumbs={[{ name: "Legal", href: "/" }, { name: "License", href: "/license" }]}>
      <PageHero
        badge="Legal"
        title="AGPL-3.0-or-later License"
        subtitle="Free software, forever. Use it, modify it, distribute it — lekin modifications publicly available karo."
      />

      <Prose>
        <h2>License summary (aasan bhasha mein)</h2>
        <h3>Aapko kya-kya kar sakte ho:</h3>
        <ul>
          <li>✅ <strong>Use:</strong> Kisi bhi purpose ke liye (commercial bhi!) — free</li>
          <li>✅ <strong>Modify:</strong> Code badal sakte hao</li>
          <li>✅ <strong>Distribute:</strong> Share kar sakte ho (free ya paid)</li>
          <li>✅ <strong>Self-host:</strong> Apne server pe chala sakte ho</li>
          <li>✅ <strong>White-label:</strong> Apne brand mein rebrand kar sakte ho</li>
          <li>✅ <strong>Patent grant:</strong> Code use karne ke liye patents bhi granted hain</li>
        </ul>

        <h3>Ek condition:</h3>
        <ul>
          <li>📋 <strong>Share back:</strong> Agar aap code modify karte ho aur <em>network service</em> chalate ho (jaise ZeroPaye ko internet pe), toh modified code <strong>publicly available</strong> karna padega. AGPL ka "network copyleft" rule.</li>
        </ul>

        <h3>Kya nahi kar sakte:</h3>
        <ul>
          <li>❌ <strong>Closed-source fork sell:</strong> AGPL code ko proprietary bana kar bech nahi sakte</li>
          <li>❌ <strong>Remove attribution in source:</strong> License headers remove nahi kar sakte (lekin customer-facing UI mein "Powered by ZeroPaye" hatane ki zarurat nahi)</li>
          <li>❌ <strong>Hold users liable:</strong> ZeroPaye "as is" provided hai — koi warranty nahi</li>
        </ul>

        <h3>Key clauses:</h3>
        <ul>
          <li><strong>Section 13 (Network Use):</strong> Agar users remotely interact karte hain (jaise web app), modified source code publicly offer karna padta hai.</li>
          <li><strong>Section 15:</strong> Koi warranty nahi. Software "as is" hai.</li>
          <li><strong>Section 16:</strong> Liability limited. Authors not liable for damages.</li>
        </ul>
      </Prose>

      <div className="my-8 rounded-2xl border border-teal-500/20 bg-gradient-brand-soft p-6">
        <h3 className="text-lg font-bold">Full license text</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Poora AGPL-3.0 text repo ke <code>LICENSE</code> file mein hai. Official text:
        </p>
        <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-medium text-white shadow-md glow-teal">
          gnu.org par full text padhein →
        </a>
      </div>

      <Prose>
        <h2>Commercial use FAQ</h2>
        <h3>Kya main ZeroPaye use karke paid SaaS chala sakta hu?</h3>
        <p>
          Haan, lekin AGPL-3.0 ke under. Agar aap code modify karte ho, modified code publicly
          available karna hoga. Aap SaaS charge kar sakte ho (hosting, support, customization ke
          liye), lekin source code free rahega.
        </p>
        <h3>Kya main apne clients ko ZeroPaye deployment bech sakta hu?</h3>
        <p>
          Haan — aap setup, customization, support bech sakte ho. Client ko source code bhi dena
          padega (AGPL mandate). Client usko further distribute kar sakta hai.
        </p>
        <h3>Kya main ZeroPaye ko proprietary product bana sakta hu?</h3>
        <p>
          Nahi. AGPL-3.0 derivative works ko bhi AGPL-3.0 rakhta hai. Aap code ko proprietary
          bana kar bech nahi sakte.
        </p>
      </Prose>
    </PageLayout>
  );
}
