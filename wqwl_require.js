const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const https = require('https');
const { constants } = require('crypto');
let message = "";
//获取环境变量
function checkEnv(userCookie) {
    try {
        if (!userCookie || userCookie === "" || userCookie === undefined || userCookie === "undefined" || userCookie === null || userCookie === "null") {
            console.log("🔔 没配置环境变量就要跑脚本啊！！！");
            console.log("🔔 还没开始已经结束!");
            process.exit(1);
        }
        const envSplitor = ["&", "\n"];
        //this.sendMessage(userCookie);
        let userList = userCookie
            .split(envSplitor.find((o) => userCookie.includes(o)) || "&")
            .filter((n) => n);
        if (!userList || userList.length === 0) {
            console.log("🔔 没配置环境变量就要跑脚本啊！！！");
            console.log("🔔 还没开始已经结束!");
            process.exit(1);
        }

        console.log(`✅ 共找到${userList.length}个账号`);
        return userList;
    } catch (e) {
        console.log("🔔 环境变量格式错误,下面是报错信息")
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

function aesDecrypt(encryptedData, key, iv = '', cipher = 'aes-128-cbc', keyEncoding = 'utf8', outputEncoding = 'utf8', inputEncoding = 'hex') {
    const encryptedBuffer = Buffer.isBuffer(encryptedData)
        ? encryptedData
        : Buffer.from(encryptedData, inputEncoding);
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
                console.log('⚠️ https-proxy-agent 模块未安装，将不使用代理');
            }
        } catch (e) {
            console.log(`❌ 创建代理代理失败: ${e.message}`)
        }
    }

    const config = {
        ...options,
        httpsAgent: agent,
        httpAgent: agent,
        validateStatus: () => true,
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
            console.error(`账号[${index + 1}]：🔐 获取代理失败，正在重试...`);

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

/**
 * 通用RSA加密函数
 * @param {string|Object} data - 要加密的数据
 * @param {string} publicKey - 公钥(PEM格式)
 * @param {string} outputEncoding - 输出编码格式：'base64', 'hex', 'buffer'，默认'base64'
 * @param {string} inputEncoding - 输入编码，默认'utf8'
 * @param {number} padding - 填充方式，默认RSA_PKCS1_PADDING
 * @returns {string|Buffer} 加密后的数据
 */
function rsaEncrypt(data, publicKey, outputEncoding = 'base64', inputEncoding = 'utf8', padding = crypto.constants.RSA_PKCS1_PADDING) {
    const text = typeof data === 'string' ? data : JSON.stringify(data);

    const buffer = crypto.publicEncrypt(
        {
            key: publicKey,
            padding: padding
        },
        Buffer.from(text, inputEncoding)
    );

    return outputEncoding === 'buffer' ? buffer : buffer.toString(outputEncoding);
}

/**
 * 通用RSA解密函数
 * @param {string|Buffer} encryptedData - 加密的数据
 * @param {string} privateKey - 私钥(PEM格式)
 * @param {string} inputEncoding - 输入编码格式：'base64', 'hex', 'buffer'，默认'base64'
 * @param {string} outputEncoding - 输出编码，默认'utf8'
 * @param {number} padding - 填充方式，默认RSA_PKCS1_PADDING
 * @returns {string} 解密后的原始数据
 */
function rsaDecrypt(encryptedData, privateKey, inputEncoding = 'base64', outputEncoding = 'utf8', padding = crypto.constants.RSA_PKCS1_PADDING) {
    let inputBuffer;

    if (inputEncoding === 'buffer') {
        inputBuffer = encryptedData;
    } else {
        inputBuffer = Buffer.from(encryptedData, inputEncoding);
    }

    const buffer = crypto.privateDecrypt(
        {
            key: privateKey,
            padding: padding
        },
        inputBuffer
    );

    return buffer.toString(outputEncoding);
}


async function findTypes(targetName) {
    const config = {
        method: 'get',
        url: `https://gitee.com/cobbWmy/img/raw/staticApi/type.json`
    };

    let retries = 3;
    let lastError;

    let types = []; // 改为数组存储多个分类

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios(config);
            const data = response.data;

            // 清空之前的查找结果
            types = [];

            // 在返回的数据中查找目标name所属的所有分类
            for (const [category, items] of Object.entries(data)) {
                const found = items.find(item => item.name === targetName);
                if (found) {
                    types.push(category);
                }
            }

            // 如果找到了分类，就跳出重试循环
            break;

        } catch (error) {
            lastError = error;
            console.error(`🔐 获取分类数据失败，正在重试... (${attempt}/${retries})`);

            if (attempt < retries) {
                // 等待一段时间再重试
                await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
            }
        }
    }

    // 如果没有找到任何分类，返回"其他"
    if (types.length === 0) {
        return "其他";
    }

    // 如果找到多个分类，用"+"连接
    return types.join('+');
}

