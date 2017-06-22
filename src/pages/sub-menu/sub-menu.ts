import { Component, ViewChild, NgModule } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Validators, FormGroup, FormControl } from '@angular/forms';

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

  constructor( 
    public nav: NavController,
    private navParams: NavParams,
    public events: Events
  ) {
    this.main_page = { component: TabsNavigationPage };

    this.add_watch = new FormGroup({
    });

    this.showDrawBtn = navParams.get('showDrawBtn');

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
}
