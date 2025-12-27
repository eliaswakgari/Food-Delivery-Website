import React, { useEffect, useState } from "react";
import "./Settings.css";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../store/config";
import { setCredentials } from "../../store/authSlice";

const getImageSrc = (image) => {
         if (!image) return "";
         if (typeof image !== "string") return "";
         if (image.startsWith("blob:")) return image;
         if (image.startsWith("data:")) return image;
         if (image.startsWith("http")) return image;
         if (image.startsWith("/")) return `${API_BASE_URL}${image}`;
         return `${API_BASE_URL}/images/${image}`;
};

const Settings = () => {
         const dispatch = useDispatch();
         const navigate = useNavigate();
         const token = useSelector((state) => state.auth.token);
         const user = useSelector((state) => state.auth.user);
         const role = useSelector((state) => state.auth.role);

         // Profile form state
         const [name, setName] = useState("");
         const [email, setEmail] = useState("");
         const [avatarPreview, setAvatarPreview] = useState("");
         const [avatarFile, setAvatarFile] = useState(null);
         const [profileLoading, setProfileLoading] = useState(false);
         const [profileMessage, setProfileMessage] = useState("");
         const [profileError, setProfileError] = useState("");

         // Password form state
         const [currentPassword, setCurrentPassword] = useState("");
         const [newPassword, setNewPassword] = useState("");
         const [confirmNewPassword, setConfirmNewPassword] = useState("");
         const [passwordLoading, setPasswordLoading] = useState(false);
         const [passwordMessage, setPasswordMessage] = useState("");
         const [passwordError, setPasswordError] = useState("");

         useEffect(() => {
                  if (user) {
                           setName(user.name || "");
                           setEmail(user.email || "");
                           setAvatarPreview(user.avatar || "");
                  }
         }, [user]);

         const handleAvatarChange = (e) => {
                  const file = e.target.files && e.target.files[0];
                  if (!file) return;
                  setAvatarFile(file);
                  setAvatarPreview(URL.createObjectURL(file));
         };

         const uploadAvatarToCloudinary = async () => {
                  if (!avatarFile) return avatarPreview || "";

                  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
                  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

                  if (!cloudName || !uploadPreset) {
                           // Fallback: upload to backend local storage
                           try {
                                    const formData = new FormData();
                                    formData.append("avatar", avatarFile);

                                    const res = await axios.post(`${API_BASE_URL}/api/user/avatar`, formData, {
                                             withCredentials: true,
                                             headers: { "Content-Type": "multipart/form-data" },
                                    });

                                    if (res.data?.success && res.data.avatar) {
                                             return res.data.avatar;
                                    }
                                    return "";
                           } catch (err) {
                                    console.error("Backend avatar upload error", err);
                                    return "";
                           }
                  }

                  const formData = new FormData();
                  formData.append("file", avatarFile);
                  formData.append("upload_preset", uploadPreset);

                  try {
                           const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                                    method: "POST",
                                    body: formData,
                           });

                           if (!res.ok) {
                                    console.error("Avatar upload failed with status", res.status);
                                    return "";
                           }

                           const data = await res.json();
                           return data.secure_url || "";
                  } catch (err) {
                           console.error("Avatar upload error", err);
                           return "";
                  }
         };

         const handleProfileSubmit = async (e) => {
                  e.preventDefault();
                  setProfileError("");
                  setProfileMessage("");

                  if (!token) {
                           setProfileError("You must be logged in to update your profile");
                           return;
                  }

                  if (!name || !name.trim()) {
                           setProfileError("Name is required");
                           return;
                  }

                  try {
                           setProfileLoading(true);

                           const isBlobUrl = (url) => typeof url === "string" && url.startsWith("blob:");
                           let avatarUrl = user?.avatar || "";

                           if (avatarFile) {
                                    const uploaded = await uploadAvatarToCloudinary();
                                    if (!uploaded) {
                                             setProfileError(
                                                      "Avatar upload failed. Please configure Cloudinary env variables (VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET) or try again."
                                             );
                                             return;
                                    }
                                    avatarUrl = uploaded;
                           } else if (avatarPreview && !isBlobUrl(avatarPreview)) {
                                    avatarUrl = avatarPreview;
                           }

                           const res = await axios.put(
                                    `${API_BASE_URL}/api/user/profile`,
                                    {
                                             name: name.trim(),
                                             avatar: avatarUrl,
                                    },
                                    {
                                             withCredentials: true,
                                    }
                           );

                           if (res.data && res.data.success && res.data.user) {
                                    const updatedUser = res.data.user;
                                    dispatch(
                                             setCredentials({
                                                      token,
                                                      role: role || user?.role,
                                                      user: updatedUser,
                                             })
                                    );
                                    setProfileMessage("Profile updated successfully");
                                    setAvatarFile(null);
                                    setAvatarPreview(updatedUser.avatar || avatarUrl || "");
                           } else {
                                    setProfileError(res.data.message || "Failed to update profile");
                           }
                  } catch (err) {
                           const backendMessage = err?.response?.data?.message;
                           setProfileError(backendMessage || "Error updating profile");
                  } finally {
                           setProfileLoading(false);
                  }
         };

         const handlePasswordSubmit = async (e) => {
                  e.preventDefault();
                  setPasswordError("");
                  setPasswordMessage("");

                  if (!currentPassword || !newPassword || !confirmNewPassword) {
                           setPasswordError("All password fields are required");
                           return;
                  }

                  if (newPassword !== confirmNewPassword) {
                           setPasswordError("New passwords do not match");
                           return;
                  }

                  if (newPassword.length < 8) {
                           setPasswordError("Password must be at least 8 characters long");
                           return;
                  }

                  if (!token) {
                           setPasswordError("You must be logged in to update your password");
                           return;
                  }

                  try {
                           setPasswordLoading(true);

                           const res = await axios.put(
                                    `${API_BASE_URL}/api/user/password`,
                                    {
                                             currentPassword,
                                             newPassword,
                                    },
                                    {
                                             withCredentials: true,
                                    }
                           );

                           if (res.data && res.data.success) {
                                    setPasswordMessage("Password updated successfully");
                                    setCurrentPassword("");
                                    setNewPassword("");
                                    setConfirmNewPassword("");
                           } else {
                                    setPasswordError(res.data.message || "Failed to update password");
                           }
                  } catch (err) {
                           const backendMessage = err?.response?.data?.message;
                           setPasswordError(backendMessage || "Error updating password");
                  } finally {
                           setPasswordLoading(false);
                  }
         };

         return (
                  <div className={`settings-page-wrapper ${role === "admin" ? "settings-admin" : ""}`}>
                           <div className="settings-header">
                                    <button 
                                             className="settings-back-button"
                                             onClick={() => navigate(role === "admin" ? "/admin" : "/")}
                                    >
                                             ← {role === "admin" ? "Back to Admin Dashboard" : "Back to Home"}
                                    </button>
                           </div>
                           <div className="settings-page">
                                    <h2 className="settings-title">Account Settings</h2>

                           {/* Profile Update Section */}
                           <section className="settings-section">
                                    <h3 className="settings-section-title">Profile Information</h3>
                                    <form onSubmit={handleProfileSubmit} className="settings-form">
                                             <label>
                                                      Name
                                                      <input 
                                                               type="text" 
                                                               value={name} 
                                                               onChange={(e) => setName(e.target.value)} 
                                                               required 
                                                               placeholder="Enter your name"
                                                      />
                                             </label>

                                             <label>
                                                      Email
                                                      <input type="email" value={email} disabled />
                                             </label>

                                             <label>
                                                      Profile Image
                                                      <input type="file" accept="image/*" onChange={handleAvatarChange} />
                                             </label>

                                             {avatarPreview && (
                                                      <div className="settings-avatar-preview">
                                                               <img src={getImageSrc(avatarPreview)} alt="Avatar preview" />
                                                      </div>
                                             )}

                                             {profileError && <p className="settings-error">{profileError}</p>}
                                             {profileMessage && <p className="settings-message">{profileMessage}</p>}

                                             <button type="submit" disabled={profileLoading} className="settings-save-btn">
                                                      {profileLoading ? "Saving..." : "Update Profile"}
                                             </button>
                                    </form>
                           </section>

                           {/* Password Update Section */}
                           <section className="settings-section">
                                    <h3 className="settings-section-title">Change Password</h3>
                                    <form onSubmit={handlePasswordSubmit} className="settings-form">
                                             <label>
                                                      Current Password
                                                      <input
                                                               type="password"
                                                               value={currentPassword}
                                                               onChange={(e) => setCurrentPassword(e.target.value)}
                                                               placeholder="Enter current password"
                                                               required
                                                      />
                                             </label>

                                             <label>
                                                      New Password
                                                      <input
                                                               type="password"
                                                               value={newPassword}
                                                               onChange={(e) => setNewPassword(e.target.value)}
                                                               placeholder="Enter new password (min 8 characters)"
                                                               required
                                                               minLength={8}
                                                      />
                                             </label>

                                             <label>
                                                      Confirm New Password
                                                      <input
                                                               type="password"
                                                               value={confirmNewPassword}
                                                               onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                               placeholder="Confirm new password"
                                                               required
                                                               minLength={8}
                                                      />
                                             </label>

                                             {passwordError && <p className="settings-error">{passwordError}</p>}
                                             {passwordMessage && <p className="settings-message">{passwordMessage}</p>}

                                             <button type="submit" disabled={passwordLoading} className="settings-save-btn">
                                                      {passwordLoading ? "Updating..." : "Update Password"}
                                             </button>
                                    </form>
                           </section>
                           </div>
                  </div>
         );
};

export default Settings;
