// Combines feature reducers into the root reducer. Add one line per feature
// that owns shared (cross-feature) state. Feature-local UI state should stay in
// the component / hook — do NOT add a slice for it here.

import { combineReducers } from '@reduxjs/toolkit';
import { progressReducer } from '../../features/learning-progress/store';

export const rootReducer = combineReducers({
  progress: progressReducer,
});
