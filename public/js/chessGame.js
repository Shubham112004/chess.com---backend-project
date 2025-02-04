
const socket = io()

const chess = new Chess()

const boardElement = document.querySelector('.chessboard')

let draggedPiece = null
let sourceSquare = null
let playerRole = null
const renderBoard = () => {

    const board = chess.board();
    boardElement.innerHTML = "";

    let kingPosition = null;

    if (chess.in_check()) {
        const turn = chess.turn(); // 'w' or 'b'
        for (let rowIndex = 0; rowIndex < board.length; rowIndex++) {
            for (let squareIndex = 0; squareIndex < board[rowIndex].length; squareIndex++) {
                const square = board[rowIndex][squareIndex];
                if (square && square.type === 'k' && square.color === turn) {
                    kingPosition = { row: rowIndex, col: squareIndex };
                }
            }
        }
    }

    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark");

            squareElement.dataset.row = rowIndex;
            squareElement.dataset.column = squareIndex;

            // Highlight king's square if in check
            if (kingPosition && kingPosition.row === rowIndex && kingPosition.col === squareIndex) {
                squareElement.classList.add("check");
            }

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
                pieceElement.innerText = getPieceUniCode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row, 10),
                        col: parseInt(squareElement.dataset.column, 10),
                    };

                    handleMove(sourceSquare, targetSource);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === "b") {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
};


const handleMove = (source, target) => {

    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q',
    };

    socket.emit("move", move);
};



const getPieceUniCode = (piece) => {
    const uniCodePieces = {
        P: '♙',
        R: '♖',
        N: '♘',
        B: '♗',
        Q: '♕',
        K: '♔',
        p: '♙',
        r: '♜',
        n: '♞',
        b: '♝',
        q: '♛',
        k: '♚',
    }

    return uniCodePieces[piece.type] || ""
}

socket.on('playerRole', (role) => {
    playerRole = role
    renderBoard()
})

socket.on('spectatorRole', () => {
    playerRole = null
    renderBoard()
})


// socket.on("boardState", (fen) => {
//     chess.load(fen)
//     renderBoard()
// })


socket.on("move", (move) => {
    chess.move(move)
    renderBoard()
})

renderBoard()

const showWinnerPopup = (winner) => {
    const popup = document.getElementById("winnerPopup");
    const message = document.getElementById("winnerMessage");

    message.innerText = `${winner} is the Champion!`;
    popup.classList.add("show");
};

restartGame = () => {
    chess.reset();
    socket.emit("restartGame");

    // setTimeout(() => {
    //     socket.emit("boardState", chess.fen()); // Force update
    // }, 500);
    renderBoard()

    document.getElementById("winnerPopup").classList.remove("show");
    document.getElementById("winnerPopup").classList.add("hide");
};





socket.on("boardState", (fen) => {
    chess.load("Updated FEN received:", fen);
    chess.load(fen);
    renderBoard();

    if (chess.in_checkmate()) {
        const winner = chess.turn() === 'w' ? 'Black' : 'White';
        // showCheckmateToast(winner);
        setTimeout(() => showWinnerPopup(winner), 500);
    }
});
