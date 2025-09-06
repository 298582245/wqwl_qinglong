/**
 * 脚本：wqwl_冲刺鸭云打印.js
 * 作者：wqwlkj 裙：960690899
 * 描述：微信小程序冲刺鸭云打印
 * 环境变量：wqwl_ccy，多个换行或新建多个变量
 * 环境变量描述：抓包https://cloudprint.chongci.shop参数的openid，格式：openid#备注
 * 代理变量：wqwl_daili（获取代理链接，需要返回txt格式的http/https）
 * cron: 0 3 * * * 一天一次
 */

/**
 * 写脚本不易走个头谢谢：https://gitee.com/cobbWmy/img/blob/master/chongciya.jpg
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


//账号索引
let index = 0;

//ck环境变量名
const ckName = 'wqwl_ccy';

//脚本名称
const name = '微信小程序冲刺鸭云打印'


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

        let fileData = wqwlkj.readFile('ccy') || {}
        class Task {
            constructor(ck) {
                this.index = index++;
                this.ck = ck
                this.baseUrl = 'https://cloudprint.chongci.shop'
                this.maxRetries = 3; // 最大重试次数
                this.retryDelay = 3; // 重试延迟(秒)
                this.pointsRules = {
                    pointToMoneyRatio: 0.1 // 1积分=0.1元
                };
            }

            async init() {
                const ckData = this.ck.split('#')
                if (ckData.length < 1) {
                    return this.sendMessage(`${index + 1} 环境变量有误，请检查环境变量是否正确`, true);
                }
                else if (ckData.length === 1) {
                    this.remark = ckData[0].slice(0, 8);
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
                    'Referer': 'https://servicewechat.com/wx7d1787ad17f2d932/19/page-frame.html',
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

            async getUserInfo() {
                try {
                    const url = `${this.baseUrl}/app/index.php?i=2&c=entry&m=ewei_shopv2&do=mobile&r=member&app=1&openid=${this.token}`;
                    const options = {
                        url: url,
                        headers: this.headers,
                        method: 'GET',
                        responseType: 'buffer'
                    };

                    let res = await this.request(options);
                    res = JSON.parse(res)
                    if (!res?.mobile) {
                        return this.sendMessage(`❌获取用户信息失败,原因：${res?.msg}`)
                    }
                    else {
                        let points = res?.credit1
                        if (points >= 1) {
                            this.sendMessage(`🎉积分可以提现了，准备提现`)
                            await this.withdrawPoints(points)
                            let tempRes = await this.request(options);
                            tempRes = JSON.parse(tempRes)
                            points = tempRes?.credit1
                        } else {
                            this.sendMessage(`⚠️积分不足以提现`)
                        }
                        this.sendMessage(`ℹ️用户积分：${points}≈${(parseFloat(points) * 0.1).toFixed(2)}元，累计收益：${res?.credit2}元`, true)
                    }
                } catch (e) {
                    this.sendMessage(`❌获取用户信请求失败,原因，${e.message}`)
                }
            }

            async withdrawPoints(points) {

                try {
                    const url = `${this.baseUrl}/app/index.php?i=2&c=entry&m=ewei_shopv2&do=mobile&r=api.index.jf_exchange&app=1&openid=${this.token}&points=${points}`;
                    const options = {
                        url: url,
                        headers: this.headers,
                        method: 'POST',
                        responseType: 'buffer'
                    };

                    const res = await this.request(options);
                    // 解析提现结果
                    let withdrawInfo = "提现结果解析失败";
                    try {
                        const jsonRes = JSON.parse(resStr);
                        if (jsonRes.status === 1 || jsonRes.success) {
                            withdrawInfo = `提现成功，到账金额: ${(points * this.pointsRules.pointToMoneyRatio).toFixed(2)}元`;
                            this.sendMessage(`✅${withdrawInfo}`, true);
                        } else {
                            withdrawInfo = `提现失败: ${jsonRes.message || '系统提示失败'}`;
                        }
                    } catch (e) {
                        if (resStr.includes('成功')) {
                            withdrawInfo = `提现成功，到账金额: ${(points * this.pointsRules.pointToMoneyRatio).toFixed(2)}元`;
                            this.sendMessage(`✅${withdrawInfo}`);

                        } else {
                            withdrawInfo = `提现失败: 系统返回非预期结果`;
                            this.sendMessage(`❌${withdrawInfo}，${e.message}`);
                        }
                    }
                } catch (e) {
                    const message = `提现过程异常: ${e.message}`;
                    this.sendMessage(`❌${message}`);
                }
            }

            async checkSignStatus() {
                try {
                    const url = `${this.baseUrl}/app/index.php?i=2&c=entry&m=ewei_shopv2&do=mobile&r=sign&app=1&openid=${this.token}`;
                    const options = {
                        url: url,
                        headers: this.headers,
                        method: 'GET',
                        responseType: 'buffer'
                    };

                    const res = await this.request(options);
                    //  console.log(options)
                    const resStr = typeof res === 'string' ? res : res.toString('utf8');

                    // 解析签到状态并输出清晰信息
                    let statusInfo = "未查询到签到状态";
                    try {
                        const jsonRes = JSON.parse(resStr);
                        if (jsonRes.sign_data && jsonRes.sign_data.length > 0) {
                            const signDates = jsonRes.sign_data.map(item => item.date).join(', ');
                            statusInfo = `已签到日期: ${signDates}`;
                            // 检查是否包含今天的日期
                            this.today = wqwlkj.formatDate(new Date());
                            const hasToday = jsonRes.sign_data.some(item => item.date === this.today);
                            return { hasSigned: hasToday, message: hasToday ? "今天已经签到过了" : "今日尚未签到" };
                        } else {
                            statusInfo = "暂无签到记录";
                        }
                    } catch (e) {
                        statusInfo = "签到状态解析失败";
                    }

                    this.sendMessage(`ℹ️签到状态: ${statusInfo}`);
                    return { hasSigned: false };
                } catch (e) {
                    this.sendMessage(`❌检查签到状态失败: ${e.message}`);
                    return { hasSigned: false };
                }
            }

            async signIn() {
                const signStatus = await this.checkSignStatus();
                if (signStatus.hasSigned) {
                    const message = `今日已完成签到`;
                    return this.sendMessage(`✅${message}`);
                }
                try {
                    const url = `${this.baseUrl}/app/index.php?i=2&c=entry&m=ewei_shopv2&do=mobile&r=sign.dosign&app=1&openid=${this.token}`;
                    const options = {
                        url: url,
                        headers: this.headers,
                        method: 'GET',
                        responseType: 'buffer'
                    };

                    // console.log(options)

                    let res = await this.request(options);
                    res = JSON.parse(res)
                    if (res?.status === 1) {
                        this.sendMessage(`✅签到成功`)
                    }
                    else if (res?.status === 2) {
                        this.sendMessage(`❌签到失败，今日已经签到过啦`)
                    }
                    else {
                        this.sendMessage(`❌签到失败，未知的错误`)
                    }
                } catch (e) {
                    this.sendMessage(`❌签到请求失败,原因，${e.message}`)
                }
            }

            async main() {
                const isFinish = await this.init()
                if (!isFinish)
                    return
                await wqwlkj.sleep(wqwlkj.getRandom(3, 5))
                const bool = await this.signIn()
                await wqwlkj.sleep(wqwlkj.getRandom(3, 5))
                await this.getUserInfo()
            }

            // 带重试机制的请求方法
            async request(options, retryCount = 0) {
                try {
                    const data = await wqwlkj.request(options, this.proxy);
                    return data;

                } catch (error) {
                    this.sendMessage(`🔐检测到请求发生错误，正在重试...`)
                    // 刷新代理
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
        wqwlkj.saveFile(fileData, 'ccy')
        console.log(`${name}全部任务已完成！`);

        const message = wqwlkj.getMessage()
        if (message !== '' && isNotify === true) {
            await notify.sendNotify(`${name} `, `${message} `);
        }

    } catch (e) {
        console.error('❌ 执行过程中发生异常:', e.message);
    }

})();