import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeduplicationsComponent } from './deduplications.component';

describe('DeduplicationsComponent', () => {
  let component: DeduplicationsComponent;
  let fixture: ComponentFixture<DeduplicationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeduplicationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeduplicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
