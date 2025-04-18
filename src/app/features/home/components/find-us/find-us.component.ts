import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafePipe } from '../../../../core/pipes/safe.pipe';

@Component({
  selector: 'app-find-us',
  standalone: true,
  imports: [CommonModule, SafePipe],
  templateUrl: './find-us.component.html',
  styleUrl: './find-us.component.scss'
})
export class FindUsComponent implements OnInit {
  mapUrl: string = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.1233665964!2d-46.69336908507729!3d-23.593493484679224!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce5744d26228e9%3A0xf7074dbd172c7868!2sRua%20Funchal%2C%20418%20-%20Vila%20Ol%C3%ADmpia%2C%20S%C3%A3o%20Paulo%20-%20SP%2C%2004551-060!5e0!3m2!1spt-BR!2sbr!4v1684892123456!5m2!1spt-BR!2sbr";

  ngOnInit() {
    this.getUserLocation();
  }

  getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          this.updateMapWithUserLocation(latitude, longitude);
        },
        (error) => {
          console.error('Error getting user location:', error);
          // Keep default location if there's an error
        }
      );
    } else {
      console.log('Geolocation is not supported by this browser.');
    }
  }

  updateMapWithUserLocation(latitude: number, longitude: number) {
    // Create a new Google Maps embed URL with the user's coordinates
    this.mapUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${longitude}!3d${latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM4KwMzgnMTcuOSJOIDkwwrAyNScyOS4zIlc!5e0!3m2!1sen!2s!4v1620000000000!5m2!1sen!2s`;
  }
}
