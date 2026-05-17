import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_URL}/api/admin/enquiries`;

function SalesTeam() {
    const [winners, setWinners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchWinners = async () => {
            setLoading(true);
            setError("");
            try {
                const token = localStorage.getItem("adminToken");
                const res = await axios.get(`${API_BASE}/winners`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setWinners(res.data.data || []);
            } catch (err) {
                setError("Failed to fetch winners");
            } finally {
                setLoading(false);
            }
        };
        fetchWinners();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading…</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Auction Winners</h1>
            {winners.length === 0 ? (
                <div className="text-slate-500">No winners found.</div>
            ) : (
                <table className="min-w-full border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-2 text-left">Enquiry ID</th>
                            <th className="px-4 py-2 text-left">Winner Name</th>
                            <th className="px-4 py-2 text-left">Email</th>
                            <th className="px-4 py-2 text-left">Bid Amount</th>
                            <th className="px-4 py-2 text-left">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {winners.map((w, i) => (
                            <tr key={w.enquiryId || i} className="border-t border-slate-100">
                                <td className="px-4 py-2">{w.enquiryId}</td>
                                <td className="px-4 py-2">{w.winnerName}</td>
                                <td className="px-4 py-2">{w.winnerEmail}</td>
                                <td className="px-4 py-2">{w.bidAmount}</td>
                                <td className="px-4 py-2">
                                    <WinnerDetailsButton enquiryId={w.enquiryId} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

function WinnerDetailsButton({ enquiryId }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button
                className="px-3 py-1 bg-primary text-white rounded-theme text-xs font-semibold shadow-theme hover:bg-primary-hover"
                onClick={() => setOpen(true)}
            >
                View Winner
            </button>
            {open && <WinnerDetailsModal enquiryId={enquiryId} onClose={() => setOpen(false)} />}
        </>
    );
}

function WinnerDetailsModal({ enquiryId, onClose }) {
    const [winner, setWinner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchWinner = async () => {
            setLoading(true);
            setError("");
            try {
                const token = localStorage.getItem("adminToken");
                const res = await axios.get(`${API_BASE}/${enquiryId}/winner`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setWinner(res.data.data || null);
            } catch (err) {
                setError("Failed to fetch winner details");
            } finally {
                setLoading(false);
            }
        };
        fetchWinner();
    }, [enquiryId]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-theme shadow-theme w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-4">Winner Details</h2>
                {loading ? (
                    <div className="text-center text-muted">Loading…</div>
                ) : error ? (
                    <div className="text-center text-danger">{error}</div>
                ) : winner ? (
                    <div className="space-y-2">
                        <div><b>Name:</b> {winner.winnerName}</div>
                        <div><b>Email:</b> {winner.winnerEmail}</div>
                        <div><b>Bid Amount:</b> {winner.bidAmount}</div>
                        <div><b>Enquiry ID:</b> {winner.enquiryId}</div>
                        {/* Add more winner details as needed */}
                    </div>
                ) : (
                    <div className="text-center text-muted">No winner found.</div>
                )}
                <button className="mt-6 w-full py-2 bg-primary text-white rounded-theme font-semibold hover:bg-primary-hover" onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
}

export default SalesTeam;
