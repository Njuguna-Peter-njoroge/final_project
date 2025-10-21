import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Vieworders } from './vieworders';

describe('Vieworders', () => {
  let component: Vieworders;
  let fixture: ComponentFixture<Vieworders>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Vieworders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Vieworders);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