async function newFindTypes(targetName) {
    const config = {
        method: 'get',
        url: `https://gitee.com/cobbWmy/img/raw/staticApi/type.json`
    };

    let retries = 3;
    let lastError;

    let types = [];
    let remoteVersion = "未知";

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios(config);
            const data = response.data;

            types = [];
            remoteVersion = "未知";

            // 在返回的数据中查找目标name所属的所有分类和版本
            for (const [category, items] of Object.entries(data)) {
                const found = items.find(item => item.name === targetName);
                if (found) {
                    types.push(category);
                    // 获取版本号，如果没有版本号就返回"其他"
                    if (found.version) {
                        remoteVersion = found.version;
                    } else {
                        remoteVersion = "其他";
                    }
                }
            }

            break;

        } catch (error) {
            lastError = error;
            console.error(`🔐 获取分类数据失败，正在重试... (${attempt}/${retries})`);

            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
            }
        }
    }

    // 如果没有找到任何分类，返回"其他"
    if (types.length === 0) {
        return {
            type: "其他",
            version: "其他"
        };
    }

    // 返回对象
    return {
        type: types.join('+'),
        version: remoteVersion
    };
}

function hmacSHA256(data, key, inputEncoding = 'utf8') {
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(data, inputEncoding);
    return hmac.digest('base64');
}

//基础模板类，
class WQWLBase {
    constructor(wqwlkj, ckName, scriptName, version, isNeedFile, proxy, isProxy, bfs, isNotify, isDebug) {
        this.wqwlkj = wqwlkj;
        this.ckName = ckName;
        this.scriptName = scriptName;
        this.version = version || 1.0;
        this.isNeedFile = isNeedFile || false;
        this.proxyUrl = proxy || process.env["wqwl_daili"] || '';
        this.isProxy = isProxy || process.env["wqwl_useProxy"] || false;
        this.bfs = bfs || process.env["wqwl_bfs"] || 4;
        this.isNotify = isNotify || process.env["wqwl_isNotify"] || true;
        this.isDebug = isDebug || process.env["wqwl_isDebug"] || false;
        this.index = 0;
        this.sendText = ''
        this.lock = false;//发消息的锁，没法了
    }

    async initFramework() {
        try {
            this.wqwlkj.disclaimer();
            let typeData = await this.wqwlkj.newFindTypes(this.scriptName);
            console.log(`============================
🚀 当前脚本：${this.scriptName} 🚀
📂 所属分类：${typeData.type} 📂
🔄 本地版本：V${this.version}，远程版本：V${typeData.version} 🔄${this.version < typeData.version ? "\n🚨 当前非最新版本，如未能使用请及时更新！ 🚨" : ""}
============================\n`);
            if (this.isNeedFile)
                this.fileData = this.wqwlkj.readFile(this.scriptName)

            return true;
        } catch (e) {
            console.error('❌ 初始化框架失败:', e.message);
            return false;
        }
    }

