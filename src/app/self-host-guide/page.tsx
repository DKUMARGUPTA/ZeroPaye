import type { Metadata } from "next";
import { buildMetadata, articleJsonLd } from "@/lib/zeropaye/seo";
import { PageLayout, PageHero, SectionHeading, Prose } from "@/components/zeropaye/page-layout";

export const metadata: Metadata = buildMetadata({
  title: "Self-Host Guide — VPS Setup, PM2, HTTPS, Backups",
  description:
    "Complete ZeroPaye self-hosting guide: VPS requirements, install commands, PM2 for auto-restart, Caddy/Let's Encrypt for HTTPS, daily DB backups, observer setup. Go live in 30 minutes.",
  path: "/self-host-guide",
  keywords: [
    "self-host payment gateway", "ZeroPaye VPS setup", "UPI gateway self-hosting",
    "PM2 Next.js", "Caddy HTTPS payment", "SQLite backup fintech",
  ],
  ogType: "article",
});

const jsonLd = articleJsonLd({
  headline: "ZeroPaye Self-Host Guide — Production Deployment in 30 Minutes",
  description: "Complete guide to self-hosting ZeroPaye: VPS, PM2, HTTPS, backups, observer setup.",
  path: "/self-host-guide",
});

export default function SelfHostGuidePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageLayout breadcrumbs={[{ name: "Resources", href: "/" }, { name: "Self-Host Guide", href: "/self-host-guide" }]}>
        <PageHero
          badge="Self-Host Guide"
          title="30 minute mein production-ready"
          subtitle="VPS setup se le kar HTTPS + backups + observer tak — har step detailed commands ke saath."
        />

        <SectionHeading eyebrow="Prerequisites" title="Kya-kya chahiye?" />
        <Prose>
          <table>
            <thead><tr><th>Cheez</th><th>Cost</th><th>Kahan se</th></tr></thead>
            <tbody>
              <tr><td>VPS (1 vCPU, 1GB RAM)</td><td>₹200-500/month</td><td>DigitalOcean, AWS Lightsail, Hetzner, Railway</td></tr>
              <tr><td>Domain name</td><td>₹500-1000/year</td><td>GoDaddy, Namecheap, Cloudflare</td></tr>
              <tr><td>Node.js 20+ or Bun 1.0+</td><td>Free</td><td>nodejs.org</td></tr>
              <tr><td>UPI VPA (aapka bank)</td><td>Free</td><td>Aapke bank app (e.g. <code>yourname@okhdfcbank</code>)</td></tr>
              <tr><td>Android phone (observer)</td><td>₹5000 one-time</td><td>Any spare Android with bank SIM</td></tr>
            </tbody>
          </table>
        </Prose>

        <SectionHeading eyebrow="Step 1" title="Install ZeroPaye (5 min)" />
        <Prose>
          <pre><code>{`# SSH into your VPS
ssh root@your-server-ip

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Clone ZeroPaye
git clone https://github.com/DKUMARGUPTA/ZeroPaye.git
cd ZeroPaye

# Install dependencies
bun install

# Setup environment
cp .env.example .env
nano .env  # edit DATABASE_URL if needed

# Initialize database
bun run db:push

# Test run
bun run dev
# Visit http://your-server-ip:3000 to verify`}</code></pre>
        </Prose>

        <SectionHeading eyebrow="Step 2" title="PM2 — auto-restart + monitoring (5 min)" />
        <Prose>
          <pre><code>{`# Install PM2 globally
bun add -g pm2
# or: npm install -g pm2

# Start ZeroPaye in production mode
pm2 start "bun run start" --name zeropaye

# Save PM2 process list
pm2 save

# Enable auto-start on server boot
pm2 startup
# Run the command it prints

# Check status
pm2 status
pm2 logs zeropaye

# Restart after code update
git pull && bun install && pm2 restart zeropaye`}</code></pre>
        </Prose>

        <SectionHeading eyebrow="Step 3" title="HTTPS with Caddy (10 min)" />
        <Prose>
          <p>
            Caddy automatic Let's Encrypt certificates manage karta hai — zero config HTTPS.
          </p>
          <pre><code>{`# Install Caddy
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install caddy

# Edit Caddyfile
nano /etc/caddy/Caddyfile`}</code></pre>
          <p>Caddyfile content:</p>
          <pre><code>{`pay.yourdomain.com {
    reverse_proxy localhost:3000
    encode gzip
    header {
        Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
    }
}`}</code></pre>
          <pre><code>{`# Start Caddy
systemctl enable caddy
systemctl start caddy

# DNS: Point pay.yourdomain.com A record to your VPS IP
# Caddy will auto-provision TLS cert from Let's Encrypt`}</code></pre>
        </Prose>

        <SectionHeading eyebrow="Step 4" title="Daily DB backups (2 min)" />
        <Prose>
          <pre><code>{`# Test backup script
bun run backup
# Creates backups/zeropaye-2025-01-15T02-00-00.db

# Add to crontab for daily backup at 2am
crontab -e
# Add this line:
0 2 * * * cd /root/ZeroPaye && bun run backup >> /var/log/zeropaye-backup.log 2>&1

# Optional: upload to S3/GCS
# Add this after the backup script:
# aws s3 cp backups/zeropaye-*.db s3://your-bucket/zeropaye-backups/`}</code></pre>
        </Prose>

        <SectionHeading eyebrow="Step 5" title="Android Observer setup (10 min)" />
        <Prose>
          <ol>
            <li>
              Spare Android phone rakhein jisme aapka bank SIM ho (jisme bank SMS aate hain).
            </li>
            <li>
              ZeroPaye Observer APK download karein (GitHub releases page se).
            </li>
            <li>
              APK install karein (Settings → Security → Unknown sources enable karein).
            </li>
            <li>
              App kholein → "Pair Device" → QR scan karein (yeh QR merchant dashboard mein dikhega).
            </li>
            <li>
              App ko battery optimization se exclude karein (Settings → Battery → Don't optimize).
            </li>
            <li>
              Phone ko charging laga rakhein, 24/7 on rakhein.
            </li>
          </ol>
          <p>
            App background mein bank SMS + push notifications capture karega aur ZeroPaye API
            ko HMAC-signed payload bhej degi. Payment automatically verify hoga.
          </p>
        </Prose>

        <SectionHeading eyebrow="Step 6" title="Pehla test payment" />
        <Prose>
          <pre><code>{`# Create a ₹1 test session
curl -X POST https://pay.yourdomain.com/api/zeropaye/session \
  -H "content-type: application/json" \
  -d '{"orderId":"TEST-001","amount":1,"description":"Test payment"}'

# Response mein session.id milega
# Link: https://pay.yourdomain.com/checkout/SESSION_ID
# Open it, pay ₹1 via any UPI app

# Check dashboard:
# https://pay.yourdomain.com/dashboard
# Payment should show "SUCCESS" within 30 seconds

# Verify bank credit:
# Check your bank app — ₹1 should be credited`}</code></pre>
        </Prose>

        <SectionHeading eyebrow="Checklist" title="Production readiness" />
        <Prose>
          <h3>Security</h3>
          <ul>
            <li>☐ <code>adminApiKey</code> kisi ko nahi diya</li>
            <li>☐ <code>.env</code> file <code>.gitignore</code> mein hai</li>
            <li>☐ HTTPS enabled (Caddy + Let's Encrypt)</li>
            <li>☐ Server firewall on (sirf 80, 443, 22 ports open)</li>
            <li>☐ DB backups daily cron setup</li>
          </ul>
          <h3>Reliability</h3>
          <ul>
            <li>☐ PM2 auto-restart enabled</li>
            <li>☐ Android Observer phone 24/7 on + charging</li>
            <li>☐ Gmail Observer (backup) running</li>
            <li>☐ <code>/health</code> endpoint monitoring (UptimeRobot)</li>
          </ul>
          <h3>Business</h3>
          <ul>
            <li>☐ Test ₹1 payment successful</li>
            <li>☐ UPI VPA sahi hai</li>
            <li>☐ Customer support email/WhatsApp ready</li>
            <li>☐ Refund policy documented</li>
          </ul>
        </Prose>

        <SectionHeading eyebrow="Monitoring" title="Health check setup" />
        <Prose>
          <p>
            <a href="https://uptimerobot.com">UptimeRobot</a> (free) mein add karein:
          </p>
          <pre><code>{`Monitor type: HTTP(s)
URL: https://pay.yourdomain.com/api/zeropaye/health
Expected response: 200
Interval: 5 minutes
Alert email: your@email.com`}</code></pre>
          <p>
            Yeh har 5 minute mein check karega aur server down hua toh turant email karega.
          </p>
        </Prose>
      </PageLayout>
    </>
  );
}
