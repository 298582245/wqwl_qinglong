


/**
 * 脚本：wqwl_聚友赚.js
 * 作者：wqwlkj 裙：960690899
 * 描述：app聚友赚
 * 环境变量：wqwl_juyouzhuan，多个换行或新建多个变量
 * 环境变量描述：ID#Authorization ，例如ID1#Authorization1
 * 代理变量：wqwl_daili（获取代理链接，需要返回txt格式的http/https）
 */

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');

//代理链接
let proxy = process.env["wqwl_daili"] || '';

//是否用代理，默认使用（填了代理链接）
let isProxy = process.env["wqwl_useProxy"] || false;

//并发数，默认4
let bfs = process.env["wqwl_bfs"] || 4;

// 是否通知
let isNotify = true;

//账号索引
let index = 0;

//开启则打印每一次请求的返回结果
let isDebug = 2;

//ck环境变量名
const ckName = 'wqwl_juyouzhuan';

//脚本名称
const name = 'app聚友赚'


!(async function () {
    let wqwlkj;

    const filePath = 'wqwl_require.js';
    const url = 'https://raw.githubusercontent.com/298582245/wqwl_qinglong/refs/heads/main/wqwl_require.js';

    if (fs.existsSync(filePath)) {
        console.log('✅wqwl_require.js已存在，无需重新下载，如有报错请重新下载覆盖\n');
        wqwlkj = require('./wqwl_require');
    } else {
        console.log('正在下载wqwl_require.js，请稍等...\n');
        console.log(`如果下载过慢，可以手动下载wqwl_require.js，并保存为wqwl_require.js，并重新运行脚本`)
        console.log('地址：' + url);
        try {
            const res = await axios.get(url);
            fs.writeFileSync(filePath, res.data);
            console.log('✅下载完成，准备开始运行脚本\n');
            wqwlkj = require('./wqwl_require');
        } catch (e) {
            console.log('❌下载失败，请手动下载wqwl_require.js，并保存为wqwl_require.js，并重新运行脚本\n');
            console.log('地址：' + url);
            return; // 下载失败，不再继续执行
        }
    }

    // 确保 require 成功后才继续执行
    try {
        wqwlkj.disclaimer();
        if (typeof wqwlkj.findTypes == "function") {
            let type = await wqwlkj.findTypes(name);
            console.log(`============================
🚀 当前脚本：${name} 🚀
📂 所属分类：${type} 📂
============================\n`)
        }
        let notify;
        if (isNotify) {
            try {
                notify = require('./sendNotify');
                console.log('✅加载发送通知模块成功');
            } catch (e) {
                console.log('❌加载发送通知模块失败');
                notify = null
            }
        }

        let fileData = wqwlkj.readFile('juyouzhuan')
        class Task {
            constructor(ck) {
                this.index = index++;
                this.ck = ck
                this.baseUrl = 'https://pool.ylwlyx.com/app-api'
                this.maxRetries = 3; // 最大重试次数
                this.retryDelay = 3; // 重试延迟(秒)
                this.adIndex = 0;
                this.adIndex2 = 0;
                this.adNums = 6;//广告总数

            }
            async init() {
                const ckData = this.ck.split('#')
                if (ckData.length < 2) {
                    this.sendMessage(`${index + 1} 环境变量有误，请检查环境变量是否正确`, true);
                    return false;
                }
                else if (ckData.length === 2) {
                    this.remark = `${ckData[0].slice(0, 8)}-${this.index}`;
                }
                else {
                    this.remark = ckData[2];
                }
                this.id = ckData[0]
                this.auth = ckData[1]
                let ua
                if (!fileData[this.remark])
                    fileData[this.remark] = {}
                if (!fileData[this.remark]['ua']) {
                    ua = this.getRandomUa()
                    fileData[this.remark]['ua'] = ua
                }
                else
                    ua = fileData[this.remark]['ua'];
                if (!fileData[this.remark]['params']) {
                    this.dailyParams = this.getDailyParams(ua)
                    fileData[this.remark]['params'] = this.dailyParams
                } else {
                    this.dailyParams = fileData[this.remark]['params']
                }

                this.sendMessage(`🎲使用ua：${ua}`);
                this.headers = {
                    'User-Agent': ua,
                    'Connection': 'Keep-Alive',
                    'Accept-Encoding': 'gzip',
                    'Authorization': this.auth,
                    'Content-Type': 'application/json; charset=UTF-8'
                }
                if (proxy && isProxy) {
                    this.proxy = await wqwlkj.getProxy(this.index, proxy)
                    //console.log(`使用代理：${this.proxy}`)
                    this.sendMessage(`✅使用代理：${this.proxy}`)
                }
                else {
                    this.proxy = ''
                    this.sendMessage(`⚠️不使用代理`)
                }
                return true
            }



            async getAdNums(isReturn = false) {
                try {
                    const headers = JSON.parse(JSON.stringify(this.headers))
                    headers['X-Encrypted-Timestamp'] = this.getEncryptedTimestamp()
                    const options = {
                        url: `${this.baseUrl}/pool/ad/record/trans_id`,
                        headers: headers,
                        method: "POST",
                        data: JSON.stringify({})
                    }
                    const res = await this.request(options)
                    if (Array.isArray(res?.data)) {
                        const findNotWatchId = this.findNotWatchId(res?.data)
                        this.adIndex = findNotWatchId.count
                        const missing = findNotWatchId.missing
                        this.adIndex2 = missing[wqwlkj.getRandom(0, missing.length - 1)]
                        this.sendMessage(`🔁今日广告进度：${this.adIndex}/${this.adNums}`, isReturn)
                        return true
                    }
                    else {
                        this.sendMessage(`❌返回结果不是数组格式，返回内容:${JSON.stringify(res)}`, true)
                        return false
                    }
                }
                catch (e) {
                    this.sendMessage(`❌获取今日次数失败，${e.message}`, true)
                    return false
                }
            }

            async createAd(channel, originMoney, transId) {
                try {
                    const headers = JSON.parse(JSON.stringify(this.headers))
                    headers['X-Encrypted-Timestamp'] = this.getEncryptedTimestamp()
                    const options = {
                        url: `${this.baseUrl}/pool/ad/record-sec/create`,
                        headers: headers,
                        method: "POST",
                        data: JSON.stringify({
                            "channel": channel,
                            "id": 0,
                            "originMoney": originMoney,
                            "transId": transId,
                            "userId": this.id,
                            "uvChannel": "26000"
                        })
                    }
                    const res = await this.request(options)
                    if ((res?.data > 0)) {
                        this.sendMessage(`✅创建广告成功`)
                        return true
                    }
                    else {
                        this.sendMessage(`❌创建广告失败，返回内容:${JSON.stringify(res)}`, true)
                        return false
                    }
                }
                catch (e) {
                    this.sendMessage(`❌创建广告失败，${e.message}`, true)
                    return false
                }
            }
            async finishAd(channel, originMoney, transId) {
                try {
                    const headers = JSON.parse(JSON.stringify(this.headers))
                    headers['X-Encrypted-Timestamp'] = this.getEncryptedTimestamp()
                    const options = {
                        url: `${this.baseUrl}/pool/ad/callback/chaping`,
                        headers: headers,
                        method: "POST",
                        data: JSON.stringify({
                            "channel": channel,
                            "id": 0,
                            "originMoney": originMoney,
                            "transId": transId,
                            "userId": this.id,
                            "uvChannel": "26000"
                        })
                    }
                    const res = await this.request(options)
                    this.sendMessage(`✅回调观看广告成功`)
                    return true

                }
                catch (e) {
                    this.sendMessage(`❌观看广告失败，${e.message}`, true)
                    return false
                }
            }

            async dailyActivity() {
                try {
                    const headers = JSON.parse(JSON.stringify(this.headers))
                    headers['X-Encrypted-Timestamp'] = this.getEncryptedTimestamp()
                    const options = {
                        url: `${this.baseUrl}/pool/user/daily-activity/create`,
                        headers: headers,
                        method: "POST",
                        data: JSON.stringify({
                            "openBlueTooth": 2,
                            "systemAlertWindow": 2,
                            "udaAccessibility": 1,
                            "udaAllApp": 1,
                            "udaAllAppDetail": [],
                            "udaDebugMode": 2,
                            "udaMac": "",
                            "udaPackage": "com.xlxxkj.wjhqs",
                            "udaRoot": 2,
                            "udaSeparation": 2,
                            "udaSimStatus": 2,
                            "udaSimulator": 2,
                            "udaSystemAllApp": 0,
                            "udaUsbMode": 2,
                            "udaVpnProxy": 2,
                            ...this.dailyParams
                        })
                    }
                    const res = await this.request(options)
                    this.sendMessage(`✅模拟访问`)
                    return true

                }
                catch (e) {
                    this.sendMessage(`❌模拟访问失败，${e.message}`, true)
                    return false
                }
            }

            //https://pool.ylwlyx.com/app-api/pool/user/daily-activity/create

            rangeMoney() {
                // 生成30-50之间的整数部分
                const integerPart = (Math.random() * 20 + 30).toFixed(0); // 30-49的整数

                // 生成10位小数部分
                let decimalPart = '';
                for (let i = 0; i < 10; i++) {
                    decimalPart += Math.floor(Math.random() * 10);
                }

                return `${integerPart}.${decimalPart}`;
            }

            getTransId() {
                const res = `${wqwlkj.formatDate(new Date())}-${this.id}-${this.adIndex2}`
                return res
            }

            randomId() {
                const ids = ['ad_ylh', 'ad_csj', 'ad_ks']
                return ids[wqwlkj.getRandom(0, ids.length - 1)]
            }
            generateUUID() {
                return crypto.randomUUID();
            }

            getRandomUa() {
                // 设备品牌和型号配置
                const deviceConfigs = {
                    brands: ['Xiaomi', 'Huawei', 'OPPO', 'vivo', 'Samsung', 'OnePlus', 'Realme', 'Meizu'],

                    xiaomiModels: [
                        '2201123C', '2112123AC', '2109119BC', '2107119DC', '21061119AG',
                        'M2007J3SC', 'M2102K1AC', 'M2012K11AC', 'M2101K9C', 'M2006C3LC'
                    ],
                    huaweiModels: [
                        'NOH-AN00', 'TET-AN00', 'LIO-AN00', 'EBG-AN00', 'OCE-AN10',
                        'JEF-AN00', 'ANA-AN00', 'VOG-AL00', 'EVR-AL00', 'MAR-AL00'
                    ],
                    oppoModels: [
                        'PEXM00', 'PEUM00', 'PGFM10', 'PHJ110', 'PJT110',
                        'PCLM10', 'PDEM10', 'PDSM00', 'PFTM20', 'PGJM10'
                    ],
                    vivoModels: [
                        'V2185A', 'V2183A', 'V2157A', 'V2148A', 'V2136A',
                        'V2115A', 'V2102A', 'V2056A', 'V2048A', 'V2036A'
                    ],
                    samsungModels: [
                        'SM-G9980', 'SM-G9960', 'SM-G9910', 'SM-N9860', 'SM-N9760',
                        'SM-F9260', 'SM-F7110', 'SM-A5260', 'SM-A7160', 'SM-M225FV'
                    ],

                    androidVersions: [
                        'android-13', 'android-14', 'android-15'
                    ],
                    apiLevels: [
                        'api-33', 'api-34', 'api-35'
                    ]
                };


                const brand = deviceConfigs.brands[Math.floor(Math.random() * deviceConfigs.brands.length)];
                let model = '';

                // 根据品牌选择对应的型号
                switch (brand) {
                    case 'Xiaomi':
                        model = deviceConfigs.xiaomiModels[Math.floor(Math.random() * deviceConfigs.xiaomiModels.length)];
                        break;
                    case 'Huawei':
                        model = deviceConfigs.huaweiModels[Math.floor(Math.random() * deviceConfigs.huaweiModels.length)];
                        break;
                    case 'OPPO':
                        model = deviceConfigs.oppoModels[Math.floor(Math.random() * deviceConfigs.oppoModels.length)];
                        break;
                    case 'vivo':
                        model = deviceConfigs.vivoModels[Math.floor(Math.random() * deviceConfigs.vivoModels.length)];
                        break;
                    case 'Samsung':
                        model = deviceConfigs.samsungModels[Math.floor(Math.random() * deviceConfigs.samsungModels.length)];
                        break;
                    default:
                        model = deviceConfigs.xiaomiModels[Math.floor(Math.random() * deviceConfigs.xiaomiModels.length)];
                }

                const androidVersion = deviceConfigs.androidVersions[Math.floor(Math.random() * deviceConfigs.androidVersions.length)];
                const apiLevel = deviceConfigs.apiLevels[Math.floor(Math.random() * deviceConfigs.apiLevels.length)];
                return `litehttp-v3 (${androidVersion}; ${apiLevel}; ${brand}; ${model})`;
            }
            getDailyParams(ua) {
                // 从UA字符串中解析出品牌和型号
                const uaMatch = ua.match(/\(([^)]+)\)/);
                if (!uaMatch) {
                    throw new Error('Invalid UA format');
                }

                const parts = uaMatch[1].split(';').map(part => part.trim());
                if (parts.length < 4) {
                    throw new Error('UA format error');
                }

                const androidVersion = parts[0]; // android-13
                const brand = parts[2]; // Xiaomi
                const model = parts[3]; // 2201123C

                // 运营商列表
                const operators = ['中国移动', '中国电信', '中国联通'];
                const networkTypes = ['WIFI', 'MOBILE'];

                // 生成Android版本号（从android-13转换为OS13.0.210.0.VLCCNXM格式）
                const androidVersionNum = androidVersion.replace('android-', '');
                const udaAndroid = `OS${androidVersionNum}.0.210.0.VLCCNXM`;

                // 只返回需要随机生成的值
                return {
                    "udaAndroid": udaAndroid,
                    "udaBrand": brand,
                    "udaNetWork": networkTypes[Math.floor(Math.random() * networkTypes.length)],
                    "udaSimOperator": operators[Math.floor(Math.random() * operators.length)],
                    "udaSystemVersionCode": model
                };
            }
            getEncryptedTimestamp() {
                const str = Date.now();
                const publicKeyBase64 = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1d/P/f3uaTk2H+mPAMB/lIKaOYsPLpTVZpUzfxM37Gl9O4qbnr8zvlcnaAXP8+deVxkEPk3iGcZPjEDJRhjzW0sjke2ir+sAsSrmeERqOsMXOTVJ0ynDKLswTuknjTp4njgu0/1RnkFzEsxeRuTIQ7xOu4e3jT98BfO4mVwn9yEsJfi10uCK/Cv5QNq6xBbwhoJH+M3bx0ercEmH2P1eSAd/ipy3JofkZd8TI35KgYUztAHXby68dEdAz+CWQmuHqkqiDDWsoISS9Y6t3V8DdTtBkBazUsCX+8BtN34pacfY49r1JVkrUqmVjBxhJgjlxc0uTg2kNx4PwwiEsdnriwIDAQAB";
                const publicKeyPEM = `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64}\n-----END PUBLIC KEY-----`;
                return wqwlkj.rsaEncrypt(str, publicKeyPEM, 'base64', 'utf8');
            }

            findNotWatchId(data) {
                // 提取所有符合条件的索引
                const existingIndexes = data
                    .map(item => {
                        const match = item.match(new RegExp(`\\d{4}-\\d{2}-\\d{2}-${this.id}-(\\d+)`));
                        return match ? parseInt(match[1]) : null;
                    })
                    .filter(index => index !== null && index >= 1 && index <= this.adNums);

                const generateArray = function (n) {
                    return Array.from({ length: n }, (_, i) => i + 1);
                }

                // 找出缺失的索引
                const allIndexes = generateArray(this.adNums);
                const missingIndexes = allIndexes.filter(index => !existingIndexes.includes(index));

                return {
                    existing: [...new Set(existingIndexes)].sort((a, b) => a - b), // 去重并排序
                    missing: missingIndexes,
                    count: existingIndexes.length
                };
            }


            async main() {
                const init = await this.init()
                if (!init) return;
                const daily = await this.dailyActivity()
                if (!daily) return;
                let failTimes = 0
                await this.getAdNums()
                while (this.adIndex < 6) {

                    const bool1 = await this.getAdNums()
                    if (this.adIndex >= 6) break;
                    if (!bool1) return;
                    this.sendMessage(`🔁开始执行第${this.adIndex + 1}个看广告`)
                    const channel = this.randomId()
                    const originMoney = this.rangeMoney()
                    const transId = this.generateUUID()

                    const bool2 = await this.createAd(channel, originMoney, transId)
                    if (!bool2) return;
                    const sleep = wqwlkj.getRandom(40, 80);
                    this.sendMessage(`⏳等待${sleep}s`)
                    await wqwlkj.sleep(sleep);
                    const transId2 = this.getTransId();
                    const bool3 = await this.finishAd(channel, originMoney, transId2)
                    if (!bool3)
                        failTimes++
                    if (failTimes > 3) return
                    await wqwlkj.sleep(wqwlkj.getRandom(3, 5));
                }
                await this.getAdNums(true)

            }

            // 带重试机制的请求方法
            async request(options, retryCount = 0) {
                try {
                    const data = await wqwlkj.request(options, this.proxy);
                    if (isDebug) {
                        if (isDebug === 2)
                            console.log(`[调试输出] 请求配置：${JSON.stringify(options)}`)
                        const formatData = (data) => {
                            if (data === null) return 'null';
                            if (data === undefined) return 'undefined';

                            if (typeof data === 'string') return data;
                            if (typeof data === 'object') {
                                try {
                                    return JSON.stringify(data, null, 2); // 美化输出
                                } catch (error) {
                                    return `[对象序列化失败: ${error.message}]`;
                                }
                            }

                            return String(data);
                        };

                        this.sendMessage(`[调试输出] 请求${options?.url}返回：${formatData(data)}`);
                    }
                    return data;

                } catch (error) {
                    this.sendMessage(`🔐检测到请求发生错误，正在重试...`)
                    let newProxy;
                    if (isProxy) {
                        newProxy = await wqwlkj.getProxy(this.index, proxy);
                        this.proxy = newProxy
                        this.sendMessage(`✅代理更新成功:${this.proxy}`);
                    } else {
                        this.sendMessage(`⚠️未使用代理`);
                        newProxy = true
                    }

                    if (retryCount < this.maxRetries && newProxy) {
                        this.sendMessage(`🕒${this.retryDelay * (retryCount + 1)}s秒后重试...`);
                        await wqwlkj.sleep(this.retryDelay * (retryCount + 1));
                        return await this.request(options, retryCount + 1);
                    }

                    throw new Error(`❌请求最终失败: ${error.message}`);
                }
            }

            sendMessage(message, isPush = false) {
                message = `账号[${this.index + 1}](${this.remark}): ${message}`
                if (isNotify && isPush) {
                    return wqwlkj.sendMessage(message + "\n")
                }
                console.log(message)
                return message
            }

        }

        console.log(`${name}开始执行...`);
        const tokens = wqwlkj.checkEnv(process.env[ckName]);
        //console.log(`共${tokens.length}个账号`);
        const totalBatches = Math.ceil(tokens.length / bfs);

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const start = batchIndex * bfs;
            const end = start + bfs;
            const batch = tokens.slice(start, end);

            console.log(`开始执行第 ${batchIndex + 1} 批任务 (${start + 1}-${Math.min(end, tokens.length)})`);

            const taskInstances = batch.map(token => new Task(token));
            const tasks = taskInstances.map(instance => instance.main());
            const results = await Promise.allSettled(tasks);

            results.forEach((result, index) => {
                const task = taskInstances[index];

                if (result.status === 'rejected') {
                    task.sendMessage(result.reason);
                }
            });

            await wqwlkj.sleep(wqwlkj.getRandom(3, 5));
        }
        wqwlkj.saveFile(fileData, 'juyouzhuan')
        console.log(`${name}全部任务已完成！`);

        const message = wqwlkj.getMessage()
        if (message !== '' && isNotify === true) {
            await notify.sendNotify(`${name} `, `${message} `);
        }

    } catch (e) {
        console.error('❌ 执行过程中发生异常:', e.message);
    }

})();