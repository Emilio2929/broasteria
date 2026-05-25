import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IniSesion } from './ini-sesion';

describe('IniSesion', () => {
  let component: IniSesion;
  let fixture: ComponentFixture<IniSesion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IniSesion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IniSesion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
