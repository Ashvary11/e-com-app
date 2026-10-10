import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getActiveSessions,
  getMe,
  googleLoginUser,
  loginUser,
  logoutAllSessions,
  logoutUser,
  revokeSession,
} from "../../services/authService";

export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMe();
      return response.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Not authenticated",
      );
    }
  },
);

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await loginUser(credentials);

      let user;

      if (response.user) {
        user = response.user;
      } else {
        const me = await getMe();
        user = me.user;
      }

      return user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Unable to sign in.",
      );
    }
  },
);
export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async (credential, { rejectWithValue }) => {
    try {
      const response = await googleLoginUser(credential);

      let user;

      if (response.user) {
        user = response.user;
      } else {
        const me = await getMe();
        user = me.user;
      }

      return {
        user,
        isNewUser: response.isNewUser,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Unable to sign in with Google.",
      );
    }
  },
);
export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      return await logoutUser();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Unable to logout",
      );
    }
  },
);
export const fetchActiveSessions = createAsyncThunk(
  "auth/fetchActiveSessions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getActiveSessions();

      return response.data || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Unable to load active sessions.",
      );
    }
  },
);

export const logoutAll = createAsyncThunk(
  "auth/logoutAll",
  async (_, { rejectWithValue }) => {
    try {
      return await logoutAllSessions();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Unable to logout from other sessions.",
      );
    }
  },
);

export const revokeSessionById = createAsyncThunk(
  "auth/revokeSession",
  async (sessionId, { rejectWithValue }) => {
    try {
      return {
        ...(await revokeSession(sessionId)),
        sessionId,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Unable to revoke session.",
      );
    }
  },
);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  sessions: [],
  sessionsLoading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.sessions = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      })

      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(login.rejected, (state) => {
        state.loading = false;
      })

      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      })
      .addCase(logout.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      })
      .addCase(fetchActiveSessions.pending, (state) => {
        state.sessionsLoading = true;
      })
      .addCase(fetchActiveSessions.fulfilled, (state, action) => {
        state.sessions = action.payload;
        state.sessionsLoading = false;
      })
      .addCase(fetchActiveSessions.rejected, (state) => {
        state.sessions = [];
        state.sessionsLoading = false;
      })
      .addCase(logoutAll.fulfilled, (state) => {
        state.sessions = [];
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.sessionsLoading = false;
      })
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(googleLogin.rejected, (state) => {
        state.loading = false;
      });
  },
});
export const { clearAuth } = authSlice.actions;
export default authSlice.reducer;
