import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './careers.html',
  styleUrl: './careers.css',
})
export class Careers {
  
  openPositions = signal([
    {
      id: 1,
      title: 'Senior Frontend Engineer',
      department: 'Engineering',
      location: 'Remote (US/Europe)',
      type: 'Full-time',
      isHot: true
    },
    {
      id: 2,
      title: 'AI Product Manager',
      department: 'Product',
      location: 'New York, NY or Remote',
      type: 'Full-time',
      isHot: true
    },
    {
      id: 3,
      title: 'Backend Systems Engineer (.NET)',
      department: 'Engineering',
      location: 'London, UK or Remote',
      type: 'Full-time',
      isHot: false
    },
    {
      id: 4,
      title: 'Product Designer (Bento UI Master)',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
      isHot: false
    }
  ]);

}
