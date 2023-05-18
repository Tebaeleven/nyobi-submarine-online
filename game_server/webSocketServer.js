function createWebSocketServer(io, game) {

    const rootIo = io.of('/');
    
    //新しく接続してきた人の処理
    rootIo.on('connection', (socket) => {

        //新規接続ユーザから送られてくるGoogleアカウントの名前とプロフィール写真のURL
        const displayName = socket.handshake.query.displayName;
        const thumbUrl = socket.handshake.query.thumbUrl;

        console.log('WebSocket のコネクションがありました。');

        socket.emit('start data', {}); //接続が来たユーザにデータを送信

        socket.on('disconnect', () => { }); //ユーザが接続を切断した時に実行
    });

    //全員に送る
    const socketTicker = setInterval(() => {
        //volatile.emit はクライアントにデータが届いたかを確認しない送信方法
        //確認の処理が省けるので、高頻度な通信をする場合に便利
        rootIo.volatile.emit('map data', {});
    },
    66);
}

module.exports = {
    createWebSocketServer
};