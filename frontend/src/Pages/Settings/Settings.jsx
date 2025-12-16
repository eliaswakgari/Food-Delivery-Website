import React, { useEffect, useState } from "react";
import "./Settings.css";
import axios from "axios";
import { FaMoon, FaSun } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { API_BASE_URL } from "../../store/config";
import { setTheme } from "../../store/uiSlice";
import { setCredentials } from "../../store/authSlice";

const Settings = () => {
         const dispatch = useDispatch();
         const token = useSelector((state) => state.auth.token);
         const user = useSelector((state) => state.auth.user);
         const theme = useSelector((state) => state.ui.theme);

         const [name, setName] = useState("");
         const [email, setEmail] = useState("");
         const [currentPassword, setCurrentPassword] = useState("");
         const [newPassword, setNewPassword] = useState("");
         const [confirmNewPassword, setConfirmNewPassword] = useState("");
         const [avatarPreview, setAvatarPreview] = useState("");
         const [avatarFile, setAvatarFile] = useState(null);
         const [loading, setLoading] = useState(false);
         const [message, setMessage] = useState("");
         const [error, setError] = useState("");

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
                  // If no new file was selected, keep whatever avatar the user already had.
                  if (!avatarFile) return avatarPreview || "";

                  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
                  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

                  // If Cloudinary is not configured, do not attempt to upload and do not
                  // change the persisted avatar (return empty string so backend ignores it).
                  if (!cloudName || !uploadPreset) {
                           console.warn("Cloudinary env variables are missing; skipping avatar upload.");
                           return "";
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
                                    // Fallback: do not change avatar if upload fails
                                    return "";
                           }

                           const data = await res.json();
                           // Only ever persist a real URL from Cloudinary, never a blob:
                           return data.secure_url || "";
                  } catch (err) {
                           console.error("Avatar upload error", err);
                           // Fallback: keep existing avatar on any error by not sending a new value
                           return "";
                  }
         };

         const handleSubmit = async (e) => {
                  e.preventDefault();
                  setError("");
                  setMessage("");

                  const wantsPasswordChange = newPassword || confirmNewPassword;

                  if (wantsPasswordChange && (!currentPassword || !newPassword || !confirmNewPassword)) {
                           setError("Please fill current, new, and confirm password to change password");
                           return;
                  }

                  if (wantsPasswordChange && newPassword !== confirmNewPassword) {
                           setError("Passwords do not match");
                           return;
                  }

                  if (!token) {
                           setError("You must be logged in to update your profile");
                           return;
                  }

                  try {
                           setLoading(true);

                           let avatarUrl = avatarPreview || "";
                           if (avatarFile) {
                                    avatarUrl = await uploadAvatarToCloudinary();
                           }

                           const payload = {
                                    name,
                                    avatar: avatarUrl,
                           };

                           if (wantsPasswordChange) {
                                    payload.password = newPassword;
                                    payload.currentPassword = currentPassword;
                           }

                           const res = await axios.put(
                                    `${API_BASE_URL}/api/user/profile`,
                                    payload,
                                    {
                                             // Use fd_token cookie for auth
                                             withCredentials: true,
                                    }
                           );

                           if (res.data && res.data.success && res.data.user) {
                                    const updatedUser = res.data.user;
                                    dispatch(
                                             setCredentials({
                                                      token,
                                                      role: user?.role,
                                                      user: updatedUser,
                                             })
                                    );
                                    setMessage("Profile updated successfully");
                           } else {
                                    setError(res.data.message || "Failed to update profile");
                           }
                  } catch (err) {
                           const backendMessage = err?.response?.data?.message;
                           setError(backendMessage || "Error updating profile");
                  } finally {
                           setLoading(false);
                  }
         };

         const handleThemeToggle = () => {
                  dispatch(setThemeAction(theme === "dark" ? "light" : "dark"));
         };

         return (
                  <div className="settings-page">
                           <h2 className="settings-title">Account Settings</h2>

                           <section className="settings-section">
                                    <h3 className="settings-section-title">Profile</h3>
                                    <form onSubmit={handleSubmit} className="settings-form">
                                             <label>
                                                      Name
                                                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                                             </label>

                                             <label>
                                                      Email
                                                      <input type="email" value={email} disabled />
                                             </label>

                                             <label>
                                                      Current Password
                                                      <input
                                                               type="password"
                                                               value={currentPassword}
                                                               onChange={(e) => setCurrentPassword(e.target.value)}
                                                               placeholder="Required only when changing password"
                                                      />
                                             </label>

                                             <label>
                                                      New Password
                                                      <input
                                                               type="password"
                                                               value={newPassword}
                                                               onChange={(e) => setNewPassword(e.target.value)}
                                                               placeholder="Leave blank to keep current password"
                                                      />
                                             </label>

                                             <label>
                                                      Confirm New Password
                                                      <input
                                                               type="password"
                                                               value={confirmNewPassword}
                                                               onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                      />
                                             </label>

                                             <label>
                                                      Profile Image
                                                      <input type="file" accept="image/*" onChange={handleAvatarChange} />
                                             </label>

                                             {avatarPreview && (
                                                      <div className="settings-avatar-preview">
                                                               <img src={avatarPreview} alt="Avatar preview" />
                                                      </div>
                                             )}

                                             {error && <p className="settings-error">{error}</p>}
                                             {message && <p className="settings-message">{message}</p>}

                                             <button type="submit" disabled={loading} className="settings-save-btn">
                                                      {loading ? "Saving..." : "Save Changes"}
                                             </button>
                                    </form>
                           </section>

                           <section className="settings-section">
                                    <h3 className="settings-section-title">Appearance</h3>
                                    <div className="theme-toggle">
                                             <span>Theme:</span>
                                             <button type="button" onClick={handleThemeToggle} className="theme-toggle-btn">
                                                      {theme === "dark" ? (
                                                               <>
                                                                        <FaSun /> <span>Light</span>
                                                               </>
                                                      ) : (
                                                               <>
                                                                        <FaMoon /> <span>Dark</span>
                                                               </>
                                                      )}
                                             </button>
                                    </div>
                           </section>
                  </div >
         );
};

export default Settings;
