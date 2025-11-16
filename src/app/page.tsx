"use client";
import React, { useState, useEffect } from "react";
import {
  Send,
  Leaf,
  MapPin,
  Users,
  Clock,
  Zap,
  ThermometerSun,
  Search,
  X,
} from "lucide-react";
import EnergyChart from "../components/EnergyChart";

interface Room {
  id: string;
  name: string;
  building: string;
  capacity: number;
  available: boolean;
  cleanlinessScore: number;
  sustainabilityScore: number;
  energyEfficiency: string;
  features: string[];
  availableSlots: string[];
  costScore: number;
  occupancy: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function RoomScheduler() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I can help you find the perfect room. Tell me what date and time you need it! 🌱",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBuilding, setFilterBuilding] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [numPeople, setNumPeople] = useState<string>("1");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    userName: "",
    userEmail: "",
    purpose: "",
  });

  const buildings = [
    "all",
    "Science Center",
    "Library",
    "Music Building",
    "Tech Hub",
    "Arts Building",
  ];

  // Fetch rooms when date or building filter changes
  useEffect(() => {
    fetchRooms();
  }, [selectedDate, filterBuilding]);

  const parsedNumPeople = Math.max(1, Number(numPeople) || 1);

  const fetchRooms = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate);
      if (filterBuilding !== "all") params.append("building", filterBuilding);

      const response = await fetch(`/api/rooms?${params}`);
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.building.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBuilding =
      filterBuilding === "all" || room.building === filterBuilding;
    return matchesSearch && matchesBuilding;
  });

  const handleBookRoom = async () => {
    if (!selectedRoom || !selectedDate || !selectedTime) {
      alert("Please select a room, date, and time");
      return;
    }

    if (!bookingForm.userName || !bookingForm.userEmail) {
      alert("Please enter your name and email");
      return;
    }

    const parsedNumPeople = Math.max(1, Number(numPeople) || 1);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          people: parsedNumPeople,
          userName: bookingForm.userName,
          userEmail: bookingForm.userEmail,
          date: selectedDate,
          startTime: selectedTime,
          purpose: bookingForm.purpose,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(
          `✅ Room booked successfully!\n\n${data.booking.roomName} in ${data.booking.building}\n${selectedDate} at ${selectedTime}`
        );
        setShowBookingModal(false);
        setBookingForm({ userName: "", userEmail: "", purpose: "" });
        fetchRooms(); // Refresh to show updated availability
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert("Failed to book room");
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          rooms: rooms,
          selectedDate,
          selectedTime,
        }),
      });

      const data = await response.json();

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: data.message,
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return "text-emerald-700 font-bold";
    if (score >= 7) return "text-emerald-600 font-semibold";
    return "text-emerald-500";
  };

  const getEfficiencyColor = (efficiency: string) => {
    if (efficiency.startsWith("A")) return "bg-emerald-100 text-emerald-800";
    if (efficiency.startsWith("B")) return "bg-emerald-50 text-emerald-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Left Panel - Room List */}
      <div className="w-2/5 border-r border-emerald-200 bg-white flex flex-col shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-emerald-200 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Leaf className="w-9 h-9" />
            <div>
              <h1 className="text-3xl font-bold">EcoRoom</h1>
              <p className="text-sm text-emerald-100">Smart Room Booking</p>
            </div>
          </div>
        </div>

        {/* Date & Time Selection */}
        <div className="p-4 bg-emerald-50 border-b border-emerald-200 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-emerald-700 mb-1 block">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border-2 border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-emerald-700 mb-1 block">
                Time
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 border-2 border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select time</option>
                <option value="9:00 AM">9:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="12:00 PM">12:00 PM</option>
                <option value="1:00 PM">1:00 PM</option>
                <option value="2:00 PM">2:00 PM</option>
                <option value="3:00 PM">3:00 PM</option>
                <option value="4:00 PM">4:00 PM</option>
                <option value="5:00 PM">5:00 PM</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-emerald-700 mb-1 block">
                People
              </label>
              <input
                type="number"
                min={1}
                value={numPeople}
                onChange={(e) => setNumPeople(e.target.value)}
                className="w-full px-3 py-2 border-2 border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          {(selectedDate || selectedTime) && (
            <div className="flex items-center justify-between bg-white rounded-lg p-2 border-2 border-emerald-300">
              <span className="text-sm font-medium text-emerald-700">
                {selectedDate &&
                  new Date(selectedDate + "T00:00:00").toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" }
                  )}
                {selectedDate && selectedTime && " at "}
                {selectedTime}
              </span>
              <button
                onClick={() => {
                  setSelectedDate("");
                  setSelectedTime("");
                }}
                className="text-emerald-600 hover:text-emerald-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Search and Filter */}
        <div className="p-4 border-b border-emerald-200 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-emerald-500" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterBuilding}
            onChange={(e) => setFilterBuilding(e.target.value)}
            className="w-full px-4 py-2 border-2 border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            {buildings.map((building) => (
              <option key={building} value={building}>
                {building === "all" ? "All Buildings" : building}
              </option>
            ))}
          </select>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredRooms.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p>No rooms found. Try selecting a date or adjusting filters.</p>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                  selectedRoom?.id === room.id
                    ? "border-emerald-500 bg-emerald-50 shadow-md"
                    : "border-emerald-200 bg-white hover:border-emerald-400"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">
                      {room.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span>{room.building}</span>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      room.available
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {room.available ? "✓ Available" : "Occupied"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Leaf className="w-4 h-4 text-emerald-600" />
                    <span className={getScoreColor(room.sustainabilityScore)}>
                      {room.sustainabilityScore}/10
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span className="text-gray-700 font-medium">
                      {room.capacity} seats
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${getEfficiencyColor(
                      room.energyEfficiency
                    )}`}
                  >
                    {room.energyEfficiency}
                  </span>
                  <span className="text-xs text-gray-600 font-medium">
                    {room.occupancy} occupied
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Details & Chat */}
      <div className="flex-1 flex flex-col">
        {/* Room Details */}
        {selectedRoom && (
          <div className="bg-white border-b border-emerald-200 p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  {selectedRoom.name}
                </h2>
                <p className="text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  {selectedRoom.building}
                </p>
              </div>
              <button
                onClick={() => setShowBookingModal(true)}
                disabled={!selectedDate || !selectedTime}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg font-bold hover:shadow-lg transition-all hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Book Room
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="bg-emerald-50 p-4 rounded-lg border-2 border-emerald-200">
                <div className="flex items-center gap-2 mb-1">
                  <Leaf className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">
                    Sustainability
                  </span>
                </div>
                <p className="text-2xl font-bold text-emerald-700">
                  {selectedRoom.sustainabilityScore}
                </p>
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg border-2 border-emerald-200">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">
                    Cleanliness
                  </span>
                </div>
                <p className="text-2xl font-bold text-emerald-700">
                  {selectedRoom.cleanlinessScore}
                </p>
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg border-2 border-emerald-200">
                <div className="flex items-center gap-2 mb-1">
                  <ThermometerSun className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">
                    Efficiency
                  </span>
                </div>
                <p className="text-2xl font-bold text-emerald-700">
                  {selectedRoom.energyEfficiency}
                </p>
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg border-2 border-emerald-200">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">
                    Occupancy
                  </span>
                </div>
                <p className="text-2xl font-bold text-emerald-700">
                  {selectedRoom.occupancy}
                </p>
              </div>
            </div>

            {/* Available Time Slots */}
            <div className="mb-4">
              <h4 className="text-sm font-bold text-emerald-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Available Time Slots:
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedRoom.availableSlots.length > 0 ? (
                  selectedRoom.availableSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedTime(slot)}
                      className={`px-4 py-2 border-2 rounded-lg text-sm font-semibold transition-all ${
                        selectedTime === slot
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-500"
                      }`}
                    >
                      {slot}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    No available slots for selected date
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedRoom.features.map((feature, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Chatbot */}
        <div className="flex-1 flex flex-col bg-gradient-to-b from-white to-emerald-50">
          <div className="p-4 border-b border-emerald-200 bg-white">
            <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800">
              <Leaf className="w-5 h-5 text-emerald-600" />
              AI Room Assistant
            </h3>
            <p className="text-sm text-gray-600">
              Ask me about room availability, sustainability, and booking!
            </p>
          </div>

          <div className="p-4">
            <EnergyChart />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl p-4 ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md"
                      : "bg-white border-2 border-emerald-200 text-gray-800 shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border-2 border-emerald-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-emerald-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask: 'I need a room tomorrow at 2 PM in the Science Center'"
                className="flex-1 px-4 py-3 border-2 border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold hover:from-emerald-700 hover:to-green-700"
              >
                <Send className="w-5 h-5" />
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Book {selectedRoom?.name}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={bookingForm.userName}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, userName: e.target.value })
                  }
                  className="w-full px-4 py-2 border-2 border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={bookingForm.userEmail}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      userEmail: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border-2 border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="john@lakeforest.edu"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Purpose (Optional)
                </label>
                <textarea
                  value={bookingForm.purpose}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, purpose: e.target.value })
                  }
                  className="w-full px-4 py-2 border-2 border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Study group, meeting, etc."
                  rows={3}
                />
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg border-2 border-emerald-200">
                <p className="text-sm text-gray-700">
                  <strong>Room:</strong> {selectedRoom?.name}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Building:</strong> {selectedRoom?.building}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Date:</strong>{" "}
                  {selectedDate &&
                    new Date(selectedDate + "T00:00:00").toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Time:</strong> {selectedTime}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>People:</strong> {parsedNumPeople}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setBookingForm({
                      userName: "",
                      userEmail: "",
                      purpose: "",
                    });
                  }}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookRoom}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg font-bold hover:shadow-lg transition-all hover:from-emerald-700 hover:to-green-700"
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
