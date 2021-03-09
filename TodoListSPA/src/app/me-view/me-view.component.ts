import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { Service } from '../service';

@Component({
  selector: 'app-me-view',
  templateUrl: './me-view.component.html',
  styleUrls: ['./me-view.component.css']
})
export class MeViewComponent implements OnInit {
  me?: any;

  constructor(private service: Service) { }

  ngOnInit(): void {
    this.getMe();
  }

  getMe(): void {
    this.service.getMe().subscribe((me) => {
      this.me = JSON.stringify(me);
    })
  }
}
