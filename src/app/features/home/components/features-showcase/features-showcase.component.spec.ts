import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeaturesShowcaseComponent } from './features-showcase.component';

describe('FeaturesShowcaseComponent', () => {
  let component: FeaturesShowcaseComponent;
  let fixture: ComponentFixture<FeaturesShowcaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeaturesShowcaseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeaturesShowcaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
