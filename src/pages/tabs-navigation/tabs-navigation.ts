import { Component } from '@angular/core';

import { SettingsPage } from '../settings/settings';


@Component({
  selector: 'tabs-navigation',
  templateUrl: 'tabs-navigation.html'
})
export class TabsNavigationPage {
  tab1Root: any;
  tab2Root: any;
  tab3Root: any;

  constructor() {
    this.tab1Root = SettingsPage;
  }
}
