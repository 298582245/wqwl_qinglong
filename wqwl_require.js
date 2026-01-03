const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const http = require('http');
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


    // 检查URL协议
    const isHttps = options.url.startsWith('https://');
    const isHttp = options.url.startsWith('http://');

    // 如果没有协议前缀，添加http://
    if (!isHttps && !isHttp) {
        options.url = 'http://' + options.url;
    }

    // 再次检查
    const protocol = options.url.startsWith('https://') ? https : http;

    let agent;

    if (options.url.startsWith('https://')) {
        agent = new https.Agent({
            ciphers: 'DEFAULT@SECLEVEL=1',
            secureOptions: constants.SSL_OP_LEGACY_SERVER_CONNECT,
            minVersion: 'TLSv1',
            maxVersion: 'TLSv1.2',
            rejectUnauthorized: false
        });
    } else {
        // 对于HTTP，使用普通的http.Agent
        agent = new http.Agent({ keepAlive: true });
    }

    if (proxy) {
        try {
            if (options.url.startsWith('https://')) {
                const { HttpsProxyAgent } = require('https-proxy-agent');
                agent = new HttpsProxyAgent(`http://${proxy}`);
            } else {
                const { HttpProxyAgent } = require('http-proxy-agent');
                agent = new HttpProxyAgent(`http://${proxy}`);
            }
        } catch (e) {
            console.log(`❌ 创建代理代理失败: ${e.message}`);
        }
    }

    const config = {
        ...options,
        httpsAgent: options.url.startsWith('https://') ? agent : undefined,
        httpAgent: options.url.startsWith('http://') ? agent : undefined,
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


function randomUAAlipay() {
    // 随机生成函数
    const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randomVersion = (major, minorMin, minorMax, patchMin, patchMax) =>
        `${major}.${randomNumber(minorMin, minorMax)}.${randomNumber(patchMin, patchMax)}`;

    // Android版本池
    const androidVersions = ['10', '11', '12', '13', '14', '15'];

    // 设备型号池（包含示例中的PJE110）
    const deviceModels = [
        'PJE110', 'SM-G991B', 'SM-G998B', 'Pixel 7', 'Pixel 8',
        'M2102J20SG', 'M2012K11AG', '22081212C', '2210132C'
    ];

    // Chrome版本范围
    const chromeMajor = 126;

    // WebView版本范围
    const webviewMajor = 4;

    // MYWeb版本范围
    const mywebVersions = ['1.3.126', '1.3.127', '1.3.128', '1.3.129'];

    // UWS/UCBS版本
    const uwsVersions = ['3.22.2.9999', '3.23.1.1000', '3.24.0.1001'];

    // Alipay版本
    const alipayVersions = ['10.8.0.8100', '10.8.1.8200', '10.8.2.8300', '10.9.0.9000'];

    // 网络类型
    const networkTypes = ['WIFI', 'MOBILE', 'UNKNOWN'];

    // 屏幕分辨率
    const screenWidths = ['360', '392', '412', '430'];
    const screenHeights = ['800', '844', '892', '926'];

    // 生成随机参数
    const androidVersion = randomElement(androidVersions);
    const deviceModel = randomElement(deviceModels);
    const buildNumber = `TP${randomNumber(1, 2)}A.${randomNumber(220, 230)}${randomNumber(100, 999)}.${randomNumber(100, 999)}`;

    const chromeVersion = `${chromeMajor}.0.${randomNumber(6478, 6499)}.${randomNumber(100, 199)}`;
    const webviewVersion = `${webviewMajor}.0`;

    const mywebVersion = randomElement(mywebVersions);
    const timestamp = `${Date.now().toString().slice(0, 10)}${randomNumber(100000, 999999)}`;

    const uwsVersion = randomElement(uwsVersions);
    const ucbsVersion = `${uwsVersion}_${randomNumber(200, 250)}0000000000`;

    const networkType = randomElement(networkTypes);
    const screenWidth = randomElement(screenWidths);
    const screenHeight = randomElement(screenHeights);
    const screenScale = '3.0';
    const accelerometer = randomElement(['sp', 'g', 'm']);

    const alipayVersion = randomElement(alipayVersions);
    const language = 'zh-Hans';
    const isConcaveScreen = randomElement(['true', 'false']);
    const region = 'CN';
    const ariverVersion = alipayVersion;
    const channelId = randomNumber(1, 10);

    // 构造UA字符串
    const uaParts = [
        `Mozilla/5.0 (Linux; Android ${androidVersion}; ${deviceModel} Build/${buildNumber}; wv)`,
        `AppleWebKit/537.36 (KHTML, like Gecko)`,
        `Version/${webviewVersion}`,
        `Chrome/${chromeVersion}`,
        `MYWeb/${mywebVersion}.${timestamp}`,
        `UWS/${uwsVersion}`,
        `UCBS/${ucbsVersion}`,
        `Mobile Safari/537.36`,
        `NebulaSDK/${randomVersion(1, 8, 9, 100000, 199999)}`,
        `Nebula AlipayDefined(nt:${networkType},ws:${screenWidth}|${screenHeight}|${screenScale},ac:${accelerometer})`,
        `AliApp(AP/${alipayVersion})`,
        `AlipayClient/${alipayVersion}`,
        `Language/${language}`,
        `isConcaveScreen/${isConcaveScreen}`,
        `Region/${region}`,
        `Ariver/${ariverVersion}`,
        `ChannelId(${channelId})`,
        `DTN/2.0`
    ];

    return uaParts.join(' ');
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
    let remoteUrl = '';

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios(config);
            const data = response.data;

            types = [];
            remoteVersion = "未知";
            remoteUrl = '';

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
                    if (found.url) {
                        remoteUrl = found.url;
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
            version: "其他",
            url: ''
        };
    }

    // 返回对象
    return {
        type: types.join('+'),
        version: remoteVersion,
        url: remoteUrl
    };
}

