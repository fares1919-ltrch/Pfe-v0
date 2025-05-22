import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FraudsComponent } from './frauds.component';

describe('FraudsComponent', () => {
  let component: FraudsComponent;
  let fixture: ComponentFixture<FraudsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FraudsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FraudsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
