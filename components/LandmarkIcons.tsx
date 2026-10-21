import React from 'react';
import Svg, { Path, Rect, Circle, Line, Polygon } from 'react-native-svg';

interface LandmarkProps {
    size?: number;
    color?: string;
}

// Hyderabad - Charminar
export const CharminarIcon = ({ size = 36, color = "#8A2BE2" }: LandmarkProps) => (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Rect x="14" y="52" width="36" height="4" rx="1" fill={color} />
        <Rect x="18" y="26" width="28" height="26" rx="2" fill={color} opacity={0.2} stroke={color} strokeWidth="2" />
        <Path d="M26 52V38C26 34.6863 28.6863 32 32 32C35.3137 32 38 34.6863 38 38V52" stroke={color} strokeWidth="2.5" fill="none" />
        <Rect x="16" y="24" width="32" height="4" rx="1" fill={color} />
        
        {/* Left Minaret */}
        <Rect x="12" y="14" width="5" height="38" rx="1" fill={color} />
        <Path d="M11 14H18L14.5 8L11 14Z" fill={color} />
        <Circle cx="14.5" cy="7" r="1.5" fill={color} />
        <Rect x="11" y="22" width="7" height="2" rx="0.5" fill={color} />
        <Rect x="11" y="34" width="7" height="2" rx="0.5" fill={color} />
        
        {/* Right Minaret */}
        <Rect x="47" y="14" width="5" height="38" rx="1" fill={color} />
        <Path d="M46 14H53L49.5 8L46 14Z" fill={color} />
        <Circle cx="49.5" cy="7" r="1.5" fill={color} />
        <Rect x="46" y="22" width="7" height="2" rx="0.5" fill={color} />
        <Rect x="46" y="34" width="7" height="2" rx="0.5" fill={color} />
        
        {/* Center Domes */}
        <Path d="M25 24C25 20 27 18 29 18C31 18 31 20 31 24" stroke={color} strokeWidth="1.5" fill="none" />
        <Path d="M33 24C33 20 35 18 35 18C37 18 39 20 39 24" stroke={color} strokeWidth="1.5" fill="none" />
        <Circle cx="32" cy="18" r="2.5" fill={color} />
    </Svg>
);

// Mumbai - Gateway of India
export const GatewayIcon = ({ size = 36, color = "#8A2BE2" }: LandmarkProps) => (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Rect x="8" y="52" width="48" height="4" rx="1" fill={color} />
        <Rect x="14" y="20" width="36" height="32" rx="2" fill={color} opacity={0.2} stroke={color} strokeWidth="2" />
        <Path d="M24 52V34C24 29 27.5 26 32 26C36.5 26 40 29 40 34V52" stroke={color} strokeWidth="2.5" fill="none" />
        <Path d="M17 52V42C17 40 18 39 20 39C22 39 23 40 23 42V52" stroke={color} strokeWidth="1.5" fill="none" />
        <Path d="M41 52V42C41 40 42 39 44 39C46 39 47 40 47 42V52" stroke={color} strokeWidth="1.5" fill="none" />
        
        {/* Turrets */}
        <Rect x="12" y="16" width="6" height="36" rx="1" fill={color} />
        <Path d="M12 16C12 12 15 10 15 10C15 10 18 12 18 16" fill={color} />
        <Rect x="46" y="16" width="6" height="36" rx="1" fill={color} />
        <Path d="M46 16C46 12 49 10 49 10C49 10 52 12 52 16" fill={color} />
        
        {/* Dome */}
        <Path d="M26 20C26 14 32 12 32 12C32 12 38 14 38 20" fill={color} />
        <Line x1="32" y1="12" x2="32" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Rect x="11" y="19" width="42" height="3" rx="1" fill={color} />
    </Svg>
);

// Bangalore - Vidhana Soudha
export const VidhanaSoudhaIcon = ({ size = 36, color = "#8A2BE2" }: LandmarkProps) => (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Rect x="8" y="52" width="48" height="4" rx="1" fill={color} />
        <Rect x="12" y="49" width="40" height="3" fill={color} opacity={0.6} />
        <Rect x="14" y="32" width="36" height="17" fill={color} opacity={0.2} stroke={color} strokeWidth="1.5" />
        
        {/* Pillars */}
        <Line x1="20" y1="32" x2="20" y2="49" stroke={color} strokeWidth="2" />
        <Line x1="26" y1="32" x2="26" y2="49" stroke={color} strokeWidth="2" />
        <Line x1="32" y1="32" x2="32" y2="49" stroke={color} strokeWidth="2" />
        <Line x1="38" y1="32" x2="38" y2="49" stroke={color} strokeWidth="2" />
        <Line x1="44" y1="32" x2="44" y2="49" stroke={color} strokeWidth="2" />
        
        {/* Cornice & Pediment */}
        <Rect x="12" y="29" width="40" height="3" fill={color} />
        <Polygon points="22,29 42,29 32,22" fill={color} />
        
        {/* Central Dome */}
        <Path d="M26 22C26 15 32 13 32 13C32 13 38 15 38 22" fill={color} />
        <Line x1="32" y1="13" x2="32" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <Circle cx="32" cy="7" r="1.5" fill={color} />
        
        {/* Side Domes */}
        <Path d="M13 29C13 25 15 23 16 23C17 23 19 25 19 29" fill={color} />
        <Path d="M45 29C45 25 47 23 48 23C49 23 51 25 51 29" fill={color} />
    </Svg>
);

