const express = require('express');
const mysql = require('mysql');
var db = mysql.createPool({host:'localhost',user:'root',password:'root',database:'zhkj'});
module.exports=function(){
    var route = express.Router();
    route.get('/',(req,res,next)=>{
        db.query('select * from banner',(err,data)=>{
            if(err){
                res.status(500).send('error').end()
            }else{
                res.banner = data;
                next();
            }
        })
    })
    route.get('/',(res,req,next)=>{
        db.query('select * from index_con',(err,data)=>{
            if(err){
                res.status(500).send('error').end();
            }else{
                indexC = data[0];
                indexC.index_con = indexC.index_con.replace(/^/gm,'<p>').replace(/$/gm,'</p>');
                next();
            }
        })
    })
    route.get('/',(req,res)=>{
        res.render('./web/index.ejs',{banner:res.banner,indexCon:indexC})
    })
    return route;
}