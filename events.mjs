// NOTE: Keep this file synced with events.js in client
import deepFreeze from "deep-freeze"

export const EVENTS = deepFreeze({
    // To Server //
    CONNECTION: "connection",
    DISCONNECT: "disconnect",
    ATTEMPT_PLAY: "attempt-play",
    DO_ROLL: "do-roll",
    DO_HOLD: "do-hold",
    // From Server //
    PLAYER_CONNECT: "player-connect",
    PLAYER_DISCONNECT: "player-disconnect",
    ATTEMPT_PLAY_RESPONSE: "attempt-play-response",
    ATTEMPT_PLAY_RESPONSE_TYPES: {
        WAITING: "waiting",
        STARTING: "starting",
        FULL: "full"
    },
    SET_ACTIVE_PLAYER: "set-active-player",
    UPDATE_SCORE: "update-score",
    UPDATE_TOTAL_SCORE: "update-total-score",
})