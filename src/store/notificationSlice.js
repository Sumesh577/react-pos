import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: []
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const { id, type, message, duration = 5000 } = action.payload;
      state.notifications.push({
        id,
        type,
        message,
        duration,
        timestamp: Date.now()
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    }
  }
});

export const { addNotification, removeNotification, clearNotifications } = notificationSlice.actions;

// Thunk for auto-removing notifications
export const showNotification = (type, message, duration = 5000) => (dispatch) => {
  const id = Date.now().toString();
  dispatch(addNotification({ id, type, message, duration }));

  // Auto-remove after duration
  setTimeout(() => {
    dispatch(removeNotification(id));
  }, duration);
};

// Selectors
export const selectNotifications = (state) => state.notification.notifications;

export default notificationSlice.reducer;
