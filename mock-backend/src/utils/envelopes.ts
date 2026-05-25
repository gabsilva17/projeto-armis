import type { BooleanFriendlyResponseT, ProblemDetails } from '../types/api.js';

export function ok(message?: string): BooleanFriendlyResponseT {
  return { content: true, message: message ?? null, tracking: null };
}

export function fail(message: string): BooleanFriendlyResponseT {
  return { content: false, message, tracking: null };
}

export function problem(status: number, title: string, detail: string, instance?: string): ProblemDetails {
  return {
    type: 'about:blank',
    title,
    status,
    detail,
    instance: instance ?? null,
  };
}
