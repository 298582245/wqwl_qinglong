/**
 * 脚本：wqwl_旧衣小二.js
 * 作者：wqwlkj 裙：960690899
 * 描述：微信小程序旧衣小二
 * 环境变量：wqwl_jyxe，多个换行或新建多个变量
 * 环境变量描述：抓包https://jiuyixiaoer.fzjingzhou.com/api/请求体token=xxx，格式：xxx#备注
 * 代理变量：wqwl_daili（获取代理链接，需要返回txt格式的http/https）
 * cron: 0 3 * * * 一天一次
 */


const axios = require('axios');
const fs = require('fs');
const qs = require('qs');


//代理链接
let proxy = process.env["wqwl_daili"] || '';

//是否用代理，默认使用（填了代理链接）
let isProxy = process.env["wqwl_useProxy"] || false;

//并发数，默认4
let bfs = process.env["wqwl_bfs"] || 4;

// 是否通知
let isNotify = true;

//开启则打印每一次请求的返回结果
let isDebug = false;

//账号索引
let index = 0;

//ck环境变量名
const ckName = 'wqwl_jyxe';

//脚本名称
const name = '微信小程序旧衣小二'


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

        let fileData = wqwlkj.readFile('jyxe') || {}
        class Task {
            constructor(ck) {
                this.index = index++;
                this.ck = ck
                this.baseUrl = 'https://jiuyixiaoer.fzjingzhou.com/api'
                this.maxRetries = 3; // 最大重试次数
                this.retryDelay = 3; // 重试延迟(秒)
            }

            async init() {
                const ckData = this.ck.split('#')
                if (ckData.length < 1) {
                    return this.sendMessage(`${this.index + 1} 环境变量有误，请检查环境变量是否正确`, true);
                }
                else if (ckData.length === 1) {
                    this.remark = `${ckData[0].slice(0, 8)}-${this.index}`;
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
                //  this.sendMessage(`🎲使用随机ua：${ua}`);
                this.headers = {
                    'Host': 'jiuyixiaoer.fzjingzhou.com',
                    'Connection': 'keep-alive',
                    'xweb_xhr': '1',
                    'platform': 'MP-WEIXIN',
                    'User-Agent': ua,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': '*/*',
                    'Sec-Fetch-Site': 'cross-site',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Dest': 'empty',
                    'Referer': 'https://servicewechat.com/wx426d52c8130b8559/5/page-frame.html',
                    'Accept-Language': 'zh-CN,zh;q=0.9',
                    'Accept-Encoding': 'gzip, deflate'
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

            async sign() {
                try {
                    const options = {
                        method: 'POST',
                        url: `${this.baseUrl}/Person/sign`,
                        headers: this.headers,
                        data: qs.stringify({
                            token: this.token
                        })
                    }
                    const res = await this.request(options)
                    // console.log(res)
                    if (res.code === 1000)
                        this.sendMessage(`✅签到成功,获得：${res.data}环保币`, true)
                    else
                        this.sendMessage(`❌签到失败，${res.msg}`, true)
                    return true
                }
                catch (e) {
                    this.sendMessage(`❌签到请求失败，${e.message}`, true)
                    return false
                }
            }

            async info() {
                try {
                    const options = {
                        method: 'POST',
                        url: `${this.baseUrl}/Person/index`,
                        headers: this.headers,
                        data: qs.stringify({
                            token: this.token
                        })
                    }
                    const res = await this.request(options)
                    // console.log(res)
                    if (res.code === 1000) {
                        if (res.data.score >= 20) {
                            await this.scoreWithdraw(res.data.score, res.data.exchange)
                        }
                        else {
                            this.sendMessage(`🪙【${res.data.nickname}】环保币：${res.data.score}≈${res.data.exchange}元`, true)
                            this.sendMessage(`⚠️不足以提现，跳过提现操作`)
                        }
                    }
                    else
                        this.sendMessage(`❌信息获取失败，${res.msg}`, true)
                    return true
                }
                catch (e) {
                    this.sendMessage(`❌信息获取请求失败，${e.message}`, true)
                    return false
                }
            }

            async scoreWithdraw(score, money) {
                try {
                    const options = {
                        method: 'POST',
                        url: `${this.baseUrl}/cash/scoreWithdraw`,
                        headers: this.headers,
                        data: qs.stringify({
                            type: 'wx_account',
                            score: score,
                            token: this.token
                        })
                    }
                    this.sendMessage(`尝试提现${score}环保币（≈${money}元）...`)
                    const res = await this.request(options)
                    // console.log(res)
                    if (res.code === 1000) {
                        this.sendMessage(`🎉提现成功！提现 ${score} 环保币(≈${money}元)`, true)
                        //重新获取环保币数量
                        await this.info()
                    }
                    else
                        this.sendMessage(`❌提现失败，${res.msg}`, true)
                    return true
                }
                catch (e) {
                    this.sendMessage(`❌提现请求失败，${e.message}`, true)
                    return false
                }
            }


            async main() {
                const isFinish = await this.init()
                if (!isFinish)
                    return
                await wqwlkj.sleep(wqwlkj.getRandom(3, 5))
                const bool = await this.sign()
                if (!bool)
                    return
                await wqwlkj.sleep(wqwlkj.getRandom(3, 5))
                await this.info()
            }

            // 带重试机制的请求方法
            async request(options, retryCount = 0) {
                try {
                    const data = await wqwlkj.request(options, this.proxy);
                    if (isDebug) {
                        if (isDebug === 2)
                            console.log(JSON.stringify(options))
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

                        this.sendMessage(`[调试输出] ${options?.method}请求${options?.url}返回：${formatData(data)}`);
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
        wqwlkj.saveFile(fileData, 'jyxe')
        console.log(`${name}全部任务已完成！`);

        const message = wqwlkj.getMessage()
        if (message !== '' && isNotify === true) {
            await notify.sendNotify(`${name} `, `${message} `);
        }

    } catch (e) {
        console.error('❌ 执行过程中发生异常:', e.message);
    }

})();