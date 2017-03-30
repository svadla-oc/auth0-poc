import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';

import { AuthService, AuthServerProvider } from '../';

@Injectable()
export class UserRouteAccessService implements CanActivate {

    constructor(
        private router: Router,
        private auth: AuthService,
        private authServer: AuthServerProvider) {
    }

    // canActivate(route: ActivatedRouteSnapshot): boolean | Promise<boolean> {
    //     // return this.auth.authorize(false).then( canActivate => canActivate);
    //     // return this.authServer.isAuthenticated().then( canActivate => canActivate);
    // }

    canActivate() {
        return this.authServer.isAuthenticated();
    }
}
