import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Observable, catchError, forkJoin, map, of, throwError, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../modules/authentication/services/auth.service';
import { ContentService } from '../../modules/general/services/content.service';
import { MainContentBlocksModule } from '../../modules/main-content-blocks/main-content-blocks.module';
import { ContactUsComponent } from '../../modules/main-content-blocks/components/contact-us/contact-us.component';
import { VideoPlayerComponent } from '../../modules/main-content-blocks/components/video-player/video-player.component';
import { ComputerLogoComponent } from '../../modules/main-content-blocks/components/computer-logo/computer-logo.component';

interface BuildInfo {
  service: string;
  version: string;
  commit: string;
  builtAt: string;
}

@Component({
  selector: 'app-main-page',
  imports: [MatIconModule, CommonModule, MainContentBlocksModule, ContactUsComponent,
    ComputerLogoComponent,
    VideoPlayerComponent,],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainPageComponent {
  public videoSrc = `${environment.apiUrl}presentation-content/video-promo-background`;
  private readonly buildInfoRequestSuffix = `v=${Date.now()}`;
  public frontendBuild: BuildInfo = {
    service: 'tap-frontend',
    version: 'tap-frontend-local-dev',
    commit: 'local',
    builtAt: 'dev',
  };
  public backendBuild: BuildInfo = {
    service: 'backend',
    version: 'backend-unavailable',
    commit: 'unknown',
    builtAt: 'unknown',
  };
  public get isLoggedIn(): boolean {
    return this.mainAuthService.isAuthenticated() || sessionStorage.getItem(`${environment.storage.userId}`) !== null;
  }

  features = [
    {
      icon: 'connect_without_contact',
      title: 'Smart Matching',
      description:
        'AI-powered algorithms match candidates with perfect job opportunities based on skills, experience, and preferences.'
    },
    {
      icon: 'business',
      title: 'Company Management',
      description:
        'Tools for recruiters to manage companies, post positions, and track hiring pipelines.'
    },
    {
      icon: 'sync_alt',
      title: 'Pipeline Tracking',
      description:
        'Analytics and tracking tools to monitor recruitment progress and optimize processes.'
    },
    {
      icon: 'feed',
      title: 'CV Generation',
      description:
        'CV generation with AI optimization and PDF export capabilities for applications.'
    },
    {
      icon: 'trending_up',
      title: 'Career Development',
      description:
        'Career path recommendations with links to courses and certification programs.'
    },
    {
      icon: 'smart_toy',
      title: 'AI Feedback',
      description:
        'Actionable feedback for both candidates and recruiters powered by AI.'
    }
  ];

  public valueItems: { icon: string, title: string, text: string, img: string, width: string }[] = [
    {
      icon: 'trending_up',
      title: 'Growth',
      text: "Driving mutual growth for companies and candidates by creating unique competitive advantages through smart talent matching and career development tools.",
      img: 'assets/main-page/values/values_7.svg',
      width: '56%'
    },
    {
      icon: 'loop',
      title: 'Kaizen',
      text: "Continuously improving recruitment processes and candidate experiences through feedback, analytics, and evolving AI-driven solutions.",
      img: 'assets/main-page/values/values_7.svg',
      width: '63%'
    },
    {
      icon: 'speed',
      title: 'Efficiency',
      text: 'Optimizing hiring pipelines and application processes to reduce time-to-hire, lower costs, and deliver real value to all parties.',
      img: 'assets/main-page/values/values_1.svg',
      width: '70%'
    },
    {
      icon: 'handshake',
      title: 'Commitment',
      text: "Building long-term partnerships with both employers and job seekers to ensure sustained career success and organizational excellence.",
      img: 'assets/main-page/values/values_7.svg',
      width: '77%'
    },
    {
      icon: 'visibility',
      title: 'Transparency',
      text: "Ensuring open, clear communication and fair processes for recruiters and candidates throughout every stage of the hiring journey.",
      img: 'assets/main-page/values/values_7.svg',
      width: '84%'
    },
    {
      icon: 'transform',
      title: 'Flexibility',
      text: "Adapting to the unique goals and challenges of each employer and candidate to deliver tailored recruitment and career solutions.",
      img: 'assets/main-page/values/values_7.svg',
      width: '93%'
    },
    {
      icon: 'lightbulb',
      title: 'Innovation',
      text: "Leveraging AI, automation, and creative strategies to make hiring smarter, career planning easier, and results more impactful for everyone.",
      img: 'assets/main-page/values/values_7.svg',
      width: '100%'
    }
  ];

  public pillars = [
    {
      title: 'Goal',
      icon: 'track_changes',
      text: [
        'Creating meaningful connections between companies and candidates, ensuring that every match benefits both sides.',
        'Driving success through well-aligned skills, values, and ambitions that support sustainable growth for individuals and organizations.'
      ]
    },
    {
      title: 'Mission',
      icon: 'rocket_launch',
      text: [
        'We accelerate decent work and inclusive growth by connecting people to fair opportunities through an open, AI-powered talent infrastructure, and by forging cross-sector partnerships that make hiring transparent, skills-based, and resilient.',
        'Delivering a seamless hiring and career development experience through innovation, efficiency, and continuous improvement.'
      ]
    },
    {
      title: 'Vision',
      icon: 'visibility',
      text: [
        'Becoming the most trusted global space where talent and opportunity meet in harmony.',
        'Shaping the future of recruitment by fostering a world in which every career path and hiring decision is guided by fairness, precision, and mutual benefit.'
      ]
    }
  ];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private mainAuthService: AuthService,
    public content: ContentService
  ) {
    forkJoin({
      frontend: this.loadBuildInfo('assets/build-info.json', this.frontendBuild),
      backend: this.loadBuildInfoWithFallback(this.getBackendBuildInfoUrls(), this.backendBuild),
    }).subscribe(({ frontend, backend }) => {
      this.frontendBuild = frontend;
      this.backendBuild = backend;
      this.cdr.markForCheck();
    });
  }

  onRegistration() {
    this.router.navigate([`${environment.serverPaths.register}`]);
  }

  getBuildCaption(build: BuildInfo): string {
    return `${build.version} | ${build.commit} | ${build.builtAt}`;
  }

  getBuildMeta(build: BuildInfo): string[] {
    return [build.service, build.commit, this.formatBuildTimestamp(build.builtAt)].filter(Boolean);
  }

  private loadBuildInfo(url: string, fallback: BuildInfo): Observable<BuildInfo> {
    return this.requestBuildInfo(this.appendCacheBuster(url)).pipe(
      catchError(() => of(fallback))
    );
  }

  private loadBuildInfoWithFallback(urls: string[], fallback: BuildInfo): Observable<BuildInfo> {
    const [currentUrl, ...remainingUrls] = urls;

    if (!currentUrl) {
      return of(fallback);
    }

    return this.requestBuildInfo(this.appendCacheBuster(currentUrl)).pipe(
      catchError(() => this.loadBuildInfoWithFallback(remainingUrls, fallback))
    );
  }

  private getBackendBuildInfoUrls(): string[] {
    const currentOrigin = globalThis.location?.origin?.replace(/\/+$/, '') ?? '';
    const currentHostname = globalThis.location?.hostname?.toLowerCase() ?? '';
    const normalizedApiUrl = environment.apiUrl.replace(/\/+$/, '');
    const configuredApiOrigin = normalizedApiUrl.replace(/\/api$/, '');
    const sameOriginUrl = currentOrigin ? `${currentOrigin}/api/health-check/version` : '';
    const directApiUrls = [
      `${normalizedApiUrl}/health-check/version`,
      configuredApiOrigin ? `${configuredApiOrigin}/api/health-check/version` : '',
    ];

    if (this.isLocalHost(currentHostname)) {
      return this.dedupeBuildInfoUrls([
        ...directApiUrls,
        'https://api.evryka.org/api/health-check/version',
        'https://evryka.org/api/health-check/version',
      ]);
    }

    if (this.isTrustedEvrykaHost(currentHostname)) {
      return this.dedupeBuildInfoUrls([sameOriginUrl]);
    }

    return this.dedupeBuildInfoUrls([
      sameOriginUrl,
      ...directApiUrls,
      'https://api.evryka.org/api/health-check/version',
      'https://evryka.org/api/health-check/version',
    ]);
  }

  private dedupeBuildInfoUrls(urls: string[]): string[] {
    return [...new Set(urls.filter(Boolean))];
  }

  private isLocalHost(hostname: string): boolean {
    return ['localhost', '127.0.0.1'].includes(hostname);
  }

  private isTrustedEvrykaHost(hostname: string): boolean {
    return /(^|\.)evryka\.org$/i.test(hostname);
  }

  private requestBuildInfo(url: string): Observable<BuildInfo> {
    return this.http.get<Partial<BuildInfo>>(url).pipe(
      timeout(2500),
      map((buildInfo) => {
        if (this.isBuildInfo(buildInfo)) {
          return buildInfo;
        }

        throw new Error(`Invalid build info payload from ${url}`);
      }),
      catchError((error) => throwError(() => error))
    );
  }

  private isBuildInfo(value: Partial<BuildInfo> | null | undefined): value is BuildInfo {
    return !!value
      && typeof value.service === 'string'
      && typeof value.version === 'string'
      && typeof value.commit === 'string'
      && typeof value.builtAt === 'string';
  }

  private formatBuildTimestamp(value: string): string {
    if (!value || value === 'unknown' || value === 'dev') {
      return value || 'unknown';
    }

    const parsedValue = Date.parse(value);

    if (Number.isNaN(parsedValue)) {
      return value;
    }

    return new Date(parsedValue).toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private appendCacheBuster(url: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${this.buildInfoRequestSuffix}`;
  }
}