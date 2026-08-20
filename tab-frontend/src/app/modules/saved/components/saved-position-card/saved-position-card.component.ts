import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CompanyVersionService } from 'src/app/modules/companies/services/company-version.service';
import { PositionStatus } from 'src/app/modules/positions/models/position-details';
import { ContentService } from '../../../general/services/content.service';
import { OpenPosition, PositionItem } from '../../../positions/models/position';
import { PositionData } from '../../../positions/models/position-data';
import { PositionsService } from '../../../positions/services/positions.service';

@Component({
  selector: 'app-saved-position-card',
  templateUrl: './saved-position-card.component.html',
  styleUrl: './saved-position-card.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SavedPositionCardComponent implements OnInit {
  @Input() 
  statuses: string[] = [];

  @Input()
  public set position(value: OpenPosition) {
    this._position = value;
  }

  @Output()
  positionsListUpdated = new EventEmitter<{ positionId: string; isLiked: boolean; }>();

  summaryContent: string = '';
  positionData!: PositionData;
  statusOptions = Object.values(PositionStatus);
  private _position: OpenPosition = new OpenPosition();

  public get position(): OpenPosition {
    return this._position;
  }

  constructor(
    private positionService: PositionsService,
    private companyService: CompanyVersionService,
    public content: ContentService,
  ) {}

  ngOnInit(): void {
    this.positionData = new PositionData(this.position);
  }

  onNavigateToPosition() {
    if(this.position._id) {
      this.positionService.openPositionPage(this.position._id);
    }
  }

  hasValidSummary(): boolean {
    if (this.position.summary.sectionContent.length > 0) {
      this.summaryContent = this.position.summary.sectionContent;
      return true;
    }

    const summaryElement = this.position.positionElements.find((el: PositionItem) => el.sectionName === 'Summary');
    if (summaryElement && summaryElement.sectionContent.length > 0) {
      this.summaryContent = summaryElement.sectionContent;
      return true;
    }

    return false;
  }

  getSummaryContent(): string {
    return this.truncateContent(this.summaryContent);
  }

  truncateContent(content: string, limit: number = 0): string {
    if (!content) {
      return '';
    }

    let updated = content.replace(
      /<h2([^>]*)>(.*?)<\/h2>/g,
      '<h3 class="custom-h3"$1>$2</h3>'
    );

    updated = content.replace(
      /<h4([^>]*)>(.*?)<\/h4>/g,
      '<h3 class="custom-h3"$1>$2</h3>'
    );

    return updated;
  }

  getStatusClass(status: PositionStatus): string {
    switch (status) {
      case PositionStatus.ACTIVE:
        return 'badge-success';
      case PositionStatus.PAUSED:
        return 'badge-warning';
      case PositionStatus.CLOSED:
        return 'badge-muted';
      default:
        return '';
    }
  }

  onStatusSwitched(newStatus: PositionStatus) {
    console.log('onStatusSwitched', this.position, newStatus);
    if (this.position.status === newStatus) {
      return;
    }
    this.positionService.patchAsync(this.position._id, this.position, 'status', newStatus, true);
  }

  onNavigateToCompanyPage(companyId: string) {
    if (companyId) {
      this.companyService.openCompanyPage(companyId);
    }
  }
}