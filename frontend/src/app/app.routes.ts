import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { RegComponent } from './reg/reg.component';
import { SearchComponent } from './search/search.component';
import { ProfileComponent } from './profile/profile.component';

export const routes: Routes = [
    {path: "", component: HomeComponent},
    {path: "login", component: LoginComponent},
    {path: "reg", component: RegComponent},
    {path: "search", component: SearchComponent},
    {path: "profile", component: ProfileComponent}
];
