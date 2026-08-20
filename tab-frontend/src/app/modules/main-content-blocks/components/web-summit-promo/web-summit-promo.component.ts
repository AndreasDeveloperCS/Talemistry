import { Component } from '@angular/core';
import { ChangeDetectionStrategy, signal } from '@angular/core';
import { environment } from '../../../../../environments/environment';
@Component({
  selector: 'app-web-summit-promo',
  standalone: true,
  templateUrl: './web-summit-promo.component.html',
  styleUrl: './web-summit-promo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WebSummitPromoComponent {
  lang: 'en' = 'en';
  private targetMs = new Date('2025-11-10T09:00:00Z').getTime();
  shedulemeetingLink = `${environment.sourceUrl}/schedule/demo?returnUrl=%2Fmain`;
  calendarLinkTemplate = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Meet%20Evryka%20at%20Web%20Summit%202025&dates=20251110T090000Z/20251113T180000Z&location=MEO%20Arena%2C%20Lisbon&details=We%E2%80%99re%20participating%20in%20Web%20Summit%202025.%20Let's%20have%20a%20meeting%20with%20.&add=andreaspetrov%40evryka.com&add=evrykadis%40gmail.com`;
  // Official Web Summit appearance page for Evryka (opens in new tab from the logo card)
  appearanceUrl = 'https://websummit.com/appearances/lis25/5463aff8-e0bc-4923-8d04-55880123603f/?code=EVRYKA&utm_source=zapier&utm_campaign=social-cards&utm_medium=email'; // Opening morning in Lisbon


  remaining = signal(this.formatRemaining());
  private timer = setInterval(() => this.remaining.set(this.formatRemaining()), 1000);


  ngOnDestroy() { clearInterval(this.timer); }


  t(key: keyof typeof this.dict['en']) { return this.dict.en[key]; }


  private formatRemaining() {
    const now = Date.now();
    const diff = this.targetMs - now;
    if (diff <= 0) return 'Live now!';
    const d = Math.floor(diff / 86_400_000);
    const h = Math.floor((diff % 86_400_000) / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    return `${d}d ${h}h ${m}m ${s}s`;
  }


  private dict = {
    en: {
      badge: `Web Summit 2025`,
      heading: "Let's meet at Web Summit 2025 in Lisbon!",
      sub: "Connecting global talent, partners, and investors.",
      dates: 'Nov 10–13, 2025 · MEO Arena, Lisbon',
      ctaMeet: 'Book a meeting',
      ctaJoin: 'Join us in Lisbon',
      ctaTickets: 'Get tickets',
      // countdown: 'Countdown',
      legal: 'Web Summit ® is a trademark of the Web Summit Group. Used here for identification only.',
      officialListing: 'Official Web Summit listing',
      logoAlt: 'Web Summit wordmark — visit our official listing'
    }
  } as const;
}