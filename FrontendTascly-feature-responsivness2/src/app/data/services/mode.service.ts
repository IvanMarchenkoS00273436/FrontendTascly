 import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ModeService {
    private businessMode = signal<boolean>(false);

    isBusinessMode(): boolean {
        return this.businessMode();
    }

    setBusinessMode(value: boolean): void {
        this.businessMode.set(value);
    }

    toggleMode(): void {
        this.businessMode.set(!this.businessMode());
    }
}
