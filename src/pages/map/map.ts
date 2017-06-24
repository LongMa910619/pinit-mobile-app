import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, Nav, MenuController, NavController, NavParams, LoadingController, Platform, ToastController } from 'ionic-angular';

import { Storage } from '@ionic/storage';
import { NativeStorage } from '@ionic-native/native-storage';
import { OneSignal } from '@ionic-native/onesignal';
import { SettingsPage } from '../settings/settings';
import { AddWatchPage } from '../add-watch/add-watch';
import { SubMenuPage } from '../sub-menu/sub-menu';

import { Http, Headers } from '@angular/http';

import {Observable} from 'rxjs/Rx';

/**
 * Generated class for the MapPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

 declare var google;

@Component({
  selector: 'page-map',
  templateUrl: 'map.html',
})
export class MapPage {

  @ViewChild(Nav) nav: Nav;
  @ViewChild('map') mapElement: ElementRef;

  map: any;
  alert_circle: any;
  fLat: any;
  fLng: any;

  pages: Array<{title: string, icon: string, component: any}>;

  // POLLING_URL: string = "http://localhost:3000/api/v1/map/polling";
  POLLING_URL: string = "https://pinit-staging-eu.herokuapp.com/api/v1/map/polling";

  contentHeader: Headers = new Headers({"Content-Type": "application/json"});

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public menu: MenuController,
    public loadingCtrl: LoadingController,
    private http: Http,
    private nativeStorage: NativeStorage,
    private storage: Storage,
    public  toastCtrl: ToastController,
    private oneSignal: OneSignal,
    private platform: Platform
  ) {

    this.pages = [
      { title: 'Home', icon: 'home', component: MapPage },
      { title: 'Add Device', icon: 'create', component: SettingsPage },
      { title: 'Settings', icon: 'code', component: SettingsPage },
      { title: 'Logout', icon: 'exit', component: SettingsPage }
    ];

    if(this.platform.is('cordova')){
      this.oneSignal.startInit('8afb6c4c-51ed-4332-ae8a-0079a0d8d4f2', '');
      this.oneSignal.inFocusDisplaying(this.oneSignal.OSInFocusDisplayOption.InAppAlert);

      this.oneSignal.handleNotificationReceived().subscribe(() => {
        // do something when notification is received
        alert("Receive notification");
      });

      this.oneSignal.handleNotificationOpened().subscribe(() => {
        // do something when a notification is opened
        alert("Open notification");
      });

      this.oneSignal.endInit();
     }
  }

  openPage(page) {
    // close the menu when clicking a link from the menu
    //this.menu.close();
    // navigate to the new page if it is not the current page
    this.nav.setRoot(page.component);
  }


  ionViewDidLoad() {
    console.log('ionViewDidLoad MapPage');

    console.log(this.contentHeader);

    this.loadMap();
  }

  polling() {
    this.http.get(this.POLLING_URL, { headers: this.contentHeader })
      .subscribe(
        data => {
          let response = data.json();
          console.log(response);

          // this.map.data.forEach(function(feature) {
          //   this.map.data.remove(feature);
          // });

         //create bounds
          let bounds  = new  google.maps.LatLngBounds();
          this.map.data.addGeoJson(JSON.parse(response.result));

          // Check each feature and fit into bound
          this.map.data.forEach(function(feature) {
            // this.processPoints(feature.getGeometry(), bounds.extend, bounds);
            if (feature.getGeometry() instanceof google.maps.LatLng) {
              bounds.extend.call(bounds, feature.getGeometry());
            } else if (feature.getGeometry() instanceof google.maps.Data.Point) {
              bounds.extend.call(bounds, feature.getGeometry().get());
            } else {
              feature.getGeometry().getArray().forEach(function(g) {
                this.processPoints(g, bounds.extend, bounds);
              });
            }
          });
          this.map.fitBounds(bounds);

          this.map.data.setStyle(function(feature) {
            return {
              icon: feature.getProperty('icon')
            };
          });

        }
      );
  }

  loadMap(){
    let latLng = new google.maps.LatLng(-34.9290, 138.6010);

    let mapOptions = {
      center: latLng,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }

    let navCtrl = this.navCtrl;

    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

    this.map.data.addListener('click', function(event) {
      this.fLat = event.latLng.lat();
      this.fLng = event.latLng.lng();
      console.log(navCtrl);
      navCtrl.push(SubMenuPage);
      //this.drawCircle();
      //this.drawCircle(event.latLng.lat(), event.latLng.lng());
      /*this.alert_circle = new google.maps.Circle({
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
        map: this.map,
        center: { lat: parseFloat(this.fLat), lng: parseFloat(this.fLng) },
        radius: 5 * 10, // meters (default as 50m)
        editable: true,
        draggable: true
      });*/
      console.log(event.feature.getProperty('device_id'));
    });

    if(this.platform.is('cordova')){
      this.nativeStorage.getItem('authorize_identity').then(
        data => {
          this.contentHeader.append('access-token', data['access-token']);
          this.contentHeader.append('client', data['client']);
          this.contentHeader.append('uid', data['uid']);
        },
        error => console.error(error)
      );
     }else{
      this.storage.get('authorize_identity').then((data) => {
        this.contentHeader.append('access-token', data['access-token']);
        this.contentHeader.append('client', data['client']);
        this.contentHeader.append('uid', data['uid']);

        console.log(data['access-token']);
        console.log(data['client']);
        console.log(data['uid']);
        this.polling();
        Observable.interval(2000 * 60).subscribe(x => {
          this.polling();
        });
      });
     }
  }

  // Fit pins into bounds
  processPoints(geometry, callback, thisArg) {
    if (geometry instanceof google.maps.LatLng) {
      callback.call(thisArg, geometry);
    } else if (geometry instanceof google.maps.Data.Point) {
      callback.call(thisArg, geometry.get());
    } else {
      geometry.getArray().forEach(function(g) {
        this.processPoints(g, callback, thisArg);
      });
    }
  }

  drawCircle(){
    if(this.alert_circle == null){
      this.alert_circle = new google.maps.Circle({
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
        map: this.map,
        center: { lat: parseFloat(this.fLat), lng: parseFloat(this.fLng) },
        radius: 5 * 10, // meters (default as 50m)
        editable: true,
        draggable: true
      });

      //this.map.setZoom(this.map.getZoom() - 3);

      //init_ajax_save_circle_geofence(this.alert_circle.getRadius(), this.alert_circle.getCenter().lat(), this.alert_circle.getCenter().lng());
      //init_circle_geofence_callback();

      //$(this).hide();
      //$('#remove-circle-btn').fadeIn();
    }
  }

  removeCircle(){

  }

  gotoAddWatch() {
    console.log("Click AddWatch Button.")
    this.navCtrl.push(SubMenuPage);
  }
}
