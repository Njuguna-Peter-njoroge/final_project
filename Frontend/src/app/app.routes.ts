import { Routes } from '@angular/router';
import {Navbar} from './component/Shared/navbar/navbar';
import {Footer} from './component/Shared/footer/footer';
import {Login} from './component/auth/login/login';
import {Register} from './component/auth/register/register';
import {EmailVerification} from './component/auth/email-verification/email-verification';
import {UsersInfo} from './component/users-info/users-info';
import {AdminDashboard} from './component/Admin/admin-dashboard/admin-dashboard';
import {ManageUsers} from './component/Admin/manage-users/manage-users';
import {AddCourier} from './component/Admin/manage-users/add-courier';
import {DriverCourierForm} from './component/Admin/manage-users/driver-courier-form';
import {ViewOrders} from './component/Admin/vieworders/vieworders';
import {Homepage} from './component/homepage/homepage';
import { Userdashboard } from './component/userdashboard/userdashboard';;
import {ParcelManagementComponent} from './component/Admin/parcel-management/parcel-management';
import {Addcourier} from './component/addcourier/addcourier';
import {About} from './component/Shared/about/about';
import {CourierMapComponent} from './component/map/map';
import {Forgotpassword} from './component/auth/forgotpassword/forgotpassword';
import {Resetpassword} from './component/auth/resetpassword/resetpassword';



export const routes: Routes = [
  { path: '', redirectTo: 'homepage', pathMatch: 'full' },
  { path: 'homepage', component: Homepage},

  {
      path: 'navbar', component: Navbar,},
  {path:'ManageUsers',component:ManageUsers,},
  {path:'add-courier', component: AddCourier},
  {path:'add-driver-courier', component: DriverCourierForm},
  {path:'', component:Register,},
  {path:'Vieworders', redirectTo: 'parcel-management', pathMatch: 'full'},
  {path:'add courier', component: Addcourier,},
  { path: 'userdashboard', component: Userdashboard },
  {path:'UsersInfo',component:UsersInfo,},
  {path:'footer',component:Footer,},
  {path:'forgot password',component:Forgotpassword,},
  {path:'Resetpassword',component:Resetpassword,},
  {path:'adminDashboard',component:AdminDashboard,},
  {path: 'about', component:About},
  {path:'login',component:Login,},
  {path:'Forgotpassword',component:Forgotpassword,},
  {path:'register',component:Register,},
  {path:'email-verification',component:EmailVerification,},
  {path:'users-info', component: UsersInfo},
  {path:'map', component: CourierMapComponent},
  {path:'parcel-management', component: ParcelManagementComponent}

];
