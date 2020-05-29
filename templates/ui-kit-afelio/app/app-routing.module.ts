import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { TypographyComponent, IconsComponent, BordersComponent, LinkComponent, ButtonComponent, FormsComponent, MarginComponent, PaddingComponent, GridComponent } from './components';
import { ColorsComponent } from './components/colors/colors.component';

const routes: Routes = [
    { path: 'home', component: HomeComponent, pathMatch: 'full', data: { category: 'Home', name: 'Home' } },
    // Layout
    { path: 'grid', component: GridComponent, pathMatch: 'full', data: { category: 'Layout', name: 'Grid' } },
    // Components
    { path: 'link', component: LinkComponent, pathMatch: 'full', data: { category: 'Components', name: 'Links' } },
    { path: 'button', component: ButtonComponent, pathMatch: 'full', data: { category: 'Components', name: 'Buttons' } },
    { path: 'forms', component: FormsComponent, pathMatch: 'full', data: { category: 'Components', name: 'Forms elements' } },

    // Fragments
    //
    // Properties
    { path: 'margin', component: MarginComponent, pathMatch: 'full', data: { category: 'Properties', name: 'Margin' } },
    { path: 'padding', component: PaddingComponent, pathMatch: 'full', data: { category: 'Properties', name: 'Padding' } },
    { path: 'borders', component: BordersComponent, pathMatch: 'full', data: { category: 'Properties', name: 'Borders' } },
    { path: 'colors', component: ColorsComponent, pathMatch: 'full', data: { category: 'Properties', name: 'Colors' } },
    { path: 'typography', component: TypographyComponent, pathMatch: 'full', data: { category: 'Properties', name: 'Typography' } },
    { path: 'icons', component: IconsComponent, pathMatch: 'full', data: { category: 'Properties', name: 'Icons' } },
    // Other
    { path: '**', redirectTo: '/home' }
];


@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
