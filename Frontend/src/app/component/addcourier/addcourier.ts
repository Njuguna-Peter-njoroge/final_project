import { Component } from '@angular/core';
import {Navbar} from '../Shared/navbar/navbar';
import {Footer} from '../Shared/footer/footer';

@Component({
  selector: 'app-addcourier',
  imports: [
    Navbar,
    Footer
  ],
  templateUrl: './addcourier.html',
  styleUrl: './addcourier.css'
})
export class Addcourier {

}
