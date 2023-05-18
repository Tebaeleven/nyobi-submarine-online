const express = require('express')
const router = express.Router()

router.get('/', (req, res, next) => {
    let displayName = 'anonymous'
    let thumbUrl = 'anonymous'
    if (req.user) { //もしgoogleログインしていたら
        displayName = req.user.displayName
        thumbUrl=req.user.photos[0].value
    }
    res.render('game',
        {
            title: "潜水艦ゲーム",
            displayName: displayName,
            thumbUrl: thumbUrl,
            ipAddress: process.env.SERVER_URL
        }
    )
})

module.exports=router