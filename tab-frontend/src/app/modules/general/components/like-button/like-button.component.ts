import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject, take, takeUntil } from 'rxjs';
import { PositionsLikedService } from '../../../positions/services/positions-liked.service';

@Component({
  selector: 'app-like-button',
  templateUrl: './like-button.component.html',
  styleUrl: './like-button.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LikeButtonComponent implements OnInit, OnDestroy {
  @Input() 
  positionId!: string;

  @Output()
  likedChanged = new EventEmitter<{ positionId: string; isLiked: boolean; }>();

  protected _onDestroy = new Subject<void>();
  isLiked = false;
  likedPositionIds: string[] = [];

  constructor(private likePositionService: PositionsLikedService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadLikedPositions();
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }
  
  loadLikedPositions() {
    this.likePositionService.likedPositionsUpdated$
      .pipe(takeUntil(this._onDestroy))
      .subscribe((trigger) => {
        if(trigger) {
          this.likedPositionIds = this.likePositionService.likedPositions;
          this.isLiked = this.likedPositionIds.includes(this.positionId);
        }
        this.cdr.markForCheck();
    });
  }

  toggleLike(target: EventTarget | null) {
    if (this.isLiked) {
      this.likePositionService.unlikePosition(this.positionId).pipe(take(1)).subscribe(() => {
        this.isLiked = false;
        if (target instanceof HTMLButtonElement) {
          this.animateClick(target);
        }
        this.likePositionService.likedPositions = this.likePositionService.likedPositions.filter(pid => pid !== this.positionId);
        this.likePositionService.notifyLikedPositionUpdates();
        console.log('unlikePosition', this.isLiked, this.positionId);
        this.likedChanged.emit({
          positionId: this.positionId,
          isLiked: false
        });
        this.cdr.markForCheck();
      });
    } else {
      this.likePositionService.likePosition(this.positionId).pipe(take(1)).subscribe(() => {
        this.isLiked = true;
        if (target instanceof HTMLButtonElement) {
          this.animateClick(target);
        }
        this.likePositionService.likedPositions.push(this.positionId);
        this.likePositionService.notifyLikedPositionUpdates();
        console.log('likePosition', this.isLiked, this.positionId);
        this.likedChanged.emit({
          positionId: this.positionId,
          isLiked: true
        });
        this.cdr.markForCheck();
      });
    }
  }

  animateClick(button: HTMLButtonElement | null) {
    if(button) {
      button.classList.add('clicked');
      setTimeout(() => {
        button.classList.remove('clicked');
        this.cdr.markForCheck();
      }, 250);
    }
  }
}
