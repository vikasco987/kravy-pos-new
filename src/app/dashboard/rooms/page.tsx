"use client";

import React, { useState, useEffect } from "react";
import {
  Home,
  PlusCircle,
  Search,
  Calendar,
  Clock,
  User,
  Phone,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  LogOut,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  X,
  FileText,
  Printer,
  ShieldCheck,
  Building,
  Bed,
  Users,
  Eye,
  Key,
  IndianRupee,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { kravy } from "@/lib/sounds";

interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  floor: string;
  pricePerNight: number;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "CLEANING";
  amenities: string[];
}

interface Booking {
  id: string;
  roomNumber: string;
  roomId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  gender: string;
  idProofType?: string;
  idProofNumber?: string;
  customerAddress?: string;
  city?: string;
  entryTime: string;
  exitTime?: string;
  adults: number;
  children: number;
  pricePerNight: number;
  totalAmount: number;
  advancePaid: number;
  balanceDue: number;
  paymentMode: string;
  status: "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
  remarks?: string;
}

export default function RoomManagementPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFloor, setSelectedFloor] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  // Modals state
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState<Booking | null>(null);
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState<Booking | null>(null);

  // Check-In Form State
  const [formRoomNumber, setFormRoomNumber] = useState("");
  const [formCustomerName, setFormCustomerName] = useState("");
  const [formCustomerPhone, setFormCustomerPhone] = useState("");
  const [formGender, setFormGender] = useState("Male");
  const [formIdProofType, setFormIdProofType] = useState("Aadhaar Card");
  const [formIdProofNumber, setFormIdProofNumber] = useState("");
  const [formCustomerAddress, setFormCustomerAddress] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formEntryTime, setFormEntryTime] = useState("");
  const [formExitTime, setFormExitTime] = useState("");
  const [formAdults, setFormAdults] = useState(1);
  const [formChildren, setFormChildren] = useState(0);
  const [formPricePerNight, setFormPricePerNight] = useState(1500);
  const [formAdvancePaid, setFormAdvancePaid] = useState(0);
  const [formPaymentMode, setFormPaymentMode] = useState("Cash");
  const [formRemarks, setFormRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Room Form State
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newRoomType, setNewRoomType] = useState("Deluxe Single");
  const [newFloor, setNewFloor] = useState("1st Floor");
  const [newPricePerNight, setNewPricePerNight] = useState(1500);

  // Fetch Rooms & Active Bookings
  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        fetch("/api/rooms"),
        fetch("/api/rooms/bookings?status=CHECKED_IN")
      ]);

      if (roomsRes.ok) {
        const rData = await roomsRes.json();
        if (Array.isArray(rData)) setRooms(rData);
      }

      if (bookingsRes.ok) {
        const bData = await bookingsRes.json();
        if (Array.isArray(bData)) setBookings(bData);
      }
    } catch (err) {
      console.error("Error fetching rooms/bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Default Entry Time & Exit Time
    const now = new Date();
    const isoNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setFormEntryTime(isoNow);

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(11, 0, 0, 0);
    const isoTomorrow = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setFormExitTime(isoTomorrow);
  }, []);

  // Quick Open Check-In Modal for specific room
  const handleOpenCheckIn = (room?: Room) => {
    kravy.click();
    if (room) {
      setFormRoomNumber(room.roomNumber);
      setFormPricePerNight(room.pricePerNight);
    } else if (rooms.length > 0) {
      const availableRoom = rooms.find(r => r.status === "AVAILABLE");
      if (availableRoom) {
        setFormRoomNumber(availableRoom.roomNumber);
        setFormPricePerNight(availableRoom.pricePerNight);
      } else {
        setFormRoomNumber(rooms[0].roomNumber);
        setFormPricePerNight(rooms[0].pricePerNight);
      }
    }
    setShowCheckInModal(true);
  };

  // Submit Check-In
  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRoomNumber || !formCustomerName || !formCustomerPhone) {
      alert("Please fill Room Number, Customer Name & Mobile Phone!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/rooms/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomNumber: formRoomNumber,
          customerName: formCustomerName,
          customerPhone: formCustomerPhone,
          gender: formGender,
          idProofType: formIdProofType,
          idProofNumber: formIdProofNumber,
          customerAddress: formCustomerAddress,
          city: formCity,
          entryTime: formEntryTime,
          exitTime: formExitTime,
          adults: formAdults,
          children: formChildren,
          pricePerNight: formPricePerNight,
          totalAmount: formPricePerNight,
          advancePaid: formAdvancePaid,
          paymentMode: formPaymentMode,
          remarks: formRemarks
        })
      });

      if (res.ok) {
        kravy.success();
        setShowCheckInModal(false);
        // Reset form
        setFormCustomerName("");
        setFormCustomerPhone("");
        setFormIdProofNumber("");
        setFormCustomerAddress("");
        setFormAdvancePaid(0);
        setFormRemarks("");
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to check-in!");
      }
    } catch (err) {
      console.error("Checkin error:", err);
      alert("Something went wrong with Check-In!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check-Out Booking
  const handleCheckoutSubmit = async (booking: Booking) => {
    if (!confirm(`Are you sure you want to Check-Out Room ${booking.roomNumber} for ${booking.customerName}?`)) return;

    try {
      const res = await fetch("/api/rooms/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: booking.id,
          action: "CHECK_OUT",
          actualCheckOutTime: new Date().toISOString()
        })
      });

      if (res.ok) {
        kravy.success();
        setShowCheckoutModal(null);
        fetchData();
      } else {
        alert("Failed to Check-Out room!");
      }
    } catch (err) {
      console.error("Checkout error:", err);
    }
  };

  // Mark Room Clean & Available
  const handleMarkClean = async (roomId: string) => {
    try {
      const res = await fetch("/api/rooms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: roomId, status: "AVAILABLE" })
      });

      if (res.ok) {
        kravy.click();
        fetchData();
      }
    } catch (err) {}
  };

  // Create New Room Submit
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber) return;

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomNumber: newRoomNumber,
          roomType: newRoomType,
          floor: newFloor,
          pricePerNight: newPricePerNight
        })
      });

      if (res.ok) {
        kravy.success();
        setShowAddRoomModal(false);
        setNewRoomNumber("");
        fetchData();
      } else {
        alert("Room number might already exist!");
      }
    } catch (err) {}
  };

  // Calculations
  const totalRoomsCount = rooms.length;
  const availableCount = rooms.filter(r => r.status === "AVAILABLE").length;
  const occupiedCount = rooms.filter(r => r.status === "OCCUPIED").length;
  const cleaningCount = rooms.filter(r => r.status === "CLEANING").length;

  const totalAdvanceCollected = bookings.reduce((sum, b) => sum + (b.advancePaid || 0), 0);

  // Filtered Rooms
  const filteredRooms = rooms.filter(room => {
    const activeBooking = bookings.find(b => b.roomNumber === room.roomNumber && b.status === "CHECKED_IN");
    const matchesSearch =
      room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.roomType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (activeBooking && activeBooking.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (activeBooking && activeBooking.customerPhone.includes(searchQuery));

    const matchesFloor = selectedFloor === "ALL" || room.floor === selectedFloor;
    const matchesStatus = selectedStatusFilter === "ALL" || room.status === selectedStatusFilter;

    return matchesSearch && matchesFloor && matchesStatus;
  });

  const floorsList = Array.from(new Set(rooms.map(r => r.floor).filter(Boolean)));

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/80 p-6 rounded-3xl border border-slate-700/60 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-2xl">
              🏨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Hotel Room Booking Engine</h1>
                <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-full">
                  Hotel Stay POS
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 font-medium mt-1">
                Manage room stay check-ins, guest details, entry/exit timings & room billing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenCheckIn()}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95"
            >
              <Key size={16} />
              + New Guest Check-In
            </button>
            <button
              onClick={() => setShowAddRoomModal(true)}
              className="flex items-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-2xl border border-slate-600 transition-all"
            >
              <PlusCircle size={16} />
              Add Room
            </button>
            <button
              onClick={fetchData}
              className="p-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-2xl border border-slate-600 transition-all"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* METRICS STATS SUMMARY */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xl border border-blue-500/20">
              🛏️
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Rooms</p>
              <p className="text-xl font-black text-white mt-0.5">{totalRoomsCount}</p>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/20">
              🟢
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Available Rooms</p>
              <p className="text-xl font-black text-white mt-0.5">{availableCount}</p>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-rose-500/30 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-xl border border-rose-500/20">
              🔴
            </div>
            <div>
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Occupied Stay</p>
              <p className="text-xl font-black text-white mt-0.5">{occupiedCount}</p>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xl border border-amber-500/20">
              🧹
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Cleaning Needed</p>
              <p className="text-xl font-black text-white mt-0.5">{cleaningCount}</p>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/40">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search Room #, Guest Name, Mobile..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {/* Status Pills */}
            <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700">
              {["ALL", "AVAILABLE", "OCCUPIED", "CLEANING"].map(st => (
                <button
                  key={st}
                  onClick={() => setSelectedStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    selectedStatusFilter === st
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {st === "ALL" ? "All Status" : st}
                </button>
              ))}
            </div>

            {/* Floor Filter */}
            {floorsList.length > 0 && (
              <select
                value={selectedFloor}
                onChange={e => setSelectedFloor(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 font-bold outline-none"
              >
                <option value="ALL">All Floors</option>
                {floorsList.map(f => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* ROOMS VISUAL GRID */}
        {loading ? (
          <div className="py-20 text-center text-slate-500 font-bold animate-pulse text-sm">
            Loading Hotel Rooms & Stay Status...
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="py-16 text-center bg-slate-800/30 rounded-3xl border border-slate-700/40">
            <p className="text-slate-400 font-bold text-base">No rooms found matching your filter criteria.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedStatusFilter("ALL");
                setSelectedFloor("ALL");
              }}
              className="mt-3 text-xs font-bold text-indigo-400 underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRooms.map(room => {
              const activeBooking = bookings.find(
                b => b.roomNumber === room.roomNumber && b.status === "CHECKED_IN"
              );

              const isOccupied = room.status === "OCCUPIED" && activeBooking;
              const isCleaning = room.status === "CLEANING";

              return (
                <motion.div
                  key={room.id}
                  whileHover={{ y: -4 }}
                  className={`rounded-3xl border transition-all p-5 flex flex-col justify-between relative overflow-hidden ${
                    isOccupied
                      ? "bg-slate-800/90 border-rose-500/40 shadow-xl shadow-rose-950/20"
                      : isCleaning
                      ? "bg-slate-800/90 border-amber-500/40 shadow-xl shadow-amber-950/20"
                      : "bg-slate-800/80 border-slate-700/60 hover:border-emerald-500/40 shadow-lg"
                  }`}
                >
                  {/* Status Indicator Stripe */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1.5 ${
                      isOccupied
                        ? "bg-gradient-to-r from-rose-500 to-red-600"
                        : isCleaning
                        ? "bg-gradient-to-r from-amber-500 to-yellow-600 animate-pulse"
                        : "bg-gradient-to-r from-emerald-400 to-teal-500"
                    }`}
                  />

                  {/* ROOM HEADER */}
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-white tracking-tight">
                            Room {room.roomNumber}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-slate-700">
                            {room.floor}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-indigo-300 mt-1">{room.roomType}</p>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                          isOccupied
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : isCleaning
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {isOccupied ? "🔴 Occupied" : isCleaning ? "🧹 Cleaning" : "🟢 Available"}
                      </span>
                    </div>

                    {/* ROOM CONTENT DETAILS */}
                    <div className="mt-4 pt-3 border-t border-slate-700/50">
                      {isOccupied ? (
                        /* GUEST OCCUPIED INFORMATION */
                        <div className="space-y-2.5">
                          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-700/60">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-white flex items-center gap-1.5">
                                <User size={13} className="text-indigo-400" />
                                {activeBooking.customerName}
                              </span>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md">
                                {activeBooking.gender === "Female" ? "👩 Female" : "👨 Male"}
                              </span>
                            </div>
                            <p className="text-[11px] font-medium text-slate-400 mt-1 flex items-center gap-1">
                              <Phone size={11} /> {activeBooking.customerPhone}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                              <p className="text-slate-400 font-bold uppercase">Entry / Check-In</p>
                              <p className="font-extrabold text-slate-200 mt-0.5">
                                {new Date(activeBooking.entryTime).toLocaleString([], {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </p>
                            </div>
                            <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                              <p className="text-slate-400 font-bold uppercase">Expected Exit</p>
                              <p className="font-extrabold text-slate-200 mt-0.5">
                                {activeBooking.exitTime
                                  ? new Date(activeBooking.exitTime).toLocaleString([], {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    })
                                  : "N/A"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 px-1">
                            <span className="text-slate-400 font-bold">Advance Paid:</span>
                            <span className="font-black text-emerald-400">₹{activeBooking.advancePaid || 0}</span>
                          </div>
                        </div>
                      ) : (
                        /* AVAILABLE / CLEANING DETAILS */
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400">Rate per Night:</span>
                            <span className="text-base font-black text-white">₹{room.pricePerNight}</span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {room.amenities.map(am => (
                              <span
                                key={am}
                                className="text-[10px] font-bold text-slate-300 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-700/60"
                              >
                                ✓ {am}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ROOM CARD ACTION FOOTER */}
                  <div className="mt-5 pt-3 border-t border-slate-700/50 flex items-center gap-2">
                    {isOccupied ? (
                      <>
                        <button
                          onClick={() => handleCheckoutSubmit(activeBooking)}
                          className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                        >
                          <LogOut size={14} /> Check-Out & Bill
                        </button>
                        <button
                          onClick={() => setShowBookingDetailsModal(activeBooking)}
                          className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition-all"
                          title="View Stay Details"
                        >
                          <Eye size={15} />
                        </button>
                      </>
                    ) : isCleaning ? (
                      <button
                        onClick={() => handleMarkClean(room.id)}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Sparkles size={14} /> Mark Clean & Available
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenCheckIn(room)}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Key size={14} /> + Check-In Guest
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================
          CHECK-IN GUEST MODAL
      ======================================================== */}
      <AnimatePresence>
        {showCheckInModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-8"
            >
              <button
                onClick={() => setShowCheckInModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-2"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xl">
                  🔑
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">New Room Check-In</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Enter guest details, entry/exit timings & room deposit.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCheckInSubmit} className="space-y-4">
                {/* ROOM & TYPE SELECTOR */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                      Room Number *
                    </label>
                    <select
                      value={formRoomNumber}
                      onChange={e => {
                        setFormRoomNumber(e.target.value);
                        const rm = rooms.find(r => r.roomNumber === e.target.value);
                        if (rm) setFormPricePerNight(rm.pricePerNight);
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none focus:border-indigo-500"
                    >
                      {rooms.map(r => (
                        <option key={r.id} value={r.roomNumber}>
                          Room {r.roomNumber} ({r.roomType}) - ₹{r.pricePerNight}/night [{r.status}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                      Room Price / Night (₹)
                    </label>
                    <input
                      type="number"
                      value={formPricePerNight}
                      onChange={e => setFormPricePerNight(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* GUEST DETAILS */}
                <div className="pt-2 border-t border-slate-800">
                  <p className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-3">
                    Customer Personal Details
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                        Customer Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={formCustomerName}
                        onChange={e => setFormCustomerName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                        Mobile Phone Number *
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={formCustomerPhone}
                        onChange={e => setFormCustomerPhone(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                        Gender (Male / Female) *
                      </label>
                      <div className="flex gap-2">
                        {["Male", "Female", "Other"].map(g => (
                          <button
                            type="button"
                            key={g}
                            onClick={() => setFormGender(g)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                              formGender === g
                                ? "bg-indigo-600 border-indigo-500 text-white"
                                : "bg-slate-800 border-slate-700 text-slate-400"
                            }`}
                          >
                            {g === "Female" ? "👩 Female" : g === "Male" ? "👨 Male" : "🧑 Other"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                        ID Proof Type
                      </label>
                      <select
                        value={formIdProofType}
                        onChange={e => setFormIdProofType(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none"
                      >
                        <option value="Aadhaar Card">Aadhaar Card</option>
                        <option value="Passport">Passport</option>
                        <option value="Driving License">Driving License</option>
                        <option value="Voter ID">Voter ID</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                        ID Proof Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1234 5678 9012"
                        value={formIdProofNumber}
                        onChange={e => setFormIdProofNumber(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                        Address / City
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Delhi"
                        value={formCustomerAddress}
                        onChange={e => setFormCustomerAddress(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* TIMINGS & OCCUPANCY */}
                <div className="pt-2 border-t border-slate-800">
                  <p className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-3">
                    Stay Timings & Occupancy
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                        Entry / Check-In Time
                      </label>
                      <input
                        type="datetime-local"
                        value={formEntryTime}
                        onChange={e => setFormEntryTime(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                        Expected Exit / Check-Out Time
                      </label>
                      <input
                        type="datetime-local"
                        value={formExitTime}
                        onChange={e => setFormExitTime(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* PAYMENT & ADVANCE */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                        Advance Deposit Paid (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={formAdvancePaid}
                        onChange={e => setFormAdvancePaid(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-emerald-400 font-black outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                        Payment Mode
                      </label>
                      <select
                        value={formPaymentMode}
                        onChange={e => setFormPaymentMode(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none"
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI / QR">UPI / QR Code</option>
                        <option value="Card">Credit / Debit Card</option>
                        <option value="Wallet">Customer Wallet</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCheckInModal(false)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-2 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-500/25"
                  >
                    {isSubmitting ? "Allocating Room..." : "Complete Check-In & Allocate Room 🔑"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          ADD NEW ROOM MODAL
      ======================================================== */}
      <AnimatePresence>
        {showAddRoomModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setShowAddRoomModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-2"
              >
                <X size={20} />
              </button>

              <h3 className="text-lg font-black text-white mb-4">Add New Hotel Room</h3>

              <form onSubmit={handleCreateRoom} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Room Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 104 or 302"
                    value={newRoomNumber}
                    onChange={e => setNewRoomNumber(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Room Type
                  </label>
                  <select
                    value={newRoomType}
                    onChange={e => setNewRoomType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none"
                  >
                    <option value="Deluxe Single">Deluxe Single</option>
                    <option value="Deluxe Double">Deluxe Double</option>
                    <option value="Super Deluxe">Super Deluxe</option>
                    <option value="Presidential Suite">Presidential Suite</option>
                    <option value="Executive Room">Executive Room</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Floor
                  </label>
                  <input
                    type="text"
                    value={newFloor}
                    onChange={e => setNewFloor(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Price per Night (₹)
                  </label>
                  <input
                    type="number"
                    value={newPricePerNight}
                    onChange={e => setNewPricePerNight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none"
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddRoomModal(false)}
                    className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
                  >
                    Save Room
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          STAY DETAILS MODAL
      ======================================================== */}
      <AnimatePresence>
        {showBookingDetailsModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setShowBookingDetailsModal(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-2"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
                  🔑
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    Room {showBookingDetailsModal.roomNumber} Stay Details
                  </h3>
                  <p className="text-xs text-slate-400">Active Checked-In Guest Record</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Guest Name</p>
                    <p className="font-black text-white text-sm mt-0.5">{showBookingDetailsModal.customerName}</p>
                    <p className="text-slate-400 font-medium">{showBookingDetailsModal.customerPhone}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 font-bold text-xs rounded-xl">
                    {showBookingDetailsModal.gender}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/40">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">ID Proof</p>
                    <p className="font-bold text-white mt-0.5">
                      {showBookingDetailsModal.idProofType || "N/A"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {showBookingDetailsModal.idProofNumber || "-"}
                    </p>
                  </div>

                  <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/40">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Address</p>
                    <p className="font-bold text-white mt-0.5">
                      {showBookingDetailsModal.customerAddress || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/40">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Check-In Time</p>
                    <p className="font-bold text-slate-200 mt-0.5">
                      {new Date(showBookingDetailsModal.entryTime).toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/40">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Expected Exit</p>
                    <p className="font-bold text-slate-200 mt-0.5">
                      {showBookingDetailsModal.exitTime
                        ? new Date(showBookingDetailsModal.exitTime).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase">Advance Deposit Paid</p>
                    <p className="text-lg font-black text-emerald-400 mt-0.5">
                      ₹{showBookingDetailsModal.advancePaid || 0}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg">
                    {showBookingDetailsModal.paymentMode}
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-2">
                <button
                  onClick={() => setShowBookingDetailsModal(null)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
