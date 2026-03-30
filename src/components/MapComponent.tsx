import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper to update map view when coordinates are found
const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  map.setView(center, 15);
  return null;
};

interface AddressMapProps {
  address: string;
}

const circleOptions = {
    fillColor: '#3880ff', // Ionic Primary Blue
    color: '#3880ff',     // Border color
    weight: 1,            // Border thickness
    opacity: 0.5,
    fillOpacity: 0.2,     // Transparency of the center
  };

const AddressMap: React.FC<AddressMapProps> = ({ address }) => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const geocodeAddress = async () => {
      if (!address) return;
      setLoading(true);
      try {
        // Using Nominatim (Free OpenStreetMap Geocoder)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setPosition([lat, lon]);
        }
      } catch (error) {
        console.error("Geocoding error:", error);
      } finally {
        setLoading(false);
      }
    };

    geocodeAddress();
  }, [address]);

  if (loading) return <div className="ion-padding">Searching for location...</div>;
  if (!position) return <div className="ion-padding">Location not found on map.</div>;

  return (
    <MapContainer 
      center={position} 
      zoom={15} 
      style={{ height: '100%', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} />
      <Circle 
        center={position} 
        pathOptions={circleOptions} 
        radius={500} 
      />
      <ChangeView center={position} />
    </MapContainer>
  );
};

export default AddressMap;