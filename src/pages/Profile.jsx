import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  User, Mail, Phone, Shield, Calendar, 
  Edit2, LogOut 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    fetchProfile();
  }, []);
   const handleLogout = () => {
    // clear token if needed
    localStorage.removeItem("adminToken");

    navigate("/");
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProfile(res.data.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/60">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-red-400 p-6">Failed to load profile</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
            <p className="text-white/50 mt-1">Manage your account information</p>
          </div>
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 transition-colors rounded-xl text-sm font-medium border border-white/10"
          >
            <Edit2 size={18} />
            Edit Profile
          </button>
        </div>

        <div className="bg-gray-900 border border-white/10 rounded-3xl overflow-hidden">
          {/* Profile Header / Avatar Section */}
          <div className="h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600"></div>
          
          <div className="px-8 -mt-12 pb-8">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-2xl bg-gray-800 border-4 border-gray-900 flex items-center justify-center text-4xl font-bold shadow-xl overflow-hidden">
                {profile.avatar ? (
                  <img 
                    src={profile.avatar} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </div>
                )}
              </div>

              <h2 className="mt-4 text-2xl font-semibold">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-white/50 flex items-center gap-2 mt-1">
                <Mail size={16} /> {profile.email}
              </p>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center mt-4">
              <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium
                ${profile.isActive 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" 
                  : "bg-red-500/10 text-red-400 border border-red-500/30"
                }`}>
                <div className={`w-2 h-2 rounded-full ${profile.isActive ? "bg-emerald-400" : "bg-red-400"} animate-pulse`}></div>
                {profile.isActive ? "Active" : "Inactive"}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="border-t border-white/10 px-8 py-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <DetailItem 
                icon={<User size={20} />}
                label="First Name"
                value={profile.firstName}
              />
              <DetailItem 
                icon={<User size={20} />}
                label="Last Name"
                value={profile.lastName}
              />
              <DetailItem 
                icon={<Phone size={20} />}
                label="Phone Number"
                value={profile.phone || "Not provided"}
              />
            </div>

            <div className="space-y-6">
              <DetailItem 
                icon={<Shield size={20} />}
                label="Role"
                value={profile.role}
                highlight
              />
              <DetailItem 
                icon={<Calendar size={20} />}
                label="Member Since"
                value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long' 
                }) : "N/A"}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-white/10 p-6 flex gap-3 bg-black/30">
            <button className="flex-1 py-3 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-medium transition-all active:scale-95">
              Change Password
            </button>
            <button  onClick ={handleLogout}className="flex-1 py-3 px-6 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-2xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2">
              <LogOut  size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Detail Component
const DetailItem = ({ icon, label, value, highlight = false }) => (
  <div className="group">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/70 group-hover:text-white transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/40 font-medium tracking-widest uppercase">{label}</p>
        <p className={`font-medium ${highlight ? "text-indigo-400" : "text-white"} truncate`}>
          {value}
        </p>
      </div>
    </div>
  </div>
);

export default Profile;