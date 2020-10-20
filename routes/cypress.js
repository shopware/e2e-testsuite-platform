const http = require("http");
const childProcess = require("child_process");

// Either use the current directory or use the env parameter "PROJECT_ROOT" to terminate the project root
let PROJECT_ROOT = ".";
if (Object.prototype.hasOwnProperty.call(process.env, "PROJECT_ROOT")) {
    PROJECT_ROOT = require("path").resolve(process.env.PROJECT_ROOT);
}

const requestHandler = (request, response) => {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });

    const requestedUrl = request.url;
    if (requestedUrl !== "/cleanup") {
        response.end();
        return;
    }

    return childProcess.exec(
        `${PROJECT_ROOT}/psh.phar e2e:cleanup`,
        (err, stdout, stderr) => {
            let output = "success";

            // ToDo: Replace with status 500 when cypress issue #5150 is released:
            //  https://github.com/cypress-io/cypress/pull/5150/files
            if (err) {
                output =
                    err.toString() +
                    "\n" +
                    err.message +
                    "\n" +
                    stdout +
                    "\n" +
                    stderr;
            }

            response.write(output);
            response.end();
        }
    );
};

const server = http.createServer(requestHandler);
server.listen(8005);
