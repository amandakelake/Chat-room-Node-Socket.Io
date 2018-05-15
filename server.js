const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime'); // mime模块，根据文件扩展名得出MIME文件类型
let cache = {}; // 缓存文件内容的对象,以文件路径absPath为key

// 文件不存在时，发送404错误
function send404(response) {
  response.writeHead(404, { 'Content-Type': 'text/plain' });
  response.write('Error 404: resource not found.');
  response.end();
}

// 文件数据服务
function sendFile(response, filePath, fileContents) {
  response.writeHead(200, {
    'Content-Type': mime.lookup(path.basename(filePath))
  });
  response.end(fileContents);
}

// 第一次访问，从文件系统读取
// 判断文件是否缓存，是则直接返回， 否则从硬盘读取并返回，如果文件不存在则返回404
function serveStatic(response, cache, absPath) {
  if (cache[absPath]) {
    sendFile(response, absPath, cache[absPath]);
  } else {
    // fs.exists()已经废弃,这里不确认是否对
    fs.stat(absPath, (err, stats) => {
      if(stats) {
        fs.readFile(absPath, (err, data) => {
          if (err) {
            send404(response);
          } else {
            cache[absPath] = data;
            sendFile(response, absPath, data);
          }
        })
      } else {
        send404(response);
      }
    })
  }
}