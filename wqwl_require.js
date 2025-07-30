const crypto = require('crypto');
const { HttpsProxyAgent } = require('https-proxy-agent');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
let message = "";
//获取环境变量
function checkEnv(userCookie) {
    try {
        const envSplitor = ["&", "\n"];
        //this.sendMessage(userCookie);
        let userList = userCookie
            .split(envSplitor.find((o) => userCookie.includes(o)) || "&")
            .filter((n) => n);
        if (!userList || userList.length === 0) {
            console.log("没配置环境变量就要跑脚本啊！！！");
            console.log("🔔还没开始已经结束!");
            process.exit(1);
        }

        console.log(`共找到${userList.length}个账号`);
        return userList;
    } catch (e) {
        console.log("环境变量格式错误,下面是报错信息")
        console.log(e);
    }
}

async function sleep(s) {
    return new Promise(resolve => setTimeout(resolve, s * 1000));
}

function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sendMessage(text, isPush = true) {
    if (isPush) {
        message += text + "\n";
    }
    console.log(text);
}

function getMessage() {
    return message;
}

function md5(str, uppercase = false) {
    const hash = crypto.createHash('md5');
    hash.update(str);
    let result = hash.digest('hex');
    return uppercase ? result.toUpperCase() : result;
}

function aesEncrypt(data, key, iv = '', cipher = 'aes-256-cbc', keyEncoding = 'utf8', inputEncoding = 'utf8', outputEncoding = 'hex') {
    let keyBuffer = Buffer.from(key, keyEncoding);
    const ivBuffer = iv ? Buffer.from(iv, 'utf8') : null;

    const cipherObj = crypto.createCipheriv(cipher, keyBuffer, ivBuffer);
    cipherObj.setAutoPadding(true); // 确保使用 PKCS7 填充

    let encrypted = cipherObj.update(data, inputEncoding, outputEncoding);
    encrypted += cipherObj.final(outputEncoding);

    return encrypted;
}

function aesDecrypt(encryptedData, key, iv = '', cipher = 'aes-128-cbc', keyEncoding = 'utf8', outputEncoding = 'utf8') {
    const encryptedBuffer = Buffer.isBuffer(encryptedData)
        ? encryptedData
        : Buffer.from(encryptedData, 'hex');
    const keyBuffer = Buffer.from(key, keyEncoding);

    const ivBuffer = iv ? Buffer.from(iv, keyEncoding) : Buffer.alloc(0);
    const decipher = crypto.createDecipheriv(cipher, keyBuffer, ivBuffer);
    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString(outputEncoding);
}


async function request(options, proxy = '') {
    let agent = null;

    if (proxy) {
        try {
            agent = new HttpsProxyAgent(`http://${proxy}`);
        } catch (e) {
            console.error('创建代理失败:', e.message);
            return null;
        }
    }
    const config = {
        ...options,
        httpsAgent: agent,
        httpAgent: agent,
    };

    try {
        const response = await axios(config);
        return response.data;
    } catch (e) {
        console.log(e.message);
        return null;
    }
}

async function getProxy() {
    const config = {
        method: 'get',
        url: process.env['wqwl_daili']
    };

    try {
        const response = await axios(config);
        console.log('获取到的代理✅：', response.data.trim());
        return response.data.trim(); // 返回代理 IP:端口
    } catch (error) {
        console.error('获取代理失败❌：', error.message);
        throw error;
    }
}


// 固定存储目录
const DATA_DIR = path.resolve(__dirname, 'wqwl_data');

// 确保目录存在
function ensureDataDirExists() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

// 保存 JSON 到 wqwl_data 目录（覆盖或新建）
function saveFile(data, filename) {
    ensureDataDirExists();

    const filePath = path.join(DATA_DIR, `wqwl_${filename}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
    //console.log(`✅ 已保存文件到: ${filePath}`);
}

// 从 wqwl_data 目录读取 JSON
function readFile(filename) {
    const filePath = path.join(DATA_DIR, filename);

    if (!fs.existsSync(filePath)) {
        console.warn(`❌ 文件不存在: ${filePath}`);
        return null;
    }

    try {
        const rawData = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(rawData);
        //console.log(`✅ 已读取文件: ${filePath}`);
        return data;
    } catch (err) {
        console.error(`❌ 读取或解析文件失败: ${err.message}`);
        return null;
    }
}

function disclaimer() {
    console.log(`⚠️免责声明
1. 本脚本中涉及的解锁解密分析脚本仅用于测试、学习和研究，禁止用于商业目的。 其合法性、准确性、完整性和有效性无法得到保证。 请根据实际情况作出自己的判断。
2. 禁止任何官方账号或自媒体以任何形式复制或发布本项目中的所有资源文件。
3. 本脚本不负责任何脚本问题，包括但不限于任何脚本错误导致的任何损失或损坏。
4. 任何间接使用该脚本的用户，包括但不限于建立 VPS 或在某些行为违反国家/地区法律或相关法规时传播该脚本，本脚本不承担由此造成的任何隐私泄露或其他后果。
5. 请勿将本脚本项目的任何内容用于商业或非法目的，否则所造成的后果由您自行承担。
6. 任何单位或个人认为项目脚本可能侵犯其权利时，应及时通知并提供身份证明和所有权证明。 我们会在收到认证文件后删除相应的脚本。
7. 任何以任何方式或直接或间接使用 wqwl_qinglong 项目的任何脚本的人都应该仔细阅读此声明。本脚本保留随时更改或补充本免责声明的权利。 一旦您使用并复制了本脚本，您就被视为接受了本免责声明。
8. 您必须在下载后 24 小时内从您的电脑或手机上彻底删除以上内容。
9. 您在本脚本使用或复制了由本人开发的任何脚本，即视为已接受此声明。请在使用前仔细阅读以上条款。
10. 脚本来源：https://github.com/298582245/wqwl_qinglong，QQ裙：960690899
============================
        `)
}

module.exports = {
    checkEnv: checkEnv, //获取环境变量
    sleep: sleep, //等待
    getRandom: getRandom, //随机数
    sendMessage: sendMessage, //发送消息
    getMessage: getMessage, //获取消息
    md5: md5, //md5,
    request: request, //请求
    getProxy: getProxy, //获取代理
    disclaimer: disclaimer, //免责声明
    saveFile: saveFile, //保存文件
    readFile: readFile, //读取文件
    aesEncrypt: aesEncrypt, //aes加密
    aesDecrypt: aesDecrypt,  //aes解密
};