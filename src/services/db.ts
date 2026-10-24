/**
 * Hydro Control Manager - Local Persistent Database (IndexedDB)
 * 
 * Strict requirement: Initialized 100% EMPTY.
 * No dummy names, no mock phone numbers, no sample appointments.
 */

import { Customer, Appointment, AppointmentWithCustomer, DatabaseBackup } from '../types/database';

const DB_NAME = 'hydro_control_db';
const DB_VERSION = 1;

class HydroDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Table: customers
        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', {
            keyPath: 'customer_id',
            autoIncrement: true,
          });
          customerStore.createIndex('name', 'name', { unique: false });
          customerStore.createIndex('phone', 'phone', { unique: false });
          customerStore.createIndex('governorate', 'governorate', { unique: false });
        }

        // Table: appointments
        if (!db.objectStoreNames.contains('appointments')) {
          const appointmentStore = db.createObjectStore('appointments', {
            keyPath: 'appointment_id',
            autoIncrement: true,
          });
          appointmentStore.createIndex('customer_id', 'customer_id', { unique: false });
          appointmentStore.createIndex('appointment_date', 'appointment_date', { unique: false });
          appointmentStore.createIndex('status', 'status', { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // --- Customers CRUD ---

  async getCustomers(): Promise<Customer[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('customers', 'readonly');
      const store = tx.objectStore('customers');
      const request = store.getAll();
      request.onsuccess = () => {
        // Return sorted newest first
        const list = (request.result as Customer[]).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getCustomerById(customerId: number): Promise<Customer | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('customers', 'readonly');
      const store = tx.objectStore('customers');
      const request = store.get(customerId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async addCustomer(customer: Omit<Customer, 'customer_id' | 'created_at'>): Promise<Customer> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('customers', 'readwrite');
      const store = tx.objectStore('customers');
      const record: Omit<Customer, 'customer_id'> = {
        ...customer,
        created_at: new Date().toISOString(),
      };
      const request = store.add(record);
      request.onsuccess = () => {
        const generatedId = request.result as number;
        resolve({
          ...record,
          customer_id: generatedId,
        });
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateCustomer(customer: Customer): Promise<Customer> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('customers', 'readwrite');
      const store = tx.objectStore('customers');
      const request = store.put(customer);
      request.onsuccess = () => resolve(customer);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCustomer(customerId: number, cascadeAppointments: boolean = true): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['customers', 'appointments'], 'readwrite');
      const customerStore = tx.objectStore('customers');
      const appointmentStore = tx.objectStore('appointments');

      customerStore.delete(customerId);

      if (cascadeAppointments) {
        const index = appointmentStore.index('customer_id');
        const req = index.openCursor(IDBKeyRange.only(customerId));
        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Appointments CRUD ---

  async getAppointments(): Promise<Appointment[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('appointments', 'readonly');
      const store = tx.objectStore('appointments');
      const request = store.getAll();
      request.onsuccess = () => {
        // Sort chronologically by appointment date & time
        const list = (request.result as Appointment[]).sort((a, b) => {
          const timeA = `${a.appointment_date}T${a.appointment_time}`;
          const timeB = `${b.appointment_date}T${b.appointment_time}`;
          return timeA.localeCompare(timeB);
        });
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAppointmentsWithCustomers(): Promise<AppointmentWithCustomer[]> {
    const [appointments, customers] = await Promise.all([
      this.getAppointments(),
      this.getCustomers(),
    ]);

    const customerMap = new Map<number, Customer>();
    customers.forEach((c) => customerMap.set(c.customer_id, c));

    return appointments.map((a) => ({
      ...a,
      customer: customerMap.get(a.customer_id),
    }));
  }

  async getAppointmentsByCustomer(customerId: number): Promise<Appointment[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('appointments', 'readonly');
      const store = tx.objectStore('appointments');
      const index = store.index('customer_id');
      const request = index.getAll(IDBKeyRange.only(customerId));
      request.onsuccess = () => {
        const list = (request.result as Appointment[]).sort((a, b) => {
          const timeA = `${a.appointment_date}T${a.appointment_time}`;
          const timeB = `${b.appointment_date}T${b.appointment_time}`;
          return timeB.localeCompare(timeA); // Newest visit first for customer history
        });
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAppointmentById(appointmentId: number): Promise<Appointment | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('appointments', 'readonly');
      const store = tx.objectStore('appointments');
      const request = store.get(appointmentId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async addAppointment(
    appointment: Omit<Appointment, 'appointment_id' | 'created_at' | 'updated_at'>
  ): Promise<Appointment> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('appointments', 'readwrite');
      const store = tx.objectStore('appointments');
      const now = new Date().toISOString();
      const record: Omit<Appointment, 'appointment_id'> = {
        ...appointment,
        created_at: now,
        updated_at: now,
      };
      const request = store.add(record);
      request.onsuccess = () => {
        const generatedId = request.result as number;
        resolve({
          ...record,
          appointment_id: generatedId,
        });
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateAppointment(appointment: Appointment): Promise<Appointment> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('appointments', 'readwrite');
      const store = tx.objectStore('appointments');
      const updated: Appointment = {
        ...appointment,
        updated_at: new Date().toISOString(),
      };
      const request = store.put(updated);
      request.onsuccess = () => resolve(updated);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteAppointment(appointmentId: number): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('appointments', 'readwrite');
      const store = tx.objectStore('appointments');
      const request = store.delete(appointmentId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Check for potential appointment time conflicts
  async checkTimeOverlap(
    date: string,
    time: string,
    excludeAppointmentId?: number
  ): Promise<AppointmentWithCustomer[]> {
    const all = await this.getAppointmentsWithCustomers();
    return all.filter((a) => {
      if (excludeAppointmentId && a.appointment_id === excludeAppointmentId) {
        return false;
      }
      if (a.status === 'cancelled') return false;
      // Match exact date and time (or within 1 hour range if desired)
      return a.appointment_date === date && a.appointment_time === time;
    });
  }

  // --- Statistics ---

  async getDashboardStats() {
    const [customers, appointments] = await Promise.all([
      this.getCustomers(),
      this.getAppointments(),
    ]);

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    let todayCount = 0;
    let tomorrowCount = 0;
    let upcomingCount = 0;
    let needsConfirmationCount = 0;
    let rescheduledCount = 0;

    appointments.forEach((a) => {
      if (a.status === 'cancelled') return;

      if (a.appointment_date === todayStr) {
        todayCount++;
      }
      if (a.appointment_date === tomorrowStr) {
        tomorrowCount++;
      }
      if (a.appointment_date >= todayStr) {
        upcomingCount++;
      }
      if (a.status === 'new') {
        needsConfirmationCount++;
      }
      if (a.status === 'rescheduled') {
        rescheduledCount++;
      }
    });

    return {
      totalCustomers: customers.length,
      todayAppointments: todayCount,
      tomorrowAppointments: tomorrowCount,
      upcomingAppointments: upcomingCount,
      needsConfirmation: needsConfirmationCount,
      rescheduledAppointments: rescheduledCount,
    };
  }

  // --- Backup & Restore ---

  async exportBackup(): Promise<DatabaseBackup> {
    const [customers, appointments] = await Promise.all([
      this.getCustomers(),
      this.getAppointments(),
    ]);

    const payload = {
      version: '1.0.0',
      app: 'Hydro Control Manager',
      exported_at: new Date().toISOString(),
      customers,
      appointments,
      checksum: `${customers.length}-${appointments.length}-${Date.now()}`,
    };

    return payload;
  }

  async importBackup(backup: DatabaseBackup, replaceExisting: boolean = true): Promise<{ customersCount: number; appointmentsCount: number }> {
    if (!backup || !Array.isArray(backup.customers) || !Array.isArray(backup.appointments)) {
      throw new Error('ملف النسخة الاحتياطية غير صالح أو تالف.');
    }

    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['customers', 'appointments'], 'readwrite');
      const customerStore = tx.objectStore('customers');
      const appointmentStore = tx.objectStore('appointments');

      if (replaceExisting) {
        customerStore.clear();
        appointmentStore.clear();
      }

      backup.customers.forEach((c) => {
        customerStore.put(c);
      });

      backup.appointments.forEach((a) => {
        appointmentStore.put(a);
      });

      tx.oncomplete = () => {
        resolve({
          customersCount: backup.customers.length,
          appointmentsCount: backup.appointments.length,
        });
      };

      tx.onerror = () => reject(tx.error);
    });
  }

  async clearAllData(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['customers', 'appointments'], 'readwrite');
      tx.objectStore('customers').clear();
      tx.objectStore('appointments').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const dbService = new HydroDatabase();
