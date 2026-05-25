import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitarCorreo } from './solicitar-correo';

describe('SolicitarCorreo', () => {
  let component: SolicitarCorreo;
  let fixture: ComponentFixture<SolicitarCorreo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitarCorreo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SolicitarCorreo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
