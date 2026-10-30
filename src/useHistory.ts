import { useCallback, useReducer } from "react";
import type { SetStateAction } from "react";

type History<T> = {
  past: T[];
  present: T;
  future: T[];
  group?: string;
  at: number;
};
type Action<T> =
  | { type: "set"; value: SetStateAction<T>; group?: string; at: number }
  | { type: "replace"; value: T }
  | { type: "undo" | "redo" };
export function historyReducer<T>(
  state: History<T>,
  action: Action<T>,
): History<T> {
  if (action.type === "replace")
    return { past: [], present: action.value, future: [], at: 0 };
  if (action.type === "undo") {
    if (!state.past.length) return state;
    return {
      past: state.past.slice(0, -1),
      present: state.past.at(-1)!,
      future: [state.present, ...state.future].slice(0, 60),
      at: 0,
    };
  }
  if (action.type === "redo") {
    if (!state.future.length) return state;
    return {
      past: [...state.past, state.present].slice(-60),
      present: state.future[0],
      future: state.future.slice(1),
      at: 0,
    };
  }
  if (action.type !== "set") return state;
  const value =
    typeof action.value === "function"
      ? (action.value as (previous: T) => T)(state.present)
      : action.value;
  if (Object.is(value, state.present)) return state;
  const merge =
    !!action.group &&
    state.group === action.group &&
    action.at - state.at <= 750 &&
    !state.future.length;
  return {
    past: merge ? state.past : [...state.past, state.present].slice(-60),
    present: value,
    future: [],
    group: action.group,
    at: action.at,
  };
}
export function useHistory<T>(initial: T) {
  const [state, dispatch] = useReducer(historyReducer<T>, {
    past: [],
    present: initial,
    future: [],
    at: 0,
  });
  const set = useCallback(
    (value: SetStateAction<T>, group?: string) =>
      dispatch({ type: "set", value, group, at: Date.now() }),
    [],
  );
  const replace = useCallback(
    (value: T) => dispatch({ type: "replace", value }),
    [],
  );
  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);
  return {
    value: state.present,
    set,
    replace,
    undo,
    redo,
    canUndo: !!state.past.length,
    canRedo: !!state.future.length,
  };
}
