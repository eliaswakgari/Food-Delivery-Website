import { useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { API_BASE_URL } from "../../store/config";
import { setCredentials } from "../../store/authSlice";

const AuthBootstrap = () => {
         const dispatch = useDispatch();
         const token = useSelector((state) => state.auth.token);

         useEffect(() => {
                  // If we already have a token in Redux, do nothing
                  if (token) return;

                  let cancelled = false;

                  const loadProfile = async () => {
                           try {
                                    const res = await axios.get(`${API_BASE_URL}/api/user/me`, {
                                             withCredentials: true,
                                    });

                                    if (!res.data || !res.data.success || !res.data.user) return;

                                    if (cancelled) return;

                                    const user = res.data.user;
                                    const role = user.role || "user";

                                    // We don't need the raw JWT in Redux; we just use a placeholder
                                    dispatch(
                                             setCredentials({
                                                      token: "cookie",
                                                      role,
                                                      user,
                                             })
                                    );
                           } catch (err) {
                                    // Not logged in or error; ignore, user stays unauthenticated in Redux
                           }
                  };

                  loadProfile();

                  return () => {
                           cancelled = true;
                  };
         }, [dispatch, token]);

         return null;
};

export default AuthBootstrap;
