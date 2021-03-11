import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as auth from './auth-config.json';

@Injectable({
  providedIn: 'root'
})
export class Service {
  url = auth.resources.backend.resourceUri;

  constructor(private http: HttpClient) { }

  getMe() {
    return this.http.get(this.url);
  }
}
