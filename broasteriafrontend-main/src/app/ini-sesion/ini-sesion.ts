import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-ini-sesion',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './ini-sesion.html',
  styleUrls: ['./ini-sesion.css']
})
export class IniSesion {
  constructor(private router: Router) {}

  empleado(event?: Event) {
    event?.preventDefault();
    this.router.navigate(['/empleado']);
  }

  cliente(event?: Event) {
    event?.preventDefault();
    this.router.navigate(['/cliente']);
  }
}
