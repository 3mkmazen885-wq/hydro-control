/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { DashboardView } from './components/DashboardView';
import { CustomersView } from './components/CustomersView';
import { AppointmentsView } from './components/AppointmentsView';
import { NotificationsCenter } from './components/NotificationsCenter';
import { BackupExportView } from './components/BackupExportView';
import { CustomerModal, CustomerAppointmentScheduleData } from './components/CustomerModal';
import { AppointmentModal } from './components/AppointmentModal';
import { dbService } from './services/db';
import { notificationService } from './services/notifications';
import { Customer, Appointment, AppointmentWithCustomer, AppointmentStatus } from './types/database';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Database State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [appointments, setAppointments] = useState<AppointmentWithCustomer[]>([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    todayAppointments: 0,
    tomorrowAppointments: 0,
    upcomingAppointments: 0,
    needsConfirmation: 0,
    rescheduledAppointments: 0,
  });

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
  const [appointmentDefaultCustomerId, setAppointmentDefaultCustomerId] = useState<number | null>(null);

  // Load all data from IndexedDB
  const loadData = useCallback(async () => {
    try {
      const [allCustomers, allAppointmentsWithCustomers, dashboardStats] = await Promise.all([
        dbService.getCustomers(),
        dbService.getAppointmentsWithCustomers(),
        dbService.getDashboardStats(),
      ]);

      setCustomers(allCustomers);
      setAppointments(allAppointmentsWithCustomers);
      setStats(dashboardStats);

      // Re-schedule all active upcoming reminders (e.g. after reload or boot)
      allAppointmentsWithCustomers.forEach((apt) => {
        if (apt.customer && apt.status !== 'cancelled' && apt.status !== 'visited') {
          notificationService.scheduleAppointmentReminder(apt.customer, apt);
        }
      });
    } catch (err) {
      console.error('Failed to load data from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Customer Add / Edit (with optional direct appointment booking)
  const handleSaveCustomer = async (
    customerData: Omit<Customer, 'customer_id' | 'created_at'>,
    customerId?: number,
    appointmentData?: CustomerAppointmentScheduleData
  ) => {
    let savedCustomer: Customer;

    if (customerId) {
      const existing = customers.find((c) => c.customer_id === customerId);
      if (existing) {
        savedCustomer = await dbService.updateCustomer({
          ...existing,
          ...customerData,
        });
      } else {
        return;
      }
    } else {
      savedCustomer = await dbService.addCustomer(customerData);
    }

    // If an appointment was booked directly from the customer modal
    if (appointmentData) {
      const calc = notificationService.calculateReminderTime(
        appointmentData.appointment_date,
        appointmentData.appointment_time
      );
      const reminderStatus = calc.isPastDue ? 'due_passed' : 'scheduled';

      const savedApt = await dbService.addAppointment({
        customer_id: savedCustomer.customer_id,
        appointment_date: appointmentData.appointment_date,
        appointment_time: appointmentData.appointment_time,
        service_type: 'كشف تسريب مياه',
        technician_name: undefined,
        status: 'confirmed',
        notes: undefined,
        reminder_status: reminderStatus,
        reminder_id: Date.now(),
      });

      // Schedule 12-hour notification for the new visit
      notificationService.scheduleAppointmentReminder(savedCustomer, savedApt);
    }

    await loadData();
  };

  // Handle Customer Deletion
  const handleDeleteCustomer = async (customerId: number) => {
    await dbService.deleteCustomer(customerId, true);
    await loadData();
  };

  // Handle Appointment Add / Edit
  const handleSaveAppointment = async (
    appointmentData: Omit<Appointment, 'appointment_id' | 'created_at' | 'updated_at'>,
    appointmentId?: number
  ) => {
    let savedAppointment: Appointment;

    if (appointmentId) {
      const existing = appointments.find((a) => a.appointment_id === appointmentId);
      if (existing) {
        savedAppointment = await dbService.updateAppointment({
          ...existing,
          ...appointmentData,
        });
      } else {
        return;
      }
    } else {
      savedAppointment = await dbService.addAppointment(appointmentData);
    }

    // Schedule or update 12-hour notification
    const customer = customers.find((c) => c.customer_id === savedAppointment.customer_id);
    if (customer) {
      notificationService.scheduleAppointmentReminder(customer, savedAppointment);
    }

    await loadData();
  };

  // Handle Appointment Status Change (Confirmed, Visited, Cancelled)
  const handleUpdateAppointmentStatus = async (
    appointmentId: number,
    newStatus: AppointmentStatus
  ) => {
    const existing = appointments.find((a) => a.appointment_id === appointmentId);
    if (!existing) return;

    const updated = await dbService.updateAppointment({
      ...existing,
      status: newStatus,
    });

    if (newStatus === 'cancelled' || newStatus === 'visited') {
      notificationService.cancelReminder(appointmentId);
    } else if (existing.customer) {
      notificationService.scheduleAppointmentReminder(existing.customer, updated);
    }

    await loadData();
  };

  // Handle Appointment Rescheduling
  const handleRescheduleAppointment = async (
    apt: AppointmentWithCustomer,
    newDate: string,
    newTime: string
  ) => {
    const updated = await dbService.updateAppointment({
      ...apt,
      appointment_date: newDate,
      appointment_time: newTime,
      status: 'rescheduled',
    });

    // Automatically reschedule 12-hour notification with new timestamp
    if (apt.customer) {
      notificationService.scheduleAppointmentReminder(apt.customer, updated);
    }

    await loadData();
  };

  // Handle Appointment Deletion
  const handleDeleteAppointment = async (appointmentId: number) => {
    notificationService.cancelReminder(appointmentId);
    await dbService.deleteAppointment(appointmentId);
    await loadData();
  };

  // Today & Tomorrow appointments for quick display
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const todayVisits = appointments.filter(
    (a) => a.appointment_date === todayStr && a.status !== 'cancelled'
  );
  const tomorrowVisits = appointments.filter(
    (a) => a.appointment_date === tomorrowStr && a.status !== 'cancelled'
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddCustomer={() => {
          setCustomerToEdit(null);
          setIsCustomerModalOpen(true);
        }}
      />

      {/* PWA Install Notification Bar */}
      <PWAInstallBanner />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500 text-sm">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>جارٍ تحميل قاعدة البيانات المحلية...</span>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                stats={stats}
                todayVisits={todayVisits}
                tomorrowVisits={tomorrowVisits}
                customers={customers}
                appointments={appointments}
                onOpenAddCustomer={() => {
                  setCustomerToEdit(null);
                  setIsCustomerModalOpen(true);
                }}
                onSelectCustomer={(c) => {
                  setCustomerToEdit(c);
                  setIsCustomerModalOpen(true);
                }}
                onSelectAppointment={(a) => {
                  setAppointmentToEdit(a);
                  setIsAppointmentModalOpen(true);
                }}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'customers' && (
              <CustomersView
                customers={customers}
                appointments={appointments}
                onOpenAddCustomer={() => {
                  setCustomerToEdit(null);
                  setIsCustomerModalOpen(true);
                }}
                onEditCustomer={(c) => {
                  setCustomerToEdit(c);
                  setIsCustomerModalOpen(true);
                }}
                onDeleteCustomer={handleDeleteCustomer}
                onScheduleAppointment={(c) => {
                  setAppointmentToEdit(null);
                  setAppointmentDefaultCustomerId(c.customer_id);
                  setIsAppointmentModalOpen(true);
                }}
              />
            )}

            {activeTab === 'appointments' && (
              <AppointmentsView
                appointments={appointments}
                onOpenAddCustomer={() => {
                  setCustomerToEdit(null);
                  setIsCustomerModalOpen(true);
                }}
                onEditAppointment={(apt) => {
                  setAppointmentToEdit(apt);
                  setIsAppointmentModalOpen(true);
                }}
                onUpdateStatus={handleUpdateAppointmentStatus}
                onReschedule={handleRescheduleAppointment}
                onDeleteAppointment={handleDeleteAppointment}
              />
            )}

            {activeTab === 'notifications' && (
              <NotificationsCenter appointments={appointments} />
            )}

            {activeTab === 'backup' && (
              <BackupExportView onDataChanged={loadData} />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Customer Modal (Add & Edit) */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setCustomerToEdit(null);
        }}
        onSave={handleSaveCustomer}
        initialCustomer={customerToEdit}
      />

      {/* Appointment Modal (Add & Edit) */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => {
          setIsAppointmentModalOpen(false);
          setAppointmentToEdit(null);
          setAppointmentDefaultCustomerId(null);
        }}
        customers={customers}
        onSave={handleSaveAppointment}
        initialAppointment={appointmentToEdit}
        defaultCustomerId={appointmentDefaultCustomerId}
        onOpenQuickAddCustomer={() => {
          setIsCustomerModalOpen(true);
        }}
      />

    </div>
  );
}
