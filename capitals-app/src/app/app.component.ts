import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Importer FormsModule
import * as L from 'leaflet';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FormsModule], // Ajouter FormsModule aux imports
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'capitals-app';
  sidebarActive = false;
  showMap = true;
  showCapitals = false;
  isAddingNewCapital = false;

  capitals: { ville: string; pays: string; lat: number; lon: number; population: number; isEditing?: boolean }[] = [];

  newCapital = {
    ville: '',
    pays: '',
    lat: 0,
    lon: 0,
    population: 0
  };

  private map: L.Map | undefined;

  private readonly jsonFile = 'assets/capitals.json';

  ngOnInit() {
    if (this.showMap) {
      this.initMap();
    }
    if (this.showCapitals) {
      this.loadCapitals();
    }
  }

  displayMap() {
    this.showMap = true;
    this.showCapitals = false;
    setTimeout(() => this.initMap(), 0);
  }

  displayCapitals() {
    this.showMap = false;
    this.showCapitals = true;
    if (this.capitals.length === 0) {
      setTimeout(() => this.loadCapitals(), 0);
    }
  }

  private initMap(): void {
    const minZoom = 2;
    const maxZoom = 17;

    const myfrugalmap = L.map('frugalmap', {
      minZoom: minZoom,
      maxZoom: maxZoom
    }).setView([20, 0], 2);

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: 'Frugal Map'
    }).addTo(myfrugalmap);

    if (this.capitals.length === 0) {
      fetch(this.jsonFile)
        .then(response => response.json())
        .then(data => {
          this.capitals = data;
          this.saveCapitalsToStorage();
          this.capitals.forEach((capital: { ville: string; pays: string; lat: number; lon: number; population: number }) => {
            const marker = L.marker([capital.lat, capital.lon]).addTo(myfrugalmap);
            marker.bindPopup(`<b>${capital.ville}</b><br>Population: ${capital.population}`).openPopup();
          });
        })
        .catch(error => {
          console.error("Erreur lors du chargement des capitales: ", error);
        });
    } else {
      this.capitals.forEach((capital: { ville: string; pays: string; lat: number; lon: number; population: number }) => {
        const marker = L.marker([capital.lat, capital.lon]).addTo(myfrugalmap);
        marker.bindPopup(`<b>${capital.ville}</b><br>Population: ${capital.population}`).openPopup();
      });
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        myfrugalmap.setView([lat, lon], 12);

        const userMarker = L.marker([lat, lon]).addTo(myfrugalmap);
        userMarker.bindPopup("Vous êtes ici").openPopup();
      }, (error) => {
        console.error("Erreur de géolocalisation: ", error);
      });
    } else {
      console.error("La géolocalisation n'est pas supportée par ce navigateur.");
    }
  }

  private updateMapMarkers(map: L.Map): void {
    // Clear existing markers before adding new ones
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    this.capitals.forEach((capital: { ville: string; pays: string; lat: number; lon: number; population: number }) => {
      const marker = L.marker([capital.lat, capital.lon]).addTo(map);
      marker.bindPopup(`<b>${capital.ville}</b><br>Population: ${capital.population}`).openPopup();
    });
  }

  private loadCapitals(): void {
    fetch(this.jsonFile)
      .then(response => response.json())
      .then(data => {
        this.capitals = data;
        this.saveCapitalsToStorage();
      })
      .catch(error => {
        console.error("Erreur lors du chargement des capitales: ", error);
        this.capitals = [
          {
            "ville": "Paris",
            "pays": "France",
            "lat": 48.8566,
            "lon": 2.3522,
            "population": 2148000
          },
          {
            "ville": "Tokyo",
            "pays": "Japon",
            "lat": 35.6895,
            "lon": 139.6917,
            "population": 13929286
          },
          {
            "ville": "Washington D.C.",
            "pays": "États-Unis",
            "lat": 38.9072,
            "lon": -77.0369,
            "population": 692683
          },
          {
            "ville": "Canberra",
            "pays": "Australie",
            "lat": -35.2809,
            "lon": 149.1300,
            "population": 453424
          },
          {
            "ville": "Madrid",
            "pays": "Espagne",
            "lat": 40.4168,
            "lon": -3.7038,
            "population": 3266126
          }
        ];
      });
  }

  private saveCapitalsToStorage(): void {
    localStorage.setItem('capitalsData', JSON.stringify(this.capitals));
  }

  editCapital(index: number): void {
    this.capitals[index].isEditing = true;
  }

  saveCapital(index: number): void {
    this.capitals[index].isEditing = false;
    this.saveCapitalsToStorage();
    console.log('Capital updated:', this.capitals[index]);
  }

  cancelEdit(index: number): void {
    this.capitals[index].isEditing = false;
    this.loadCapitals();
  }

  deleteCapital(index: number): void {
    if (confirm("Are you sure you want to delete this capital?")) {
      this.capitals.splice(index, 1);
      this.saveCapitalsToStorage();
      this.updateMapMarkers(this.map!); // Ensure the map reference is valid
    }
  }

  downloadJSON(): void {
    const blob = new Blob([JSON.stringify(this.capitals, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'capitals.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  toggleNewCapitalForm(): void {
    this.isAddingNewCapital = !this.isAddingNewCapital;
  }

  addCapital(): void {
    if (this.newCapital.ville && this.newCapital.pays && this.newCapital.lat && this.newCapital.lon && this.newCapital.population) {
      this.capitals.push({
        ville: this.newCapital.ville,
        pays: this.newCapital.pays,
        lat: Number(this.newCapital.lat),
        lon: Number(this.newCapital.lon),
        population: Number(this.newCapital.population),
        isEditing: false
      });
      this.saveCapitalsToStorage();
      this.newCapital = { ville: '', pays: '', lat: 0, lon: 0, population: 0 };
      this.isAddingNewCapital = false;
      this.updateMapMarkers(this.map!);
    }
  }

  cancelNewCapital(): void {
    this.newCapital = { ville: '', pays: '', lat: 0, lon: 0, population: 0 };
    this.isAddingNewCapital = false;
  }
}
