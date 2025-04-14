import { Component, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CenterService } from '../../services/center.service'; // ✅ adapte le chemin

@Component({
  selector: 'app-maps',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.css']
})
export class MapsComponent implements AfterViewInit {
  private map: any;
  private userMarker: any;
  private userCircle: any;
  public currentLoc: { lat: number; lon: number } = { lat: 0, lon: 0 };
  private lastLoc: { lat: number; lon: number } = { lat: 0, lon: 0 };
  private addresse: string = '';
  private centersArray: { name: string; coords: [number, number]; address: string }[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private centerService: CenterService) {}

  async ngAfterViewInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      const L = await import('leaflet');
      this.initMap(L);
    }
  }

  private initMap(L: any): void {
    this.map = L.map('map').setView([36.8065, 10.1815], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);


    this.map.on('click', (e: any) => {
      L.popup()
        .setLatLng(e.latlng)
        .setContent(`Tu as cliqué ici :<br>lat ${e.latlng.lat}, lon ${e.latlng.lng}`)
        .openOn(this.map);
    });

    // 🔥 Appel API pour récupérer les centres
    this.centerService.getAllActiveCenters().subscribe({
      next: (response) => {
        console.log("Centres récupérés :", response.centers);
        this.centersArray = response.centers.map((center: any) => {
          const lat = parseFloat(center.lat);
          const lon = parseFloat(center.lon);
          const address = center.address;
          const name = center.name || 'Centre';

          // Ajouter le marker
          L.circle([lat, lon])
            .addTo(this.map)
            .bindPopup(`
              <b>Point le plus proche :</b> ${name}<br>
            <b>Adresse :</b> ${address}`);

          return { name, coords: [lat, lon], address };
        });
      },
      error: (err) => {
        console.error("Erreur API getAllCenters", err);
      }
    });

    // Géolocalisation utilisateur
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          this.currentLoc.lat = position.coords.latitude;
          this.currentLoc.lon = position.coords.longitude;

          if (
            Math.abs(this.currentLoc.lat - this.lastLoc.lat) > 0.001 ||
            Math.abs(this.currentLoc.lon - this.lastLoc.lon) > 0.001
          ) {
            this.updateUserLocation(L, this.currentLoc.lat, this.currentLoc.lon);
            this.lastLoc = { ...this.currentLoc };
          }
        },
        (error) => console.error("Erreur de géolocalisation: ", error),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    } else {
      console.error("La géolocalisation n'est pas supportée par ce navigateur.");
    }
  }

  private updateUserLocation(L: any, lat: number, lon: number): void {
    const position = [lat, lon];

    if (this.userCircle) {
      this.userCircle.setLatLng(position);
    } else {
      this.userCircle = L.circleMarker(position, {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: 8
      })
        .addTo(this.map)
        .bindPopup('Position actuelle');
    }

    this.map.setView(position, 13);
    this.highlightClosestLocation(L, lat, lon);
  }

  private highlightClosestLocation(L: any, userLat: number, userLng: number): void {
    if (!this.centersArray.length) return;

    const userPos = L.latLng(userLat, userLng);

    let closest = this.centersArray[0];
    let minDistance = userPos.distanceTo(L.latLng(closest.coords));

    this.centersArray.forEach(center => {
      const dist = userPos.distanceTo(L.latLng(center.coords));
      if (dist < minDistance) {
        closest = center;
        minDistance = dist;
      }
    });

    const [lat, lon] = closest.coords;

    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
      .then(res => res.json())
      .then(data => {
        this.addresse = data.display_name || 'Adresse non trouvée';

        L.marker([lat, lon], { icon: L.icon({ iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png' }) })
          .addTo(this.map)
          .bindPopup(`
            <b>Point le plus proche :</b> ${closest.name}<br>
            <b>Distance :</b> ${(minDistance / 1000).toFixed(2)} km<br>
            <b>Adresse :</b> ${this.addresse}
          `)
          .openPopup();
      })
      .catch(err => console.error('Erreur reverse geocoding:', err));
  }
}