function hmacSHA256(data, key, inputEncoding = 'utf8') {
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(data, inputEncoding);
    return hmac.digest('base64');
}

//基础模板类，
class WQWLBase {
    constructor(wqwlkj, ckName, scriptName, version, isNeedFile, proxy, isProxy, bfs, isNotify, isDebug, isNeedTimes = false, isNeedDetailed = false) {
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
        this.isNeedTimes = isNeedTimes;
        this.statistic = new WQWLStatistic(scriptName);
        this.isNeedDetailed = isNeedDetailed;
    }

    async initFramework() {
        try {
            this.wqwlkj.disclaimer();
            let typeData = await this.wqwlkj.newFindTypes(this.scriptName);
            console.log(`============================
🚀 当前脚本：${this.scriptName} 🚀
📂 所属分类：${typeData.type} 📂
🔄 本地版本：V${this.version}，远程版本：V${typeData.version} 🔄${this.version < typeData.version ? `\n🚨 当前非最新版本，如未能使用请及时更新！ 🚨\n🔗 更新地址：${typeData?.url} 🔗` : ""}
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
        //重置统计
        await this.statistic.reset();
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

            // 检查当前统计队列情况
            const pendingCount = this.statistic.getPendingCount();
            if (pendingCount > 100) {
                console.log(`⏳ 统计队列中有 ${pendingCount} 个任务，等待清理...`);
                await this.statistic.waitForAll();
            }

            await this.wqwlkj.sleep(this.wqwlkj.getRandom(3, 5));
        }
        if (this.fileData)
            this.wqwlkj.saveFile(this.fileData, this.scriptName)
        console.log(`🎉 ${this.scriptName}全部任务已完成！`);
        // 等待所有统计操作完成
        console.log('⏳ 等待所有统计操作完成...');
        await this.statistic.waitForAll();

        const statsOutput = await this.statistic.formatOutput();

        if (this.sendText !== '' && this.isNotify === true && notify) {
            let message = this.formatAccountLogs(this.sendText)
            console.log(`\n推送消息汇总：\n`)
            if (statsOutput) {
                if (this.isNeedDetailed) {
                    message = `${statsOutput}\n${message}`
                } else {
                    console.log(statsOutput)
                }
            }
            console.log(message)
            await notify.sendNotify(`${this.scriptName} `, `${message} `);
        }
        else if (statsOutput && this.sendText === '' && this.isNotify === true && notify) {
            // 如果没有其他消息，只推送统计结果
            console.log('📊 无详细消息，仅推送统计结果');
            await notify.sendNotify(`${this.scriptName} - 执行统计结果`, `${statsOutput}`);
        }
        else {
            console.log('⚠️ 未开启推送或者无消息可推送')
        }
    }
    async sendMessage(msg, isPush = false) {
        // 等待锁释放
        while (this.lock) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        this.lock = true;
        try {
            if (this.isNeedTimes)
                msg = `[${this.getDateDetail()}] ${msg}`
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

    getDateDetail() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

        const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`
        return formattedTime;
    }

    formatAccountLogs(msg) {
        const lines = msg.split('\n').filter(line => line.trim() !== '');

        const accountGroups = {};

        lines.forEach(line => {
            // 匹配：可选时间戳 + 账号[1](xxx): 内容
            const match = line.match(/^(?:\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3})\]\s*)?账号\[(\d+)\]\(([^)]+)\):(.+)$/);
            if (match) {
                const timestamp = match[1] || ''; // 可能为空
                const accountIndex = match[2];
                const accountName = match[3];
                const content = match[4].trim();

                const accountKey = `账号[${accountIndex}](${accountName})`;

                if (!accountGroups[accountKey]) {
                    accountGroups[accountKey] = [];
                }

                // 存储 { timestamp, content }，便于后续格式化
                accountGroups[accountKey].push({ timestamp, content });
            }
        });

        // 按账号编号排序
        const sortedAccounts = Object.keys(accountGroups).sort((a, b) => {
            const numA = parseInt(a.match(/\[(\d+)\]/)?.[1] || 0, 10);
            const numB = parseInt(b.match(/\[(\d+)\]/)?.[1] || 0, 10);
            return numA - numB;
        });

        const formattedLines = [];
        sortedAccounts.forEach(accountKey => {
            formattedLines.push(`${accountKey}:`);
            accountGroups[accountKey].forEach(({ timestamp, content }) => {
                if (this.isNeedTimes && timestamp) {
                    // 保留原始时间戳前缀
                    formattedLines.push(`  [${timestamp}] ↳ ${content}`);
                } else {
                    // 不需要时间，或时间不存在
                    formattedLines.push(`  ↳ ${content}`);
                }
            });
            formattedLines.push(''); // 空行分隔
        });

        return formattedLines.join('\n').trim();
    }
}
//基础任务类
class WQWLBaseTask {

