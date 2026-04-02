export const ADMIN_ROOM = "role:admin";

export const toUserRoom = (userId: number | string): string =>
  `user:${String(userId)}`;

