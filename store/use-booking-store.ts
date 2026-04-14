import { create } from 'zustand';

interface BookingState {
  location: string;
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
  deliveryMethod: 'pickup' | 'delivery';
  deliveryAddress: string;
  depositMethod: 'pay' | 'two_wheeler';

  setLocation: (location: string) => void;
  setPickupDate: (date: string) => void;
  setPickupTime: (time: string) => void;
  setDropoffDate: (date: string) => void;
  setDropoffTime: (time: string) => void;
  setDeliveryMethod: (method: 'pickup' | 'delivery') => void;
  setDeliveryAddress: (address: string) => void;
  setDepositMethod: (method: 'pay' | 'two_wheeler') => void;
  reset: () => void;
}

const formatDisplayDate = (date: Date) =>
  date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const getDefaultState = () => {
  const pickup = new Date();
  pickup.setDate(pickup.getDate() + 1);
  pickup.setHours(10, 0, 0, 0);

  const dropoff = new Date(pickup);
  dropoff.setDate(dropoff.getDate() + 1);

  return {
    location: "Detecting...",
    pickupDate: formatDisplayDate(pickup),
    pickupTime: "10:00 AM",
    dropoffDate: formatDisplayDate(dropoff),
    dropoffTime: "10:00 AM",
    deliveryMethod: 'pickup' as const,
    deliveryAddress: '',
    depositMethod: 'pay' as const,
  };
};

export const useBookingStore = create<BookingState>((set) => ({
  ...getDefaultState(),

  setLocation: (location) => set({ location }),
  setPickupDate: (date) => set({ pickupDate: date }),
  setPickupTime: (time) => set({ pickupTime: time }),
  setDropoffDate: (date) => set({ dropoffDate: date }),
  setDropoffTime: (time) => set({ dropoffTime: time }),
  setDeliveryMethod: (method) => set({ deliveryMethod: method }),
  setDeliveryAddress: (address) => set({ deliveryAddress: address }),
  setDepositMethod: (method) => set({ depositMethod: method }),
  reset: () => set(getDefaultState()),
}));