    constructor(token, index, base) {
        this.ck = token;
        this.index = index;
        this.base = base;
        this.proxy = '';
        this.maxRetries = 3;
        this.retryDelay = 3;
        this.scheduleInterval = null;
        this.scheduleResults = [];
    }

    格式化结果方法
    formatResult(result) {
        if (result === null || result === undefined) {
            return result === null ? 'null' : 'undefined';
        }

        if (typeof result === 'string') {
            return result.length > 50 ? result.substring(0, 50) + '...' : result;
        }

        if (typeof result === 'object') {
            try {
                const jsonStr = JSON.stringify(result);
                return jsonStr.length > 50 ? jsonStr.substring(0, 50) + '...' : jsonStr;
            } catch {
                return '[复杂对象]';
            }
        }

        return String(result);
    }

    // 输出结果方法
    outputScheduleResults(timeStr, results, duration) {
        const methodName = `定时结果[${timeStr}]`;

        if (!results || results.length === 0) {
            this.sendMessage(`📊 [${methodName}] 没有执行结果`, true);
            return;
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.length - successCount;

        let summary = `\n📊 [${methodName}] 执行完成\n`;
        summary += `⏱️ 耗时: ${duration}秒\n`;
        summary += `📊 总计: ${results.length}次\n`;
        summary += `✅ 成功: ${successCount}次\n`;
        summary += `❌ 失败: ${failCount}次\n`;
        summary += `📅 完成时间: ${this.base.wqwlkj.formatDate(new Date(), true)}\n`;

        if (successCount > 0) {
            summary += `\n📋 执行结果:\n`;
            results.forEach(item => {
                if (item.success) {
                    const resultStr = this.formatResult(item.result);
                    summary += `  第${item.index}次: ${resultStr} (${item.time})\n`;
                }
            });
        }

        if (failCount > 0) {
            summary += `\n🚨 异常结果:\n`;
            results.forEach(item => {
                if (!item.success) {
                    summary += `  第${item.index}次: ${item.error} (${item.time})\n`;
                }
            });
        }

        this.sendMessage(summary);
    }

    // 定时任务类
    ScheduleExecutor = class {
        constructor(parent) {
            this.parent = parent;
            this.scheduleResults = [];
        }

        // 执行定时任务的核心方法
        async executeScheduledTask(func, timeStr, concurrent, maxTimes, delayMs) {
            const methodName = `定时执行[${timeStr}]`;
            const results = [];
            const startTime = new Date();

            try {
                if (concurrent) {
                    // 并发执行
                    this.parent.sendMessage(`⚡ [${methodName}] 开始并发执行，次数：${maxTimes}`);

                    const promises = [];
                    for (let i = 0; i < maxTimes; i++) {
                        promises.push(
                            (async (index) => {
                                try {
                                    // 使用func.call(parent)确保在父类上下文中执行
                                    const result = await func.call(this.parent);
                                    return {
                                        index: index + 1,
                                        success: true,
                                        result: result,
                                        time: new Date().toLocaleTimeString('zh-CN', {
                                            hour12: false,
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                        })
                                    };
                                } catch (error) {
                                    return {
                                        index: index + 1,
                                        success: false,
                                        error: error.message,
                                        time: new Date().toLocaleTimeString('zh-CN', {
                                            hour12: false,
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                        })
                                    };
                                }
                            })(i)
                        );
                    }

                    const settledResults = await Promise.allSettled(promises);
                    settledResults.forEach(settled => {
                        if (settled.status === 'fulfilled') {
                            results.push(settled.value);
                        }
                    });
                } else {
                    // 顺序执行
                    this.parent.sendMessage(`🔄 [${methodName}] 开始顺序执行，次数：${maxTimes}，间隔：${delayMs}ms`);

                    for (let i = 0; i < maxTimes; i++) {
                        try {
                            // 使用func.call(parent)确保在父类上下文中执行
                            const result = await func.call(this.parent);
                            results.push({
                                index: i + 1,
                                success: true,
                                result: result,
                                time: new Date().toLocaleTimeString('zh-CN', {
                                    hour12: false,
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                })
                            });
                            this.parent.sendMessage(`✅ [${methodName}] 第${i + 1}次请求成功`);
                            if (result) break;
                        } catch (error) {
                            results.push({
                                index: i + 1,
                                success: false,
                                error: error.message,
                                time: new Date().toLocaleTimeString('zh-CN', {
                                    hour12: false,
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                })
                            });
                            this.parent.sendMessage(`❌ [${methodName}] 第${i + 1}次执行失败: ${error.message}`);
                        }

                        // 如果不是最后一次，等待延迟
                        if (i < maxTimes - 1) {
                            await new Promise(resolve => setTimeout(resolve, delayMs));
                        }
                    }
                }

                // 计算执行耗时
                const endTime = new Date();
                const duration = (endTime - startTime) / 1000;

                // 存储结果到父类
                this.parent.scheduleResults.push({
                    timeStr: timeStr,
                    startTime: this.parent.base.wqwlkj.formatDate(new Date(startTime), true),
                    endTime: this.parent.base.wqwlkj.formatDate(new Date(endTime), true),
                    duration: duration.toFixed(2),
                    results: results
                });

                // 输出结果摘要
                this.parent.outputScheduleResults(timeStr, results, duration);

                return results;
            } catch (error) {
                this.parent.sendMessage(`❌ [${methodName}] 执行失败: ${error.message}`, true);
                throw error;
            }
        }

        // 启动定时检测（返回Promise）
        async startScheduleDetection(func, timeStr, targetTime, concurrent, maxTimes, delayMs) {
            const methodName = `定时检测[${timeStr}]`;
            const targetTimestamp = targetTime.getTime();

            return new Promise((resolve, reject) => {
                const checkInterval = 100;
                let lastLogTime = Date.now();
                const logInterval = 30 * 1000;

                const checkTimer = setInterval(async () => {
                    const now = Date.now();
                    const timeDiff = targetTimestamp - now;

                    // 每30秒输出一次日志
                    if (now - lastLogTime >= logInterval) {
                        const remainingSeconds = Math.round(timeDiff / 1000);
                        this.parent.sendMessage(`⏰ [${methodName}] 距离执行还有 ${remainingSeconds} 秒`);
                        lastLogTime = now;
                    }

                    // 检查是否应该执行
                    if (timeDiff <= 0) {
                        clearInterval(checkTimer);
                        this.parent.sendMessage(`⏰ [${methodName}] 时间到，开始执行`);

                        try {
                            const results = await this.executeScheduledTask(func, timeStr, concurrent, maxTimes, delayMs);
                            resolve(results);
                        } catch (error) {
                            reject(error);
                        }
                    }
                }, checkInterval);

                // 超时保护（半小时）
                setTimeout(() => {
                    clearInterval(checkTimer);
                    reject(new Error('定时检测超时'));
                }, 30 * 60 * 1000);
            });
        }

        // 主调度方法（返回Promise，可以被await）
        async scheduleExecute(
            func,
            timeStr,
            concurrent = true,
            maxTimes = 3,
            delayMs = 50
        ) {
            const methodName = `定时任务[${timeStr}]`;

            return new Promise(async (resolve, reject) => {
                try {
                    const now = new Date();
                    const currentTime = now.getTime();

                    // 解析目标时间
                    const [targetHour, targetMinute, targetSecond] = timeStr.split(':').map(Number);

                    // 今天的目标时间
                    const targetTimeToday = new Date(now);
                    targetTimeToday.setHours(targetHour, targetMinute, targetSecond, 0);

                    // 明天同一时间
                    const targetTimeTomorrow = new Date(targetTimeToday);
                    targetTimeTomorrow.setDate(targetTimeTomorrow.getDate() + 1);

                    // 计算时间差
                    const diffToday = targetTimeToday.getTime() - currentTime;
                    const diffTomorrow = targetTimeTomorrow.getTime() - currentTime;

                    // 选择最接近的未来的目标时间
                    let targetTime;
                    let timeDiff;

                    if (diffToday >= 0) {
                        targetTime = targetTimeToday;
                        timeDiff = diffToday;
                    } else {
                        targetTime = targetTimeTomorrow;
                        timeDiff = diffTomorrow;
                    }

                    // 时间窗口定义
                    const tenMinutesMs = 10 * 60 * 1000;
                    const oneMinuteMs = 60 * 1000;

                    // 判断执行逻辑
                    if (timeDiff > tenMinutesMs) {
                        this.parent.sendMessage(`⏰ [${methodName}] 距离目标时间超过10分钟（${Math.round(timeDiff / 1000)}秒），不启动定时器`);
                        resolve({
                            status: 'skipped',
                            reason: 'too_early',
                            timeDiff,
                            message: '距离目标时间超过10分钟，跳过执行'
                        });
                        return;
                    }
                    else if (timeDiff > 0 && timeDiff <= tenMinutesMs) {
                        this.parent.sendMessage(`⏰ [${methodName}] 距离目标时间${Math.round(timeDiff / 1000)}秒，启动定时器`);

                        // 启动定时检测并等待结果
                        const results = await this.startScheduleDetection(
                            func, timeStr, targetTime, concurrent, maxTimes, delayMs
                        );
                        resolve({
                            status: 'completed',
                            results,
                            executionType: 'scheduled',
                            message: '定时任务执行完成'
                        });
                    }
                    else if (timeDiff <= 0 && Math.abs(timeDiff) <= oneMinuteMs) {
                        this.parent.sendMessage(`⏰ [${methodName}] 已超过目标时间${Math.round(Math.abs(timeDiff) / 1000)}秒（在1分钟内），立即执行`);
                        const results = await this.executeScheduledTask(func, timeStr, concurrent, maxTimes, delayMs);
                        resolve({
                            status: 'completed',
                            results,
                            executionType: 'immediate',
                            message: '立即执行完成'
                        });
                    }
                    else {
                        this.parent.sendMessage(`⏰ [${methodName}] 已超过目标时间${Math.round(Math.abs(timeDiff) / 1000)}秒（超过1分钟），跳过执行`);
                        resolve({
                            status: 'skipped',
                            reason: 'too_late',
                            timeDiff,
                            message: '已超过目标时间1分钟以上，跳过执行'
                        });
                    }
                } catch (error) {
                    this.parent.sendMessage(`❌ [${methodName}] 调度出错: ${error.message}`, true);
                    reject(error);
                }
            });
        }
    }

    // 父类的定时执行方法（按需创建内部类实例）
    async scheduleExecute(func, timeStr, concurrent = true, maxTimes = 3, delayMs = 50) {
        // 按需创建内部类实例
        const executor = new this.ScheduleExecutor(this);

        // 调用内部类方法并返回Promise
        return executor.scheduleExecute(func, timeStr, concurrent, maxTimes, delayMs);
    }

    async init() {
        return true;
    }

    async main() {
        // 由子类实现
    }

    // 统计方法（不等待）
    statisticSetValue(action = '默认动作', status = 0, isNeedCalculate = false, value = 0, unit = '元') {
        // 不等待，直接返回null
        return this.base.statistic.setValue(action, status, isNeedCalculate, value, unit);
    }

    //成功带计算值
    statisticSetSuccessWithValue(action = '默认动作', value = 0, unit = '元') {
        // 不等待，直接返回null
        return this.base.statistic.setValue(action, 0, true, value, unit);
    }

    //成功不带计算值
    statisticSetSuccess(action = '默认动作') {
        // 不等待，直接返回null
        return this.base.statistic.setValue(action, 0, false, 0, '元');
    }

    //失败不带计算值
    statisticSetFailure(action = '默认动作') {
        // 不等待，直接返回null
        return this.base.statistic.setValue(action, 1, false, 0, '元');
    }

    // 批量统计（不等待）
    statisticSetValues(actionStatusPairs, isNeedCalculate = false, values = [], unit = '元') {
        return this.base.statistic.setValues(actionStatusPairs, isNeedCalculate, values, unit);
    }

    // 新增：一个操作多个收益（主要方法）
    statisticMulti(action, values) {
        // 只计一次成功
        this.statisticSetSuccess(action);
        // 分别统计各种收益（不增加计数）
        Object.entries(values).forEach(([unit, value]) => {
            this.base.statistic.addValue(action, unit, value);
        });
        return null;
    }

    // 如果需要获取统计结果，才需要等待
    async getStatistic() {
        return await this.base.statistic.getStats();
    }

    async formatStatisticOutput() {
        return await this.base.statistic.formatOutput();
    }

    async request(options, retryCount = 0) {
        try {
            if (this.base.proxyUrl && this.base.isProxy && this.proxy == '') {
                this.proxy = await this.base.wqwlkj.getProxy(this.index, this.base.proxyUrl)
                this.sendMessage(`✅使用代理：${this.proxy}`)
            }
            const data = await this.base.wqwlkj.request(options, this.proxy);

            if (this.base.isDebug) {
                if (this.base.isDebug === 2)
                    this.sendMessage(`[请求配置] ${JSON.stringify(options)}`)
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
                newProxy = await this.base.wqwlkj.getProxy(this.index, this.base.proxyUrl)
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

//统计类
class WQWLStatistic {
    constructor(scriptName) {
        this.scriptName = scriptName
        this.action = {};
        this.lock = false;
        this.pendingPromises = new Set(); // 跟踪所有异步操作
    }

    // 获取锁（带超时）
    async acquireLock(timeout = 1000) {
        const startTime = Date.now();
        while (this.lock) {
            if (Date.now() - startTime > timeout) {
                throw new Error('获取锁超时');
            }
            await new Promise(resolve => setTimeout(resolve, 5)); // 更短的等待
        }
        this.lock = true;
    }

    // 释放锁
    releaseLock() {
        this.lock = false;
    }

    // 安全的加锁执行函数
    async executeWithLock(fn) {
        await this.acquireLock();
        try {
            return await fn();
        } finally {
            this.releaseLock();
        }
    }

    // 异步统计，但不等待（fire and forget）
    setValue(action = '默认动作', status = 0, isNeedCalculate = false, value = 0, unit = '元') {
        // 创建异步操作但不等待
        const promise = this._setValueInternal(action, status, isNeedCalculate, value, unit);
        this.pendingPromises.add(promise);

        // 异步操作完成后清理
        promise.finally(() => {
            this.pendingPromises.delete(promise);
        });

        // 不返回promise，不让调用者等待
        return null;
    }

    // 内部实现
    async _setValueInternal(action = '默认动作', status = 0, isNeedCalculate = false, value = 0, unit = '元') {
        return await this.executeWithLock(async () => {
            const VALID_STATUS = ['success', 'failure'];
            const statusKey = VALID_STATUS[status] || VALID_STATUS[0];

            if (!this.action['extra']) {
                this.action['extra'] = {}
            }

            if (!this.action[action]) {
                this.action[action] = {
                    success: 0,
                    failure: 0,
                    total: 0,
                };
            }

            if (isNeedCalculate) {
                if (!this.action['extra'][unit]) {
                    this.action['extra'][unit] = 0;
                }
            }

            // 更新统计
            this.action[action][statusKey] += 1;
            this.action[action]['total'] += 1;

            // 计算收益（只有成功时才计算）
            if (isNeedCalculate && this.action['extra'] && status === 0) {
                // 尝试将字符串转为数字
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    // 如果是有效的数字字符串，使用转换后的值
                    value = numValue;
                }
                this.action['extra'][unit] += value;
            }

            return true;
        });
    }

    // 新增：只添加收益，不增加计数
    addValue(action = '默认动作', unit = '元', value = 0) {
        // 创建异步操作但不等待
        const promise = this._addValueInternal(action, unit, value);
        this.pendingPromises.add(promise);

        promise.finally(() => {
            this.pendingPromises.delete(promise);
        });

        return null;
    }

    // 内部实现：只添加收益
    async _addValueInternal(action = '默认动作', unit = '元', value = 0) {
        return await this.executeWithLock(async () => {
            // 确保 extra 结构存在
            if (!this.action['extra']) {
                this.action['extra'] = {};
            }

            // 初始化该单位的统计
            if (!this.action['extra'][unit]) {
                this.action['extra'][unit] = 0;
            }

            // 累加收益
            if (typeof this.action['extra'][unit] !== 'number') {
                this.action['extra'][unit] = 0;
            }
            this.action['extra'][unit] += value;

            return true;
        });
    }

    // 批量设置（同样不等待）
    setValues(actionStatusPairs, isNeedCalculate = false, values = [], unit = '元') {
        actionStatusPairs.forEach((pair, index) => {
            const [action, status] = pair;
            const value = values[index] || 0;
            this.setValue(action, status, isNeedCalculate, value, unit);
        });
        return null;
    }

    // 等待所有异步统计完成
    async waitForAll() {
        const promises = Array.from(this.pendingPromises);
        if (promises.length === 0) return true;

        console.log(`⏳ 等待 ${promises.length} 个统计操作完成...`);
        await Promise.allSettled(promises);
        console.log('✅ 所有统计操作已完成');
        return true;
    }

    // 获取当前统计结果（需要等待统计完成）
    async getStats() {
        await this.waitForAll(); // 确保所有统计已完成
        return await this.executeWithLock(() => {
            return JSON.parse(JSON.stringify(this.action));
        });
    }

    // 重置统计
    async reset() {
        await this.waitForAll(); // 等待当前统计完成
        return await this.executeWithLock(() => {
            this.action = {};
            return true;
        });
    }

    async formatOutput() {
        await this.waitForAll(); // 确保所有统计已完成

        return await this.executeWithLock(() => {
            if (Object.keys(this.action).length === 0) {
                console.log(`⚠️ 没有任何函数使用综合统计`)
                return false;
            }

            let result = `====== 任务统计汇总 ======\n`;

            Object.keys(this.action).forEach(key => {
                if (key === 'extra') return;
                const actionData = this.action[key];
                result += `📊 [${key}] 总执次数：${actionData['total']}次\n`;
                result += `✅ [${key}] 成功个数：${actionData['success']}个\n`;
                result += `❌ [${key}] 失败个数：${actionData['failure']}个\n`;

                result += `---------------------\n`;
            });
            // 如果有收益统计（按单位分别显示）
            if (this.action['extra'] && Object.keys(this.action['extra']).length > 0) {
                const extraList = [];
                Object.keys(this.action['extra']).forEach(unit => {
                    const value = this.action['extra'][unit];
                    if (typeof value === 'number' && value !== 0) {
                        extraList.push(`${value.toFixed(2)}${unit}`);
                    }
                });
                if (extraList.length > 0) {
                    result += `💰 总计收益：${extraList.join('、')}\n`;
                }
            }

            result += `====== 详细结果 ======`;
            return result;
        });
    }

    // 获取进行中的统计数量
    getPendingCount() {
        return this.pendingPromises.size;
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
⚠️⚠️⚠️使用代理时，必须安装依赖：https-proxy-agent、http-proxy-agent
⚠️⚠️⚠️使用代理时，必须安装依赖：https-proxy-agent、http-proxy-agent
⚠️⚠️⚠️使用代理时，必须安装依赖：https-proxy-agent、http-proxy-agent
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
    WQWLBaseTask: WQWLBaseTask, //基础任务类
    randomUAAlipay: randomUAAlipay //随机支付宝ua
};