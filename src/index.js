const express = require('express')
const socketio = require('socket.io')
const path = require('path')
const http = require('http')
const { addPlayer, getPlayer, removePlayer, updateRooms, dimensions, findFreeRoom } = require('./utils/players')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000

app.use(express.static(path.join(__dirname, '../public')))

io.on('connection', (socket)=>{
    console.log(`websocket: ${socket.id} is connected.`)

    socket.on('join', (roomName, callback)=>{
        console.log(roomName)
        if(!roomName){
            callback({ redirectToRoom: findFreeRoom().roomName })
            return
        }
        const error = addPlayer(socket.id, roomName)
        if(error){
            callback({ error })
            return
        }
        socket.join(roomName)

        //отправляю сокету статические параметры игры
        socket.emit('gameDimensions', dimensions)
        
        callback({})
    })

    socket.on('keyPressed', (dir)=>{
        getPlayer(socket.id).move(dir)
    })

    socket.on('disconnect', ()=>{
        console.log('disconnect')
        removePlayer(socket.id)
    })
})

setInterval(()=>{
    updateRooms((room)=>{
        io.to(room.roomName).emit('update', room)
    })
}, 20)

server.listen(port, ()=>{
    console.log('Server is up on port', port)
})