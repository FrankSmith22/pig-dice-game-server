import { Server } from "socket.io"
import { createServer } from 'http'
import { EVENTS as E} from "./events.mjs"

const httpServer = createServer()

const io = new Server(4000, {
    cors: {
        origin: ["http://localhost:3000", "http://192.168.1.169:3000", "http://192.168.1.155:3000", "https://franksmith22.github.io"]
    }
})

const users = {}

io.on(E.CONNECTION, socket => {
    console.log('client connected: ' + socket.id)
    socket.on(E.ATTEMPT_PLAY, playerName => {
        const usersLen = Object.keys(users).length
        switch(usersLen){
            case 0:
                users[socket.id] = {playerName, wantsRematch: false}
                socket.emit(E.ATTEMPT_PLAY_RESPONSE, {
                    msg: E.ATTEMPT_PLAY_RESPONSE_TYPES.WAITING,
                    playerNames: Object.values(users).map(userObj => userObj.playerName)
                })
                break;
            case 1:
                if(users[socket.id]){
                    // This client is already connected, don't start
                    return
                }
                // Tell user game is starting
                users[socket.id] = {playerName, wantsRematch: false}
                io.emit(E.ATTEMPT_PLAY_RESPONSE, {
                    msg: E.ATTEMPT_PLAY_RESPONSE_TYPES.STARTING,
                    playerNames: Object.values(users).map(userObj => userObj.playerName)
                })
                io.emit(E.SET_ACTIVE_PLAYER, Object.values(users)[0].playerName)
                break;
            case 2:
                socket.emit(E.ATTEMPT_PLAY_RESPONSE, {
                    msg: E.ATTEMPT_PLAY_RESPONSE_TYPES.FULL,
                    playerNames: Object.values(users).map(userObj => userObj.playerName)
                })
                break;
            default:
                break;
        }
    })
    socket.on(E.DO_ROLL, ({activePlayer, latestRoll}) => {
        const randomNum = Math.ceil(Math.random() * 6)
        io.emit(E.UPDATE_SCORE, {player: activePlayer, updateScore: randomNum, prevRoll: latestRoll})
        if(randomNum === 1) {
            // set active player to other player
            const newActivePlayer = Object.values(users).filter(userObj => userObj.playerName !== activePlayer)[0].playerName
            setTimeout(() => io.emit(E.SET_ACTIVE_PLAYER, newActivePlayer), 1500)
        }
    })
    socket.on(E.DO_HOLD, ({activePlayer, points}) => {
        io.emit(E.UPDATE_SCORE, {player: activePlayer, updateScore: 1, prevRoll: null}) // will trigger resetScore dispatch client-side
        io.emit(E.UPDATE_TOTAL_SCORE, {player: activePlayer, updateTotalScore: points})
        const newActivePlayer = Object.values(users).filter(userObj => userObj.playerName !== activePlayer)[0].playerName
        io.emit(E.SET_ACTIVE_PLAYER, newActivePlayer)
        
    })
    socket.on(E.ATTEMPT_REMATCH, () => {
        users[socket.id].wantsRematch = true
        if(Object.values(users).every(userObj => userObj.wantsRematch)){
            Object.values(users).forEach(userObj => userObj.wantsRematch = false)
            io.emit(E.BEGIN_REMATCH)
            io.emit(E.SET_ACTIVE_PLAYER, Object.values(users)[0].playerName)
        }
        else {
            io.emit(E.PLAYER_WANTS_REMATCH, users[socket.id].playerName)
        }
    })
    socket.on(E.DISCONNECT, () => {
        delete users[socket.id]
        io.emit(E.PLAYER_DISCONNECT)
    })
})