import { Injectable } from "@angular/core";
import { BehaviorSubject, map } from "rxjs";
import { DrawerState } from "../models/drawer-state.model";

@Injectable({
  providedIn: 'root'
})
export class UiInteractionService {
  private drawerStackSubject = new BehaviorSubject<DrawerState[]>([]);
  drawerStack$ = this.drawerStackSubject.asObservable();
  currentDrawer$ = this.drawerStack$.pipe(
    map(stack => stack[stack.length - 1] || null)
  );

  openDrawer(drawer: DrawerState): void {
    const current = this.drawerStackSubject.value;
    this.drawerStackSubject.next([...current, drawer]);
  }

  backDrawer(): void {
    const current = this.drawerStackSubject.value;
    current.pop();
    this.drawerStackSubject.next([...current]);
  }

  closeDrawer(): void {
    this.drawerStackSubject.next([]);
  }
}