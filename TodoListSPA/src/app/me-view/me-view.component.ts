import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { TodoService } from '../todo.service';

@Component({
  selector: 'app-me-view',
  templateUrl: './me-view.component.html',
  styleUrls: ['./me-view.component.css']
})
export class MeViewComponent implements OnInit {
  me?: any;

  constructor(private service: TodoService) { }

  ngOnInit(): void {
    this.getMe();
  }

  getMe(): void {
    this.service.getMe().subscribe((me) => {
      this.me = me;
    })
  }
}
