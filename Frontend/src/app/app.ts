import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationStart } from '@angular/router';
import { LoaderComponent } from './component/Shared/loader/loader';
import { LoaderService } from './services/loader.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'Frontend';
  loading = false;
  loadingMessage = 'Loading, please wait...';

  constructor(private router: Router, private loaderService: LoaderService) {
    this.loaderService.loading$.subscribe(({show, message}) => {
      this.loading = show;
      this.loadingMessage = message;
    });

    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.loaderService.show();
        setTimeout(() => {
          this.loaderService.hide();
        }, 3000);
      }
    });
  }
}
