import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, Nav, MenuController, NavController, NavParams, LoadingController, Platform, ToastController } from 'ionic-angular';

import { Storage } from '@ionic/storage';
import { NativeStorage } from '@ionic-native/native-storage';
import { Geolocation } from '@ionic-native/geolocation';
import { OneSignal } from '@ionic-native/onesignal';
import { SettingsPage } from '../settings/settings';
import { AddWatchPage } from '../add-watch/add-watch';
import { SubMenuPage } from '../sub-menu/sub-menu';
import { Events } from 'ionic-angular';
import { CallNumber } from '@ionic-native/call-number';

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
  ////@ViewChild('selectdevice') selectDevice;

  map: any;
  alert_circle: any;
  fLat: any;
  fLng: any;
  showDrawBtn: boolean;
  device_id: string;
  device_number: string;
  defaultLat: any;
  defaultLng: any;

  pages: Array<{title: string, icon: string, component: any}>;
  ////devices : any;

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
    private geolocation: Geolocation,
    private callNumber: CallNumber,
    public events: Events
  ) {

    this.pages = [
      { title: 'Home', icon: 'home', component: MapPage },
      { title: 'Add Device', icon: 'create', component: SettingsPage },
      { title: 'Settings', icon: 'code', component: SettingsPage },
      { title: 'Logout', icon: 'exit', component: SettingsPage }
    ];

    if(this.platform.is('cordova')){
      // Onesignal
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

    this.geolocation.getCurrentPosition().then((resp) => {
      console.log(resp.coords.latitude);
      console.log(resp.coords.longitude);
      this.defaultLat = resp.coords.latitude;
      this.defaultLng = resp.coords.longitude;
    }).catch((error) => {
      console.log('Error getting location', error);
    });

    events.subscribe('map:drawcircle', () => {
      this.drawCircle();
    });

    events.subscribe('map:removecircle', () => {
      this.removeCircle();
    });

    events.subscribe('map:searchpins', (start, end) => {
      this.init_ajax_search_pins(start, end);
    });

    events.subscribe('map:devicechange', (selectedValue) => {
      this.onDeviceChange(selectedValue);
    })

    events.subscribe('map:addwatch', () => {
      this.gotoAddWatch();
    });

    events.subscribe('map:addingDevice', (name, id, sn, pwd) => {
      this.add_watch(name, id, sn, pwd);
    });

    events.subscribe('map:callDeviceNumber', () => {
      this.callDeviceNumber();
    });

    this.showDrawBtn = true;
  }

  openPage(page) {
    //this.menu.close();
    // navigate to the new page if it is not the current page
    this.nav.setRoot(page.component);
  }

  ionViewDidLoad() {
    this.loadMap();
  }

  callDeviceNumber() {
    console.log(this.device_number);
    this.callNumber.callNumber("00" + this.device_number, true)
      .then(() => console.log('Launched dialer!'))
      .catch(() => console.log('Error launching dialer'));
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
    console.log(response.result);

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

    ////let exist_zoom_for_device = localStorage.getItem(this.selectDevice.value);
    let exist_zoom_for_device = localStorage.getItem(this.device_id);
    if(exist_zoom_for_device != null){
      this.map.setCenter(bounds.getCenter());
      this.map.setZoom(parseInt(exist_zoom_for_device));
    }else{
      this.map.fitBounds(bounds);
    }

    //this.map.fitBounds(bounds);

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
        ////this.devices = data.json();
        this.events.publish('app:pollingdevices', data.json());
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
    this.device_id = selectedValue;
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
    let latLng = new google.maps.LatLng(this.defaultLat, this.defaultLng);
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
      this.events.publish('app:selectdevice', event.feature.getProperty('device_id'));
      this.device_number = event.feature.getProperty('msisdn');
    });

    this.map.addListener('zoom_changed', (event) => {
      ////if (this.selectDevice.value.length > 0) {
      if (this.device_id != null && this.device_id.length > 0) {
        localStorage.setItem(this.device_id, this.map.getZoom());
      }
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
    ////let strURL = this.FILTER_URL + this.selectDevice.value;
    let strURL = this.FILTER_URL + this.device_id;
    let json = JSON.stringify({radius: radius, lat: lat, lng: lng});

    this.http.put(strURL, json, { headers: this.contentHeader }).subscribe(
      data => {
      }
    );
  }

  init_ajax_get_circle_geofence() {
    ////this.http.get(this.FILTER_URL + this.selectDevice.value, { headers: this.contentHeader }).subscribe(
    this.http.get(this.FILTER_URL + this.device_id, { headers: this.contentHeader }).subscribe(
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
    ////this.http.delete(this.FILTER_URL + this.selectDevice.value, { headers: this.contentHeader }).subscribe(
    this.http.delete(this.FILTER_URL + this.device_id, { headers: this.contentHeader }).subscribe(
      data => {
      }
    );
  }

  init_ajax_search_pins(start, end){
    this.removeMapData();
    ////let strURL = this.SEARCHPIN_URL + "?device_id=" + this.selectDevice.value + "&from=" + start + "&to=" + end;
    let strURL = this.SEARCHPIN_URL + "?device_id=" + this.device_id + "&from=" + start + "&to=" + end;
    //let json = JSON.stringify({device_id: this.selectDevice.value, from: start, to: end});
    console.log(strURL);
    this.http.get(strURL, { headers: this.contentHeader }).subscribe(
      data => {
        let response = data.json();
        console.log(response);
        if (response.success) {
          var bounds = new google.maps.LatLngBounds();
          this.map.data.addGeoJson(JSON.parse(response.result));

          // Check each feature and fit into bound
          this.map.data.forEach(function(feature) {
            //this.processPoints(feature.getGeometry(), bounds.extend, bounds);
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
    let json = JSON.stringify({device : {friendly_name: name, friendly_colour: "#43ac6a", lccid: id, serial_number: sn, password:pwd}});

    console.log(json);
    this.http.post(strURL, json, { headers: this.contentHeader }).subscribe(
      data => {
        this.pollingDevices();
      }
    );
  }

  gotoAddWatch() {
    this.navCtrl.push(AddWatchPage);
  }
}
