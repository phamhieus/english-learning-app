// Typed Redux hooks. ALWAYS use these instead of the plain `useDispatch` /
// `useSelector` so RootState and thunk-aware AppDispatch are inferred for free.

import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './index';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
