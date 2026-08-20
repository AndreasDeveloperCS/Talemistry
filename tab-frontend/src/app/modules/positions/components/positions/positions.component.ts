import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs';
import { PdfFullViewComponent } from '../../../general/components/pdf-full-view/pdf-full-view.component';
import { ContentService } from '../../../general/services/content.service';

@Component({
    selector: 'app-positions',
    templateUrl: './positions.component.html',
    styleUrl: './positions.component.scss',
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionsComponent {

  public pdf1: string = 'assets/cv/[RN-039925] Developer - Backend - Senior-C-Sharp.pdf';
  public pdf2: string = 'assets/cv/Developer - Backend API - .NET.pdf';
  public pdf3: string = 'assets/cv/Developer - Backend API - PHP.pdf';
  public pdf4: string = 'assets/cv/Developer - Frontend - React.pdf';
  public pdf5: string = 'assets/cv/DevOps - Cloud Engineer.pdf';
  public pdfs: string[] = [] ;

  constructor(public dialog: MatDialog, 
    public content: ContentService,
    private cdr: ChangeDetectorRef,
  ) {
    this.pdfs  =  [this.pdf1, this.pdf2, this.pdf3, this.pdf4, this.pdf5];
  }

  onPdfComplete($event: any) {
  //   //console.log('onPdfComplete', $event);
  }
  onPdfError($event:any) {
  //   //console.log('onPdfError',$event);
  }

  onFullView(pdfPath:string) {
    const dialogRef = this.dialog.open(PdfFullViewComponent, {
      width: '95%',
      height: "95%",
      data: pdfPath
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe(result => {
      this.cdr.markForCheck();
    //   //console.log(`Dialog ${PdfFullViewComponent} closed`);
    })
 }
}
