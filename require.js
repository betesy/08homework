// 流程
// require方法 
// Module._load 加载模块
// Module._resolveFilename 解析文件名 把一个相对路径转化成绝对路径 加一个.js后缀
// Module._cache 存放缓存的
// 如果没有缓存 new Module 就创建一个模块
// Module 中 1) id 路径 2) exports ={}
// 把模块缓存起来 绝对路径
// tryModuleLoad 尝试加载模块 load();
// 如果是json 按照json 来处理 如果js 按照js的方式来处理
// Module.extensions[];
let path = require('path');
let fs = require('fs');
let vm = require('vm');

function Module(id) {
    //是否被缓存过
    this.loaded = false;
    this.id = id;
    this.exports = {}
}
Module.wrap = function (script) {
  return `(function (exports, require, module, __filename, __dirname) {
      ${script}
  })`
}
Module._extensions = {
  '.js'(module){
    let content = fs.readFileSync(module.id, 'utf8');
    let fnStr = Module.wrap(content);
    let fn = vm.runInThisContext(fnStr);
    fn.call(module.exports, module.exports, req, module); // module.exports = 'hello';
  },
  '.json'(module){
    let content = fs.readFileSync(module.id,'utf8');
    module.exports = JSON.parse(content);
  }
}
Module._extension = ['.js', '.json'];
Module._cache = {};
Module._resolveFilename = function (p) {
    p = path.join(__dirname, p);
    if (/\.\w+$/.test(p)) {
        return p;
    } else {
        for (let i = 0; i < Module._extension.length; i++) {
            let filePath = p + Module._extension[i];
            try{
                fs.accessSync(filePath);
                return filePath;
            } catch (e) {
                throw new Error ('Module not found !');
            }
        }
    }
}
function req(p) {
  let readlPath = path.resolve(__dirname,p); // 把相对路径转化成绝对路径
  readlPath = Module._resolveFilename(readlPath);
  if (Module._cache[readlPath]) {
      return Module._cache[readlPath].exports;
  }
  let module = new Module(readlPath); // {id:'xxxx/a.json',exports = {}}
  let extName = path.extname(module.id);
  Module._extensions[extName](module);
  Module._cache[readlPath] = module;
  return module.exports;
}
let r = req('./a');
console.log(r);

// 1) 自己断点调试 看看里面逻辑 简化逻辑 实现 1） 缓存功能  2） 实现模块的自动后缀查找  先找 js再找 json 在找node (练断点调试)
// fs.accessSync
// 下周六交