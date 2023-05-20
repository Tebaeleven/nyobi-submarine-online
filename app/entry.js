'use strict';
import $ from 'jquery'
import io from 'socket.io-client'

const gameObj = {
    raderCanvasWidth: 500,
    raderCanvasHeight: 500,
    scoreCanvasWidth: 300,
    scoreCanvasHeight: 500,
    itemRadius: 4,
    airRadius: 5,
    deg: 0,
    rotationDegreeByDirection: {
        'left': 0,
        'up': 270,
        'down': 90,
        'right': 0
    },
    myDisplayName: $('#main').attr('data-displayName'),
    myThumbUrl: $('#main').attr('data-thumbUrl'),
    fieldWidth: null,
    fieldHeight: null,
    itemsMap: new Map(),
    airMap: new Map()
}

const socketQueryParameters = `displayName=${gameObj.myDisplayName}&thumbUrl=${gameObj.myThumbUrl}`;
//サーバにデータを送ることもできる
//WebSocket通信を開始した人のGoogleアカウントの名前とプロフィール写真のURLをサーバに送信
const socket = io($('#main').attr('data-ipAddress') + '?' + socketQueryParameters);

function init() {
    
    // ゲーム用のキャンバス
    const raderCanvas = $('#rader')[0];
    raderCanvas.width = gameObj.raderCanvasWidth;
    raderCanvas.height = gameObj.raderCanvasHeight;
    gameObj.ctxRader = raderCanvas.getContext('2d');

    // ランキング用のキャンバス
    const scoreCanvas = $('#score')[0];
    scoreCanvas.width = gameObj.scoreCanvasWidth;
    scoreCanvas.height = gameObj.scoreCanvasHeight;
    gameObj.ctxScore = scoreCanvas.getContext('2d');

    // 潜水艦の画像
    const submarineImage = new Image();
    submarineImage.src = '/images/submarine.png';
    gameObj.submarineImage = submarineImage;

    // ミサイルの画像
    gameObj.missileImage = new Image();
    gameObj.missileImage.src = '/images/missile.png';
}
init()

function ticker() {
    //データが受信されていないときは何もしない
    if (!gameObj.myPlayerObj || !gameObj.playersMap) return;

    gameObj.ctxRader.clearRect(0, 0, gameObj.raderCanvasWidth, gameObj.raderCanvasHeight);
    drawRadar(gameObj.ctxRader);
    drawMap(gameObj);
    drawSubmarine(gameObj.ctxRader, gameObj.myPlayerObj);

    gameObj.ctxScore.clearRect(0, 0, gameObj.scoreCanvasWidth, gameObj.scoreCanvasHeight); // scoreCanvas もまっさら
    drawAirTimer(gameObj.ctxScore, gameObj.myPlayerObj.airTime);
    drawMissiles(gameObj.ctxScore, gameObj.myPlayerObj.missilesMany);
}

setInterval(ticker, 33)

function drawRadar(ctxRader) {
    const x = gameObj.raderCanvasWidth / 2;
    const y = gameObj.raderCanvasHeight / 2;
    const r = gameObj.raderCanvasWidth * 1.5 / 2; // 対角線の長さの半分

    ctxRader.save(); //一度ctxの状態を保存

    ctxRader.beginPath();
    ctxRader.translate(x, y);
    ctxRader.rotate(getRadian(gameObj.deg));

    ctxRader.fillStyle = 'rgba(0, 220, 0, 0.5)';

    ctxRader.arc(0, 0, r, getRadian(0), getRadian(-30), true);
    ctxRader.lineTo(0, 0);

    ctxRader.fill();

    ctxRader.restore(); // 元の座標設定に戻す
    gameObj.deg = (gameObj.deg + 5) % 360;
}

function drawSubmarine(ctxRader, myPlayerObj) {
    const rotationDegree = gameObj.rotationDegreeByDirection[myPlayerObj.direction];

    //一度ctxの状態を保存
    ctxRader.save();
    //中心の位置を変更
    ctxRader.translate(gameObj.raderCanvasWidth / 2, gameObj.raderCanvasHeight / 2);

    ctxRader.rotate(getRadian(rotationDegree));
    if (myPlayerObj.direction === 'left') {
        ctxRader.scale(-1, 1);
    }

    ctxRader.drawImage(
        gameObj.submarineImage, -(gameObj.submarineImage.width / 2), -(gameObj.submarineImage.height / 2)
    );
    ctxRader.restore();
}

