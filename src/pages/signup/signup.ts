import { Component } from '@angular/core';
import { NavController, ModalController, LoadingController, ToastController } from 'ionic-angular';
import { Validators, FormGroup, FormControl } from '@angular/forms';

import { TermsOfServicePage } from '../terms-of-service/terms-of-service';
import { PrivacyPolicyPage } from '../privacy-policy/privacy-policy';
import { TabsNavigationPage } from '../tabs-navigation/tabs-navigation';

import { Http, Headers } from '@angular/http';
import { Storage } from '@ionic/storage';

import 'rxjs/add/operator/map'

@Component({
  selector: 'signup-page',
  templateUrl: 'signup.html'
})
export class SignupPage {
  signup: FormGroup;
  main_page: { component: any };
  loading: any;

  // SIGNUP_URL: string = "http://localhost:3000/api/v1/auth";
  SIGNUP_URL: string = "https://pinit-staging-eu.herokuapp.com/api/v1/auth";

  contentHeader: Headers = new Headers({"Content-Type": "application/json"});

  constructor(
    public nav: NavController,
    public modal: ModalController,
    public loadingCtrl: LoadingController,
    private http: Http,
    public  toastCtrl: ToastController,
    public  storage: Storage
  ) {
    this.main_page = { component: TabsNavigationPage };

    this.signup = new FormGroup({
      account_name: new FormControl('', Validators.required),
      postcode: new FormControl('', Validators.required),
      name: new FormControl('', Validators.required),
      email: new FormControl('', Validators.required),
      password: new FormControl('', Validators.minLength(8)),
      confirm_password: new FormControl('', Validators.minLength(8))
    });
    this.loading = this.loadingCtrl.create();
  }

  doSignup(){
    this.loading.present();
    this.http.post(this.SIGNUP_URL, JSON.stringify(this.signup.getRawValue()), { headers: this.contentHeader })
      .map(
        res => res.json()
      )
      .subscribe(
        data => {
          this.loading.dismiss();
          this.storage.set('user', data);
          this.nav.setRoot(this.main_page.component);
        },
        err => {
          this.loading.dismiss();
          if(err.ok == false){
            let toast = this.toastCtrl.create({
              message: JSON.parse(err._body).errors.full_messages.join(', '),
              duration: 3000
            });
            toast.present();
          }
        }
      );
  }

  showTermsModal() {
    let modal = this.modal.create(TermsOfServicePage);
    modal.present();
  }

  showPrivacyModal() {
    let modal = this.modal.create(PrivacyPolicyPage);
    modal.present();
  }

}
