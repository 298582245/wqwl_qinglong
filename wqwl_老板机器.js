/**
 * 脚本：wqwl_老板机器.js
 * 作者：wqwlkj 裙：960690899
 * 描述：微信小程序老板机器
 * 环境变量：wqwl_lbjq，多个换行或新建多个变量
 * 环境变量描述：抓包Headers下的authorization，格式例如：authorization#备注1（authorization去掉Bearer ）
 * 代理变量：wqwl_daili（获取代理链接，需要返回txt格式的http/https）
 * cron: 0 3 * * * 一天一次
 */


/*
* 单纯签到领积分
* 写本不易，走个人头谢谢：https://gitee.com/cobbWmy/img/blob/master/laobanjiqi.jpg
* 
*/

const axios = require('axios');
const fs = require('fs');

//代理链接
let proxy = process.env["wqwl_daili"] || '';

//是否用代理，默认使用（填了代理链接）
let isProxy = process.env["wqwl_useProxy"] || true;

//并发数，默认4
let bfs = process.env["wqwl_bfs"] || 4;

// 是否通知
let isNotify = true;

//账号索引
let index = 0;

//ck环境变量名
const ckName = 'wqwl_lbjq';

//脚本名称
const name = '微信小程序老板机器'


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

        let fileData = wqwlkj.readFile('lbjq')
        class Task {
            constructor(ck) {
                this.index = index++;
                this.ck = ck
                this.baseUrl = 'https://aio.myroki.com/api/v1'
                this.maxRetries = 3; // 最大重试次数
                this.retryDelay = 3; // 重试延迟(秒)
            }
            async init() {
                const ckData = this.ck.split('#')
                if (ckData.length < 1) {
                    return this.sendMessage(`${index + 1} 环境变量有误，请检查环境变量是否正确`, true);
                }
                else if (ckData.length === 1) {
                    this.remark = `${ckData[0].slice(0, 8)}-${index}`;
                }
                else {
                    this.remark = ckData[1];
                }
                this.token = ckData[0];
                let ua
                if (!fileData[this.remark])
                    fileData[this.remark] = {}
                if (!fileData[this.remark]['ua']) {
                    ua = wqwlkj.generateRandomUA();
                    fileData[this.remark]['ua'] = ua
                }
                else
                    ua = fileData[this.remark]['ua'];
                this.sendMessage(`🎲使用ua：${ua}`);
                this.headers = {
                    'app-version': 5000,
                    'app-id': 'roki_app',
                    Connection: 'keep-alive',
                    'xweb_xhr': 1,
                    'User-Agent': ua,
                    'X-App-Env': 'release',
                    'X-USER-TOKEN': this.token,
                    'Content-Type': 'application/json',
                    Accept: '*/*',
                    Referer: 'https://servicewechat.com/wxba70fb8e3eb3aab9/350/page-frame.html',
                    'Accept-Language': 'zh-CN,zh;q=0.9',
                    'Accept-Encoding': 'gzip, deflate',
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

            async checkIn() {
                const encryptData = this.getHeaders('POST', {})
                //console.log(encryptData)
                const headers = {
                    ...this.headers,
                    ...encryptData.headers
                }
                try {
                    const options = {
                        url: `${this.baseUrl}/mini-app/user/check-in-record/check-in`,
                        headers: headers,
                        method: 'POST',
                        data: JSON.stringify({})
                    }
                    // console.log(options)
                    const res = await this.request(options)
                    if (res?.success) {
                        return this.sendMessage(`✅签到成功`, true)
                    } else {
                        return this.sendMessage(`❌签到失败，${res?.message || 'ck可能不对或者过期了'}`, true)
                    }
                }
                catch (e) {
                    return this.sendMessage(`❌签到请求失败，${e.message}`)
                }
            }
            //https://aio.myroki.com/api/v1/mini-app/user/profile

            async profile() {
                const encryptData = this.getHeaders('GET', {})
                //console.log(encryptData)
                const headers = {
                    ...this.headers,
                    ...encryptData.headers
                }
                try {
                    const options = {
                        url: `${this.baseUrl}/mini-app/user/profile`,
                        headers: headers,
                        method: 'GET',
                    }
                    //console.log(options)
                    const res = await this.request(options)
                    if (res?.success) {
                        return this.sendMessage(`✅【${res?.data?.nickName || '默认昵称'}】积分：${res?.data?.points}`, true)
                    } else {
                        return this.sendMessage(`❌个人信息获取失败，${res?.message || 'ck可能不对或者过期了'}`, true)
                    }
                }
                catch (e) {
                    return this.sendMessage(`❌个人请求失败，${e.message}`, true)
                }
            }

            async main() {
                await this.init()
                const b1 = await this.checkIn()
                if (b1.includes('过期'))
                    return
                await wqwlkj.sleep(wqwlkj.getRandom(3, 5));
                await this.profile()
            }

            // 带重试机制的请求方法
            async request(options, retryCount = 0) {
                try {
                    const data = await wqwlkj.request(options, this.proxy);
                    return data;

                } catch (error) {
                    console.log(error)
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


            jiami(data = '1234567890123456', publicKey = 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCQwjPnvbv5nPPUrCdo167kcYd+7UqWYuedCNhLQradkfVJ0Ce8qkqTEmD9aWH1+t6gYQVmaPWIjZCW0U1DqacYKJ6JZzUsFWzYaSIr+OXoJ5OvNNxWqAGMz/GkJkeXWcQ+dLLnMmLzNIhbakdXoZzzvdde5IOj5YWk2/nK97pHGwIDAQAB') {
                let cleanedPublicKey = publicKey.trim();
                if (!cleanedPublicKey.includes('-----BEGIN')) {
                    cleanedPublicKey = `-----BEGIN PUBLIC KEY-----\n${cleanedPublicKey}\n-----END PUBLIC KEY-----`;
                }
                return wqwlkj.rsaEncrypt(data, cleanedPublicKey, 'hex');
            }

            jiemi(encryptedData, privateKey) {
                return wqwlkj.rsaDecrypt(encryptedData, privateKey, 'hex');
            }

            hmacSHAsign(e = 'ee8694419924a22f04ac0e01368683521daa659f', r) {
                return wqwlkj.hmacSHA256(r, e)
            }

            getStrFun(e) {
                return Object.keys(e).sort()
                    .map(key => `${key}=${e[key]}`)
                    .join('&');
            }

            getHeaders(method = 'GET', requestData = {}) {
                const p = '1234567890123456';
                const publicKey = 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCQwjPnvbv5nPPUrCdo167kcYd+7UqWYuedCNhLQradkfVJ0Ce8qkqTEmD9aWH1+t6gYQVmaPWIjZCW0U1DqacYKJ6JZzUsFWzYaSIr+OXoJ5OvNNxWqAGMz/GkJkeXWcQ+dLLnMmLzNIhbakdXoZzzvdde5IOj5YWk2/nK97pHGwIDAQAB';

                // 第一层加密（基础header）
                const a1 = this.jiami(p, publicKey);
                const n1 = Date.now();
                const c1 = {
                    aesEncryptSecret: a1,
                    appId: "roki_app",
                    nonce: p,
                    secret: "ee8694419924a22f04ac0e01368683521daa659f",
                    timestamp: n1
                };
                const d1 = this.getStrFun(c1);
                const f1 = this.hmacSHAsign("ee8694419924a22f04ac0e01368683521daa659f", d1);

                const baseHeaders = {
                    timestamp: n1,
                    nonce: p,
                    secret: a1,
                    signature: encodeURIComponent(f1),
                    "app-version": 5000
                };

                // 第二层加密（数据加密部分）
                const a2 = this.jiami(p, publicKey);
                const n2 = Date.now();
                const c2 = {
                    aesEncryptSecret: a2,
                    appId: "roki_app",
                    nonce: p,
                    secret: "ee8694419924a22f04ac0e01368683521daa659f",
                    timestamp: n2.toString()
                };
                const d2 = this.getStrFun(c2);
                //  console.log(d2)
                const f2 = this.hmacSHAsign("ee8694419924a22f04ac0e01368683521daa659f", d2);

                const encryptHeaders = {
                    "app-id": "roki_app",
                    timestamp: n2.toString(),
                    nonce: p,
                    secret: a2,
                    signature: encodeURIComponent(f2),
                    "app-version": 5000
                };

                // 合并headers
                const finalHeaders = { ...baseHeaders, ...encryptHeaders };

                let encryptedData = null;

                // 处理数据加密
                if (method.toLowerCase() === 'post' || method.toLowerCase() === 'put') {
                    if (Object.keys(requestData).length > 0) {
                        encryptedData = this.jiami(JSON.stringify(requestData), p);
                    }
                } else if (Object.keys(requestData).length > 0) {
                    // GET请求的参数加密
                    encryptedData = this.jiami(JSON.stringify(requestData), p);
                }

                return {
                    headers: finalHeaders,
                    encryptedData: encryptedData
                };
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
        wqwlkj.saveFile(fileData, 'lbjq')
        console.log(`${name}全部任务已完成！`);

        const message = wqwlkj.getMessage()
        if (message !== '' && isNotify === true) {
            await notify.sendNotify(`${name} `, `${message} `);
        }

    } catch (e) {
        console.error('❌ 执行过程中发生异常:', e.message);
    }

})();