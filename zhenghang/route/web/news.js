const express = require('express');
const mysql = require('mysql');
var db = mysql.createPool({host:'localhost',user:'root',password:'root',database:'zhkj'});
module.exports = function(){
    var route = express.Router();
    route.use('/',(req,res)=>{
        db.query('select * from news',(err,data)=>{
            if(err){
                res.status(500).send('error').end()
            }else{
                req.news = data;
                console.log(req.news);
                res.render('./web/news.ejs',{news:req.news})
            }
        })
    });
}