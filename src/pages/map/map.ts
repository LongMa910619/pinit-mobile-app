import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, Nav, MenuController, NavController, NavParams, LoadingController, Platform, ToastController } from 'ionic-angular';

import { Storage } from '@ionic/storage';
import { NativeStorage } from '@ionic-native/native-storage';
import { OneSignal } from '@ionic-native/onesignal';
import { SettingsPage } from '../settings/settings';
import { AddWatchPage } from '../add-watch/add-watch';
import { SubMenuPage } from '../sub-menu/sub-menu';
import { Events } from 'ionic-angular';

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
  @ViewChild('selectdevice') selectDevice;

  map: any;
  alert_circle: any;
  fLat: any;
  fLng: any;
  showDrawBtn: boolean;

  pages: Array<{title: string, icon: string, component: any}>;
  devices : any;

  // POLLING_URL: string = "http://localhost:3000/api/v1/map/polling";
  POLLING_URL: string = "https://pinit-staging-eu.herokuapp.com/api/v1/map/polling";
  DEVICES_URL: string = "https://pinit-staging-eu.herokuapp.com/api/v1/devices";
  LASTPIN_URL: string = "https://pinit-staging-eu.herokuapp.com/api/v1/devices/";
  FILTER_URL : string = "https://pinit-staging-eu.herokuapp.com/api/v1/geofence/";
  SEARCHPIN_URL: string = "https://pinit-staging-eu.herokuapp.com/api/v1/map/search_pins";


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
    private platform: Platform,
    public events: Events
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

    events.subscribe('map:drawcircle', () => {
      this.drawCircle();
    });     

    events.subscribe('map:removecircle', () => {
      this.removeCircle();
    });

    events.subscribe('map:searchpins', (start, end) => {
      this.init_ajax_search_pins(start, end);
    });

    events.subscribe('map:addwatch', (name, lccid, sn, pwd) => {
      this.add_watch(name, lccid, sn, pwd);
    })
  }

  openPage(page) {
    // close the menu when clicking a link from the menu
    //this.menu.close();
    // navigate to the new page if it is not the current page
    this.nav.setRoot(page.component);
  }

  ionViewDidLoad() {
    //console.log('ionViewDidLoad MapPage');
    //console.log(this.contentHeader);
    this.loadMap();
  }

  removeMapData() {
    let datas:any = this.map.data;
    this.map.data.forEach(function(feature) {
      datas.remove(feature);
    });
    this.map.data = datas;
  }

  markView(response: any) {
    this.removeMapData();
    //create bounds
    let bounds = new google.maps.LatLngBounds();
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

  polling() {
    this.http.get(this.POLLING_URL, { headers: this.contentHeader }).subscribe(
      data => {
        let response = data.json();
        //this.removeMapData();
        this.markView(response);
      }
    );
  }

  pollingDevices() {
    this.http.get(this.DEVICES_URL, { headers : this.contentHeader }).subscribe(
      data => {
        this.devices = data.json();
      }
    );
  }

  init_ajax_call(device_id: string) {
    if (device_id.length > 0) {
      let strURL = this.LASTPIN_URL + device_id + "/last_pin";

      this.http.get(strURL, { headers: this.contentHeader }).subscribe(
        data => {
          let response = data.json();
          if (response.msg) {
            alert(response.msg);
          } else {
            this.markView(response);
          }
        }
      );
    } else {
      this.polling();
    }
  }
  //When change Select Watch Combobox.
  onDeviceChange(selectedValue: any) {
    this.init_ajax_call(selectedValue);

    if(selectedValue == ''){                                    ////select [select all] item
      if(this.alert_circle != null){
        this.alert_circle.setMap(null);
        this.alert_circle = null;
      }
    }else{                                                      ////select a device
      // $('#device-name').html($(this).find('option:selected').text());
      this.init_ajax_get_circle_geofence();
    }
  }

  loadMap(){
    let latLng = new google.maps.LatLng(-34.9290, 138.6010);
    let mapOptions = {
      center: latLng,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }

    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

    this.map.data.addListener('click', (event) => {
      this.fLat = event.latLng.lat();
      this.fLng = event.latLng.lng();
      this.navCtrl.push(SubMenuPage, { showDrawBtn: this.showDrawBtn });
      this.selectDevice.value = event.feature.getProperty('device_id');
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

        //console.log(data['access-token']);
        //console.log(data['client']);
        //console.log(data['uid']);
        this.pollingDevices();
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
      this.init_ajax_save_circle_geofence(this.alert_circle.getRadius(), this.alert_circle.getCenter().lat(), this.alert_circle.getCenter().lng());
      this.showDrawBtn = false;
    }
  }

  removeCircle(){
    this.alert_circle.setMap(null);
    this.alert_circle = null;
    this.init_ajax_remove_circle_geofence();
    this.showDrawBtn = true;
  }

  init_ajax_save_circle_geofence(radius, lat, lng) {
    let strURL = this.FILTER_URL + this.selectDevice.value;
    let json = JSON.stringify({radius: radius, lat: lat, lng: lng});

    this.http.put(strURL, json, { headers: this.contentHeader }).subscribe(
      data => {
      }
    );
  }

  init_ajax_get_circle_geofence() {
    this.http.get(this.FILTER_URL + this.selectDevice.value, { headers: this.contentHeader }).subscribe(
      data => {
        let response = data.json();
        this.showDrawBtn = true;

        if (this.alert_circle != null) {
          this.alert_circle.setMap(null);
          this.alert_circle = null;
        }

        if (response.msg) {
          alert(response.msg)
        } else if (response.success) {
          this.alert_circle = new google.maps.Circle({
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#F25F5C',
            fillOpacity: 0.35,
            map: this.map,
            center: { lat: parseFloat(this.fLat), lng: parseFloat(this.fLng) },
            radius: 5 * 10, // meters (default as 5km)
            editable: true,
            draggable: true
          });
          //this.init_circle_geofence_callback()
          this.showDrawBtn = false;
        }
      }
    );
  }

  init_ajax_remove_circle_geofence() {
    this.http.delete(this.FILTER_URL + this.selectDevice.value, { headers: this.contentHeader }).subscribe(
      data => {
      }
    );
  }

  init_ajax_search_pins(start, end){
    this.removeMapData();
    let strURL = this.SEARCHPIN_URL/* + "?start=" + start + "&end=" + end*/;
    let json = JSON.stringify({device_id: this.selectDevice.value, from: start, to: end});

    this.http.patch(strURL, json, { headers: this.contentHeader }).subscribe(
      data => {
        let response = data.json();
        console.log(response);
        if (response.success) {
          var bounds = new google.maps.LatLngBounds();
          this.map.data.addGeoJson(JSON.parse(response.result));

          // Check each feature and fit into bound
          this.map.data.forEach(function(feature) {
            this.processPoints(feature.getGeometry(), bounds.extend, bounds);
          });
          this.map.fitBounds(bounds);

          this.map.data.setStyle(function(feature) {
            return {
              icon: feature.getProperty('icon')
            };
          });
        }else if(response.no_data){
          alert("No pins found!");
        }else{
          alert("Something went wrong!");
        }
      }
    );
  }

  add_watch(name, id, sn, pwd) {
    let strURL = this.DEVICES_URL;
    //let json = JSON.stringify({account: "b70206f2-346e-40e4-9d00-1a678097fac2", added_by_user: "319f6e72-e520-4637-89be-11ac9ec0a6f3", friendly_name: name, friendly_colour: "#43ac6a", lccid: id, serial_number: sn, password:pwd});
    let json = JSON.stringify({device : {friendly_name: name, friendly_colour: "#43ac6a", lccid: id, serial_number: sn, password:pwd}});

    console.log(json);
    this.http.post(strURL, json, { headers: this.contentHeader }).subscribe(
      data => {
        console.log(data);
      },
      err => {
        console.log(err);
      }
    );
  }

  gotoAddWatch() {
    console.log("Click AddWatch Button.")
    this.navCtrl.push(AddWatchPage);
  }
}
