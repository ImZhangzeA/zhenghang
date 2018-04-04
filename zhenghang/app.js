const express = require('express');
const expressStatic = require('express-static');
const mysql = require('mysql');
const consolidate = require('consolidate');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const time2date = require('./inpublic/public.js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
var app = express();
app.listen(8081);
//数据库连接池
var db = mysql.createPool({host:'localhost',user:'root',password:'root',database:'zhkj'});
//设置cookie
app.use(cookieParser());
(function(){
    var keys=[];
    for(var i=0;i<10000;i++){
        keys.push('dasd'+Math.random());
    }
    app.use(cookieSession({
    name:'admin_id',
    keys:keys,
    maxAge:2*3600*1000
    }))
})()
//创建ejs模板
app.set('view engine','html');
app.set('views','./template/');
app.set('html',consolidate.ejs);
//设置路由
// app.get('/',require('./route/web/index')());
app.get('/',(req,res,next)=>{
    db.query('select * from banner',(err,data)=>{
        if(err){
            res.status(500).send('error1').end()
        }else{
            res.banner = data;
            next();
        }
    })
})
app.get('/',(req,res,next)=>{
    db.query('select * from index_cons',(err,data)=>{
        if(err){
            res.status(500).send('error2').end();
        }else{
            indexC = data[0];
            indexC.index_con = indexC.index_con.replace(/^/gm,'<p>').replace(/$/gm,'</p>');
            next();
        }
    })
})
app.get('/',(req,res)=>{
    res.render('./web/index.ejs',{banner:res.banner,indexCon:indexC})
})
//跳转新闻界面
app.use('/article',(req,res)=>{
    db.query('select * from news',(err,data)=>{
        if(err){
            res.status(500).send('error').end()
        }else{
            var news= data;
            // console.log(req.news);
            for(var i=0;i<news.length;i++){
                news[i].time = time2date.timetodate(news[i].time)
            }
            res.render('./web/news.ejs',{news:news})
        }
    })
});
//跳转行业动态页面
app.use('/brticle',(req,res)=>{
    db.query('select * from company',(err,data)=>{
        if(err){
            res.status(500).send('error').end();
        }else{
            var company = data;
            for(var i=0;i<company.length;i++){
                company[i].time = time2date.timetodate(company[i].time)
            }
            res.render('./web/company.ejs',{company:company})
        }
    })
})
//跳转企业理念
app.use('/crticle',(req,res)=>{
    db.query('select * from polic',(err,data)=>{
        if(err){
            res.status(500).send('error').end();
        }else{
            // console.log(data)
            var philo = data[0];
            console.log(philo.idea)
            res.render('./web/company philosophy.ejs',{philo:philo})
        }
    })
})
//跳转网站留言
app.use(bodyParser.urlencoded({
    extended:false,
    limit:1024*1024*2,
}));
app.use('/drticle',(req,res)=>{
    res.render('./web/web message.ejs',{})
})
app.use('/user',(req,res)=>{
    var objData = req.body;
    db.query(`INSERT into list (username,sex,likes,qq,city,eml) values('${objData.username}','${objData.sex}','${objData.likes}','${objData.qq}','${objData.city}','${objData.eml}')`,(err,data)=>{
        if(err){
            res.status(500).send('error').end();
        }else{
            res.send({'ok':true,'msg':'提交成功'});
        }
    })
})
//判断是否登录
app.use('/admin',(req,res,next)=>{
    if(req.session.admin_id == null){
        res.redirect('/eract')
    }else{
        db.query(`select * from banner`,(err,data)=>{
            if(err){
                res.status(500).send('error').end()
            }else{
                res.render('./admin/adbanner.ejs',{banne:data});
                // console.log(data)
            }
        })
    }
});
//Post数据
app.use('/log',(req,res)=>{
    var objLog = req.body;
    db.query(`select * from log where username like '${objLog.username}'`,(err,data)=>{
        if(err){
            res.status(500).send('error').end()
        }else{
            // console.log(data[0].id);
            if(data[0].id){
                if(data[0].pwd == objLog.pwd){
                    req.session.admin_id = data[0].ID;
                    res.send({'ok':true,'msg':'登陆成功','iod':data[0].id});
                }else{
                    res.send({'ok':false,'msg':'密码错误'})
                }
            }else{
                res.send({'ok':false,'msg':'用户名错误'})
            }
        }
    })
});
//跳转banner管理界面
app.use('/frticle',(req,res)=>{
    db.query(`select * from banner`,(err,data)=>{
        if(err){
            res.status(500).send('error').end()
        }else{
            res.render('./admin/adbanner.ejs',{banne:data});
            // console.log(res.iod)
        }
    })
})
    //删除图片操作
app.use('/ban',(req,res,next)=>{
    var deSrc = req.body;
    console.log(deSrc)
    db.query(`delete from banner where src = '${deSrc.src}'`,(err,data)=>{
        if(err){
            res.status(500).send('error').end()
        }else{
            res.send({'ok':true,'msg':'删除成功'});
            next()
        }
    })
});
    //图片上传
var objmulter = multer({dest:'static/upload'});
app.use(objmulter.any());
app.use('/upload',(req,res)=>{
    // console.log(req.files)
    var kzName = path.parse(req.files[0].originalname);
    // console.log(kzName);
    var newName = req.files[0].path + kzName.ext;
    fs.rename(req.files[0].path,newName,(err)=>{
        if(err){
            res.status(500).send('error').end()
        }else{
            console.log(newName)
            db.query(`insert into banner (src) values('${newName}')`,(err,data)=>{
                if(err){
                    res.status(500).send('error').end()
                }else{
                    res.redirect('/frticle');
                }
            })
        }
    })
})

//跳转公司管理界面
app.use('/grticle',(req,res)=>{
    db.query('select * from company',(err,data)=>{
        if(err){
            res.status(500).send('error').end();
        }else{
            var company = data;
            for(var i=0;i<company.length;i++){
                company[i].time = time2date.timetodate(company[i].time)
            }
            res.render('./admin/index.ejs',{company:company})
        }
    })
});
app.use('/comp',(req,res)=>{
    var cdata = req.body;
    db.query(`insert into company (title,time,cont) values('${cdata.title}','${cdata.date}','${cdata.cont}')`,(err,data)=>{
        if(err){
            res.status(500).send('error').end()
        }else{
            res.send({'ok':true})
        }
    })
})
    //删除
app.use('/desw',(req,res)=>{
    var deswp = req.body;
    // console.log(deswp);
    db.query(`delete from company where title like '${deswp.datas}'`,(err,data)=>{
        if(err){
            res.status(500).send('error').end();
        }else{
            res.send({'ok':true})
        }
    })
})
//简介管理界面
app.use('/hrticle',(req,res)=>{
    db.query(`select * from index_cons`,(err,data)=>{
        if(err){
            res.status(500).send('error').send();
        }else{
            data[0].index_con = data[0].index_con.replace(/^/gm,'<p>').replace(/$/gm,'</p>');
            res.render('./admin/jianjie.ejs',{conts:data[0]})
        }
    })
});
app.use('/adindexC',(req,res)=>{
    var des = req.body;
    // console.log(des)
    // update index_con set index_con like '${des.jj}' where id = 1
    db.query(`update index_cons set index_con = '${des.jj}' where id = 1 `,(err,data)=>{
        if(err){
            res.status(500).send('error').end();
        }else{
            res.send({'ok':true})
        }
    })
})
//用户信息管理界面
app.use('/irticle',(req,res)=>{
    db.query(`select * from list`,(err,data)=>{
        if(err){
            res.status(500).send('error').send();
        }else{
            res.render('./admin/user.ejs',{userlist:data});
        }
    })
})
    //删除信息
app.use('/aduse',(req,res)=>{
    var adu = req.body;
    // console.log(adu.usen)
    db.query(`delete from list where username like '${adu.usen}'`,(err,data)=>{
        if(err){
            res.status(500).send('error').end()
        }else{
            res.send({'ok':true})
        }
    })
})
    //修改信息
app.use('/adust',(req,res)=>{
    var adst = req.body;
    db.query(`select * from list where username like '${adst.uset}'`,(err,data)=>{
        if(err){
            res.status(500).send('error').end();
        }else{
            res.render('./admin/user.ejs',{adul:adst});
        }
    })
})
//管理员信息管理界面
app.use('/jrticle',(req,res)=>{
    db.query(`select * from log`,(err,data)=>{
        if(err){
            res.status(500).send('error').end();
        }else{
            res.render('./admin/adadmin.ejs',({aduse:data}))
        }
    })
})
    //删除信息
app.use('/des',(req,res)=>{
    var desp = req.body;
    // console.log(desp.decont)
    db.query(`delete from log where username like '${desp.decont}'`,(err,data)=>{
        if(err){
            res.status(500).send('error').end()
        }else{
            res.send({'ok':true});
        }
    })
})
app.use('/adtj',(req,res)=>{
    var addti = req.body;
    db.query(`insert into log (username,pwd) values('${addti.usena}','${addti.pwsd}')`,(err,data)=>{
        if(err){
            res.status(500).send('error').end()
        }else{
            res.send({'ok':true})
        }
    })
})
//新闻管理界面
app.use('/krticle',(req,res)=>{
    db.query(`select * from news`,(err,data)=>{
        if(err){
            res.status(500).send('error').end()
        }else{
            res.render('./admin/news.ejs',{newsdata:data})
        }
    })
})
app.use('/newsmp',(req,res)=>{
    var cdata = req.body;
    db.query(`insert into news (title,time,cont) values('${cdata.title}','${cdata.date}','${cdata.cont}')`,(err,data)=>{
        if(err){
            res.status(500).send('error').end()
        }else{
            res.send({'ok':true})
        }
    })
})
    //删除
app.use('/newsde',(req,res)=>{
    var deswp = req.body;
    // console.log(deswp);
    db.query(`delete from news where title like '${deswp.datas}'`,(err,data)=>{
        if(err){
            res.status(500).send('error').end();
        }else{
            res.send({'ok':true})
        }
    })
})

app.use('/eract',(req,res)=>{
    res.render('./admin/login_user.ejs',{})
})
//设置静态文件路径
app.use(expressStatic('./static'))