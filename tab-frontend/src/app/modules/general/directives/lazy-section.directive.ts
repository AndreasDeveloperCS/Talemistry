import { AfterViewInit, Directive, ElementRef, EventEmitter, OnDestroy, Output } from "@angular/core";

@Directive({
  selector: '[appLazySection]',
  standalone: false
})
export class LazySectionDirective implements AfterViewInit, OnDestroy {

  @Output() visible = new EventEmitter<void>();

  private observer!: IntersectionObserver;

  static pauseLazyLoading = false;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    const el = this.el.nativeElement;

    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {

          if (entry.isIntersecting && !LazySectionDirective.pauseLazyLoading) {
            this.visible.emit();
            this.observer.unobserve(entry.target);
          }

        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -25% 0px'
      }
    );

    this.observer.observe(el);

    // manual trigger support
    el.addEventListener('lazy-trigger', () => {
      if (!LazySectionDirective.pauseLazyLoading) {
        this.visible.emit();
        this.observer.unobserve(el);
      }
    });
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}