// Redux store root. This file is configuration ONLY — no business logic lives
// here. Domain logic stays in each feature's `store/` folder (slice + thunks +
// selectors), keeping the app's vertical-slice isolation intact.

import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './rootReducer';

export const store = configureStore({
  reducer: rootReducer,
});

export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
