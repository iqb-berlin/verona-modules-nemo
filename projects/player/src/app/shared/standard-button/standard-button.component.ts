import { Component, input, OnInit, output } from '@angular/core';

import { ButtonTypeEnum } from "../../models/unit-definition";


@Component({
  selector: 'stars-standard-button',
  templateUrl: './standard-button.component.html',
  styleUrls: ['./standard-button.component.scss'],
  standalone: true
})

export class StandardButtonComponent implements OnInit {
  id=input.required<string>();
  value=input.required<number>();
  inputType = input<'radio'|'checkbox'>('radio');
  image = input<string>();
  text = input<string>();
  icon = input<string>();
  selected = input<boolean>();
  isSmallText = input<boolean>(false);
  type = input<ButtonTypeEnum>();
  buttonClick = output<void>();

  textMode = false;

  ngOnInit() {
    if (this.text() && !this.icon() && !this.image()) {
      this.textMode = true;
    }
    console.log(this.textMode);
  }

  onClick(): void {
    this.buttonClick.emit();
  }
}
