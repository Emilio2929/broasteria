import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Chef } from './chef';

describe('Chef', () => {
  let component: Chef;
  let fixture: ComponentFixture<Chef>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Chef]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Chef);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
