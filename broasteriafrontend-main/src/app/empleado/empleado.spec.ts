import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpleadoService } from '../services/empleado.service';

describe('Empleado', () => {
  let component: EmpleadoService;
  let fixture: ComponentFixture<EmpleadoService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmpleadoService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmpleadoService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
