/**
 * Hydro Control Manager - Notification Service
 * 
 * Core Logic:
 * NotificationTime = AppointmentDateTime - 12 hours exactly.
 * 
 * Strict format:
 * «تذكير Hydro Control: لديك زيارة للعميل [الاسم] اليوم الساعة [الوقت]. العنوان: [العنوان]. الهاتف: [الهاتف].»
 */

import { Customer, Appointment } from '../types/database';

export interface ReminderCalculationResult {
  appointmentDateTime: Date;
  reminderDateTime: Date;
  isPastDue: boolean; // True if (appointmentDateTime - 12h) is already in the past
  hoursUntilReminder: number;
  readableReminderTime: string;
  readableAppointmentTime: string;
}

export interface ScheduledReminderJob {
  appointmentId: number;
  reminderId: number;
  reminderTime: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  appointmentTime: string;
  timerHandle?: number;
}

class NotificationService {
  private activeTimers = new Map<number, number>();
  private audioContext: AudioContext | null = null;

  constructor() {
    this.initAudio();
  }

  private initAudio() {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    } catch {
      // AudioContext unavailable
    }
  }

  // Play a clean acoustic two-tone alert chime
  playAlertChime() {
    try {
      if (!this.audioContext) {
        this.initAudio();
      }
      if (!this.audioContext) return;

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const now = this.audioContext.currentTime;

      // Tone 1: 587.33 Hz (D5)
      const osc1 = this.audioContext.createOscillator();
      const gain1 = this.audioContext.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(this.audioContext.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Tone 2: 880 Hz (A5)
      const osc2 = this.audioContext.createOscillator();
      const gain2 = this.audioContext.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.15);
      gain2.gain.setValueAtTime(0.2, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(this.audioContext.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.6);
    } catch {
      // Audio playback failed silently
    }
  }

  /**
   * Check Notification Permission state: 'granted' | 'denied' | 'default' | 'unsupported'
   */
  getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  /**
   * Request Notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    try {
      const res = await Notification.requestPermission();
      return res === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Calculate exact 12-hour prior reminder time
   * Formula: NotificationTime = AppointmentDateTime - 12 hours
   */
  calculateReminderTime(dateStr: string, timeStr: string): ReminderCalculationResult {
    // Construct local Date
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);

    const appointmentDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

    // Subtract exactly 12 hours (12 * 60 * 60 * 1000 ms)
    const reminderDateTime = new Date(appointmentDateTime.getTime() - 12 * 60 * 60 * 1000);

    const now = new Date();
    const isPastDue = reminderDateTime.getTime() <= now.getTime();
    const hoursUntilReminder = (reminderDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    const formatOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };

    return {
      appointmentDateTime,
      reminderDateTime,
      isPastDue,
      hoursUntilReminder,
      readableReminderTime: reminderDateTime.toLocaleDateString('ar-EG', formatOptions),
      readableAppointmentTime: appointmentDateTime.toLocaleDateString('ar-EG', formatOptions),
    };
  }

  /**
   * Generates exact notification message conforming to user spec:
   * «تذكير Hydro Control: لديك زيارة للعميل [الاسم] اليوم الساعة [الوقت]. العنوان: [العنوان]. الهاتف: [الهاتف].»
   */
  formatNotificationMessage(customer: Customer, appointment: Appointment): { title: string; body: string } {
    const formattedTime = this.formatArabicTime(appointment.appointment_time);
    const title = 'تذكير Hydro Control';
    const body = `لديك زيارة للعميل ${customer.name} اليوم الساعة ${formattedTime}. العنوان: ${customer.address}. الهاتف: ${customer.phone}.`;
    return { title, body };
  }

  formatArabicTime(time24: string): string {
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'مساءً' : 'صباحاً';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const minStr = m < 10 ? `0${m}` : `${m}`;
    return `${hour12}:${minStr} ${period}`;
  }

  /**
   * Schedule 12-hour notification for an appointment
   */
  scheduleAppointmentReminder(customer: Customer, appointment: Appointment): {
    scheduled: boolean;
    reason?: 'past_due' | 'cancelled_or_visited' | 'permission_denied';
    reminderDateTime?: Date;
  } {
    // Cancel any previous timer for this appointment
    this.cancelReminder(appointment.appointment_id);

    if (appointment.status === 'cancelled' || appointment.status === 'visited') {
      return { scheduled: false, reason: 'cancelled_or_visited' };
    }

    const calc = this.calculateReminderTime(appointment.appointment_date, appointment.appointment_time);

    // If appointment is less than 12 hours away, reminder time is in the past!
    // Per user prompt requirement: "إذا كان الموعد بعد أقل من 12 ساعة من تسجيله، وضّح أن وقت التذكير قد فات، ولا ترسل إشعارًا متأخرًا على أنه تذكير مسبق."
    if (calc.isPastDue) {
      return {
        scheduled: false,
        reason: 'past_due',
        reminderDateTime: calc.reminderDateTime,
      };
    }

    const delayMs = calc.reminderDateTime.getTime() - Date.now();

    // Schedule timer
    // Note: If delay is very long (more than 24.8 days, 32-bit int), handle gracefully
    if (delayMs > 0 && delayMs < 2147483647) {
      const timerId = window.setTimeout(() => {
        this.triggerNotification(customer, appointment);
        this.activeTimers.delete(appointment.appointment_id);
      }, delayMs);

      this.activeTimers.set(appointment.appointment_id, timerId);
    }

    // Also register with service worker if available for background wake
    this.registerWithServiceWorker(customer, appointment, calc.reminderDateTime);

    return {
      scheduled: true,
      reminderDateTime: calc.reminderDateTime,
    };
  }

  /**
   * Cancel scheduled reminder
   */
  cancelReminder(appointmentId: number) {
    const timer = this.activeTimers.get(appointmentId);
    if (timer) {
      clearTimeout(timer);
      this.activeTimers.delete(appointmentId);
    }
  }

  /**
   * Fire actual OS notification & audio chime
   */
  async triggerNotification(customer: Customer, appointment: Appointment) {
    const { title, body } = this.formatNotificationMessage(customer, appointment);
    this.playAlertChime();

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          const registration = await navigator.serviceWorker.ready;
          registration.showNotification(title, {
            body,
            icon: '/pwa-192x192.png',
            badge: '/icon.svg',
            tag: `hydro-reminder-${appointment.appointment_id}`,
            data: {
              appointmentId: appointment.appointment_id,
              customerId: customer.customer_id,
              phone: customer.phone,
              url: window.location.origin,
            },
            lang: 'ar',
            dir: 'rtl',
            vibrate: [200, 100, 200, 100, 200],
          } as NotificationOptions);
          return;
        }

        // Standard Window Notification fallback
        new Notification(title, {
          body,
          icon: '/pwa-192x192.png',
          tag: `hydro-reminder-${appointment.appointment_id}`,
          dir: 'rtl',
          lang: 'ar',
        });
      } catch (err) {
        console.warn('Could not display system notification:', err);
      }
    }
  }

  /**
   * Dispatch instant test notification to verify OS setup
   */
  async triggerInstantTestNotification(): Promise<boolean> {
    const granted = await this.requestPermission();
    this.playAlertChime();

    const title = 'تذكير Hydro Control (فحص تجريبي)';
    const body = 'لديك زيارة للعميل أحمد حسن اليوم الساعة 04:00 مساءً. العنوان: المعادي، شارع النصر، القاهرة. الهاتف: 01012345678.';

    if (granted && 'Notification' in window) {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, {
            body,
            icon: '/pwa-192x192.png',
            badge: '/icon.svg',
            tag: 'hydro-test-notification',
            vibrate: [200, 100, 200],
            lang: 'ar',
            dir: 'rtl',
          } as NotificationOptions);
          return true;
        }

        new Notification(title, {
          body,
          icon: '/pwa-192x192.png',
          tag: 'hydro-test-notification',
          dir: 'rtl',
          lang: 'ar',
        });
        return true;
      } catch (err) {
        console.error('Test notification failed:', err);
      }
    }

    return false;
  }

  private registerWithServiceWorker(
    customer: Customer,
    appointment: Appointment,
    reminderTime: Date
  ) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_REMINDER',
        payload: {
          appointmentId: appointment.appointment_id,
          reminderTimestamp: reminderTime.getTime(),
          customerName: customer.name,
          customerPhone: customer.phone,
          customerAddress: customer.address,
          appointmentTime: appointment.appointment_time,
        },
      });
    }
  }
}

export const notificationService = new NotificationService();
