import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Clock, Bell, Edit, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Settings } from "@shared/schema";

export function TimeDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationTime, setNotificationTime] = useState("");
  const { toast } = useToast();

  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<Settings>) => {
      const res = await apiRequest("PUT", "/api/settings", updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings updated successfully" });
    },
  });

  const resetItemsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/items/reset");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({ title: "All items reset successfully" });
    },
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (settings) {
      setNotificationTime(settings.notificationTime);
    }
  }, [settings]);

  const formatTime = (date: Date) => {
    if (settings?.is24HourFormat) {
      return date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
    } else {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const toggleClockFormat = () => {
    if (settings) {
      updateSettingsMutation.mutate({
        is24HourFormat: !settings.is24HourFormat
      });
    }
  };

  const saveNotificationTime = () => {
    if (settings) {
      updateSettingsMutation.mutate({
        notificationTime: notificationTime
      });
      setShowNotificationModal(false);
    }
  };

  const getTimeUntilNextReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  if (!settings) return null;

  return (
    <div className="p-4 bg-white dark:bg-gray-900 border-b border-border">
      {/* Current Date & Time Display */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Date</div>
            <div className="text-lg font-medium text-foreground">
              {formatDate(currentTime)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Time</div>
            <div className="text-lg font-medium text-foreground">
              {formatTime(currentTime)}
            </div>
          </div>
        </div>
        
        {/* Clock Format Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleClockFormat}
          className="text-xs"
        >
          <Clock className="w-3 h-3 mr-1" />
          {settings.is24HourFormat ? "24H" : "12H"}
        </Button>
      </div>

      {/* Notification Time Setting */}
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg mb-3">
        <div className="flex items-center space-x-3">
          <Bell className="w-5 h-5 text-primary" />
          <div>
            <div className="text-sm font-medium text-foreground">Notification Time</div>
            <div className="text-xs text-muted-foreground">Daily reminder</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-foreground">
            {settings.notificationTime}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotificationModal(true)}
            className="p-2 text-primary hover:bg-blue-50 rounded-full"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Reset Timer */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <div>
              <div className="text-sm font-medium text-amber-800">Next Reset</div>
              <div className="text-xs text-amber-600">{getTimeUntilNextReset()}</div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => resetItemsMutation.mutate()}
            disabled={resetItemsMutation.isPending}
            className="text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            Reset Now
          </Button>
        </div>
      </div>

      {/* Notification Time Modal */}
      <Dialog open={showNotificationModal} onOpenChange={setShowNotificationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Notification Time</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="time"
              value={notificationTime}
              onChange={(e) => setNotificationTime(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNotificationModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveNotificationTime}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
