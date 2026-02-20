export const SOCKET_PATH = '/api/socket'

export const SOCKET_EVENTS = {
  GAME_START: 'game-start',
  MOVEMENT: 'movement',
  SHOOT: 'shoot',
  STATE: 'state',
  DEAD: 'dead',
  UPDATED_USER_LIST: 'updatedUserlist',
  JOINING_LIST: 'joiningList',
  UPDATED_PLAYER_LIST: 'updatedPlayerList',
  JOIN_LOBBY: 'join-lobby',
  PLAYERS_UPDATE: 'players-update',
  CHAT_MESSAGE: 'chat-message',
  MATCH_TIMER: 'match-timer',
  SPECTATE_MODE: 'spectate-mode',
} as const
