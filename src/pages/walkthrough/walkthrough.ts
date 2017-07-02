import { Component, ViewChild } from '@angular/core';
import { Platform, NavController, Slides } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { NativeStorage } from '@ionic-native/native-storage';

import { MapPage } from '../map/map';
import { LoginPage } from '../login/login';
import { SignupPage } from '../signup/signup';

@Component({
  selector: 'walkthrough-page',
  templateUrl: 'walkthrough.html'
})
export class WalkthroughPage {

  lastSlide = false;

  @ViewChild('slider') slider: Slides;

  constructor(
    public nav: NavController,
    public storage: Storage,
    private nativeStorage: NativeStorage,
    private platform: Platform
  ) {

  }

  skipIntro() {
    // You can skip to main app
    // this.nav.setRoot(TabsNavigationPage);

    // Or you can skip to last slide (login/signup slide)
    this.lastSlide = true;
    this.slider.slideTo(this.slider.length());
  }

  onSlideChanged() {
    // If it's the last slide, then hide the 'Skip' button on the header
    this.lastSlide = this.slider.isEnd();
  }

  goToLogin() {
    this.nav.push(LoginPage);
  }

  goToSignup() {
    this.nav.push(SignupPage);
  }

  ionViewWillEnter(){
    if(this.platform.is('cordova')){
      this.nativeStorage.getItem('user').then(
        value => {
          if(value){
            // do nothing is authorized
            this.nav.setRoot(MapPage);
          }else{
            // unauthorized
          }
        },
        error => console.error(error)
      );
    }else{
      this.storage.get('user').then((value) => {
        if(value){
          // do nothing is authorized
          this.nav.setRoot(MapPage);
        }else{
          // unauthorized
        }
      });
    }
  }

}