    async runTasks(TaskClass) {
        if (!await this.initFramework()) return;

        let notify;
        if (this.isNotify) {
            try {
                notify = require('./sendNotify');
                console.log('✅加载发送通知模块成功');
            } catch (e) {
                console.log('❌加载发送通知模块失败');
                notify = null;
            }
        }

        console.log(`🚀 ${this.scriptName}开始执行...`);
        const tokens = this.wqwlkj.checkEnv(process.env[this.ckName]);
        const totalBatches = Math.ceil(tokens.length / this.bfs);

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const start = batchIndex * this.bfs;
            const end = start + this.bfs;
            const batch = tokens.slice(start, end);

            console.log(`▶️ 开始执行第 ${batchIndex + 1} 批任务 (${start + 1}-${Math.min(end, tokens.length)})`);

            const taskInstances = batch.map(token => new TaskClass(token, this.index++, this));
            const tasks = taskInstances.map(instance => instance.main());
            const results = await Promise.allSettled(tasks);

            results.forEach((result, index) => {
                const task = taskInstances[index];
                if (result.status === 'rejected') {
                    task.sendMessage(result.reason);
                }
            });

            await this.wqwlkj.sleep(this.wqwlkj.getRandom(3, 5));
        }
        if (this.fileData)
            this.wqwlkj.saveFile(this.fileData, this.scriptName)
        console.log(`🎉 ${this.scriptName}全部任务已完成！`);
        if (this.sendText !== '' && this.isNotify === true && notify) {
            await notify.sendNotify(`${this.scriptName} `, `${this.sendText} `);
        }
        else {
            console.log('未开启推送或者无消息可推送')
        }
    }
    async sendMessage(msg, isPush = false) {
        // 等待锁释放
        while (this.lock) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        this.lock = true;
        try {
            if (isPush) {
                //console.log("本消息进行推送");
                this.sendText += msg + "\n";
                msg = `${msg} 🚀[push]`
                //console.log(`[DEBUG] 调用后sendText: "${this.sendText}"`);
            }
            console.log(msg);
        } finally {
            this.lock = false;
        }
    }
}
//基础任务类
class WQWLBaseTask {
    constructor(token, index, base) {
        this.ck = token;
        this.index = index;
        this.base = base;
        this.proxy = ''
        this.maxRetries = 3;
        this.retryDelay = 3;
    }

    async init() {
        // 由子类实现
        return true;
    }

    async main() {
        // 由子类实现
    }

    async request(options, retryCount = 0) {
        try {
            if (this.base.proxyUrl && this.base.isProxy && this.proxy == '') {
                this.proxy = await wqwlkj.getProxy(this.index, this.base.proxyUrl)
                //console.log(`使用代理：${this.proxy}`)
                this.sendMessage(`✅使用代理：${this.proxy}`)
            }
            const data = await this.base.wqwlkj.request(options, this.proxy);

            if (this.base.isDebug) {
                if (this.base.isDebug === 2)
                    console.log(JSON.stringify(options))
                const formatData = (data) => {
                    if (data === null) return 'null';
                    if (data === undefined) return 'undefined';

                    if (typeof data === 'string') return data;
                    if (typeof data === 'object') {
                        try {
                            return JSON.stringify(data, null, 2);
                        } catch (error) {
                            return `[对象序列化失败: ${error.message}]`;
                        }
                    }

                    return String(data);
                };

                this.sendMessage(`[调试输出] ${options?.method}请求${options?.url}返回：${formatData(data)}`);
            }
            return data;

        } catch (error) {
            this.sendMessage(`🔐 检测到请求发生错误，正在重试...`);
            console.log(error)
            let newProxy;
            if (this.base.isProxy) {
                newProxy = await wqwlkj.getProxy(this.index, this.base.proxyUrl)
                this.proxy = newProxy;
                this.sendMessage(`✅ 代理更新成功:${this.proxy}`);
            } else {
                this.sendMessage(`⚠️ 未使用代理`);
                newProxy = true;
            }

            if (retryCount < this.maxRetries && newProxy) {
                this.sendMessage(`🕒 ${this.retryDelay * (retryCount + 1)}s秒后重试...`);
                await this.base.wqwlkj.sleep(this.retryDelay * (retryCount + 1));
                return await this.request(options, retryCount + 1);
            }

            throw new Error(`❌ 请求最终失败: ${error.message}`);
        }
    }

    async safeExecute(fn, methodName = '') {
        try {
            const result = await fn();
            return result;
        } catch (e) {
            if (this.sendMessage) {
                this.sendMessage(`❌ [${methodName}] 执行失败,原因: ${e.message || e || "未知原因"}`, true);
            }
            return false;
        }
    }


    sendMessage(message, isPush = false) {
        message = `账号[${this.index + 1}](${this.remark}): ${message}`;
        return this.base.sendMessage(message, isPush);
    }
}

function disclaimer() {
    console.log(`⚠️ 免责声明
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
============================\n
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
    rsaEncrypt: rsaEncrypt, // rsa加密
    rsaDecrypt: rsaDecrypt, // rsa解密
    hmacSHA256: hmacSHA256, //HMAC-SHA256签名
    findTypes: findTypes, //脚本分类

    newFindTypes: newFindTypes, //新版寻找分类
    WQWLBase: WQWLBase, // 基础模板类
    WQWLBaseTask: WQWLBaseTask //基础任务类
};