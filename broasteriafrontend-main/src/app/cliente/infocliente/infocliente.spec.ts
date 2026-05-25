import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Infocliente } from './infocliente';

describe('Infocliente', () => {
  let component: Infocliente;
  let fixture: ComponentFixture<Infocliente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Infocliente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Infocliente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
