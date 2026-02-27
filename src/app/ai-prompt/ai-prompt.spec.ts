import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiPrompt } from './ai-prompt';

describe('AiPrompt', () => {
  let component: AiPrompt;
  let fixture: ComponentFixture<AiPrompt>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiPrompt]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiPrompt);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
