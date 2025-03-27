import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleRedirectComponent } from './role-redirect.component';

describe('RoleRedirectComponent', () => {
  let component: RoleRedirectComponent;
  let fixture: ComponentFixture<RoleRedirectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleRedirectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoleRedirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
