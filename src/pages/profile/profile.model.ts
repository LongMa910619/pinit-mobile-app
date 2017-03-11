export class AccountModel {
  postcode: string;
  name: string;
}

export class ProfileModel {
  avatar: string;
  name: string;
  email: string;
  account: AccountModel = new AccountModel();
}

