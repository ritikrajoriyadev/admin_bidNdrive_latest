import React, { useMemo, useState } from 'react';
import { Search, RefreshCw, DollarSign, Users, Calendar, CheckCircle2, Truck, ArrowRight } from 'lucide-react';

const dealsData = [
    {
        id: 'CD-10234',
        buyer: 'Amit Sharma',
        car: 'Hyundai Creta SX',
        price: 1145000,
        type: 'Auction',
        status: 'Settled',
        closedOn: '2026-06-08',
        daysToClose: 4,
    },
    {
        id: 'CD-10235',
        buyer: 'Riya Gupta',
        car: 'Maruti Swift VXi',
        price: 568000,
        type: 'ReAution',
        status: 'Settled',
        closedOn: '2026-06-07',
        daysToClose: 2,
    },
    {
        id: 'CD-10236',
        buyer: 'Sahil Patel',
        car: 'Toyota Glanza G',
        price: 780000,
        type: 'BNB',
        status: 'Settled',
        closedOn: '2026-06-05',
        daysToClose: 3,
    },
    {
        id: 'CD-10237',
        buyer: 'Nisha Verma',
        car: 'Honda City VX',
        price: 1450000,
        type: 'Auction',
        status: 'Settled',
        closedOn: '2026-06-04',
        daysToClose: 6,
    },
    {
        id: 'CD-10238',
        buyer: 'Rohit Singh',
        car: 'Kia Seltos HTK',
        price: 1327000,
        type: 'Auction',
        status: 'Settled',
        closedOn: '2026-06-03',
        daysToClose: 5,
    },
];

const statCards = [
    {
        label: 'Total Closed Deals',
        key: 'count',
        icon: <CheckCircle2 className="w-4 h-4 text-white" />,
        accent: 'bg-indigo-500',
    },
    {
        label: 'Revenue',
        key: 'revenue',
        icon: <DollarSign className="w-4 h-4 text-white" />,
        accent: 'bg-emerald-500',
    },
    {
        label: 'Avg. Close Time',
        key: 'avgDays',
        icon: <Calendar className="w-4 h-4 text-white" />,
        accent: 'bg-sky-500',
    },
    {
        label: 'Unique Buyers',
        key: 'buyers',
        icon: <Users className="w-4 h-4 text-white" />,
        accent: 'bg-fuchsia-500',
    },
];

const formatINR = (value) =>
    `₹${value.toLocaleString('en-IN')}`;

export default function ClosedDeals() {
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('table');

    const filteredDeals = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return dealsData;
        return dealsData.filter((deal) => {
            return [deal.id, deal.buyer, deal.car, deal.type, deal.status, deal.closedOn]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(term);
        });
    }, [search]);

    const summary = useMemo(() => {
        const total = filteredDeals.length;
        const revenue = filteredDeals.reduce((sum, deal) => sum + deal.price, 0);
        const avgDays = total ? Math.round(filteredDeals.reduce((sum, deal) => sum + deal.daysToClose, 0) / total) : 0;
        const buyers = new Set(filteredDeals.map((deal) => deal.buyer)).size;
        return { total, revenue, avgDays, buyers };
    }, [filteredDeals]);

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Closed Deals</h1>
                    <p className="text-gray-500 text-sm mt-1">Review finalized transactions and settled vehicle deals across auctions and BNB listings.</p>
                </div>

                <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all text-sm shadow-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    Reset
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <div key={card.key} className="rounded-3xl bg-white border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl ${card.accent}`}>
                            {card.icon}
                        </div>
                        <p className="text-gray-400 text-xs uppercase tracking-[0.22em] mt-4 mb-2">{card.label}</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {card.key === 'count' && summary.total}
                            {card.key === 'revenue' && formatINR(summary.revenue)}
                            {card.key === 'avgDays' && `${summary.avgDays} days`}
                            {card.key === 'buyers' && summary.buyers}
                        </p>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search deal ID, buyer, car, type..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-gray-700 placeholder-gray-400 focus:border-indigo-400 focus:outline-none transition-all text-sm shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 p-1">
                    {['table', 'grid'].map((mode) => (
                        <button
                            key={mode}
                            type="button"
                            onClick={() => setViewMode(mode)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${viewMode === mode ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredDeals.map((deal) => (
                        <div key={deal.id} className="rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                            <div className="p-5">
                                <div className="flex items-center justify-between gap-3 mb-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{deal.type}</p>
                                        <h2 className="text-lg font-semibold text-gray-900 mt-2">{deal.car}</h2>
                                    </div>
                                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 text-xs font-semibold">
                                        <Truck className="w-3.5 h-3.5" />
                                        {deal.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                                    <div>
                                        <p className="font-semibold text-gray-900">Deal ID</p>
                                        <p className="mt-1">{deal.id}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Closed</p>
                                        <p className="mt-1">{deal.closedOn}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mt-4">
                                    <div>
                                        <p className="font-semibold text-gray-900">Buyer</p>
                                        <p className="mt-1">{deal.buyer}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Price</p>
                                        <p className="mt-1">{formatINR(deal.price)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="border-t border-gray-100 bg-gray-50 p-4 flex items-center justify-between gap-3">
                                <span className="text-gray-500 text-sm">Closed in {deal.daysToClose} days</span>
                                <button type="button" className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-600 transition-all">
                                    View <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="overflow-x-auto rounded-3xl bg-white border border-gray-100 shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Deal ID', 'Buyer', 'Car', 'Price', 'Type', 'Closed On', 'Days', 'Status', 'Action'].map((heading) => (
                                    <th key={heading} className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredDeals.map((deal) => (
                                <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{deal.id}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{deal.buyer}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{deal.car}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{formatINR(deal.price)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{deal.type}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{deal.closedOn}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{deal.daysToClose}</td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                            {deal.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <button type="button" className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-600 transition-all">
                                            <ArrowRight className="w-3 h-3" />
                                            Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
