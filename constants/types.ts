export const HazardType: Record<string, string> = {
  landmine: "Landmine",
  accident: "Accident",
  uxo: "UXO",
  ied: "IED",
  notsure: "Not Sure",
};

export const HazardStatusType: Record<string, string> = {
  suspected: "Suspected",
  confirmed: "Confirmed",
  cleared: "Cleared",
  marked: "Marked",
};

export const MapTypeIcons: Record<string, any> = {
  terrain: require('@/assets/images/TerrainIcon.png'),
  satellite: require('@/assets/images/SatelliteIcon.png'),
  standard: require('@/assets/images/StandardIcon.png'),
  hybrid: require('@/assets/images/HybridIcon.png'),
};

export const CommunityPassword = "communigy_password";

// Constants
export const LOCATION_TASK_NAME = 'proximity-location-task';
export const TRACKING_LOCATIONS_KEY = 'trackingLocations';
export const REPORTS_KEY = "reports";
export const CURRENT_REPORTS_COUNT = 'reports_count';
export const PROXIMITY_LIMIT = 100; // meters
export const BEEP_SOUND_URI = require('@/assets/sounds/beep.mp3'); // Add your beep sound file