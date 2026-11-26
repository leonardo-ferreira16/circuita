import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchCurrentUser(authToken) {
    try {
      console.log("Chamando /auth/me...");
      const response = await api.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log("/auth/me OK:", response.data);
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.log("/auth/me FALHOU");
      console.log("status:", error?.response?.status);
      console.log("data:", error?.response?.data);
      localStorage.removeItem("token");
      setToken("");
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function fetchCurrentUser(authToken) {
    try {
        const response = await api.get("/auth/me", {
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
        });

        setUser(response.data);
        return response.data;
    } catch (error) {
        console.error("Erro em /auth/me:", error?.response?.status, error?.response?.data);
        localStorage.removeItem("token");
        setToken("");
        setUser(null);
        throw error;
    } finally {
        setLoading(false);
    }
  }

    async function login(employeeId, password) {
        const formData = new URLSearchParams();
        formData.append("username", employeeId);
        formData.append("password", password);

        const response = await api.post("/auth/", formData, {
            headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        const accessToken = response.data.access_token;

        localStorage.setItem("token", accessToken);
        setToken(accessToken);

        const currentUser = await fetchCurrentUser(accessToken);
        return currentUser;
    }

  function logout() {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setLoading(false);
  }

  useEffect(() => {
    async function initializeAuth() {
      if (token) {
        try {
          await fetchCurrentUser(token);
        } catch {
          // já tratado acima
        }
      } else {
        setLoading(false);
      }
    }

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}