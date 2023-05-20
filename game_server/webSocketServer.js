function createWebSocketServer(io, game) {

    const rootIo = io.of('/');
    
    //新しく接続してきた人の処理
    rootIo.on('connection', (socket) => {

        //新規接続ユーザから送られてくるGoogleアカウントの名前とプロフィール写真のURL
        const displayName = socket.handshake.query.displayName;
        const thumbUrl = socket.handshake.query.thumbUrl;

        const startObj = game.newConnection(socket.id, displayName, thumbUrl);
        socket.emit('start data', startObj); //接続が来たユーザにデータを送信

        socket.on('change direction', (direction) => {
            game.updatePlayerDirection(socket.id, direction);
        });

        socket.on('missile emit', (direction) => {
            game.missileEmit(socket.id, direction);
        });
        
        socket.on('disconnect', () => { //ユーザが接続を切断した時に実行
            game.disconnect(socket.id)
        }); 
    });

    //全員に送る
    const socketTicker = setInterval(() => {
        //volatile.emit はクライアントにデータが届いたかを確認しない送信方法
        //確認の処理が省けるので、高頻度な通信をする場合に便利
        rootIo.volatile.emit('map data', game.getMapData());
    },
    66);
}

module.exports = {
    createWebSocketServer
};