import { Component, OnInit } from '@angular/core';
import { Navbar } from '../../Shared/navbar/navbar';
import { Footer } from '../../Shared/footer/footer';
import { NgForOf } from '@angular/common';
import { DatePipe } from '@angular/common';
import { User } from '../../Shared/user.model';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [Navbar, Footer, NgForOf, DatePipe],
  templateUrl: './manage-users.html',
  styleUrls: ['./manage-users.css']
})
export class ManageUsers implements OnInit {
  users: User[] = [];

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.users$.subscribe(users => {
      this.users = users;
    });
  }
}