function drawMissiles(ctxScore, missilesMany) {
    for (let i = 0; i < missilesMany; i++) {
        ctxScore.drawImage(gameObj.missileImage, 50 * i, 80);
    }
}

function drawAirTimer(ctxScore, airTime) {
    ctxScore.fillStyle = "rgb(0, 220, 250)";
    ctxScore.font = 'bold 40px Arial';
    ctxScore.fillText(airTime, 110, 50);
}

socket.on('start data', (startObj) => {
    gameObj.fieldWidth = startObj.fieldWidth;
    gameObj.fieldHeight = startObj.fieldHeight;
    gameObj.myPlayerObj = startObj.playerObj;
});
socket.on('map data', (compressed) => {
    const playersArray = compressed[0];
    const itemsArray = compressed[1];
    const airArray = compressed[2];

    gameObj.playersMap = new Map();
    for (let compressedPlayerData of playersArray) {

        const player = {};
        player.x = compressedPlayerData[0];
        player.y = compressedPlayerData[1];
        player.playerId = compressedPlayerData[2];
        player.displayName = compressedPlayerData[3];
        player.score = compressedPlayerData[4];
        player.isAlive = compressedPlayerData[5];
        player.direction = compressedPlayerData[6];
        player.missilesMany = compressedPlayerData[7];
        player.airTime = compressedPlayerData[8];

        gameObj.playersMap.set(player.playerId, player);

        // 自分の情報も更新
        if (player.playerId === gameObj.myPlayerObj.playerId) {
            gameObj.myPlayerObj.x = compressedPlayerData[0];
            gameObj.myPlayerObj.y = compressedPlayerData[1];
            gameObj.myPlayerObj.displayName = compressedPlayerData[3];
            gameObj.myPlayerObj.score = compressedPlayerData[4];
            gameObj.myPlayerObj.isAlive = compressedPlayerData[5];
            gameObj.myPlayerObj.missilesMany = compressedPlayerData[7];
            gameObj.myPlayerObj.airTime = compressedPlayerData[8];
        }
    }

    gameObj.itemsMap = new Map();
    itemsArray.forEach((compressedItemData, index) => {
        gameObj.itemsMap.set(
            index,
            {
                x: compressedItemData[0],
                y: compressedItemData[1]
            }
        );
    });

    gameObj.airMap = new Map();
    airArray.forEach((compressedAirData, index) => {
        gameObj.airMap.set(
            index,
            {
                x: compressedAirData[0],
                y: compressedAirData[1]
            }
        );
    });
    // console.log(gameObj.playersMap);
    // console.log(gameObj.itemsMap);
    // console.log(gameObj.airMap);
});
function getRadian(deg) { //角度をラジアンに変換
    return deg * Math.PI / 180
}

function drawMap(gameObj) {
    drawObj(gameObj.itemsMap, 255, 165, 0);
    drawObj(gameObj.airMap, 0, 220, 255);
}


function drawObj(obj, r, g, b) {
    for (let [index, item] of obj) {

        const distanceObj = calculationBetweenTwoPoints(
            gameObj.myPlayerObj.x, gameObj.myPlayerObj.y,
            item.x, item.y,
            gameObj.fieldWidth, gameObj.fieldHeight,
            gameObj.raderCanvasWidth, gameObj.raderCanvasHeight
        );

        if (distanceObj.distanceX <= (gameObj.raderCanvasWidth / 2) && distanceObj.distanceY <= (gameObj.raderCanvasHeight / 2)) {

            const degreeDiff = calcDegreeDiffFromRadar(gameObj.deg, distanceObj.degree);
            const toumeido = calcOpacity(degreeDiff);

            gameObj.ctxRader.fillStyle = `rgba(${r}, ${g}, ${b}, ${toumeido})`;
            gameObj.ctxRader.beginPath();
            gameObj.ctxRader.arc(distanceObj.drawX, distanceObj.drawY, gameObj.itemRadius, 0, Math.PI * 2, true);
            gameObj.ctxRader.fill();
        }
    }
}


