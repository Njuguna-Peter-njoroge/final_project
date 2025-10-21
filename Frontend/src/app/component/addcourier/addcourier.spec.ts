import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Addcourier } from './addcourier';

describe('Addcourier', () => {
  let component: Addcourier;
  let fixture: ComponentFixture<Addcourier>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Addcourier]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Addcourier);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
