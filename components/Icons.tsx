import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  style?: any;
}

export const CameraIcon = ({ size = 24, color = "currentColor", style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
    <Path 
      d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1v6zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2z"
      fill={color}
    />
    <Path 
      d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"
      fill={color}
    />
  </Svg>
);

export const FlipIcon = ({ size = 24, color = "currentColor", style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
    <Path 
      fillRule="evenodd" 
      d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"
      fill={color}
    />
    <Path 
      d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"
      fill={color}
    />
  </Svg>
);

export const GalleryIcon = ({ size = 24, color = "currentColor", style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
    <Path 
      d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"
      fill={color}
    />
    <Path 
      d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"
      fill={color}
    />
  </Svg>
);

export const PhoneIcon = ({ size = 24, color = "currentColor", style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
    <Path 
      fillRule="evenodd" 
      d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"
      fill={color}
    />
  </Svg>
);

export const HomeIcon = ({ size = 24, color = "currentColor", style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
    <Path 
      fillRule="evenodd" 
      d="M2 13.5V7h1v6.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V7h1v6.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5zm11-11V6l-2-2V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5z"
      fill={color}
    />
    <Path 
      fillRule="evenodd" 
      d="M7.293 1.5a1 1 0 0 1 1.414 0l6.647 6.646a.5.5 0 0 1-.708.708L8 2.207 1.354 8.854a.5.5 0 1 1-.708-.708L7.293 1.5z"
      fill={color}
    />
  </Svg>
);

export const ChatIcon = ({ size = 24, color = "currentColor", style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
    <Path 
      d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
      fill={color}
    />
    <Path 
      d="m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9.06 9.06 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.437 10.437 0 0 1-1.769 3.515.41.41 0 0 0 .364.688zM8 2c3.866 0 7 2.686 7 6s-3.134 6-7 6c-.52 0-1.025-.051-1.513-.149-.441-.089-.861-.285-1.286-.519l-.314-.173c-.413-.228-.94-.433-1.492-.497.442-.645.895-1.4 1.157-2.212l.133-.43c.12-.39.141-.806.06-1.206-.118-.584-.336-1.13-.642-1.623A6.059 6.059 0 0 1 2 8c0-3.314 3.134-6 7-6z"
      fill={color}
    />
  </Svg>
);

export const MedicineIcon = ({ size = 24, color = "currentColor", style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
    <Path 
      d="M1.828 8.9 8.9 1.827a4 4 0 1 1 5.657 5.657l-7.07 7.071a4 4 0 1 1-5.658-5.657z"
      fill={color}
    />
    <Path 
      d="M5.408 5.2 8.4 8.216l-3.21 3.207-2.992-3.016 3.21-3.208z"
      fill={color}
    />
  </Svg>
);

export const ProfileIcon = ({ size = 24, color = "currentColor", style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
    <Path 
      d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
      fill={color}
    />
    <Path 
      fillRule="evenodd" 
      d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"
      fill={color}
    />
  </Svg>
);

export const WarningIcon = ({ size = 24, color = "currentColor", style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
    <Path 
      d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm-1.023-.592a1.13 1.13 0 0 0-1.96 0L.165 13.087a1.13 1.13 0 0 0 .98 1.745h13.71a1.13 1.13 0 0 0 .98-1.745L8.915 1.424z"
      fill={color}
    />
    <Path 
      d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"
      fill={color}
    />
  </Svg>
);
export const LogoIcon = ({ size = 24, color = "currentColor", style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
    <Path 
      d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1v6zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2z"
      fill={color}
    />
    <Circle cx="8" cy="9" r="2" fill={color} />
  </Svg>
);
