import { Component } from '@angular/core';
import { NavController, LoadingController, Platform, ToastController } from 'ionic-angular';
import { Validators, FormGroup, FormControl } from '@angular/forms';

import { TabsNavigationPage } from '../tabs-navigation/tabs-navigation';
import { SettingsPage } from '../settings/settings';
import { SignupPage } from '../signup/signup';
import { ForgotPasswordPage } from '../forgot-password/forgot-password';

import { Http, Headers } from '@angular/http';
import { JwtHelper } from 'angular2-jwt';
import { AuthService } from '../../services/auth/auth';

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

  auth: AuthService;
  // We need to set the content type for the server
  contentHeader: Headers = new Headers({"Content-Type": "application/json"});
  error: string;
  jwtHelper: JwtHelper = new JwtHelper();
  user: string;

  constructor(
    public nav: NavController,
    public loadingCtrl: LoadingController,
    private http: Http,
    private platform: Platform,
    public toastCtrl: ToastController,
    public storage: Storage
  )
  {
    this.main_page = { component: SettingsPage };

    this.login = new FormGroup({
      email: new FormControl('', Validators.required),
      password: new FormControl('test', Validators.required)
    });
  }

  doLogin(){

    this.http.post(this.LOGIN_URL, JSON.stringify(this.login.getRawValue()), { headers: this.contentHeader })
      .map(res => res.json())
      .subscribe(
        data => {
          console.log(data);
          // this.authSuccess(data.id_token);
          console.log(data.id);
          // this.data = data;
          if(data){
            this.nav.setRoot(this.main_page.component);
          }else{
          }
        },
        err => {
          if(err.status == 401 && err.statusText == 'Unauthorized'){
            let toast = this.toastCtrl.create({
              message: 'Invalid credentials, please try again.',
              duration: 3000
            });
            toast.present();
          }
          this.error = err
        }
    );


  }

  goToSignup() {
    this.nav.push(SignupPage);
  }

  goToForgotPassword() {
    this.nav.push(ForgotPasswordPage);
  }

  authSuccess(token) {
    this.error = null;
    storage.set('token', token);
    // this.local.set('id_token', token);
    this.user = this.jwtHelper.decodeToken(token).username;
  }

}

// https://auth0.com/blog/ionic-2-authentication-how-to-secure-your-mobile-app-with-jwt/
