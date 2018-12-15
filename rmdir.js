let fs = require('fs');
let path = require('path');

// 同步
function wideSync(p) { // 'a'
  let arr = [p];
  index = 0;
  let current;
  while(current = arr[index++]){
    let statObj = fs.statSync(current);
    if (statObj.isDirectory()){
      let dirs = fs.readdirSync(current);
      dirs = dirs.map(dir => path.join(current, dir));
      arr = [...arr, ...dirs];
    }else{
      arr.splice(index,1); index--; // 需要把数组里的文件 从数组中删除掉
      fs.unlinkSync(current);
    }
    // 如果不是文件夹 我就不需要考虑了
  }
  for(let i = arr.length-1;i>=0;i--){
    
    fs.rmdirSync(arr[i]);
  }
}
//wideSync('a');
// 把同步 (改成异步) -> promise -> async + await

//异步
function wide(p, callback) {
    let arr = [p];
    index = 0;
    let current;
    function next(index) {
        current = arr[index];
        if (index != arr.length) {
            fs.stat(current, function(err, statObj) {
                if (statObj.isDirectory()) {
                    fs.readdir(current, (err, dirs) => {
                        dirs = dirs.map(dir => path.join(current, dir));
                        arr = [...arr, ...dirs];
                        next(index + 1);
                    })
                } else {
                    next(index + 1);
                }
            })
        } else {
            return remove();
        }
    }
    next(index);

    function remove() {
        function next(index) {
            if (index < 0) return callback();
            let current = arr[index];
            fs.stat(current, (err, statObj) => {
                if (statObj.isDirectory()){
                    fs.rmdir(current, () => next(index - 1));
                } else {
                    fs.unlink(current, () => next(index - 1));
                }
            })
        }
        next(arr.length - 1);
    }
}


//promise版
function widePro(p) {
    return new Promise((resolve, reject) => {
        let arr = [p];
        index = 0;
        let current;
        function next(index) {
            current = arr[index];
            if (index != arr.length) {
                fs.stat(current, function(err, statObj) {
                    if (statObj.isDirectory()) {
                        fs.readdir(current, (err, dirs) => {
                            dirs = dirs.map(dir => path.join(current, dir));
                            arr = [...arr, ...dirs];
                            next(index + 1);
                        })
                    } else {
                        next(index + 1);
                    }
                })
            } else {
                return remove();
            }
        }
        next(index);
        function remove() {
            function next(index) {
                if (index < 0) return callback();
                let current = arr[index];
                fs.stat(current, (err, statObj) => {
                    if (statObj.isDirectory()){
                        fs.rmdir(current, () => next(index - 1));
                    } else {
                        fs.unlink(current, () => next(index - 1));
                    }
                })
            }
            next(arr.length - 1);
        }
    })
}


// async await版
let {promisify} = require('util');
let stat = promisify(fs.stat);
let readdir = promisify(fs.readdir);
let unlink = promisify(fs.unlink);
let rmdir = promisify(fs.rmdir);

async function wideAwait(p) {
    let arr = [p];
    index = 0;
    let current;
    while (index != arr.length) {
        let current = arr[index];
        let statObj = await stat(current);
        if (statObj.isDirectory()) {
            let dirs = await readdir(current);
            dirs = dirs.map(dir => path.join(current, dir));
            arr = [...arr, ...dirs];
        }
        index++;
    }
    while ((current = arr.pop())) {
        let statObj = await stat(current);
        if (statObj.isDirectory()) {
            await rmdir(current);
        } else {
            await unlink(current);
        }
    }
}

wideAwait("a").then( () => {
    console.log("删除完成");
})

//console.log(fs.rmdir);
