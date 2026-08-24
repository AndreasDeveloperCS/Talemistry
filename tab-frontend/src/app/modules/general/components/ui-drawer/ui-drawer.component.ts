import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, Type, ViewChild, ViewContainerRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import { DrawerState } from '../../models/drawer-state.model';
import { UiInteractionService } from '../../services/ui-interaction.service';

type DrawerComponentResult<T = any> = {
  component: Type<T>;
  inputs: Record<string, any>;
};

@Component({
  selector: 'app-ui-drawer',
  templateUrl: './ui-drawer.component.html',
  styleUrl: './ui-drawer.component.scss',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiDrawerComponent implements AfterViewInit, OnDestroy {
  private drawerContentRef!: ViewContainerRef;
  private _destroy$ = new Subject<void>();
  private currentDrawer: DrawerState | null = null;
  private lastRenderedType: string | null = null;
  private lastRenderedId: string | null = null;

  @ViewChild('drawerContent', { read: ViewContainerRef })
  set drawerContent(vc: ViewContainerRef) {
    if (!vc) {
      return;
    }
    this.drawerContentRef = vc;
    this.tryRender(); 
  }

  drawerStack$: Observable<DrawerState[]>;
  currentDrawer$: Observable<DrawerState | null>;
  hasHistory$: Observable<boolean>;
  isOpen$: Observable<boolean>;

  constructor(
    public uiInteractionService: UiInteractionService,
    private cdr: ChangeDetectorRef
  ) {
    this.drawerStack$ = this.uiInteractionService.drawerStack$;
    this.currentDrawer$ = this.drawerStack$.pipe(
      map(stack => stack.length ? stack[stack.length - 1] : null)
    );
    this.hasHistory$ = this.drawerStack$.pipe(
      map(stack => stack.length > 1)
    );
    this.isOpen$ = this.currentDrawer$.pipe(
      map(d => !!d)
    );
  }

  ngAfterViewInit(): void {
    this.currentDrawer$
      .pipe(takeUntil(this._destroy$))
      .subscribe(drawer => {
        this.currentDrawer = drawer;
        this.tryRender();
      });
  }

  private async tryRender(): Promise<void> {
    if (!this.drawerContentRef) {
      return;
    }
    if (!this.currentDrawer) {
      this.lastRenderedType = null;
      this.lastRenderedId = null;
      this.drawerContentRef.clear();
      return;
    }

    const drawer = this.currentDrawer;
    if (this.lastRenderedType === drawer.type && this.lastRenderedId === drawer.id) {
      return;
    }

    this.lastRenderedType = drawer.type;
    this.lastRenderedId = drawer.id;
    this.drawerContentRef.clear();
    const result = await this.loadComponent(drawer);

    if (!result) {
      return;
    }

    const ref = this.drawerContentRef.createComponent<any>(result.component);
    Object.assign(ref.instance, result.inputs);
    this.cdr.markForCheck();
  }

  private async loadComponent(drawer: DrawerState): Promise<DrawerComponentResult | null> {
    switch (drawer.type) {
      case 'positions-list':
        return import('src/app/modules/ui-drawer-previews/components/positions-list-preview/positions-list-preview.component')
          .then(m => ({ component: m.PositionsListPreviewComponent, inputs: {} }));
      case 'position':
        return import('src/app/modules/ui-drawer-previews/components/position-preview/position-preview.component')
          .then(m => ({ component: m.PositionPreviewComponent, inputs: { positionId: drawer.id } }));
      case 'company':
        return import('src/app/modules/ui-drawer-previews/components/company-preview/company-preview.component')
          .then(m => ({ component: m.CompanyPreviewComponent, inputs: { companyId: drawer.id } }));
      case 'candidate':
        return import('src/app/modules/ui-drawer-previews/components/candidate-preview/candidate-preview.component')
          .then(m => ({ component: m.CandidatePreviewComponent, inputs: { talentId: drawer.id, candidateData: drawer.payload } }));
      case 'applicants':
        return import('src/app/modules/ui-drawer-previews/components/applicants-list-preview/applicants-list-preview.component')
          .then(m => ({ component: m.ApplicantsListPreviewComponent, inputs: { positionId: drawer.id, position: drawer.payload?.position } }));
      case 'meetings-list':
        return import('src/app/modules/ui-drawer-previews/components/meetings-list-preview/meetings-list-preview.component')
          .then(m => ({ component: m.MeetingsListPreviewComponent, inputs: {} }));
      case 'meeting':
        return import('src/app/modules/ui-drawer-previews/components/meeting-preview/meeting-preview.component')
          .then(m => ({ component: m.MeetingPreviewComponent, inputs: { meetingId: drawer.id } }));
      case 'chat':
        return import('src/app/modules/ui-drawer-previews/components/chat-preview/chat-preview.component')
          .then(m => ({ component: m.ChatPreviewComponent, inputs: { contactId: drawer.payload?.contactId, selectedPositionId: drawer.payload?.selectedPositionId } }));
      case 'single-pipeline':
        return import('src/app/modules/ui-drawer-previews/components/candidate-single-pipeline-preview/candidate-single-pipeline-preview.component')
          .then(m => ({ component: m.CandidateSinglePipelinePreviewComponent, inputs: { talentId: drawer.payload?.talentId, positionId: drawer.payload?.positionId } }));
      case 'multiple-pipeline':
        return import('src/app/modules/ui-drawer-previews/components/candidate-multiple-pipeline-preview/candidate-multiple-pipeline-preview.component')
          .then(m => ({ component: m.CandidateMultiplePipelinePreviewComponent, inputs: { talentId: drawer.payload?.talentId } }));
      case 'applicants-by-stage':
        return import('src/app/modules/ui-drawer-previews/components/applicants-by-stage-preview/applicants-by-stage-preview.component')
          .then(m => ({ component: m.ApplicantsByStagePreviewComponent, inputs: { positionId: drawer.payload?.positionId, stageType: drawer.payload?.stageType } }));
      case 'pipeline-health-preview':
        return import('src/app/modules/ui-drawer-previews/components/pipeline-health-preview/pipeline-health-preview.component')
          .then(m => ({ component: m.PipelineHealthPreviewComponent, inputs: {} }));
      case 'applied-positions':
        return import('src/app/modules/ui-drawer-previews/components/applied-positions-preview/applied-positions-preview.component')
          .then(m => ({ component: m.AppliedPositionsPreviewComponent, inputs: { initialStageType: drawer.payload?.initialStageType } }))
      case 'applied-position-details':
        return import('src/app/modules/ui-drawer-previews/components/applied-position-details/applied-position-details.component')
          .then(m => ({ component: m.AppliedPositionDetailsComponent, inputs: { application: drawer.payload?.application } }))
      default:
        return null;
    }
  }

  back(): void {
    this.uiInteractionService.backDrawer();
  }

  close(): void {
    this.uiInteractionService.closeDrawer();
  }

  ngOnDestroy(): void {
    this.uiInteractionService.closeDrawer();
    this._destroy$.next();
    this._destroy$.complete();
  }
}