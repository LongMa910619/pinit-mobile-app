import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonicApp, IonicModule, Platform } from 'ionic-angular';

import { MyApp } from './app.component';
import { IonicStorageModule } from '@ionic/storage';

import { LoginPage } from '../pages/login/login';
import { MapPage } from '../pages/map/map';
import { ProfilePage } from '../pages/profile/profile';
import { TabsNavigationPage } from '../pages/tabs-navigation/tabs-navigation';
import { WalkthroughPage } from '../pages/walkthrough/walkthrough';
import { SettingsPage } from '../pages/settings/settings';
import { AddWatchPage } from '../pages/add-watch/add-watch';
import { SubMenuPage } from '../pages/sub-menu/sub-menu';
import { SignupPage } from '../pages/signup/signup';
import { ForgotPasswordPage } from '../pages/forgot-password/forgot-password';
import { TermsOfServicePage } from '../pages/terms-of-service/terms-of-service';
import { PrivacyPolicyPage } from '../pages/privacy-policy/privacy-policy';
import { ProfileService } from '../pages/profile/profile.service';

import { NativeStorage } from '@ionic-native/native-storage';
import { OneSignal } from '@ionic-native/onesignal';
import { Geolocation } from '@ionic-native/geolocation';

import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { PreloadImage } from '../components/preload-image/preload-image';

@NgModule({
  declarations: [
    MyApp,
    MapPage,
    LoginPage,
    ProfilePage,
    TabsNavigationPage,
    WalkthroughPage,
    SettingsPage,
    AddWatchPage,
    SubMenuPage,
    SignupPage,
    ForgotPasswordPage,
    TermsOfServicePage,
    PrivacyPolicyPage,

    PreloadImage
  ],
  imports: [
    BrowserModule,
    HttpModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    MapPage,
    LoginPage,
    ProfilePage,
    TabsNavigationPage,
    WalkthroughPage,
    SettingsPage,
    AddWatchPage,
    SubMenuPage,
    ForgotPasswordPage,
    SignupPage,
    TermsOfServicePage,
    PrivacyPolicyPage
  ],
  providers: [
    SplashScreen,
    StatusBar,
    OneSignal,
    Geolocation,
    NativeStorage,
    ProfileService
  ],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class AppModule {}