function calculationBetweenTwoPoints(pX, pY, oX, oY, gameWidth, gameHeight, raderCanvasWidth, raderCanvasHeight) {
    let distanceX = 99999999;
    let distanceY = 99999999;
    let drawX = null;
    let drawY = null;

    if (pX <= oX) {
        // 右から
        distanceX = oX - pX;
        drawX = (raderCanvasWidth / 2) + distanceX;
        // 左から
        let tmpDistance = pX + gameWidth - oX;
        if (distanceX > tmpDistance) {
            distanceX = tmpDistance;
            drawX = (raderCanvasWidth / 2) - distanceX;
        }

    } else {
        // 右から
        distanceX = pX - oX;
        drawX = (raderCanvasWidth / 2) - distanceX;
        // 左から
        let tmpDistance = oX + gameWidth - pX;
        if (distanceX > tmpDistance) {
            distanceX = tmpDistance;
            drawX = (raderCanvasWidth / 2) + distanceX;
        }
    }

    if (pY <= oY) {
        // 下から
        distanceY = oY - pY;
        drawY = (raderCanvasHeight / 2) + distanceY;
        // 上から
        let tmpDistance = pY + gameHeight - oY;
        if (distanceY > tmpDistance) {
            distanceY = tmpDistance;
            drawY = (raderCanvasHeight / 2) - distanceY;
        }

    } else {
        // 上から
        distanceY = pY - oY;
        drawY = (raderCanvasHeight / 2) - distanceY;
        // 下から
        let tmpDistance = oY + gameHeight - pY;
        if (distanceY > tmpDistance) {
            distanceY = tmpDistance;
            drawY = (raderCanvasHeight / 2) + distanceY;
        }
    }

    const degree = calcTwoPointsDegree(drawX, drawY, raderCanvasWidth / 2, raderCanvasHeight / 2);

    return {
        distanceX,
        distanceY,
        drawX,
        drawY,
        degree
    };
}

function calcTwoPointsDegree(x1, y1, x2, y2) {
    const radian = Math.atan2(y2 - y1, x2 - x1);
    const degree = radian * 180 / Math.PI + 180;
    return degree;
}

function calcDegreeDiffFromRadar(degRader, degItem) {
    let diff = degRader - degItem;
    if (diff < 0) {
        diff += 360;
    }

    return diff;
}

function calcOpacity(degreeDiff) {
    const deleteDeg = 270;
    degreeDiff = degreeDiff > deleteDeg ? deleteDeg : degreeDiff; // もう少しだけ暗くするコツ
    return (1 - degreeDiff / deleteDeg).toFixed(2);
}

$(window).on("keydown", (event) => {
    if (!gameObj.myPlayerObj || gameObj.myPlayerObj.isAlive === false) return;

    switch (event.key) {
        case 'ArrowLeft':
            if (gameObj.myPlayerObj.direction === 'left') break; // 変わってない
            gameObj.myPlayerObj.direction = 'left';
            drawSubmarine(gameObj.ctxRader, gameObj.myPlayerObj);
            sendChangeDirection(socket, 'left');
            break;
        case 'ArrowUp':
            if (gameObj.myPlayerObj.direction === 'up') break; // 変わってない
            gameObj.myPlayerObj.direction = 'up';
            drawSubmarine(gameObj.ctxRader, gameObj.myPlayerObj);
            sendChangeDirection(socket, 'up');
            break;
        case 'ArrowDown':
            if (gameObj.myPlayerObj.direction === 'down') break; // 変わってない
            gameObj.myPlayerObj.direction = 'down';
            drawSubmarine(gameObj.ctxRader, gameObj.myPlayerObj);
            sendChangeDirection(socket, 'down');
            break;
        case 'ArrowRight':
            if (gameObj.myPlayerObj.direction === 'right') break; // 変わってない
            gameObj.myPlayerObj.direction = 'right';
            drawSubmarine(gameObj.ctxRader, gameObj.myPlayerObj);
            sendChangeDirection(socket, 'right');
            break;
    }
});

function sendChangeDirection(socket, direction) {
    socket.emit('change direction', direction);
}