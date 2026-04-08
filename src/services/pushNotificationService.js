/**
 * Push Notification Service
 * Handles Web Push API for browser notifications
 */

class PushNotificationService {
  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    this.subscription = null;
    this.isEnabled = false;
  }

  /**
   * Check if push notifications are supported
   */
  isSupportedBrowser() {
    return this.isSupported;
  }

  /**
   * Request permission for push notifications
   */
  async requestPermission() {
    if (!this.isSupported) {
      console.warn('Push notifications not supported in this browser');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush() {
    if (!this.isSupported) {
      console.warn('Push notifications not supported');
      return null;
    }

    try {
      // First check if we have permission
      if (Notification.permission !== 'granted') {
        const granted = await this.requestPermission();
        if (!granted) {
          return null;
        }
      }

      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'BDdY_gAqR7LzXlVq2jQ8XzDxJx9z6X5M4WkP7nQ8R3tY2uI1oP0sK9eF6cB5vN8mG2hJ4kL1pQ3wE6rT9yU7iO5sA2dF4gH8jK1lN3cV5bX7z'
        )
      });

      this.subscription = subscription;
      this.isEnabled = true;
      console.log('Push subscription successful:', subscription);
      
      // Send subscription to backend
      await this.sendSubscriptionToBackend(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush() {
    if (!this.subscription) {
      return true;
    }

    try {
      await this.subscription.unsubscribe();
      this.subscription = null;
      this.isEnabled = false;
      
      // Remove subscription from backend
      await this.removeSubscriptionFromBackend();
      
      console.log('Successfully unsubscribed from push notifications');
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  /**
   * Send subscription to backend
   */
  async sendSubscriptionToBackend(subscription) {
    try {
      const response = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to backend');
      }

      console.log('Subscription sent to backend successfully');
    } catch (error) {
      console.error('Error sending subscription to backend:', error);
    }
  }

  /**
   * Remove subscription from backend
   */
  async removeSubscriptionFromBackend() {
    try {
      const response = await fetch('/api/push-subscription', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscription from backend');
      }

      console.log('Subscription removed from backend successfully');
    } catch (error) {
      console.error('Error removing subscription from backend:', error);
    }
  }

  /**
   * Show a local notification (for testing)
   */
  showLocalNotification(title, options = {}) {
    if (!this.isSupported || Notification.permission !== 'granted') {
      return;
    }

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }

  /**
   * Check current status
   */
  getStatus() {
    return {
      isSupported: this.isSupported,
      isEnabled: this.isEnabled,
      permission: Notification.permission,
      hasSubscription: !!this.subscription
    };
  }

  /**
   * Helper function to convert VAPID key
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;
