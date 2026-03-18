"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Users, 
  Settings, 
  Volume2, 
  VolumeX, 
  Monitor, 
  Smartphone,
  Gamepad2,
  Target,
  Navigation,
  Zap,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow
} from "lucide-react";

interface GameStatsProps {
  score: number;
  activePlayers: number;
  isMobile?: boolean;
}

export function GameStats({ score, activePlayers, isMobile = false }: GameStatsProps) {
  return (
    <Card className={`bg-black/80 backdrop-blur-sm border-white/20 ${
      isMobile ? 'scale-90' : ''
    }`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <div className={`font-bold text-white ${isMobile ? 'text-lg' : 'text-2xl'}`}>
            {score.toLocaleString()}
          </div>
        </div>
        <Badge className="bg-slate-700 text-white">
          <Users className="w-3 h-3 mr-1" />
          {activePlayers} Players
        </Badge>
      </CardContent>
    </Card>
  );
}

interface GameSettingsProps {
  soundEnabled: boolean;
  quality: "high" | "medium" | "low";
  onSoundToggle: () => void;
  onQualityChange: (quality: "high" | "medium" | "low") => void;
  isMobile?: boolean;
}

export function GameSettings({ 
  soundEnabled, 
  quality, 
  onSoundToggle, 
  onQualityChange,
  isMobile = false 
}: GameSettingsProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(100);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Get battery level if available
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      }).catch(() => {
        // Battery API not supported
      });
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Card className={`bg-black/80 backdrop-blur-sm border-white/20 ${
      isMobile ? 'scale-90' : ''
    }`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Game Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white">Sound</span>
          <Button 
            size="default"
            variant="secondary"
            onClick={onSoundToggle}
            className="w-12 h-6 p-0"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-white">Quality</span>
          <select 
            value={quality}
            onChange={(e) => onQualityChange(e.target.value as "high" | "medium" | "low")}
            className="bg-black/60 text-white px-2 py-1 rounded border border-white/20 text-sm"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* System Status */}
        <div className="pt-2 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Connection</span>
            <div className="flex items-center gap-1">
              {isOnline ? (
                <Wifi className="w-3 h-3 text-green-500" />
              ) : (
                <WifiOff className="w-3 h-3 text-red-500" />
              )}
              <span className="text-xs text-slate-300">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          
          {batteryLevel !== null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Battery</span>
              <div className="flex items-center gap-1">
                {batteryLevel > 20 ? (
                  <Battery className="w-3 h-3 text-green-500" />
                ) : (
                  <BatteryLow className="w-3 h-3 text-red-500" />
                )}
                <span className="text-xs text-slate-300">{batteryLevel}%</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface GameFeedProps {
  feed: string[];
  isMobile?: boolean;
}

export function GameFeed({ feed, isMobile = false }: GameFeedProps) {
  return (
    <Card className={`bg-black/80 backdrop-blur-sm border-white/20 max-w-sm ${
      isMobile ? 'scale-90' : ''
    }`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
          <Target className="w-4 h-4" />
          Latest News
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-32 space-y-1 overflow-y-auto text-xs">
          {feed.length ? (
            feed.map((item, index) => (
              <p key={`${item}-${index}`} className="text-slate-300 animate-pulse">
                {item}
              </p>
            ))
          ) : (
            <p className="text-slate-500">No events yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ControlsInfoProps {
  isMobile?: boolean;
}

export function ControlsInfo({ isMobile = false }: ControlsInfoProps) {
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('desktop');

  useEffect(() => {
    const checkDevice = () => {
      setDeviceType(window.innerWidth < 768 ? 'mobile' : 'desktop');
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return (
    <Card className={`bg-black/80 backdrop-blur-sm border-white/20 ${
      isMobile ? 'scale-90' : ''
    }`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          {deviceType === 'mobile' ? (
            <Smartphone className="w-4 h-4 text-blue-400" />
          ) : (
            <Monitor className="w-4 h-4 text-green-400" />
          )}
          <span className="text-xs font-bold text-white capitalize">
            {deviceType} Controls
          </span>
        </div>
        
        <div className="text-xs space-y-1 text-white">
          <div className="flex items-center gap-1">
            <Navigation className="w-3 h-3" />
            WASD/Arrows - Move
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            Space/X - Shoot
          </div>
          {deviceType === 'desktop' && (
            <div className="flex items-center gap-1">
              <Gamepad2 className="w-3 h-3" />
              Mouse - Camera
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveLayout({ children, className = "" }: ResponsiveLayoutProps) {
  const [screenSize, setScreenSize] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('lg');

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 640) setScreenSize('xs');
      else if (width < 768) setScreenSize('sm');
      else if (width < 1024) setScreenSize('md');
      else if (width < 1280) setScreenSize('lg');
      else setScreenSize('xl');
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  const getResponsiveClasses = () => {
    switch (screenSize) {
      case 'xs':
        return 'p-2 gap-2';
      case 'sm':
        return 'p-3 gap-3';
      case 'md':
        return 'p-4 gap-4';
      case 'lg':
        return 'p-6 gap-6';
      case 'xl':
        return 'p-8 gap-8';
      default:
        return 'p-4 gap-4';
    }
  };

  return (
    <div className={`responsive-layout ${getResponsiveClasses()} ${className}`}>
      {children}
    </div>
  );
}

// Performance Monitor Component
interface PerformanceMonitorProps {
  fps: number;
  ping: number;
  quality: "high" | "medium" | "low";
}

export function PerformanceMonitor({ fps, ping, quality }: PerformanceMonitorProps) {
  const getFpsColor = (fps: number) => {
    if (fps >= 55) return 'text-green-500';
    if (fps >= 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getPingColor = (ping: number) => {
    if (ping < 50) return 'text-green-500';
    if (ping < 100) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-red-500';
      default: return 'text-slate-500';
    }
  };

  return (
    <Card className="bg-black/80 backdrop-blur-sm border-white/20">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span className="text-xs font-bold text-white">Performance</span>
        </div>
        
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">FPS:</span>
            <span className={`font-mono ${getFpsColor(fps)}`}>{fps}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Ping:</span>
            <span className={`font-mono ${getPingColor(ping)}`}>{ping}ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Quality:</span>
            <span className={`font-mono ${getQualityColor(quality)}`}>{quality}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
