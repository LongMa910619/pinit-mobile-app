import { Component, ViewChild, NgModule } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Validators, FormGroup, FormControl } from '@angular/forms';
import { CallNumber } from '@ionic-native/call-number';

import { TabsNavigationPage } from '../tabs-navigation/tabs-navigation';
import { MapPage } from '../map/map';
import { Events } from 'ionic-angular';

@Component({
  selector: 'sub-menu-page',
  templateUrl: 'sub-menu.html'
})
export class SubMenuPage {
  @ViewChild('draw') drawbutton;
  @ViewChild('remove') removebutton;
  @ViewChild('startdatepicker') startpicker;
  @ViewChild('enddatepicker') endpicker;
  
  add_watch: FormGroup;
  main_page: { component: any };
  showDrawBtn: boolean;
  startdate: String = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString();
  enddate: string = new Date().toISOString();
  title: string = "";
  device_number: string = "";

  constructor(
    public nav: NavController,
    private navParams: NavParams,
    private callNumber: CallNumber,
    public events: Events
  ) {
    this.main_page = { component: TabsNavigationPage };

    this.add_watch = new FormGroup({
    });

    this.showDrawBtn = navParams.get('showDrawBtn');
    this.title = navParams.get('title');
    this.device_number = navParams.get('device_number');
    //console.log(this.title);

    events.subscribe('submenu:setvalues', () => {
      this.setValues();
    });
  }

  setValues() {
  }

  drawCircle() {
    this.events.publish('map:drawcircle');
    this.nav.pop();
  }

  removeCircle() {
    this.events.publish('map:removecircle');
    this.nav.pop();
  }

  startDateChanged(event) {
  }

  endDateChanged(event) {
  }

  searchPins() {
    this.events.publish('map:searchpins', this.startpicker._text, this.endpicker._text);
    this.nav.pop();
  }

  callDeviceNumber() {
    //this.events.publish('map:callDeviceNumber');
    console.log(this.device_number);
    this.callNumber.callNumber("00" + this.device_number, true)
      .then(() => console.log('Launched dialer!'))
      .catch(() => console.log('Error launching dialer'));

  }

}
