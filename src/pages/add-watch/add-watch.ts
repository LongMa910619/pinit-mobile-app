import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Validators, FormGroup, FormControl } from '@angular/forms';

import { TabsNavigationPage } from '../tabs-navigation/tabs-navigation';

@Component({
  selector: 'add-watch-page',
  templateUrl: 'add-watch.html'
})
export class AddWatchPage {
  add_watch: FormGroup;
  main_page: { component: any };

  constructor(public nav: NavController) {
    this.main_page = { component: TabsNavigationPage };

    this.add_watch = new FormGroup({
      //email: new FormControl('', Validators.required)
    });
  }

  addWatch(){
    console.log(this.add_watch.value);
    this.nav.setRoot(this.main_page.component);
  }

}
