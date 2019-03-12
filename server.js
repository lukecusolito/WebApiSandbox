'use strict';

const Hapi = require('hapi');
const glob = require("glob");
const fs = require("fs");

const server = new Hapi.Server();
server.connection();

glob("./endpoints/*.json", function (er, files) {
    var array = [];
    var result = {};

    for (var i in files) {
        var content = fs.readFileSync(files[i]);
        if (content.toString()) {
            var jsonContent = JSON.parse(content);
            array.push(jsonContent);
        }
    }
    
    console.log("\n*** Endpoints ***");

    for (var i = 0; i < array.length; i++) {
        var statusCode = array[i].statusCode ? array[i].statusCode : 200;
        var delayResponse = array[i].delayResponse ? array[i].delayResponse : null;
        var response = array[i].response ? array[i].response : null;

        result[array[i].endpoint] =
            {
                Response: response,
                StatusCode: statusCode,
                DelayResponse: delayResponse
            };

        console.log(statusCode + " " + array[i].method.toUpperCase() + ": " + array[i].endpoint);
    }

    for (var i in array) {
        server.route({
            method: array[i].method,
            path: array[i].endpoint,
            handler: function (request, reply) {
                var context, statusCode, responseMessage;
                var urlPath = request.url.path.toString().split("?")[0];
                console.log("Called: " + urlPath);

                if (request.params.id) {
                    context = result[urlPath.replace(request.params.id, "{id?}")];
                    statusCode = context.StatusCode;
                    responseMessage = context.Response;
                }
                else {
                    context = result[urlPath];
                    statusCode = context.StatusCode;
                    responseMessage = context.Response;
                }

                if (context.DelayResponse)
                    wait(context.DelayResponse);

                return reply(responseMessage).code(statusCode);
            }
        });
    }
});

server.start((err) => {

    if (err) {
        throw err;
    }
    console.log('\nServer running at:', server.info.uri);
});

function wait(ms) {
    var start = new Date().getTime();
    var end = start;
    while (end < start + ms) {
        end = new Date().getTime();
    }
}