// Vijayawada - Kanaka Durga Temple
export const TempleIcon = ({ size = 36, color = "#8A2BE2" }: LandmarkProps) => (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Rect x="10" y="52" width="44" height="4" rx="1" fill={color} />
        <Rect x="16" y="40" width="32" height="12" fill={color} opacity={0.2} stroke={color} strokeWidth="1.5" />
        <Path d="M27 52V44C27 41.5 29 40 32 40C35 40 37 41.5 37 44V52" fill={color} />
        
        {/* Tiered Gopuram */}
        <Rect x="14" y="36" width="36" height="4" rx="1" fill={color} />
        <Rect x="18" y="30" width="28" height="6" fill={color} opacity={0.3} stroke={color} strokeWidth="1.5" />
        <Rect x="16" y="28" width="32" height="3" rx="1" fill={color} />
        <Rect x="21" y="23" width="22" height="5" fill={color} opacity={0.3} stroke={color} strokeWidth="1.5" />
        <Rect x="19" y="21" width="26" height="3" rx="1" fill={color} />
        <Rect x="24" y="17" width="16" height="4" fill={color} opacity={0.4} stroke={color} strokeWidth="1.5" />
        
        {/* Shikara Top with Kalasams */}
        <Path d="M22 17C22 13 32 10 32 10C32 10 42 13 42 17Z" fill={color} />
        <Line x1="32" y1="10" x2="32" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <Circle cx="32" cy="4" r="1.5" fill={color} />
        <Circle cx="27" cy="6" r="1.2" fill={color} />
        <Circle cx="37" cy="6" r="1.2" fill={color} />
    </Svg>
);

// Visakhapatnam - Dolphin's Nose Lighthouse & Coast
export const LighthouseIcon = ({ size = 36, color = "#8A2BE2" }: LandmarkProps) => (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        {/* Ocean Waves */}
        <Path d="M8 54C12 52 16 56 20 54C24 52 28 56 32 54C36 52 40 56 44 54C48 52 52 56 56 54" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M12 59C16 57 20 61 24 59C28 57 32 61 36 59C40 57 44 61 48 59C52 57 56 61 60 59" stroke={color} strokeWidth="2" strokeLinecap="round" opacity={0.6} />
        
        {/* Lighthouse Tower */}
        <Polygon points="26,50 38,50 36,22 28,22" fill={color} opacity={0.2} stroke={color} strokeWidth="2" />
        <Line x1="27" y1="31" x2="37" y2="31" stroke={color} strokeWidth="2" />
        <Line x1="28" y1="41" x2="36" y2="41" stroke={color} strokeWidth="2" />
        
        {/* Lantern Room & Dome */}
        <Rect x="24" y="20" width="16" height="3" rx="1" fill={color} />
        <Rect x="27" y="14" width="10" height="6" fill={color} opacity={0.4} stroke={color} strokeWidth="1.5" />
        <Path d="M26 14C26 9 32 8 32 8C32 8 38 9 38 14Z" fill={color} />
        <Circle cx="32" cy="6" r="1.5" fill={color} />
        
        {/* Beacon Light Rays */}
        <Line x1="38" y1="16" x2="52" y2="10" stroke={color} strokeWidth="2" strokeDasharray="3,3" strokeLinecap="round" />
        <Line x1="38" y1="18" x2="56" y2="18" stroke={color} strokeWidth="2" strokeDasharray="3,3" strokeLinecap="round" />
        <Line x1="38" y1="20" x2="50" y2="26" stroke={color} strokeWidth="2" strokeDasharray="3,3" strokeLinecap="round" />
    </Svg>
);

