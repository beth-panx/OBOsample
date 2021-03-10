import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG, MsalGuardConfiguration, MsalModule } from '@azure/msal-angular';
import { EventMessage, EventType, InteractionType, PopupRequest, RedirectRequest } from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Providers, SimpleProvider, ProviderState, TemplateHelper } from '@microsoft/mgt/dist/es6/index.js';
import * as auth from './auth-config.json';
import { MSALInstanceFactory } from './app.module';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Microsoft identity platform';
  isIframe = false;
  loggedIn = false;
  private readonly _destroying$ = new Subject<void>();
  accessToken = '';

  constructor(
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService
  ) {
    console.log('constructor msalGuardConfig',this.msalGuardConfig);
    Providers.globalProvider = new SimpleProvider(this.getAccessToken);
    console.log('global provider: ', Providers.globalProvider);

    TemplateHelper.setBindingSyntax('[[', ']]');
  }

  ngOnInit(): void {
    this.isIframe = window !== window.parent && !window.opener;

    this.checkAccount();
    console.log('ngOnInit',this.msalGuardConfig);

    this.authService.handleRedirectObservable().subscribe({
      next: (result) => {
        this.accessToken = result.accessToken;
        Providers.globalProvider.setState(ProviderState.SignedIn);
      },
      error: (error) => console.log(error)
    });

    /**
     * You can subscribe to MSAL events as shown below. For more info,
     * visit: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/events.md
     */
    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS || msg.eventType === EventType.ACQUIRE_TOKEN_SUCCESS),
        takeUntil(this._destroying$)
      )
      .subscribe((result) => {
        this.checkAccount();
      });

      console.log('ngOnInit end',this.msalGuardConfig);
  }

  async getAccessToken(scopes: any): Promise<any> {
    const msalObj = MSALInstanceFactory();
    var request = { scopes: scopes };
    console.log('getAccessToken', this.msalGuardConfig);
    try {
      let response = await msalObj.acquireTokenSilent(request);
      console.log('0', response.accessToken);
      return response.accessToken;
    } catch (error) {
      // handle error
      console.log('0', error);
    }

  }

  checkAccount() {
    this.loggedIn = this.authService.instance.getAllAccounts().length > 0;
  }

  login() {
    console.log('trying to login');
    console.log('msalGuardConfig', this.msalGuardConfig);

    if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
      if (this.msalGuardConfig.authRequest){
        this.authService.loginPopup({...this.msalGuardConfig.authRequest} as PopupRequest)
          .subscribe(() => this.checkAccount());
        } else {
          this.authService.loginPopup()
            .subscribe(() => this.checkAccount());
      }
    } else {
      if (this.msalGuardConfig.authRequest){
        this.authService.loginRedirect({...this.msalGuardConfig.authRequest} as RedirectRequest);
      } else {
        this.authService.loginRedirect();
      }
    }
    Providers.globalProvider.setState(ProviderState.SignedIn)
    console.log('SignedIn:', Providers.globalProvider.state === ProviderState.SignedIn);
  }

  logout() {
    this.authService.logout();
    Providers.globalProvider.setState(ProviderState.SignedOut)
  }

  // unsubscribe to events when component is destroyed
  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}
