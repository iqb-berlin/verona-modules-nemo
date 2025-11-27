import {
  Component, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UnitService } from '../../services/unit.service';

@Component({
  selector: 'stars-opening-image',
  templateUrl: './opening-image.component.html',
  styleUrls: ['./opening-image.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class OpeningImageComponent {
  unitService = inject(UnitService);
}
