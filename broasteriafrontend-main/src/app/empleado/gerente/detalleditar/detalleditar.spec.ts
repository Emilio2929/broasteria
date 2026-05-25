import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Detalleditar } from './detalleditar';

describe('Detalleditar', () => {
  let component: Detalleditar;
  let fixture: ComponentFixture<Detalleditar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Detalleditar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Detalleditar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
