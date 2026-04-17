import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  readonly nickname = signal<string | null>(null);

  setNickname(name: string) {
    this.nickname.set(name.trim());
  }

  clearNickname() {
    this.nickname.set(null);
  }
}
