import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {

  public menu: MenuCategory[];

  constructor(private router: Router) {
    this.menu = [];
  }

  ngOnInit() {
    this.router.config.forEach(route => {
      if (route.data && route.data.category && route.data.name) {
        const currentCategory = this.menu.find(category => category.name === route.data.category);
        const newCategory = new MenuItem(route.data.name, `/${route.path}`);
        if (currentCategory) {
          currentCategory.items.push(newCategory);
        } else {
          this.menu.push(new MenuCategory(route.data.category, [newCategory]));
        }
      }
    });
  }

}

class MenuItem {
  constructor(
    public name: string,
    public route: string
  ) {}
}

class MenuCategory {
  constructor(
    public name: string,
    public items: MenuItem[]
  ) {}
}
