import { Component, ViewChild } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Validators, FormGroup, FormControl } from '@angular/forms';
import { Events } from 'ionic-angular';

import { TabsNavigationPage } from '../tabs-navigation/tabs-navigation';

@Component({
  selector: 'add-watch-page',
  templateUrl: 'add-watch.html'
})
export class AddWatchPage {
  add_watch: FormGroup;
  main_page: { component: any };
  @ViewChild('nametxt') name_txt;
  @ViewChild('lccidtxt') lccid_txt;
  @ViewChild('serialnumbertxt') sn_txt;
  @ViewChild('passwordtxt') pwd_txt;
  //@ViewChild('colorpck') color_pck;

  constructor(public nav: NavController, public events: Events) {
    this.main_page = { component: TabsNavigationPage };

    this.add_watch = new FormGroup({
      //email: new FormControl('', Validators.required)
    });
  }

  addWatch(){
    this.events.publish('map:addwatch', this.name_txt._value, this.lccid_txt._value, this.sn_txt._value, this.pwd_txt._value/*, this.color_pck._value*/);
    this.nav.pop();
  }

}