// Delhi - India Gate
export const IndiaGateIcon = ({ size = 36, color = "#8A2BE2" }: LandmarkProps) => (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Rect x="10" y="52" width="44" height="4" rx="1" fill={color} />
        <Rect x="16" y="22" width="32" height="30" rx="1" fill={color} opacity={0.2} stroke={color} strokeWidth="2" />
        <Path d="M24 52V34C24 29 27.5 26 32 26C36.5 26 40 29 40 34V52" stroke={color} strokeWidth="3" fill="none" />
        <Line x1="16" y1="40" x2="24" y2="40" stroke={color} strokeWidth="1.5" />
        <Line x1="40" y1="40" x2="48" y2="40" stroke={color} strokeWidth="1.5" />
        <Rect x="14" y="20" width="36" height="3" fill={color} />
        <Rect x="17" y="14" width="30" height="6" fill={color} opacity={0.5} stroke={color} strokeWidth="1.5" />
        <Rect x="20" y="12" width="24" height="2" fill={color} />
        <Path d="M26 12C26 9 32 8 32 8C32 8 38 9 38 12Z" fill={color} />
    </Svg>
);

// Chennai - Central Station Clock Tower
export const ChennaiIcon = ({ size = 36, color = "#8A2BE2" }: LandmarkProps) => (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Rect x="10" y="52" width="44" height="4" rx="1" fill={color} />
        <Rect x="12" y="34" width="40" height="18" fill={color} opacity={0.2} stroke={color} strokeWidth="1.5" />
        <Path d="M16 52V44C16 42 17 40 19 40C21 40 22 42 22 44V52" stroke={color} strokeWidth="1.5" />
        <Path d="M42 52V44C42 42 43 40 45 40C47 40 48 42 48 44V52" stroke={color} strokeWidth="1.5" />
        
        {/* Clock Tower */}
        <Rect x="26" y="16" width="12" height="36" fill={color} opacity={0.3} stroke={color} strokeWidth="2" />
        <Circle cx="32" cy="25" r="3.5" fill="none" stroke={color} strokeWidth="1.5" />
        <Line x1="32" y1="25" x2="32" y2="23" stroke={color} strokeWidth="1" strokeLinecap="round" />
        <Line x1="32" y1="25" x2="33.5" y2="25" stroke={color} strokeWidth="1" strokeLinecap="round" />
        <Polygon points="24,16 40,16 32,8" fill={color} />
        <Line x1="32" y1="8" x2="32" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
);

// Kolkata - Howrah Bridge
export const BridgeIcon = ({ size = 36, color = "#8A2BE2" }: LandmarkProps) => (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Path d="M8 54C14 52 20 56 26 54C32 52 38 56 44 54C50 52 56 56 60 54" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <Line x1="8" y1="46" x2="56" y2="46" stroke={color} strokeWidth="3" />
        
        {/* Pylons */}
        <Line x1="18" y1="46" x2="22" y2="16" stroke={color} strokeWidth="2.5" />
        <Line x1="26" y1="46" x2="22" y2="16" stroke={color} strokeWidth="2.5" />
        <Line x1="19" y1="30" x2="25" y2="30" stroke={color} strokeWidth="1.5" />
        
        <Line x1="38" y1="46" x2="42" y2="16" stroke={color} strokeWidth="2.5" />
        <Line x1="46" y1="46" x2="42" y2="16" stroke={color} strokeWidth="2.5" />
        <Line x1="39" y1="30" x2="45" y2="30" stroke={color} strokeWidth="1.5" />
        
        {/* Truss */}
        <Path d="M8 32L22 16L32 26L42 16L56 32" stroke={color} strokeWidth="2" fill="none" />
        <Line x1="32" y1="26" x2="32" y2="46" stroke={color} strokeWidth="1.5" strokeDasharray="2,2" />
    </Svg>
);

// Helper function to get landmark icon by city name
export const getCityLandmarkIcon = (cityName: string, size = 36, color = "#8A2BE2") => {
    const norm = cityName.trim().toLowerCase();
    if (norm.includes('hyderabad') || norm.includes('secunderabad')) {
        return <CharminarIcon size={size} color={color} />;
    }
    if (norm.includes('mumbai') || norm.includes('bombay')) {
        return <GatewayIcon size={size} color={color} />;
    }
    if (norm.includes('bangalore') || norm.includes('bengaluru') || norm.includes('banglore')) {
        return <VidhanaSoudhaIcon size={size} color={color} />;
    }
    if (norm.includes('vijayawada') || norm.includes('tirupati') || norm.includes('kanaka')) {
        return <TempleIcon size={size} color={color} />;
    }
    if (norm.includes('visakhapatnam') || norm.includes('vizag')) {
        return <LighthouseIcon size={size} color={color} />;
    }
    if (norm.includes('delhi') || norm.includes('new delhi')) {
        return <IndiaGateIcon size={size} color={color} />;
    }
    if (norm.includes('chennai') || norm.includes('madras')) {
        return <ChennaiIcon size={size} color={color} />;
    }
    if (norm.includes('kolkata') || norm.includes('calcutta')) {
        return <BridgeIcon size={size} color={color} />;
    }
    // Default fallback
    return <TempleIcon size={size} color={color} />;
};
