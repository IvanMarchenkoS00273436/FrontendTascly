import { Component, signal, HostListener, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './common-ui/header/header';
import { Footer } from './common-ui/footer/footer';
import { LoadingService } from './data/services/loading-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('FrontendTascly');
  loadingService = inject(LoadingService);

  mouseX = signal(0);
  mouseY = signal(0);

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.mouseX.set(event.clientX);
    this.mouseY.set(event.clientY);
  }
}
