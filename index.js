var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// llama el archivo de llaves para acceder a una cuenta de AWS / carga paquete de aws-sdk
const CONF = require("./super_secure_conf.json"),
	AWS = require("aws-sdk");
var lambda = {};
var respuestaf = '';
var valorini = '';



// recupera respuesta de aws lambda y la almacena en una variable
function handleResponseFromLambda(err, response){
	if(err){
		console.log("problem");
		console.dir(err);
		return;
	}
	var data = JSON.parse(response.Payload);		
	respuestaf = data.word_to_echo_str;
	//return data.word_to_echo_str;	
}



io.on('connection', function(socket){
	console.log('un usuario se conecto');
	socket.broadcast.emit('bienvenido a la sala');
	socket.on('disconnect', function(){
		console.log('Un usuario se desconecto');
	});
	socket.on('mensaje chat', function(msg){
		
		valorini = msg;
		
		
		
		
		// carga llaves para acceder a AWS
		AWS.config = new AWS.Config({
			accessKeyId: CONF.AWS_ACCESS_KEY_ID,
			secretAccessKey: CONF.AWS_SECRET_ACCESS_KEY,
			region: "us-west-2"
		});
		lambda = new AWS.Lambda();
		
		
		
		// carga valores necesarios para ejecutar la funcion de lambda, FunctionName es el numbre de la funcion lambda y Payload son los valores que se le envia a la funcion para que las procese
		var settings = {
				FunctionName: "funcionmayuscula",
				Payload: JSON.stringify({
					word_to_echo_str: valorini
				})
		};
	
		
		// procede a invocar una funcion en AWS lambda
		var request = lambda.invoke(settings, handleResponseFromLambda);
		
		
		//request.on('success', function(response){
		request.on('complete', function(response){
			io.emit('mensaje chat', respuestaf);
			respuestaf = '';
		});
	});
});


app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});




http.listen(3000, function(){
	console.log('Escucho en *:3000');
});


//init();