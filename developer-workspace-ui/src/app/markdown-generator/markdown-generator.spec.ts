import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkdownGenerator } from './markdown-generator';

describe('MarkdownGenerator', () => {
  let component: MarkdownGenerator;
  let fixture: ComponentFixture<MarkdownGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkdownGenerator],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkdownGenerator);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
