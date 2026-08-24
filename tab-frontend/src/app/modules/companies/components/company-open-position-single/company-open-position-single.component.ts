import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { ContentService } from '../../../general/services/content.service';
import { OpenPosition } from '../../../positions/models/position';
import { PositionData } from '../../../positions/models/position-data';

@Component({
  selector: 'app-company-open-position-single',
  templateUrl: './company-open-position-single.component.html',
  styleUrl: './company-open-position-single.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyOpenPositionSingleComponent {
  @Output()
  positionsListUpdated: EventEmitter<boolean> = new EventEmitter<boolean>();
  
  positionData!: PositionData;
  
  private _position: OpenPosition = new OpenPosition();

  @Input()
  public set position(value: OpenPosition) {
    this._position = value;
  }

  public get position(): OpenPosition {
    return this._position;
  }

  @Input()
  OpenPosition: OpenPosition = new OpenPosition();

  constructor(
    public content: ContentService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.positionData = new PositionData(this.position);
  }

  navigateToPosition() {
    this.router.navigate([environment.routes.positions, this.position._id]);
  }
}
