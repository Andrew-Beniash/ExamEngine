import { configureStore } from '@reduxjs/toolkit';
import { packsApi } from '../../data/api/packsApi';

export const store = configureStore({
  reducer: {
    [packsApi.reducerPath]: packsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          // Ignore these action types
          'persist/FLUSH',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PERSIST',
          'persist/PURGE',
          'persist/REGISTER',
        ],
      },
    }).concat(packsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
