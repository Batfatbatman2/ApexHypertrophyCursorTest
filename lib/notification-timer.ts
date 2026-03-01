import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface TimerNotificationConfig {
  id?: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: boolean;
}

class TimerNotificationService {
  private channelId = 'rest-timer';
  private isInitialized = false;

  /**
   * Initialize the notification service and create Android channel
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Create Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(this.channelId, {
          name: 'Rest Timer',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF2D2D',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: false,
          sound: 'default',
        });
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  /**
   * Show timer started notification
   */
  async showTimerStarted(duration: number): Promise<string | null> {
    await this.initialize();

    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const timeStr = minutes > 0 
      ? `${minutes}:${seconds.toString().padStart(2, '0')}`
      : `${seconds}s`;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏱️ Rest Timer Started',
        body: `Rest for ${timeStr}`,
        data: { type: 'timer_started', duration },
        sound: false,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Show immediately
    });

    return notificationId;
  }

  /**
   * Show countdown notification (updates every 10 seconds)
   */
  async showCountdown(remainingSeconds: number): Promise<string | null> {
    await this.initialize();

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const timeStr = minutes > 0 
      ? `${minutes}:${seconds.toString().padStart(2, '0')}`
      : `${seconds}s`;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏱️ Rest Timer',
        body: `${timeStr} remaining`,
        data: { type: 'timer_countdown', remaining: remainingSeconds },
        sound: false,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });

    return notificationId;
  }

  /**
   * Show timer complete notification (with sound)
   */
  async showTimerComplete(): Promise<string | null> {
    await this.initialize();

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Rest Complete!',
        body: 'Time to start your next set',
        data: { type: 'timer_complete' },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        autoDismiss: true,
        sticky: false,
      },
      trigger: null,
    });

    return notificationId;
  }

  /**
   * Schedule a timer notification
   */
  async scheduleTimer(durationSeconds: number): Promise<string | null> {
    await this.initialize();

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏱️ Rest Timer',
        body: `${durationSeconds}s remaining`,
        data: { type: 'timer_scheduled', duration: durationSeconds },
        sound: false,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        seconds: durationSeconds,
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      },
    });

    return notificationId;
  }

  /**
   * Cancel a specific notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Cancel all timer notifications
   */
  async cancelAllTimerNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Add notification received listener
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Add notification response listener
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Dismiss all notifications
   */
  async dismissAll(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  }
}

// Singleton instance
export const timerNotifications = new TimerNotificationService();
