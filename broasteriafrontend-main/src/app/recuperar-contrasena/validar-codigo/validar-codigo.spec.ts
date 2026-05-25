import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidarCodigo } from './validar-codigo';

describe('ValidarCodigo', () => {
  let component: ValidarCodigo;
  let fixture: ComponentFixture<ValidarCodigo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidarCodigo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValidarCodigo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
