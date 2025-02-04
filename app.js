const express = require("express")
const socket = require("socket.io")
const http = require("http")
const { Chess } = require("chess.js")
const path = require("path")
const cors = require("cors");

const app = express()
// const port = 3000
const port = process.env.PORT || 3300;


const server = http.createServer(app)
const io = socket(server)

const chess = new Chess()

let players = {}
let currentPlayer = "w"

app.use(cors());
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, "public")))

app.get('/', (req, res) => {
    res.render('index', { title: 'Chess Game' })
})

io.on("connection", function (uniqueSocket) {
    console.log('Connected');

    if (!players.white) {
        players.white = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "w")
    } else if (!players.black) {
        players.black = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "b")
    } else {
        uniqueSocket.emit("spectatorRole")
    }

    uniqueSocket.on("disconnect", function () {
        if (uniqueSocket.id === players.white) {
            delete players.white
        }
        else if (uniqueSocket.id === players.black) {
            delete players.black
        }
    })


    uniqueSocket.on("move", function (move) {
        try {
            if (chess.turn() === 'w' && uniqueSocket.id !== players.white) return
            if (chess.turn() === 'b' && uniqueSocket.id !== players.black) return

            const result = chess.move(move)
            if (result) {
                currentPlayer = chess.turn()
                io.emit("move", move)

                io.emit("boardState", chess.fen())

            } else {
                // console.log('Invalid Move: ', move);
                uniqueSocket.emit('invalidMove', move)

            }
        }
        catch (err) {
            console.log(err);
            uniqueSocket.emit("Invalid Move: ", move)
        }
    })

    uniqueSocket.on("restartGame", () => {
        chess.reset();
        io.emit("boardState", chess.fen());
    });

})

server.listen(port, () => {
    console.log(`listining on port http://localhost:${port}`);

})