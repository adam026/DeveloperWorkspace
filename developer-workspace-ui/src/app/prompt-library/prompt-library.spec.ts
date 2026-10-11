import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PromptLibrary } from './prompt-library';

describe('PromptLibrary', () => {
  let component: PromptLibrary;
  let fixture: ComponentFixture<PromptLibrary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromptLibrary],
    }).compileComponents();

    fixture = TestBed.createComponent(PromptLibrary);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
