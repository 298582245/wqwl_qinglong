const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const https = require('https');
const { constants } = require('crypto');
//const { console } = require('inspector');
let message = "";
//获取环境变量
function checkEnv(userCookie) {
    try {
        if (!userCookie || userCookie === "" || userCookie === undefined || userCookie === "undefined" || userCookie === null || userCookie === "null") {
            console.log("没配置环境变量就要跑脚本啊！！！");
            console.log("🔔还没开始已经结束!");
            process.exit(1);
        }
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

        console.log(`✅共找到${userList.length}个账号`);
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
    return text;
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
    let agent = new https.Agent({
        ciphers: 'DEFAULT@SECLEVEL=1',
        secureOptions: constants.SSL_OP_LEGACY_SERVER_CONNECT,
        minVersion: 'TLSv1',
        maxVersion: 'TLSv1.2',
        rejectUnauthorized: false
    });

    if (proxy) {
        try {
            // 检查模块是否存在
            if (typeof require('https-proxy-agent') === 'function' ||
                typeof require('https-proxy-agent').HttpsProxyAgent === 'function') {
                const { HttpsProxyAgent } = require('https-proxy-agent');
                agent = new HttpsProxyAgent(`http://${proxy}`);
            } else {
                console.log('⚠️https-proxy-agent 模块未安装，将不使用代理');
            }
        } catch (e) {
            console.log(`创建代理代理失败❌: ${e.message}`)
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
        throw new Error(e.message);
    }
}

async function getProxy(index, url) {
    const config = {
        method: 'get',
        url: url || process.env['wqwl_daili']
    };

    let retries = 3;
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios(config);
            //console.log(`账号[${index + 1}]: 获取到的代理✅： ${response.data.trim()}`);
            return response.data.trim(); // 返回代理 IP:端口
        } catch (error) {
            lastError = error;
            console.error(`账号[${index + 1}]：🔐获取代理失败，正在重试...`);

            if (attempt < retries) {
                // 等待一段时间再重试（可选）
                await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
            }
        }
    }
    console.error(`账号[${index + 1}]：获取代理失败，已重试${retries}次❌`);
    return '';
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
    const filePath = path.join(DATA_DIR, `wqwl_${filename}.json`);

    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ 文件不存在: ${filePath}，已自动创建文件。`);
        return {};
    }

    try {
        const rawData = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(rawData);
        //console.log(`✅ 已读取文件: ${filePath}`);
        return data;
    } catch (err) {
        console.error(`❌ 读取或解析文件失败: ${err.message}`);
        return {};
    }
}

// 生成随机版本号
function getRandomVersion() {
    const major = Math.floor(Math.random() * 10) + 6; // 6-15
    const minor = Math.floor(Math.random() * 100);
    const patch = Math.floor(Math.random() * 1000);
    return `${major}.0.${minor}.${patch}`;
}

// 生成随机日期格式
function getRandomDate() {
    const year = 2022 + Math.floor(Math.random() * 3); // 2022-2024
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    return `${year}${month}${day}`;
}

// 生成随机微信版本
function getRandomWeChatVersion() {
    const major = 8;
    const minor = Math.floor(Math.random() * 50); // 0-49
    const patch = Math.floor(Math.random() * 3000); // 0-2999
    const hex = Math.floor(Math.random() * 0x3000) + 0x28000000;
    return `${major}.0.${minor}.${patch}(0x${hex.toString(16)})`;
}

// 生成随机数字ID
function getRandomId(length) {
    return Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
}

// 生成随机UA
function generateRandomUA() {
    const common = {
        prefix: 'Mozilla/5.0 (Linux; Android ',
        webkit: 'AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/',
        mobileSafari: 'Mobile Safari/537.36 ',
        xwebPrefix: 'XWEB/',
        mmwebSdkPrefix: 'MMWEBSDK/',
        mmwebIdPrefix: 'MMWEBID/',
        microMessengerPrefix: 'MicroMessenger/',
        wechat: 'WeChat/arm64 Weixin NetType/',
        language: 'Language/zh_CN ABI/arm64 MiniProgramEnv/android'
    };
    // 设备信息池
    const devices = [
        { model: 'SM-G998B', build: 'TP1A.220624.014', androidVersion: '13' },
        { model: 'Pixel 7', build: 'UQ1A.231205.015', androidVersion: '14' },
        { model: 'MI 11', build: 'SKQ1.211006.001', androidVersion: '12' },
        { model: 'Redmi Note 12', build: 'SKQ1.211006.001', androidVersion: '12' },
        { model: 'OPPO Find X5', build: 'TP1A.220624.014', androidVersion: '13' }
    ];

    // 网络类型池
    const netTypes = ['WIFI', '4G', '5G'];

    const device = devices[Math.floor(Math.random() * devices.length)];
    const netType = netTypes[Math.floor(Math.random() * netTypes.length)];

    const chromeVersion = getRandomVersion();
    const xwebVersion = Math.floor(Math.random() * 2000) + 5000;
    const mmwebSdkDate = getRandomDate();
    const mmwebId = getRandomId(4);
    const microMessengerVersion = getRandomWeChatVersion();

    return `${common.prefix}${device.androidVersion}; ${device.model} Build/${device.build}; wv) ${common.webkit}${chromeVersion} ${common.mobileSafari}${common.xwebPrefix}${xwebVersion} ${common.mmwebSdkPrefix}${mmwebSdkDate} ${common.mmwebIdPrefix}${mmwebId} ${common.microMessengerPrefix}${microMessengerVersion} ${common.wechat}${netType} ${common.language}`;
}

function formatDate(date, isDetail = false) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    if (isDetail)
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return `${year}-${month}-${day}`;
}

function sha1(str) {
    if (!str)
        return ''
    return crypto.createHash('sha1').update(str).digest('hex');
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
⚠️⚠️⚠️使用代理时，必须安装依赖：https-proxy-agent
⚠️⚠️⚠️使用代理时，必须安装依赖：https-proxy-agent
⚠️⚠️⚠️使用代理时，必须安装依赖：https-proxy-agent
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
    generateRandomUA: generateRandomUA, //生成随机UA,
    formatDate: formatDate, //格式化时间
    sha1: sha1, //sha1
};