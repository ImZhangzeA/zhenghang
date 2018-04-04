module.exports = {
    timetodate:(time)=>{
        var date = new Date();
        date.setTime(time);
        var timeStr = date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
        return timeStr;
    }
}