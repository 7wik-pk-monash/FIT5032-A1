// Leaflet icon fix utility
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Fix Leaflet default icons for production builds
export function fixLeafletIcons() {
  // Delete the default icon URL getter
  delete L.Icon.Default.prototype._getIconUrl

  // Set the correct icon URLs
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
  })
}

// Create custom icons if needed
export function createCustomIcon(options = {}) {
  return L.icon({
    iconUrl: options.iconUrl || markerIcon,
    iconRetinaUrl: options.iconRetinaUrl || markerIcon2x,
    shadowUrl: options.shadowUrl || markerShadow,
    iconSize: options.iconSize || [25, 41],
    iconAnchor: options.iconAnchor || [12, 41],
    popupAnchor: options.popupAnchor || [1, -34],
    shadowSize: options.shadowSize || [41, 41]
  })
}

// Export the fixed L object
export { L }
