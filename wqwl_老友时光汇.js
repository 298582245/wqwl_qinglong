/**
 * update: 25/08/04
 * 更新内容：优化了一下答题次数
 * 脚本：wqwl_老友时光汇.js
 * 作者：wqwlkj 裙：960690899
 * 描述：微信小程序老友时光汇
 * 环境变量：wqwl_lysgh，多个换行或新建多个变量
 * 环境变量描述：抓包Headers下的x-token
 * 代理变量：wqwl_daili
 * cron: 0 11 * * *
 */


const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');

!(async function () {
    let wqwlkj;

    const filePath = 'wqwl_require.js';
    const url = 'https://raw.githubusercontent.com/298582245/wqwl_qinglong/refs/heads/main/wqwl_require.js';

    if (fs.existsSync(filePath)) {
        console.log('✅wqwl_require.js已存在，无需重新下载，如有报错请重新下载覆盖');
        wqwlkj = require('./wqwl_require');
    } else {
        console.log('正在下载wqwl_require.js，请稍等...');
        try {
            const res = await axios.get(url);
            fs.writeFileSync(filePath, res.data);
            console.log('✅下载完成，准备开始运行脚本');
            wqwlkj = require('./wqwl_require');
        } catch (e) {
            console.log('❌下载失败，请手动下载wqwl_require.js，并保存为wqwl_require.js，并重新运行脚本');
            console.log('地址：' + url);
            return; // 下载失败，不再继续执行
        }
    }

    // 确保 require 成功后才继续执行
    try {
        wqwlkj.disclaimer();

        const isNotify = true; // 是否通知
        let notify;
        if (isNotify) {
            try {
                notify = require('./sendNotify');
            } catch (e) {
                console.log('❌加载发送通知失败');
            }
        }

        let index = 0;
        const ckName = 'wqwl_lysgh';
        const name = '微信小程序老友时光汇'

        class Task {
            constructor(cookie) {
                this.url = 'https://api.zijinzhaoyao.com/api'
                this.index = index++;
                this.headers = ''
                this.cookie = cookie;
            }
            async init() {
                this.headers = {

                    "Host": "api.zijinzhaoyao.com",
                    "code": '',
                    "Connection": "keep-alive",
                    "Cache-Control": "no-cache",
                    "sec-ch-ua": "",
                    "Accept": "application/json, text/plain, */*",
                    "Accept-Encoding": "gzip, deflate, br",
                    "Accept-Language": "zh-CN,zh;q=0.9",
                    "Content-Type": "application/json;charset=UTF-8",
                    "Sec-Fetch-Site": "cross-site",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Dest": "empty",
                    "Referrer-Policy": "unsafe-url",
                    "xweb_xhr": "1",
                    "User-Agent": wqwlkj.generateRandomUA(),
                    "miniprogram-environment": "wechat",
                    "wxapp-version": "1.0.3",
                    "x-requested-with": "XMLHttpRequest",
                    "project-name": "yl",
                    "x-token": this.cookie,
                    "x-tt-device-id": this.getDeviceId(),
                    "deviceid": "",
                    "Origin": "https://servicewechat.com",
                    "Referer": "https://servicewechat.com/wxa973bdd2c6278631/13/page-frame.html",
                    "Cookie": `acw_tc=${Date.now()}_${wqwlkj.getRandom(1000, 9999)};`

                }
                if (process.env["wqwl_daili"] != undefined) {
                    this.proxy = await wqwlkj.getProxy()
                }
                else {
                    this.proxy = ''
                }
                //解析jwt
                try {
                    const jwtData = this.cookie.split('.')
                    const jwt = JSON.parse(Buffer.from(jwtData[1], 'base64').toString())
                    this.userId = jwt.userID
                }
                catch (e) {
                    throw new Error('cookie解析失败')
                }
            }

            async main() {
                await this.init()
                await this.sign()
                await wqwlkj.sleep(wqwlkj.getRandom(1, 3))
                await this.getActivityList()
                await wqwlkj.sleep(wqwlkj.getRandom(1, 3))

            }
            // 生成设备ID
            getDeviceId() {
                const prefix = "android-";
                const randomStr = crypto.randomBytes(12).toString('hex');
                return prefix + randomStr;
            }
            // 签到
            async sign() {
                let result
                try {
                    const url = `${this.url}/userIsSign`
                    this.headers['project-name'] = 'yl'

                    const options = {
                        url: url,
                        method: 'POST',
                        headers: this.headers,
                        data: {}
                    }
                    //console.log(options)
                    result = await wqwlkj.request(options, this.proxy)
                    this.headers['code'] = 'adsadada'
                    if (result.data === false) {
                        this.headers['deviceid'] = this.getAES('adsadada')
                        const options = {
                            url: `${this.url}/userSign`,
                            method: 'POST',
                            headers: this.headers,
                            data: {}
                        }
                        //console.log(options)
                        const signReusult = await wqwlkj.request(options, this.proxy)
                        if (signReusult.code === 0) {
                            this.sendMessage(`签到成功✅`)
                        }
                    } else {
                        this.sendMessage(`今日已签到✅`)
                    }
                } catch (e) {
                    console.log(result)
                    throw new Error(`签到发现异常❌：${e.message}`)
                }
            }

            // 获取活动列表
            async getActivityList() {
                try {
                    const url = `${this.url}/v3/activity-list/columns`
                    const data = JSON.stringify({ column: 1 })
                    this.headers['project-name'] = 'xld'
                    const options = {
                        url,
                        data: data,
                        headers: this.headers,
                        method: 'POST'
                    }
                    const res = await wqwlkj.request(options, this.proxy)
                    if (res.code === 0) {
                        const resData = res
                        const activityList = resData.data
                        if (activityList.length > 0) {
                            for (let i = 0; i < activityList.length; i++) {
                                const activity = activityList[i]
                                const id = activity.id
                                const title = activity.title
                                const endTime = new Date(activity.endTime * 1000).toLocaleString()
                                const leftMoney = activity.leftMoney
                                const times = activity.times - activity.count
                                let allTimes = 0
                                let testTimes = 0
                                if (leftMoney > 0 && times > 0 && activity.endTime * 1000 > Date.now()) {
                                    this.sendMessage(`获取到活动:【 ${title}】，结束时间: ${endTime}，剩余金额: ${leftMoney}，开始答题`)
                                    while (times > allTimes && testTimes < 10) {
                                        // console.log(`活动id:${id}`)
                                        this.sendMessage(`第${allTimes + 1}次答题`)
                                        const result = await this.startAnswer(id)
                                        testTimes++
                                        if (testTimes >= 10) {
                                            this.sendMessage(`❌已连续答题10次未成功，请稍后再试`)
                                            break
                                        }
                                        if (!result) {
                                            await wqwlkj.sleep(wqwlkj.getRandom(5, 10))
                                            continue
                                        }
                                        allTimes++
                                        await wqwlkj.sleep(wqwlkj.getRandom(5, 10))
                                    }
                                    await this.getUserCredits()

                                } else {
                                    this.sendMessage(`获取到活动: ❌：【${title}】在${endTime}已结束|剩余${leftMoney}元|剩余答题${times}次`)
                                }
                            }
                        }
                    }
                    else {
                        this.sendMessage(`获取活动列表失败❌: ${res.message}`)
                    }
                } catch (e) {
                    throw new Error(`请求活动列表失败❌: ${e.message}`)
                }
            }

            async startAnswer(id) {
                try {
                    const url = `${this.url}/v2/startAnswer`
                    const data = JSON.stringify({
                        id: id
                    })
                    this.headers['project-name'] = 'yl'
                    const options = {
                        url: url,
                        method: 'POST',
                        headers: this.headers,
                        data: data
                    }
                    const res = await wqwlkj.request(options, this.proxy)
                    if (res.code == 0) {
                        const resData = res
                        const questionNum = resData.data.questionNum
                        const examId = resData.data.examId
                        const answer = resData.data.question.answer
                        if (id && examId && answer) {
                            const res1 = await this.submitAnswer(id, examId, answer, questionNum)
                            await wqwlkj.sleep(wqwlkj.getRandom(5, 10))
                            const res2 = await this.saveLog(this.userId, id)
                            await wqwlkj.sleep(wqwlkj.getRandom(10, 15))
                            const res3 = await this.submitExam(id, examId)
                            return res1 && res2 && res3
                        }
                        else {
                            this.sendMessage('获取答案失败')
                            return false
                        }
                    } else {
                        this.sendMessage(`开始答题失败：${res.message}`)
                        return false
                    }
                }
                catch (e) {
                    throw new Error(`开始答题请求失败: ${e.message}`)

                }
            }

            async submitAnswer(id, examId, answer, number) {
                try {
                    const url = `${this.url}/submitAnswer`
                    const data = JSON.stringify({
                        id: id,
                        examId: examId,
                        answer: answer,
                        number: number
                    })
                    const options = {
                        url: url,
                        method: 'POST',
                        headers: this.headers,
                        data: data
                    }
                    const res = await wqwlkj.request(options, this.proxy)
                    if (res.code === 0) {
                        this.sendMessage(`提交答案请求结果：${res.data.isCorrect === true ? '✅正确' : '❌错误'}`)
                        return true
                    } else {
                        this.sendMessage(`提交答案失败，${res.message}`)
                        return false
                    }
                }
                catch (e) {
                    throw new Error(`提交答案请求失败: ${e.message}`)
                }
            }
            async submitExam(id, examId) {
                try {
                    const url = `${this.url}/v2/submitExam`
                    const data = JSON.stringify({
                        id: id,
                        examId: examId,
                    })
                    const code = this.getRandomCode()
                    const deviceid = this.getAES(code)
                    this.headers['code'] = code
                    this.headers['deviceid'] = deviceid

                    const options = {
                        url: url,
                        method: 'POST',
                        headers: this.headers,
                        data: data
                    }
                    //console.log(options)
                    const res = await wqwlkj.request(options, this.proxy)
                    if (res.code === 0) {
                        this.sendMessage(`提交最终结果奖励：✅🪙积分：${res.data.credits}，💰现金：${res.data.money}元`)
                        return true
                    } else {
                        //  console.log(res)
                        this.sendMessage(`提交最终结果失败❌，${res.message}`)
                        return false
                    }
                }
                catch (e) {
                    throw new Error(`提交最终结果请求失败❌: ${e.message}`)
                }
            }

            //保存日志
            async saveLog(userId = 12, id) {
                try {
                    const url = `${this.url}/userVisitLog`
                    const data = JSON.stringify({
                        "visit_url": `/pages/crushPage/game/index?isNeedAd=1&adOrder=2&id=${id}&type=1`,
                        "user_id": userId,
                        "channel_id": 0,
                        "event_type": "submit_activity"
                    })
                    const options = {
                        url: url,
                        method: 'POST',
                        headers: this.headers,
                        data: data
                    }
                    const res = await wqwlkj.request(options, this.proxy)
                    return true
                    //console.log(res)
                } catch (e) {
                    throw new Error(`保存日志请求失败❌: ${e.message}`)
                }
            }

            async getUserCredits() {
                try {
                    const options = {
                        url: `${this.url}/v2/getUserCredits`,
                        method: 'POST',
                        headers: this.headers,
                        data: JSON.stringify({
                        })
                    }
                    const res = await wqwlkj.request(options, this.proxy)
                    if (res.code === 0) {
                        const amount = res.data.credits
                        this.sendMessage(`获取用户积分成功✅: ${amount}`)
                        if (amount > 50) {
                            this.sendMessage(`积分可以兑换,开始自动兑换`)
                            await this.creditExchange(amount)
                        }
                    }
                } catch (e) {
                    throw new Error(`获取积分失败，${e.message}`)
                }
            }

            async creditExchange(credits) {
                try {
                    const options = {
                        url: `${this.url}/v3/credits-exchange`,
                        method: 'POST',
                        headers: this.headers,
                        data: JSON.stringify({
                            amount: credits
                        })
                    }
                    const res = await wqwlkj.request(options, this.proxy)
                    if (res.code === 0) {
                        this.sendMessage(`兑换成功✅：约${credits / 10}元`, true)
                    } else {
                        this.sendMessage(`兑换失败❌: ${JSON.stringify(res)}`)
                    }
                } catch (e) {
                    throw new Error(`兑换失败，${e.message}`)
                }
            }

            getAES(code) {
                const ramdom = wqwlkj.getRandom(31, 40)
                const adStartTime = Date.now() + ramdom * 1000; // 假设广告 35 秒前开始
                const now = Date.now();
                const c = adStartTime ? Math.floor((now - adStartTime) / 1000) : 0;
                const deviceIdObj = {
                    code: code || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                    t: Math.floor(now / 1000),
                    c: c
                };

                const plaintext = JSON.stringify(deviceIdObj);
                //    console.log('deviceIdObj:', deviceIdObj);
                const key = 'Kj8mN2pQ9rS5tU7vW3xY1zA4bC6dE8fG';
                const iv = 'H7nM4kL9pQ2rS5tU';
                return wqwlkj.aesEncrypt(plaintext, key, iv, 'aes-256-cbc', 'utf8', 'utf8', 'hex');
            }

            getRandomCode() {
                return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            }

            sendMessage(message, isPush = false) {
                message = `账号[${this.index + 1}]: ${message}`
                if (isNotify && isPush)
                    wqwlkj.sendMessage(message + "\n")
                else
                    console.log(message)
            }
        }

        console.log(`${name}开始执行...`);
        const tokens = wqwlkj.checkEnv(process.env[ckName]);
        const tasks = tokens.map(token => new Task(token).main());
        await Promise.all(tasks); // 所有任务并发执行
        console.log("全部任务已完成！");

        const message = wqwlkj.getMessage()
        if (message !== '' && isNotify === true) {
            await notify.sendNotify(`${name} `, `${message} `);
        }

    } catch (e) {
        console.error('❌ 执行过程中发生异常:', e.message);
    }

})();