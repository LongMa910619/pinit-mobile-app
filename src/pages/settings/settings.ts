import { Component } from '@angular/core';
import { Platform, NavController, ModalController, LoadingController, ToastController } from 'ionic-angular';
import { FormGroup, FormControl } from '@angular/forms';

import { TermsOfServicePage } from '../terms-of-service/terms-of-service';
import { PrivacyPolicyPage } from '../privacy-policy/privacy-policy';
import { LoginPage } from '../login/login';

import 'rxjs/Rx';
import { ProfileModel } from '../profile/profile.model';
import { ProfileService } from '../profile/profile.service';

import { Http, Headers } from '@angular/http';
import { Storage } from '@ionic/storage';
import { NativeStorage } from '@ionic-native/native-storage';
import { Camera, File } from 'ionic-native'

declare var cordova;

@Component({
  selector: 'settings-page',
  templateUrl: 'settings.html'
})
export class SettingsPage {
  settingsForm: FormGroup;
  // make WalkthroughPage the root (or first) page
  rootPage: any = LoginPage;

  loading: any;

  profile: ProfileModel = new ProfileModel();

  // SAVE_PROFILE_URL: string = "http://localhost:3000/api/v1/profile/update";
  SAVE_PROFILE_URL: string = "https://pinit-staging-eu.herokuapp.com/api/v1/profile/update";

  contentHeader: Headers = new Headers({"Content-Type": "application/json"});

  constructor(
    public nav: NavController,
    public modal: ModalController,
    public loadingCtrl: LoadingController,
    public profileService: ProfileService,
    public storage: Storage,
    private nativeStorage: NativeStorage,
    private platform: Platform,
    private http: Http,
    public  toastCtrl: ToastController
  ) {
    this.settingsForm = new FormGroup({
      name: new FormControl(),
      account_name: new FormControl(),
      postcode: new FormControl()
    });
  }

  ionViewDidLoad() {

    if(this.platform.is('cordova')){

      this.nativeStorage.getItem('user').then(
        data => {
          this.profile = data.user;
        },
        error => console.error(error)
      );

      this.nativeStorage.getItem('authorize_identity').then(
        data => {
          this.contentHeader.append('access-token', data['access-token']);
          this.contentHeader.append('client', data['client']);
          this.contentHeader.append('uid', data['uid']);
        },
        error => console.error(error)
      );
     }else{
      this.storage.get('user').then((value) => {
        this.profile = value.user;
      });

      this.storage.get('authorize_identity').then((data) => {
        this.contentHeader.append('access-token', data['access-token']);
        this.contentHeader.append('client', data['client']);
        this.contentHeader.append('uid', data['uid']);
      });
     }

  }

  ionViewWillEnter(){
    if(this.platform.is('cordova')){
      this.nativeStorage.getItem('user').then(
        value => {
          if(value){
            // do nothing is authorized
          }else{
            this.nav.setRoot(this.rootPage);
            // unauthorized
          }
        },
        error => console.error(error)
      );
    }else{
      this.storage.get('user').then((value) => {
        if(value){
          // do nothing is authorized
        }else{
          this.nav.setRoot(this.rootPage);
          // unauthorized
        }
      });
    }
  }

  // Functionality
  logout() {
    // navigate to the new page if it is not the current page
    this.nav.setRoot(this.rootPage);
  }

  saveProfile() {
    this.loading = this.loadingCtrl.create();
    this.loading.present();

    console.log(this.contentHeader);

    console.log(this.settingsForm);
    this.settingsForm.getRawValue();
    this.http.put(this.SAVE_PROFILE_URL, JSON.stringify(this.profile), { headers: this.contentHeader })
      .map(
        res => res.json()
      )
      .subscribe(
        data => {
          if(this.platform.is('cordova')){
            this.nativeStorage.setItem('user', data);
           }else{
            this.storage.set('user', data);
           }
          this.loading.dismiss();
        },
        err => {
          if(err.ok == false){
            if(err.status == 401){
              let toast = this.toastCtrl.create({
                message: 'Unauthorized User',
                duration: 3000
              });
              toast.present();
            }else if(err.status == 201){
              let toast = this.toastCtrl.create({
                message: JSON.parse(err._body).errors.full_messages.join(', '),
                duration: 3000
              });
              toast.present();
            }
          }
          this.loading.dismiss();
        }
      );
  }

  takePhoto() {
    if(!this.platform.is('cordova')){
      let toast = this.toastCtrl.create({
        message: 'You can only take photos on device!',
        duration: 3000
      });
      toast.present();
      return false;
    }

    let options = {
      quality: 100,
      destinationType: 1,
      sourceType: 1,
      encodingType: 0,
      cameraDirection: 1,
      saveToPhotoAlbum: true
    }

    Camera.getPicture(options).then(
      (imageData) => {
        let base64Image = 'data:image/jpeg;base64,' + imageData;
        // Send to server
      },
      (err) => {
        let toast = this.toastCtrl.create({
          message: 'Something went wrong!',
          duration: 3000
        });
        toast.present();
      }
    );
  }


  // Modal Display
  showTermsModal() {
    let modal = this.modal.create(TermsOfServicePage);
    modal.present();
  }

  showPrivacyModal() {
    let modal = this.modal.create(PrivacyPolicyPage);
    modal.present();
  }
}
