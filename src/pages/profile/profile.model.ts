export class UserModel {
  avatar: string;
  name: string;
  email: string;
}

// export class ProfilePostModel {
//   date: Date;
// 	image: string;
// 	description: string;
// 	likes: number = 0;
// 	comments: number = 0;
// 	liked: boolean = false;
// }

export class ProfileModel {
  user: UserModel = new UserModel();
  // following: Array<UserModel> = [];
  // followers: Array<UserModel> = [];
  // posts: Array<ProfilePostModel> = [];
}
