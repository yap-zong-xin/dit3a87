var app=require('/app.js');
var port= process.env.PORT || 3000;

var server=app.listen(port,function(){
    console.log("=====================================================")
    console.log("Server launched. App hosted at localhost: "+ port);
    console.log("=====================================================")
});