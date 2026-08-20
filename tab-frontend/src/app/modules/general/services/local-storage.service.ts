import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  saveData(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  getData(key: string): any {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  updateData(key: string, partialData: any) {
    const existingData = this.getData(key) || {};
    const updatedData = { ...existingData, ...partialData };
    this.saveData(key, updatedData);
  }

  clearData(key: string) {
    localStorage.removeItem(key);
  }
}
