import { notificationService } from "@/lib/notificationService";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

interface NotificationContextType {
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  scheduleDailyReminder: (time: string) => Promise<boolean>;
  cancelDailyReminder: () => Promise<boolean>;
  checkGoalsAndNotify: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (user) {
      initializeNotifications();
    }

    return () => {
      notificationService.removeNotificationListeners();
    };
  }, [user]);

  const initializeNotifications = async () => {
    const granted = await notificationService.requestPermissions();
    setHasPermission(granted);

    if (granted && user) {
      const token = await notificationService.getExpoPushToken();
      if (token) {
        await notificationService.savePushToken(user.id, token);
      }
    }

    // Setup listeners
    notificationService.setupNotificationListeners(
      (notification) => {
        console.log("Received notification:", notification);
      },
      (response) => {
        console.log("User tapped notification:", response);
        // Handle navigation based on notification type
        const data = response.notification.request.content.data;
        // You can add navigation logic here
      }
    );
  };

  const requestPermission = async () => {
    const granted = await notificationService.requestPermissions();
    setHasPermission(granted);
    return granted;
  };

  const scheduleDailyReminder = async (time: string) => {
    if (!user || !hasPermission) return false;
    const id = await notificationService.scheduleDailyReminder(user.id, time);
    return id !== null;
  };

  const cancelDailyReminder = async () => {
    if (!user) return false;
    return await notificationService.cancelDailyReminder(user.id);
  };

  const checkGoalsAndNotify = async () => {
    if (!user || !hasPermission) return;
    await notificationService.checkGoalsAndNotify(user.id);
  };

  return (
    <NotificationContext.Provider
      value={{
        hasPermission,
        requestPermission,
        scheduleDailyReminder,
        cancelDailyReminder,
        checkGoalsAndNotify,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
}
