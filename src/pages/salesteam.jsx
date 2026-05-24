import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, Trophy, User, Phone, Mail, Hash, X } from "lucide-react";
import { decryptResponse } from '../utls/decryptResponse';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/admin/enquiries`;

/* ─── Avatar ─────────────────────────────────────────────────────────────── */
const Avatar = ({ src, name, size = "md" }) => {
  const [imgError, setImgError] = useState(false);
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  const sizeClass = size === "lg" ? "w-12 h-12 text-base" : "w-9 h-9 text-sm";

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgError(true)}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white/[0.08] flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${sizeClass} rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0`}>
      <span className="text-indigo-300 font-bold">{initials}</span>
    </div>
  );
};

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accent, sub }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white border border-white/[0.06] p-5 hover:border-white/[0.1] transition-all duration-300 group">
    <div className={`absolute -top-5 -right-5 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 ${accent}`} />
    <div className="flex items-center justify-between mb-3">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent} bg-opacity-20 indigo-500/60`}>
        {icon}
      </span>
      <span className="indigo-500/20 text-xs font-medium">{sub}</span>
    </div>
    <p className="indigo-500 text-2xl font-bold tracking-tight">{value}</p>
    <p className="indigo-500/35 text-xs font-medium mt-0.5 tracking-wide uppercase">{label}</p>
  </div>
);

/* ─── Winner Details Modal ───────────────────────────────────────────────── */
const WinnerDetailsModal = ({ item, onClose }) => {
  if (!item) return null;
  const { enquiryId, winner } = item;
  const fullName = `${winner.firstName} ${winner.lastName}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center indigo-500/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center indigo-500/50 hover:indigo-500 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Avatar src={winner.profileImage} name={fullName} size="lg" />
          <div>
            <h2 className="indigo-500 text-lg font-bold">{fullName}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 text-xs font-semibold">Auction Winner</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3">
          {[
            { icon: <Mail className="w-4 h-4" />, label: "Email", value: winner.email },
            { icon: <Phone className="w-4 h-4" />, label: "Phone", value: winner.phone },
            { icon: <Hash className="w-4 h-4" />, label: "Enquiry ID", value: enquiryId, mono: true },
            { icon: <User className="w-4 h-4" />, label: "User ID", value: winner._id, mono: true },
          ].map(({ icon, label, value, mono }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800/50 border border-white/[0.05]"
            >
              <span className="indigo-500/30 flex-shrink-0">{icon}</span>
              <div className="min-w-0 flex-1">
                <p className="indigo-500/40 text-xs font-medium uppercase tracking-wide mb-0.5">{label}</p>
                <p className={`indigo-500/80 text-sm truncate ${mono ? "font-mono text-xs" : "font-medium"}`}>
                  {value || "—"}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 indigo-500 font-semibold text-sm transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function SalesTeam() {
  const [winners, setWinners] = useState([]);
  const [filteredWinners, setFilteredWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  /* ── Fetch ────────────────────────────────────────────────────────────── */
  const fetchWinners =
    async () => {
      setLoading(true);

      try {
        const {
          data
        } = await api.get(
          '/api/admin/enquiries/winners',
          {
            headers:
              getAuthHeaders()
          }
        );

        /**
         * decrypt response
         */
        const decryptedData =
          decryptResponse(
            data
          );

        setWinners(
          decryptedData
            ?.data || []
        );
      } catch (err) {
        addToast(
          err?.response?.data
            ?.message ||
          'Error loading winners',
          'error'
        );
      } finally {
        setLoading(false);
      }
    };
  useEffect(() => {

    fetchWinners();
  }, []);

  /* ── Filter ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredWinners(
      winners.filter(({ enquiryId, winner }) =>
        `${winner.firstName} ${winner.lastName} ${winner.email} ${winner.phone} ${enquiryId}`
          .toLowerCase()
          .includes(term)
      )
    );
  }, [winners, searchTerm]);

  /* ── States ───────────────────────────────────────────────────────────── */
  if (loading)
    return (
      <div className="flex items-center justify-center h-48 indigo-500/40">
        Loading winners…
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-48 text-red-400">
        {error}
      </div>
    );

  const withPhoto = winners.filter((w) => w.winner.profileImage).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold indigo-500">Auction Winners</h1>
        <p className="indigo-500/40 text-sm">All auction winners and their enquiry details</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Winners"
          value={winners.length}
          icon={<Trophy className="w-4 h-4" />}
          accent="bg-amber-500"
          sub="All Time"
        />
        <StatCard
          label="Unique Enquiries"
          value={new Set(winners.map((w) => w.enquiryId)).size}
          icon={<Hash className="w-4 h-4" />}
          accent="bg-indigo-500"
          sub="Linked"
        />
        <StatCard
          label="With Profile Photo"
          value={withPhoto}
          icon={<User className="w-4 h-4" />}
          accent="bg-emerald-500"
          sub="Uploaded"
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 indigo-500/40" />
        <input
          type="text"
          placeholder="Search by name, email, phone or enquiry ID…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-800 border border-white/[0.06] indigo-500 placeholder-white/40 focus:border-indigo-400/50 focus:outline-none transition-all"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-white/[0.06] overflow-hidden">
        {filteredWinners.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 indigo-500/40">
            <Trophy className="w-8 h-8 opacity-30" />
            <p>No winners found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["#", "Winner", "Email", "Phone", "Enquiry ID", "Details"].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-xs font-semibold indigo-500/40 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredWinners.map((item, index) => {
                  const { enquiryId, winner } = item;
                  const fullName = `${winner.firstName} ${winner.lastName}`;
                  return (
                    <tr
                      key={enquiryId}
                      className="hover:bg-white/[0.02] transition-colors duration-150"
                    >
                      {/* Rank */}
                      <td className="px-6 py-4">
                        <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                          <span className="text-amber-400 text-xs font-bold">{index + 1}</span>
                        </div>
                      </td>

                      {/* Avatar + Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={winner.profileImage} name={fullName} />
                          <div>
                            <p className="indigo-500 font-semibold text-sm">{fullName}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Trophy className="w-3 h-3 text-amber-400" />
                              <span className="text-amber-400 text-xs">Winner</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 indigo-500/60 text-sm">
                          <Mail className="w-3.5 h-3.5 indigo-500/30 flex-shrink-0" />
                          <span className="truncate max-w-[200px]">{winner.email}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 indigo-500/60 text-sm">
                          <Phone className="w-3.5 h-3.5 indigo-500/30 flex-shrink-0" />
                          <span>{winner.phone}</span>
                        </div>
                      </td>

                      {/* Enquiry ID */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs indigo-500/40 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06]">
                          {enquiryId}
                        </span>
                      </td>

                      {/* View Details */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-400/20 text-indigo-300 text-xs font-semibold hover:bg-indigo-500/25 transition-all"
                        >
                          <User className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedItem && (
        <WinnerDetailsModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}