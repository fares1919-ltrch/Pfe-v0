import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrustIndicatorsComponent } from './trust-indicators.component';

describe('TrustIndicatorsComponent', () => {
  let component: TrustIndicatorsComponent;
  let fixture: ComponentFixture<TrustIndicatorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrustIndicatorsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrustIndicatorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
