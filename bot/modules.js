function sayHello(mes){
    console.log(mes)
}




module.exports = {
    getTime: (offset) => {
        var d = new Date();
        localTime = d.getTime();
        localOffset = d.getTimezoneOffset() * 60000;

        // obtain UTC time in msec
        utc = localTime + localOffset;
        // create new Date object for different city
        // using supplied offset
        var nd = new Date(utc + (3600000*offset));
        //nd = 3600000 + nd;
        utc = new Date(utc);
        // return time as a string
        return utc;
    },
    formatDate: (date) => {
        var dd = date.getDate();
        if (dd < 10) dd = '0' + dd;
        var mm = date.getMonth() + 1;
        if (mm < 10) mm = '0' + mm;
        var yy = date.getFullYear() % 100;
        if (yy < 10) yy = '0' + yy;

        var hours = date.getHours();
        var minutes = date.getMinutes();
        return `${dd}.${mm}.${yy} в ${hours}:${minutes} по МСК`;
    }

}