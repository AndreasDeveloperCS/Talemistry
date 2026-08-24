import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subject, take, takeUntil } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ContentService } from '../../../general/services/content.service';
import { TemplateColor } from '../../models/cv-template-color.enum';
import { TemplateType } from '../../models/cv-template-type.enum';
import { CvService } from '../../services/cv-pdf.service';
import { CvPreviewService } from '../../services/cv-preview-state.service';

interface Template {
  type: TemplateType;
  route: string;
  name: string;
  description: string;
  imageUrl: string;
  previewBase: string;
}

@Component({
  selector: 'app-cv-templates',
  templateUrl: './cv-templates.component.html',
  styleUrl: './cv-templates.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class CvTemplatesComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('previewWrapper') previewWrapper!: ElementRef;
  @ViewChild('previewScale') previewScale!: ElementRef;
  @ViewChild('previewTheme') previewTheme!: ElementRef<HTMLElement>;

  baseWidth: number = 1200;
  smallScreenWidth: number = 900;
  isMobilePreview: boolean = window.innerWidth < this.smallScreenWidth;

  selectedTemplate!: TemplateType;
  userId: any = sessionStorage.getItem(`${environment.storage.userId}`);
  currentRoute: string = '';
  protected _onDestroy = new Subject<void>();
  isLoadingCV: boolean = false;
  imagePathBase: string = '/assets/cv-templates';

  TemplateColor = TemplateColor;
  selectedColor: TemplateColor = TemplateColor.Teal;
  mode: 'sample' | 'user' = 'sample';

  templates: Template[] = [
    {
      type: TemplateType.MinimalistSingleColumn,
      route: environment.routes.talentTab.cvTempletes.minimalistSingleTemplate,
      name: "Horizon",
      description: "Sleek. Minimalist. Elegant.",
      imageUrl: `${this.imagePathBase}/minimalist-single-template-preview-teal.png`,
      previewBase: 'minimalist-single-template-preview'
    },
    {
      type: TemplateType.ModernTwoColumn,
      route: environment.routes.talentTab.cvTempletes.modernTwoColumnTemplate,
      name: "Metropolitan",
      description: "Cosmopolitan. Modern. Energetic.",
      imageUrl: `${this.imagePathBase}/modern-two-column-template-preview-teal.png`,
      previewBase: 'modern-two-column-template-preview'
    },
    {
      type: TemplateType.CreativeBlocks,
      route: environment.routes.talentTab.cvTempletes.creativeBlocksTemplate,
      name: "Mosaic",
      description: "Creative. Playful. Structured.",
      imageUrl: `${this.imagePathBase}/creative-blocks-template-preview-teal.png`,
      previewBase: 'creative-blocks-template-preview'
    },
    {
      type: TemplateType.TimelineProfessional,
      route: environment.routes.talentTab.cvTempletes.timelineProfessionalTemplate,
      name: "Momentum",
      description: "Professional. Timeline-oriented. Precise.",
      imageUrl: `${this.imagePathBase}/timeline-professional-template-preview-teal.png`,
      previewBase: 'timeline-professional-template-preview'
    },
    {
      type: TemplateType.ExecutiveInfographic,
      route: environment.routes.talentTab.cvTempletes.executiveInfographicTemplate,
      name: "Summit",
      description: "Ambitious. High-level. Impactful.",
      imageUrl: `${this.imagePathBase}/executive-infographic-template-preview-teal.png`,
      previewBase: 'executive-infographic-template-preview'
    },
    {
      type: TemplateType.MagazineEditorial,
      route: environment.routes.talentTab.cvTempletes.magazineEditorialTemplate,
      name: "Vogue",
      description: "Stylish. Trendy. High-end.",
      imageUrl: `${this.imagePathBase}/magazine-editorial-template-preview-teal.png`,
      previewBase: 'magazine-editorial-template-preview'
    },
    {
      type: TemplateType.HexagonTech,
      route: environment.routes.talentTab.cvTempletes.hexagonTechTemplate,
      name: "Quantum",
      description: "Futuristic. Techy. Geometric.",
      imageUrl: `${this.imagePathBase}/hexagon-tech-template-preview-teal.png`,
      previewBase: 'hexagon-tech-template-preview'
    },
    {
      type: TemplateType.SplitAccent,
      route: environment.routes.talentTab.cvTempletes.splitAccentTemplate,
      name: "Vibrance",
      description: "Dynamic. Colorful. Eye-catching.",
      imageUrl: `${this.imagePathBase}/split-accent-template-preview-teal.png`,
      previewBase: 'split-accent-template-preview'
    },
  ];

  colorOptions = [
    {
      value: TemplateColor.Teal,
      label: 'Teal',
      tones: ['#037F8C', '#008C94', '#04D9D9']
    },
    {
      value: TemplateColor.Orange,
      label: 'Orange',
      tones: ['#eb4d0fff', '#f97316', '#fb923c']
    },
    {
      value: TemplateColor.DarkBlue,
      label: 'Dark Blue',
      tones: ['#1e40af', '#1e3a8a', '#3b82f6'],
    }
  ];

  get currentTemplate(): Template | undefined {
    return this.templates.find(t => t.type === this.selectedTemplate);
  }

  constructor(private cvService: CvService,
    private router: Router,
    private previewService: CvPreviewService,
    public content: ContentService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.currentRoute = this.router.url;
    this.isMobilePreview = window.innerWidth < this.smallScreenWidth;
    if (!this.isMobilePreview) {
      this.updateScale();
    }
    this.selectedTemplate =
      this.getTemplateFromUrl(this.currentRoute) ??
      TemplateType.MinimalistSingleColumn;
    //this.applyColorTheme(this.selectedColor);
    this.cdr.markForCheck();
    console.log('currentRoute', this.currentRoute);
    this.router.events
      .pipe(takeUntil(this._onDestroy))
      .subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.currentRoute = event.urlAfterRedirects;
          this.selectedTemplate = this.getTemplateFromUrl(this.currentRoute) ?? TemplateType.MinimalistSingleColumn;
          //this.applyColorTheme(this.selectedColor);
          this.cdr.markForCheck();
        }
        this.cdr.markForCheck();
      });
  }

  ngAfterViewInit() {
    this.applyColorTheme(this.selectedColor);
    if (!this.isMobilePreview) {
      setTimeout(() => this.updateScale(), 0);
    }

    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntil(this._onDestroy)
      )
      .subscribe(() => {
        setTimeout(() => {
          if (!this.isMobilePreview) {
            this.updateScale();
          }
        }, 50);
      });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  setMode(mode: 'sample' | 'user') {
    this.mode = mode;
    this.previewService.setMode(mode);
    this.updateScale();
    this.cdr.markForCheck();
  }

  private getTemplateFromUrl(url: string): TemplateType | null {
    const segments = url.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    console.log('Last segment', last);

    return Object.values(TemplateType).includes(last as TemplateType)
      ? (last as TemplateType)
      : null;
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobilePreview = window.innerWidth < this.smallScreenWidth;
    if(this.isMobilePreview) {
      this.setMode('sample');
    }
    this.cdr.markForCheck();

    if (!this.isMobilePreview) {
      setTimeout(() => {
        this.updateScale();
        this.applyColorTheme(this.selectedColor);
        this.cdr.markForCheck();
      }, 0);
    }
  }

  updateScale() {
    console.log('Update scale');
    if (this.isMobilePreview) {
      return;
    }

    if (!this.previewWrapper || !this.previewScale) {
      return;
    }
    const containerWidth = this.previewWrapper.nativeElement.offsetWidth;
    const minScale = 0.86;
    const maxScale = 1;
    const scaleFactor = 0.94;

    let scale = (containerWidth / this.baseWidth) * scaleFactor;
    scale = Math.min(maxScale, Math.max(minScale, scale));
    const el = this.previewScale.nativeElement;
    el.style.transform = `scale(${scale})`;
    const contentHeight = el.scrollHeight;
    const scaledHeight = contentHeight * scale;
    this.previewWrapper.nativeElement.style.height = `${scaledHeight}px`;
  }

  selectColor(color: TemplateColor | string): void {
    this.selectedColor = color as TemplateColor;
    this.applyColorTheme(this.selectedColor);
    this.cdr.markForCheck();
  }

  downloadCvPdf() {
    if (!this.userId) {
      console.warn('Cannot download CV PDF: user not signed in');
      return;
    }
    this.isLoadingCV = true;
    this.cvService.downloadCvPdf(this.userId, this.selectedTemplate, this.selectedColor)
      .pipe(take(1)).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `cv-${this.userId}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
          this.isLoadingCV = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading data', err);
          this.isLoadingCV = false;
          this.cdr.markForCheck();
        },
      });
  }

  isActive(templateRoute: string): boolean {
    return this.templates.find(t => t.route === templateRoute)?.type === this.selectedTemplate;
  }

  changeTemplate(template: TemplateType | string) {
    if (!template) {
      return;
    }

    this.selectedTemplate = template as TemplateType;

    const found = this.templates.find(t => t.type === template);
    if (found) {
      this.currentRoute = found.route;
      this.router.navigate([environment.routes.talent, environment.routes.talentTab.cvTempletes.cvTempletes, found.route]);
    }

    this.updateScale();

    this.cdr.markForCheck();
  }

  applyColorTheme(color: TemplateColor) {
    const themes = {
      [TemplateColor.Teal]: {
        dark: '#037F8C',
        mid: '#008C94',
        light: '#04D9D9'
      },
      [TemplateColor.Orange]: {
        dark: '#eb4d0fff',
        mid: '#f97316',
        light: '#fb923c'
      },
      [TemplateColor.DarkBlue]: {
        dark: '#1e40af',
        mid: '#1e3a8a',
        light: '#3b82f6'
      }
    };

    const theme = themes[color];
    const container = this.previewTheme?.nativeElement;

    if (container) {
      container.style.setProperty('--cv-primary-dark', theme.dark);
      container.style.setProperty('--cv-primary-mid', theme.mid);
      container.style.setProperty('--cv-primary-light', theme.light);
    }
    this.cdr.markForCheck();
  }

  getPreviewImage(): string | null {
    if (!this.selectedTemplate) {
      return null;
    }

    const base = this.currentTemplate?.previewBase;
    const color = this.selectedColor;

    return `${this.imagePathBase}/${base}-${color}.png`;
  }
}
