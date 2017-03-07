import { Component } from '@angular/core';

import { ProfilePage } from '../profile/profile';

@Component({
  selector: 'tabs-navigation',
  templateUrl: 'tabs-navigation.html'
})
export class TabsNavigationPage {
  tab1Root: any;
  tab2Root: any;
  tab3Root: any;

  constructor() {
    this.tab2Root = ProfilePage;
  }
}
