import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

interface User {
  id: number;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

export const register = createAsyncThunk(
  "/register",
  async (credentials: { email: string; password: string; role: string }, { rejectWithValue }) => {
    try {
      const response = await fetch("http://localhost:8080/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return data; // Expect { id, email, role, token? }
      } else {
        return await response.text(); // Fallback to plain text (e.g., success message)
      }
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const login = createAsyncThunk(
  "/login",
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return data; // Expect { id, email, role, token }
      } else {
        const token = await response.text();
        console.log("Login successful, received token:", token.substring(0, 20) + "...");
        return { token: token.trim() }; // Return as object for consistency
      }
    } catch (error) {
      console.error("Login error in thunk:", error);
      return rejectWithValue((error as Error).message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      if (typeof document !== 'undefined') {
        document.cookie = "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        document.cookie = "userId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        document.cookie = "userEmail=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        document.cookie = "userRole=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      }
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload;
        if (typeof payload === 'object' && payload !== null && 'id' in payload && 'email' in payload && 'role' in payload) {
          state.user = { id: payload.id, email: payload.email, role: payload.role };
          if ('token' in payload) state.token = payload.token;
        } else {
          console.log("Registration successful:", payload);
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload;
        if (typeof payload === 'object' && payload !== null) {
          if ('token' in payload) state.token = payload.token;
          if ('id' in payload && 'email' in payload && 'role' in payload) {
            state.user = { id: payload.id, email: payload.email, role: payload.role };
          }
        }
        state.error = null;
        console.log("Token and user stored in Redux state");
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.token = null;
        state.user = null;
      });
  },
});

export const { logout, setToken, setUser } = authSlice.actions;
export default authSlice.reducer;