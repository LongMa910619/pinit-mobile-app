import { Component } from '@angular/core';
import { NavController, LoadingController, Platform, ToastController } from 'ionic-angular';
import { Validators, FormGroup, FormControl } from '@angular/forms';

import { SettingsPage } from '../settings/settings';
import { SignupPage } from '../signup/signup';
import { ForgotPasswordPage } from '../forgot-password/forgot-password';

import { Http, Headers } from '@angular/http';

import { Storage } from '@ionic/storage';

import 'rxjs/add/operator/map'

@Component({
  selector: 'login-page',
  templateUrl: 'login.html'
})
export class LoginPage {

  login: FormGroup;
  main_page: { component: any };
  loading: any;

  LOGIN_URL: string = "http://localhost:3000/api/v1/auth/sign_in";

  // We need to set the content type for the server
  contentHeader: Headers = new Headers({"Content-Type": "application/json"});

  constructor(
    public  nav: NavController,
    public  loadingCtrl: LoadingController,
    private http: Http,
    private platform: Platform,
    public  toastCtrl: ToastController,
    public  storage: Storage
  )
  {
    this.main_page = { component: SettingsPage };

    this.login = new FormGroup({
      email: new FormControl('', Validators.required),
      password: new FormControl('test', Validators.required)
    });
    this.loading = this.loadingCtrl.create();
  }

  doLogin(){
    this.loading.present();
    this.http.post(this.LOGIN_URL, JSON.stringify(this.login.getRawValue()), { headers: this.contentHeader })
      .subscribe(
        res => {
          var data = res.json();
          var headers = res.headers;

          var authorize_identity = {
            "access-token": headers.get('access-token'),
            "uid": headers.get('uid'),
            "client": headers.get('client')
          }
          this.storage.set('authorize_identity', null);
          this.storage.set('authorize_identity', authorize_identity);

          this.storage.set('user', data);
          this.storage.get("user").then((value) => {
            console.log(value);
          });

          this.storage.get("authorize_identity").then((value) => {
            console.log(value);
          });

          this.nav.setRoot(this.main_page.component);
          this.loading.dismiss();
        },
        err => {
          if(err.status == 401 && err.statusText == 'Unauthorized'){
            let toast = this.toastCtrl.create({
              message: 'Invalid credentials, please try again.',
              duration: 3000
            });
            toast.present();
          }
          this.loading.dismiss();
        }
      );
  }

  goToSignup() {
    this.nav.push(SignupPage);
  }

  goToForgotPassword() {
    this.nav.push(ForgotPasswordPage);
  }


}

// https://auth0.com/blog/ionic-2-authentication-how-to-secure-your-mobile-app-with-jwt/
