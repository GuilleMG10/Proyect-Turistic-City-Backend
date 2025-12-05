import { Icon, DivIcon } from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Default marker icon (fixes leaflet default icon issue)
export const DefaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Custom icon with place number
export const createNumberedIcon = (number: number, isDark: boolean): DivIcon => {
  const bgColor = '#2563eb'; // blue-600
  const borderColor = isDark ? '#1f2937' : '#ffffff'; // gray-800 or white
  
  return new DivIcon({
    className: 'custom-numbered-icon',
    html: `
      <div style="
        background-color: ${bgColor};
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 14px;
        border: 3px solid ${borderColor};
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        font-family: system-ui, -apple-system, sans-serif;
      ">${number}</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};
