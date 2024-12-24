import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { RegComponent } from './reg/reg.component';
import { SearchComponent } from './search/search.component';
import { ProfileComponent } from './profile/profile.component';
import { DbasesComponent } from './dbases/dbases.component';
import { StatComponent } from './stat/stat.component';
import { NgModel } from '@angular/forms';
import { PredictorComponent } from './predictor/predictor.component';
import { DiseaseComponent } from './disease/disease.component';


export const routes: Routes = [
    {path: "", component: HomeComponent},
    {path: "login", component: LoginComponent},
    {path: "reg", component: RegComponent},
    {path: "search", component: SearchComponent},
    {path: "profile", component: ProfileComponent},
    {path: "dbases", component: DbasesComponent},
    {path: "stat", component: StatComponent},
    {path: "predict", component: PredictorComponent},
    {path: "disease/:disease_name", component: DiseaseComponent}
];
