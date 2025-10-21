import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" *ngIf="show">
      <div class="flex flex-col items-center">
        <div class="loader mb-6"></div>
        <p class="text-lg font-semibold text-gray-800 bg-white px-6 py-3 rounded shadow">{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .loader {
      border: 8px solid #f3f3f3;
      border-top: 8px solid #3498db;
      border-radius: 50%;
      width: 64px;
      height: 64px;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }
    @keyframes spin {
      0% { transform: rotate(0deg);}
      100% { transform: rotate(360deg);}
    }
  `]
})
export class LoaderComponent implements OnChanges {
  @Input() show = false;
  @Input() message = 'Loading, please wait...';

  ngOnChanges(changes: SimpleChanges) {
    console.log('Loader show:', this.show, 'message:', this.message);
  }
} 