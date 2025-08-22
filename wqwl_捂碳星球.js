/**
 * 脚本：wqwl_捂碳星球.js
 * 作者：wqwlkj 裙：960690899
 * 描述：微信小程序捂碳星球旧衣服回收,
 * 环境变量：wqwl_wtxq，多个换行或新建多个变量
 * 环境变量描述：抓包Headers下的authorization，格式例如：authorization#备注1（authorization去掉Bearer ）
 * 代理变量：wqwl_daili（获取代理链接，需要返回txt格式的http/https）
 * cron: 0 0 * * * 一天一次即可
 */
/**
 * 没必要玩，签到第3天开始要每天邀请一个人才能签到，而且才0.1，为什么要玩呢？
 * 我发出来是因为我写了
 */

const axios = require('axios');
const fs = require('fs');

//代理链接
let proxy = process.env["wqwl_daili"] || '';

//是否用代理，默认使用（填了代理链接）
let isProxy = process.env["wqwl_useProxy"] || true;

//并发数，默认3
let bfs = process.env["wqwl_bfs"] || 3;

// 是否通知
let isNotify = true;

//账号索引
let index = 0;

//ck环境变量名
const ckName = 'wqwl_wtxq';

//脚本名称
const name = '微信小程序捂碳星球旧衣服回收'

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


        class Task {
            constructor(ck) {
                this.index = index++;
                this.baseURL = 'https://wt.api.5tan.com/api'
                this.ck = ck
            }

            async init(ck) {
                const ckData = ck.split('#')
                if (ckData.length < 1) {
                    return this.sendMessage(`${index + 1} 环境变量有误，请检查环境变量是否正确`, true);
                }
                else if (ckData.length === 1) {
                    this.remark = ckData[0].slice(0, 8);
                }
                else {
                    this.remark = ckData[1];
                }
                this.auth = ckData[0];
                this.headers = {
                    "accept": "*/*",
                    "accept-language": "zh-CN,zh;q=0.9",
                    "authorization": `Bearer ${this.auth}`,
                    "content-type": "application/json",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "cross-site",
                    "xweb_xhr": "1",
                    "Referer": "https://servicewechat.com/wx54c4768a6050a90e/218/page-frame.html",
                    "Referrer-Policy": "unsafe-url"
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
            }

            // 签到
            async sign() {
                try {
                    if (!(this.auth))
                        return
                    const options = {
                        url: `${this.baseURL}/signin/addSignIn`,
                        headers: this.headers,
                        method: 'POST',
                        data: JSON.stringify({
                            platform: 1
                        })
                    }
                    const result = await wqwlkj.request(options, this.proxy)
                    //console.log(JSON.stringify(result))
                    if (result.code === 200) {
                        if (result?.data?.title == '签到成功~')
                            this.sendMessage(`✅签到成功`, true)
                        else
                            this.sendMessage(`❌签到失败，${result?.data?.content}`, true)
                    } else {
                        this.sendMessage(`❌签到失败，${result.msg}`, true)
                    }
                } catch (e) {
                    throw new Error(`❌请求签到接口失败，${e.message}`)
                }
            }

            // 获取用户信息
            async getUserInfo() {
                try {
                    if (!(this.auth))
                        return
                    const options = {
                        url: `${this.baseURL}/user/index?platform=1`,
                        headers: this.headers,
                        method: 'GET',
                    }
                    const result = await wqwlkj.request(options, this.proxy)
                    if (result.code === 200) {
                        this.sendMessage(`🙍用户【${result.data.nick_name}】余额：${result.data.money}元`, true)
                    } else {
                        this.sendMessage(`❌获取用户信息失败，${result.msg}`, true)
                    }
                } catch (e) {
                    throw new Error(`❌请求用户信息接口失败，${e.message}`)
                }

            }

            async main() {
                await this.init(this.ck)
                await wqwlkj.sleep(wqwlkj.getRandom(1, 3))
                await this.sign()
                await wqwlkj.sleep(wqwlkj.getRandom(1, 3))
                await this.getUserInfo()
                await wqwlkj.sleep(wqwlkj.getRandom(1, 3))
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
        console.log(`共${tokens.length}个账号`);
        const totalBatches = Math.ceil(tokens.length / bfs);
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const start = batchIndex * bfs;
            const end = start + bfs;
            const batch = tokens.slice(start, end);

            console.log(`开始执行第 ${batchIndex + 1} 批任务 (${start + 1}-${Math.min(end, tokens.length)})`);

            const tasks = batch.map(token => new Task(token).main());
            await Promise.all(tasks);
            await wqwlkj.sleep(wqwlkj.getRandom(1, 3))
        }
        console.log(`${name}全部任务已完成！`);

        const message = wqwlkj.getMessage()
        if (message !== '' && isNotify === true) {
            await notify.sendNotify(`${name} `, `${message} `);
        }

    } catch (e) {
        console.error('❌ 执行过程中发生异常:', e.message);
    }

})();