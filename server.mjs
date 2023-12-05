import { Server } from "socket.io"
import { createServer } from 'http'
import { EVENTS as E} from "./events.mjs"

const httpServer = createServer()

const io = new Server(4000, {
    cors: {
        origin: ["http://localhost:3000", "http://192.168.1.169:3000", "http://192.168.1.155:3000"]
    }
})

const users = {}

io.on(E.CONNECTION, socket => {
    console.log('client connected: ' + socket.id)
    socket.on(E.ATTEMPT_PLAY, playerName => {
        console.log(`===\nPlayer name ${playerName} wants to play!`)
        const usersLen = Object.keys(users).length
        console.log(`Number of users: ${usersLen}`)
        switch(usersLen){
            case 0:
                console.log("Readied up, waiting for another player to join")
                users[socket.id] = {playerName, wantsRematch: false}
                socket.emit(E.ATTEMPT_PLAY_RESPONSE, {
                    msg: E.ATTEMPT_PLAY_RESPONSE_TYPES.WAITING,
                    playerNames: Object.values(users).map(userObj => userObj.playerName)
                })
                break;
            case 1:
                if(users[socket.id]){
                    // This client is already connected, don't start
                    console.log('client hit start button more than once')
                    return
                }
                // Tell user game is starting
                console.log("Readied up, game is starting")
                users[socket.id] = {playerName, wantsRematch: false}
                io.emit(E.ATTEMPT_PLAY_RESPONSE, {
                    msg: E.ATTEMPT_PLAY_RESPONSE_TYPES.STARTING,
                    playerNames: Object.values(users).map(userObj => userObj.playerName)
                })
                io.emit(E.SET_ACTIVE_PLAYER, Object.values(users)[0].playerName)
                break;
            case 2:
                console.log("Sorry, there are already two users playing")
                socket.emit(E.ATTEMPT_PLAY_RESPONSE, {
                    msg: E.ATTEMPT_PLAY_RESPONSE_TYPES.FULL,
                    playerNames: Object.values(users).map(userObj => userObj.playerName)
                })
                break;
            default:
                break;
        }
        console.log(users)
    })
    socket.on(E.DO_ROLL, activePlayer => {
        const randomNum = Math.ceil(Math.random() * 6)
        // const randomNum = 1
        if(randomNum === 1) {
            // set active player to other player
            const newActivePlayer = Object.values(users).filter(userObj => userObj.playerName !== activePlayer)[0].playerName
            console.log(newActivePlayer)
            io.emit(E.SET_ACTIVE_PLAYER, newActivePlayer)
        }
        io.emit(E.UPDATE_SCORE, {player: activePlayer, updateScore: randomNum})
    })
    socket.on(E.DO_HOLD, ({activePlayer, points}) => {
        console.log('do-hold request received')
        io.emit(E.UPDATE_SCORE, {player: activePlayer, updateScore: 1}) // will trigger resetScore dispatch client-side
        io.emit(E.UPDATE_TOTAL_SCORE, {player: activePlayer, updateTotalScore: points})
        const newActivePlayer = Object.values(users).filter(userObj => userObj.playerName !== activePlayer)[0].playerName
        io.emit(E.SET_ACTIVE_PLAYER, newActivePlayer)
        
    })
    socket.on(E.ATTEMPT_REMATCH, () => {
        users[socket.id].wantsRematch = true
        if(Object.values(users).every(userObj => userObj.wantsRematch)){
            console.log("Both players want rematch!")
            Object.values(users).forEach(userObj => userObj.wantsRematch = false)
            io.emit(E.BEGIN_REMATCH)
            io.emit(E.SET_ACTIVE_PLAYER, Object.values(users)[0].playerName)
        }
    })
    socket.on(E.DISCONNECT, () => {
        delete users[socket.id]
        io.emit(E.PLAYER_DISCONNECT)
    })
})