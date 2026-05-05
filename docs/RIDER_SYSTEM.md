# ðŸ›µ Rider System Documentation

## Overview
The MelaChow Rider System is a comprehensive, real-time logistics framework designed to bridge the gap between Vendors, Riders, and Customers. It handles rider recruitment, order dispatching, and delivery lifecycle management with high-fidelity visual feedback and low-latency communication.

---

## 1. Rider Account Creation
Riders do not sign up themselves; they are managed by specific Restaurants (Vendors). This ensures a controlled fleet for each vendor.

### How a Vendor Adds a Rider:
1.  Navigate to the **Vendor Dashboard**.
2.  Click on the **"Riders"** tab in the sidebar.
3.  Click **"Add New Rider"**.
4.  Enter the Rider's details:
    *   **Full Name**: Displayed to the vendor and customer.
    *   **Phone Number**: Used as the primary login identifier.
    *   **Initial Password**: Secure password for the rider's first login.
5.  Upon completion, the rider is added to the vendor's fleet with an initial status of **Offline**.

---

## 2. Rider Authentication
Riders have a dedicated login portal optimized for mobile devices.

- **Login URL**: `/auth/rider/login`
- **Identifier**: Phone Number
- **Security**: Secured via role-specific JWT (`riderToken`).
- **Persistence**: Authentication persists across session reloads and PWA boots via `TokenManager`.

---

## 3. The Rider Experience (PWA)
The Rider interface is a dedicated mobile-first environment accessible at `/rider`.

### Dashboard (`/rider/dashboard`):
- **Live Status Toggle**: Riders must switch to **Online** to receive job assignments.
- **Active Job Card**: Displays high-priority details of the current delivery (Restaurant location, Customer address, Item count).
- **Earnings & Metrics**: Real-time tracking of today's earnings and overall rating.
- **Micro-Animations**: Uses `framer-motion` for a premium, responsive feel.

### Availability Rules:
- **Going Online**: Possible only if authenticated and account is active.
- **Going Offline**: Permitted only when not currently assigned to an active delivery.

---

## 4. Order Lifecycle & Dispatch
The system uses a state-machine approach to manage deliveries.

### Step 1: Assignment (Vendor Action)
- Vendors monitor orders. When an order reaches **"Ready"** status, they click **"Assign Rider"** on the order card.
- A modal displays only **"Available"** riders from their fleet.
- Assigning a rider triggers a real-time `order_assigned` socket event.

### Step 2: Job Acceptance (Rider Side)
- The rider receives an instant dashboard update and a success toast.
- The order status shifts to **"Rider Assigned"**.

### Step 3: Pickup
- Rider arrives at the restaurant and taps **"Picked Up"**.
- System updates order status to **"Out for Delivery"**.
- Customer receives a real-time notification that their food is on the way.

### Step 4: Completion
- Rider arrives at the customer's location and taps **"Delivered"**.
- System marks the order as **"Delivered"** or **"Completed"**.
- Rider becomes **"Available"** again for the next job.

---

## 5. Technical Implementation

### Frontend Architecture:
- **`RiderProvider`**: Global state management for rider profile, online status, and socket handshakes.
- **`TokenManager`**: Separate storage slot for `rider` role tokens.
- **`riderApi.js`**: Dedicated Axios instance for rider-specific endpoints (`/api/riders/*`).

### Real-time (Socket.IO):
- **Handshake**: Riders emit `rider_connect` with their ID upon mounting.
- **Rooms**:
    - `rider:{id}`: For personal notifications (new assignments).
    - `order:{id}`: For updates on the specific order they are carrying.
- **Events**:
    - `order_assigned`: Sent from Vendor to Rider.
    - `rider_status_changed`: Syncs availability across dashboard sessions.
    - `rider_deactivated`: Forces immediate logout if a vendor revokes access.

---

## 6. Security & Safeguards
- **Credential Protection**: Account lockouts and secure token storage.
- **Active Job Guard**: Prevent account logout or "Offline" switch while carrying an order.
- **Role Isolation**: Global API interceptors ensure rider tokens are never leaked to user or vendor routes accidentally.

---

## 7. Troubleshooting
- **Rider not receiving jobs**: Ensure the Rider is switched to **"Online"** and the vendor has marked the order as **"Ready for Pickup"**.
- **Assignment modal empty**: No riders in the fleet are currently "Available" (they are either Offline or already on a delivery).
- **Socket Disconnection**: The `SocketContext` automatically handles reconnections, but riders can manually refresh the dashboard to force a state resync.

