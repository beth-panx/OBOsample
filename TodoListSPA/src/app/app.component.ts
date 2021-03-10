import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import {
  MsalService,
  MsalBroadcastService,
  MSAL_GUARD_CONFIG,
  MsalGuardConfiguration,
  MsalModule,
} from '@azure/msal-angular';
import {
  AccountInfo,
  AuthenticationResult,
  EventMessage,
  EventType,
  InteractionRequiredAuthError,
  InteractionType,
  PopupRequest,
  RedirectRequest,
} from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import {
  Providers,
  SimpleProvider,
  ProviderState,
  TemplateHelper,
} from '@microsoft/mgt/dist/es6/index.js';
import * as auth from './auth-config.json';
import { MSALInstanceFactory } from './app.module';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Microsoft identity platform';
  isIframe = false;
  loggedIn = false;
  private readonly _destroying$ = new Subject<void>();
  accessToken = '';
  account: any = {};
  _msalGuardConfig = {};

  constructor(
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService
  ) {
    console.log('constructor msalGuardConfig', this.msalGuardConfig);
    console.log('global provider: ', Providers.globalProvider);

    TemplateHelper.setBindingSyntax('[[', ']]');
  }

  ngOnInit(): void {
    this.isIframe = window !== window.parent && !window.opener;
    this._msalGuardConfig = this.msalGuardConfig;
    this.checkAccount();
    console.log('ngOnInit', this.msalGuardConfig);

    this.authService.handleRedirectObservable().subscribe({
      next: (result) => {
        Providers.globalProvider.setState(ProviderState.SignedIn);
      },
      error: (error) => console.log(error),
    });

    /**
     * You can subscribe to MSAL events as shown below. For more info,
     * visit: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/events.md
     */
    this.msalBroadcastService.msalSubject$
      .pipe(
        filter(
          (msg: EventMessage) =>
            msg.eventType === EventType.LOGIN_SUCCESS ||
            msg.eventType === EventType.ACQUIRE_TOKEN_SUCCESS
        ),
        takeUntil(this._destroying$)
      )
      .subscribe((result) => {
        this.checkAccount();
      });
    Providers.globalProvider = new SimpleProvider(this.getAccessToken);
    Providers.globalProvider.login = async () => {
      this.login(this.msalGuardConfig);
    };
    Providers.globalProvider.logout = async () => {
      this.logout();
    };
    console.log('ngOnInit end', this.msalGuardConfig);
  }

  async getAccessToken(scopes: any): Promise<any> {
    const msalObj = MSALInstanceFactory();
    //Why isn't this.account set here?
    var request = { scopes: scopes, account: msalObj.getAllAccounts()[0] };
    console.log('getAccessToken', msalObj.getAllAccounts()[0]);
    try {
      let response = await msalObj.acquireTokenSilent(request);
      return response.accessToken;
    } catch (error) {
      // handle error
      console.log('0', error);
      if (error instanceof InteractionRequiredAuthError) {
        msalObj.acquireTokenRedirect(request);
      }
    }
  }

  checkAccount() {
    this.loggedIn = this.authService.instance.getAllAccounts().length > 0;
  }

  login(msalGuardConfig: any) {
    console.log('trying to login');
    console.log('msalGuardConfig', this._msalGuardConfig);

    if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
      if (this.msalGuardConfig.authRequest) {
        this.authService
          .loginPopup({ ...this.msalGuardConfig.authRequest } as PopupRequest)
          .subscribe(() => this.checkAccount());
      } else {
        this.authService.loginPopup().subscribe(() => this.checkAccount());
      }
    } else {
      if (this.msalGuardConfig.authRequest) {
        this.authService.loginRedirect({
          ...this.msalGuardConfig.authRequest,
        } as RedirectRequest);
      } else {
        this.authService.loginRedirect();
      }
    }
    Providers.globalProvider.setState(ProviderState.SignedIn);
    console.log(
      'SignedIn:',
      Providers.globalProvider.state === ProviderState.SignedIn
    );
  }

  logout() {
    this.authService.logout();
    Providers.globalProvider.setState(ProviderState.SignedOut);
  }

  // unsubscribe to events when component is destroyed
  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}
