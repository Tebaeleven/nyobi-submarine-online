'use strict';
const crypto = require('crypto');

const gameObj = {
    playersMap: new Map(),
    itemsMap: new Map(),
    airMap: new Map(),
    fieldWidth: 1000,
    fieldHeight: 1000,
    itemTotal: 15,
    airTotal: 10
};

function init() {
    for (let i = 0; i < gameObj.itemTotal; i++) {
        addItem();
    }
    for (let a = 0; a < gameObj.airTotal; a++) {
        addAir();
    }
}

init(); // 初期化（初期化はサーバ起動時に行う

const gameTicker = setInterval(() => {
    movePlayers(gameObj.playersMap); // 潜水艦の移動
}, 33);

function newConnection(socketId, displayName, thumbUrl) {
    const playerX = Math.floor(Math.random() * gameObj.fieldWidth);
    const playerY = Math.floor(Math.random() * gameObj.fieldHeight);
    const playerId = crypto.createHash('sha1').update(socketId).digest('hex');

    const playerObj = {
        x: playerX,
        y: playerY,
        playerId: playerId,
        displayName: displayName,
        thumbUrl: thumbUrl,
        isAlive: true,
        direction: 'right',
        score: 0
    };
    gameObj.playersMap.set(socketId, playerObj);

    const startObj = {
        playerObj: playerObj,
        fieldWidth: gameObj.fieldWidth,
        fieldHeight: gameObj.fieldHeight
    };
    return startObj;
}

function getMapData() {
    const playersArray = [];
    const itemsArray = [];
    const airArray = [];

    for (let [socketId, plyer] of gameObj.playersMap) {
        const playerDataForSend = [];

        playerDataForSend.push(plyer.x);
        playerDataForSend.push(plyer.y);
        playerDataForSend.push(plyer.playerId);
        playerDataForSend.push(plyer.displayName);
        playerDataForSend.push(plyer.score);
        playerDataForSend.push(plyer.isAlive);
        playerDataForSend.push(plyer.direction);

        playersArray.push(playerDataForSend);
    }

    for (let [id, item] of gameObj.itemsMap) {
        const itemDataForSend = [];

        itemDataForSend.push(item.x);
        itemDataForSend.push(item.y);

        itemsArray.push(itemDataForSend);
    }

    for (let [id, air] of gameObj.airMap) {
        const airDataForSend = [];

        airDataForSend.push(air.x);
        airDataForSend.push(air.y);

        airArray.push(airDataForSend);
    }

    return [playersArray, itemsArray, airArray];
}

function disconnect(socketId) {
    gameObj.playersMap.delete(socketId);
}

function updatePlayerDirection(socketId, direction) {
    const playerObj = gameObj.playersMap.get(socketId);
    playerObj.direction = direction;
}

function addItem() {
    const itemX = Math.floor(Math.random() * gameObj.fieldWidth);
    const itemY = Math.floor(Math.random() * gameObj.fieldHeight);
    const itemKey = `${itemX},${itemY}`;

    if (gameObj.itemsMap.has(itemKey)) { // アイテムの位置が被ってしまった場合は
        return addItem(); // 場所が重複した場合は作り直し
    }

    const itemObj = {
        x: itemX,
        y: itemY,
    };
    gameObj.itemsMap.set(itemKey, itemObj);
}

function addAir() {
    const airX = Math.floor(Math.random() * gameObj.fieldWidth);
    const airY = Math.floor(Math.random() * gameObj.fieldHeight);
    const airKey = `${airX},${airY}`;

    if (gameObj.airMap.has(airKey)) { // アイテムの位置が被ってしまった場合は
        return addAir(); // 場所が重複した場合は作り直し
    }

    const airObj = {
        x: airX,
        y: airY,
    };
    gameObj.airMap.set(airKey, airObj)
}

function movePlayers(playersMap) { // 潜水艦の移動
    for (let [playerId, player] of playersMap) {

        if (player.isAlive === false) {
            continue;
        }

        switch (player.direction) {
            case 'left':
                player.x -= 1;
                break;
            case 'up':
                player.y -= 1;
                break;
            case 'down':
                player.y += 1;
                break;
            case 'right':
                player.x += 1;
                break;
        }
        if (player.x > gameObj.fieldWidth) player.x -= gameObj.fieldWidth;
        if (player.x < 0) player.x += gameObj.fieldWidth;
        if (player.y < 0) player.y += gameObj.fieldHeight;
        if (player.y > gameObj.fieldHeight) player.y -= gameObj.fieldHeight;
    }
}

module.exports = {
    newConnection,
    getMapData,
    disconnect,
    updatePlayerDirection
};