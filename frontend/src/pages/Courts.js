import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Courts = () => {
    const navigate = useNavigate();
    const { data: courts = [], isLoading, error } = useQuery('courts', () =>
        axios.get('http://localhost:5000/api/courts').then((res) => res.data)
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
                <div className="text-center text-red-600 font-semibold">
                    Error loading courts. Please try again later.
                </div>
            </div>
        );
    }

    const handleBooking = (courtId) => {
        navigate(`/booking?courtId=${courtId}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-10 text-indigo-800">
                    Available Futsal Courts
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {courts.map((court) => (
                        <div
                            key={court.id}
                            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                        >
                            <div className="h-48 bg-gray-200 relative">
                                <img
                                  src={`http://localhost:5000/api${encodeURI(court.image_url)}`}
                                  alt={court.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = 'https://placehold.co/600x400';
                                  }}
                                />
                            </div>
                            <div className="p-6">
                                <h2 className="text-2xl font-semibold text-indigo-700 mb-4">
                                    {court.name}
                                </h2>
                                <div className="space-y-3">
                                    <div className="flex items-start text-gray-600">
                                        <svg className="h-6 w-6 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span>{court.location}</span>
                                    </div>
                                    <div className="flex items-start text-gray-600">
                                        <svg className="h-6 w-6 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="flex flex-col">
                                            <span>Regular Price: ${Number(court.price_per_hour).toFixed(2)}/hr</span>
                                            <span>Peak Hours: ${Number(court.peak_price || 0).toFixed(2)}/hr</span>
                                            <span>Off-Peak: ${Number(court.off_peak_price || 0).toFixed(2)}/hr</span>
                                        </div>
                                    </div>

                                    <div className="flex items-start text-gray-600">
                                        <svg className="h-6 w-6 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <span>{court.contact_number || 'No contact number'}</span>
                                    </div>

                                    <div className="flex items-start text-gray-600">
                                        <svg className="h-6 w-6 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <span>Available Slots: {court.available_slots}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleBooking(court.id)}
                                    className="w-full mt-6 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-semibold"
                                >
                                    Book Now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Courts; 